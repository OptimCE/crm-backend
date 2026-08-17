import { randomBytes } from "node:crypto";
import config from "config";
import type { Request, Response } from "express";
import { injectable } from "inversify";
import { Redis, type RedisOptions } from "ioredis";

import logger from "../monitor/logger.js";
import { CHANNEL_PATTERN, communityChannel, userChannel } from "./realtime.channels.js";
import { buildEnvelope, MAX_ENVELOPE_BYTES, parseEnvelope } from "./realtime.envelope.js";
import { REALTIME_TOPICS } from "./realtime.topics.js";
import type { IRealtimeHub } from "./i-realtime.hub.js";
import type { RealtimeConnection, RealtimeControlEvent, RealtimeEventInput, TicketClaims } from "./realtime.types.js";

const TICKET_KEY = (token: string): string => `rt:tk:${token}`;
const MINT_KEY = (uid: number, minute: number): string => `rt:mint:${uid}:${minute}`;
/** Guard on the mint payload: 50 channels is far beyond any real membership. */
const MAX_TICKET_CHANNELS = 50;

/**
 * Redis-backed realtime hub: one process-wide pattern subscription plus an
 * in-process fan-out map.
 *
 * WHY ONE GLOBAL `PSUBSCRIBE` RATHER THAN REFCOUNTED PER-CHANNEL SUBSCRIBE:
 * a dynamic subscribe loses events in the window between the client attaching
 * and Redis acknowledging the subscription — which lands precisely on the "I
 * just clicked Run" moment and is effectively un-reproducible. Its unsubscribe
 * path needs a generation counter for a second race. crm-backend runs as one
 * container, so the cost of the simple option is currently zero.
 *
 * SCALING NOTE, honestly: with N replicas every replica decodes every event.
 * That is fine to roughly 10^3 events/second. The escape hatch when it is not is
 * SHARDING (split the pattern, or route connections by `uid % replicas`), not
 * refcounted subscribes. A consequence of the broadcast design is that this
 * process briefly holds events for users connected to *other* replicas — which
 * is harmless only because of the no-business-data rule in
 * `realtime.types.ts`. Corollary: never log a raw payload above `debug`.
 *
 * DEPENDENCIES: this class takes NO `@inject`ed dependencies, deliberately. The
 * factory resolves it eagerly at boot to open the subscription before the first
 * client attaches, and an injected binding that has not been registered yet
 * would turn that into an unrecoverable boot failure. Everything needing the
 * database (resolving a Keycloak sub to an internal id, expanding org claims to
 * community ids) happens in the notifications controller, per request.
 */
@injectable()
export class RedisRealtimeHub implements IRealtimeHub {
  private readonly cmd: Redis;
  private readonly sub: Redis;

  private readonly byChannel = new Map<string, Set<RealtimeConnection>>();
  private readonly byUser = new Map<number, Set<RealtimeConnection>>();
  private readonly connections = new Set<RealtimeConnection>();

  private readonly ticketTtl: number = config.get("realtime.ticket_ttl_seconds");
  private readonly heartbeatMs: number = (config.get("realtime.heartbeat_seconds") as number) * 1000;
  private readonly maxLifetimeMs: number = (config.get("realtime.max_connection_seconds") as number) * 1000;
  private readonly maxPerUser: number = config.get("realtime.max_connections_per_user");
  private readonly maxConnections: number = config.get("realtime.max_connections");
  private readonly mintPerMinute: number = config.get("realtime.mint_per_minute");

  private subscribed = false;
  private disposed = false;

  /**
   * @param url - Redis DSN. Defaults to config, which is how inversify builds it.
   * @param clients - Test seam ONLY. Passing fakes is the only way to exercise
   *   the fan-out, the caps and the ticket store without a live broker; the
   *   subscriber connects eagerly (see below), so a default-constructed hub
   *   always opens a socket.
   */
  constructor(url: string = config.get("realtime.redis_url"), clients?: { cmd: Redis; sub: Redis }) {
    const base: RedisOptions = {
      connectTimeout: 2000,
      // Commands are never failed just because a reconnect is in flight; the
      // bound that actually matters is `commandTimeout` below.
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => Math.min(30_000, 200 * 2 ** times),
    };

    // NO `lazyConnect` on the subscriber. With it, nothing connects until a
    // command is issued, and the only command we ever issue on this client is
    // the subscription itself — so `ready` never fires, PSUBSCRIBE never
    // happens, and realtime is silently dead in every state while looking
    // perfectly healthy. Connect eagerly and subscribe immediately.
    this.sub = clients?.sub ?? new Redis(url, base);
    this.sub.on("error", (err) => logger.warn({ operation: "realtime:sub", err }, "realtime subscriber error"));
    this.sub.on("end", () => {
      this.subscribed = false;
    });
    // ioredis re-subscribes automatically after a reconnect; this handler is a
    // reconcile, not the primary path.
    this.sub.on("ready", () => void this.psubscribe());
    this.sub.on("pmessage", (_pattern: string, channel: string, payload: string) => this.fanOut(channel, payload));
    void this.psubscribe();

    // `enableOfflineQueue` stays ON. Turning it off makes every command issued
    // while the socket is not yet `ready` reject instantly — including the very
    // first ticket mint after each boot, against a perfectly healthy Redis.
    // `commandTimeout` is what gives fail-fast, and unlike the offline queue it
    // also bounds a *connected but hung* Redis, where the mint would otherwise
    // await forever instead of answering 503.
    this.cmd = clients?.cmd ?? new Redis(url, { ...base, enableOfflineQueue: true, commandTimeout: 500 });
    this.cmd.on("error", (err) => logger.warn({ operation: "realtime:cmd", err }, "realtime command client error"));
  }

  private async psubscribe(): Promise<void> {
    if (this.disposed) return;
    try {
      await this.sub.psubscribe(CHANNEL_PATTERN);
      this.subscribed = true;
      logger.info({ operation: "realtime:psubscribe" }, `realtime subscribed to ${CHANNEL_PATTERN}`);
    } catch (err) {
      this.subscribed = false;
      logger.warn({ operation: "realtime:psubscribe", err }, "realtime psubscribe failed");
    }
  }

  healthy(): boolean {
    return this.subscribed && this.sub.status === "ready";
  }

  // ---- Publish ----------------------------------------------------------

  publishToUsers(internal_user_ids: number[], event: RealtimeEventInput): void {
    this.publish(
      internal_user_ids.map((id) => userChannel(id)),
      event,
    );
  }

  publishToCommunity(internal_community_id: number, tier: string, event: RealtimeEventInput): void {
    this.publish([communityChannel(internal_community_id, tier as never)], event);
  }

  /**
   * Fire-and-forget. Returns `void` and swallows everything.
   *
   * The `.catch()` is not optional: this is called from `flushAfterCommit`,
   * whose `try/catch` is SYNCHRONOUS and therefore cannot see a rejected
   * promise. Node turns an unhandled rejection into `process.exit`, so a Redis
   * blip would kill the process immediately after a business COMMIT — the exact
   * invariant this design exists to protect, inverted into a crash.
   */
  private publish(channels: string[], event: RealtimeEventInput): void {
    if (this.disposed || channels.length === 0) return;
    const envelope = buildEnvelope(event);
    if (!envelope) {
      logger.warn({ operation: "realtime:publish", topic: event.topic }, "realtime envelope rejected locally");
      return;
    }
    const body = JSON.stringify(envelope);
    for (const channel of channels) {
      this.cmd.publish(channel, body).catch((err: unknown) => {
        logger.warn({ operation: "realtime:publish", err }, "realtime publish failed (event dropped)");
      });
    }
  }

  // ---- Tickets ----------------------------------------------------------

  async allowMint(internal_user_id: number): Promise<boolean> {
    const key = MINT_KEY(internal_user_id, Math.floor(Date.now() / 60_000));
    const count = await this.cmd.incr(key);
    if (count === 1) await this.cmd.expire(key, 120);
    return count <= this.mintPerMinute;
  }

  async mintTicket(claims: Omit<TicketClaims, "iat">): Promise<string> {
    const channels = claims.ch.slice(0, MAX_TICKET_CHANNELS);
    if (claims.ch.length > MAX_TICKET_CHANNELS) {
      logger.warn({ operation: "realtime:mint", uid: claims.uid, count: claims.ch.length }, "ticket channel list truncated");
    }
    // 256 bits from the CSPRNG, base64url so it needs no escaping in a query
    // string. Not a UUIDv4: 122 bits, and routinely mistaken for a non-secret.
    const token = randomBytes(32).toString("base64url");
    const payload: TicketClaims = { uid: claims.uid, ch: channels, iat: Math.floor(Date.now() / 1000) };
    // NX so a (vanishingly unlikely) collision fails loudly instead of silently
    // overwriting somebody else's live ticket.
    const stored = await this.cmd.set(TICKET_KEY(token), JSON.stringify(payload), "EX", this.ticketTtl, "NX");
    if (stored !== "OK") throw new Error("realtime: ticket collision");
    return token;
  }

  /**
   * Redeem a ticket. `null` on every failure — it fails CLOSED.
   *
   * DELIBERATELY BOUND TO NOTHING BUT THE TOKEN. An earlier version also bound a
   * hash of the User-Agent, which could never match: the mint runs behind
   * KrakenD (which replaces the client UA with its own, because the generated
   * `input_headers` allow-list does not carry it) while the redeem bypasses the
   * gateway and sees the real browser UA. So every stream 401'd and realtime was
   * silently inert — the pollers kept the UI correct, which is exactly why it
   * went unnoticed. The general rule, which also killed IP binding during
   * design: never bind a ticket to any request attribute the two legs observe
   * differently. Identity comes only from what the mint resolved and stored.
   *
   * Each rejection logs a stable `reason`. Before that, all five collapsed into a
   * bare 401 with no log line, which is what turned a five-minute diagnosis into
   * an invisible outage. A steady stream of `unknown_or_expired` is the signature
   * of a client stuck in the 401-reconnect loop, so this stays at `warn` rather
   * than `debug`. The HTTP response remains an opaque 401 — the endpoint tells a
   * prober nothing.
   */
  async redeemTicket(token: string): Promise<TicketClaims | null> {
    if (!token || token.length > 128) {
      logger.warn({ operation: "realtime:redeem", reason: "malformed_token" }, "realtime ticket rejected");
      return null;
    }

    let raw: string | null;
    try {
      // GETDEL is atomic, so single-use holds across replicas and across a race
      // between two clients presenting the same token.
      raw = await this.cmd.getdel(TICKET_KEY(token));
    } catch (err) {
      // An unreachable Redis must never admit an unauthenticated connection to a
      // service that authenticates nothing else.
      logger.warn({ operation: "realtime:redeem", reason: "broker_unreachable", err }, "realtime ticket rejected");
      return null;
    }

    if (!raw) {
      logger.warn({ operation: "realtime:redeem", reason: "unknown_or_expired" }, "realtime ticket rejected");
      return null;
    }

    let claims: TicketClaims;
    try {
      claims = JSON.parse(raw) as TicketClaims;
    } catch {
      logger.warn({ operation: "realtime:redeem", reason: "corrupt_payload" }, "realtime ticket rejected");
      return null;
    }

    if (typeof claims.uid !== "number" || !Array.isArray(claims.ch)) {
      logger.warn({ operation: "realtime:redeem", reason: "invalid_claims" }, "realtime ticket rejected");
      return null;
    }

    return claims;
  }

  // ---- Connections ------------------------------------------------------

  hasCapacity(): boolean {
    return !this.disposed && this.connections.size < this.maxConnections;
  }

  attach(claims: TicketClaims, req: Request, res: Response): void {
    const conn: RealtimeConnection = {
      uid: claims.uid,
      channels: new Set(claims.ch),
      res,
      openedAt: Date.now(),
      closed: false,
    };

    const mine = this.byUser.get(claims.uid) ?? new Set<RealtimeConnection>();
    // Evict the OLDEST, admit the newest: rejecting the newest would break the
    // tab the user is actually looking at.
    while (mine.size >= this.maxPerUser) {
      const oldest = [...mine].sort((a, b) => a.openedAt - b.openedAt)[0];
      if (!oldest) break;
      this.send(oldest, "superseded", { reason: "too_many_connections" });
      this.close(oldest, "superseded");
    }
    mine.add(conn);
    this.byUser.set(claims.uid, mine);

    for (const channel of conn.channels) {
      const set = this.byChannel.get(channel) ?? new Set<RealtimeConnection>();
      set.add(conn);
      this.byChannel.set(channel, set);
    }
    this.connections.add(conn);

    // An SSE *comment*, not an event: comments are invisible to EventSource, so
    // they never reach `onmessage` and cost the client's change detector
    // nothing. Its job is to turn a half-open TCP connection into an error
    // instead of silence, and to stay well under nginx's 60s read timeout.
    conn.heartbeat = setInterval(() => this.write(conn, ": hb\n\n"), this.heartbeatMs);

    // Absolute lifetime cap. This is simultaneously the revocation window (a
    // re-mint re-verifies the JWT and re-reads roles) and the bound on what a
    // leaked 30-second ticket buys — without it, a spent ticket yields an
    // unbounded stream.
    conn.lifetime = setTimeout(
      () => {
        this.send(conn, "expiring", {});
        conn.grace = setTimeout(() => this.close(conn, "lifetime"), 5_000);
      },
      Math.max(1_000, this.maxLifetimeMs - 5_000),
    );

    req.on("close", () => this.close(conn, "client"));
    req.on("error", () => this.close(conn, "error"));

    this.send(conn, "ready", { degraded: !this.healthy() });
  }

  private fanOut(channel: string, payload: string): void {
    const targets = this.byChannel.get(channel);
    if (!targets?.size) return; // another replica's client, or nobody's
    if (Buffer.byteLength(payload, "utf8") > MAX_ENVELOPE_BYTES) return;

    const envelope = parseEnvelope(payload);
    if (!envelope) return; // untrusted publisher bytes; drop silently

    // Never forwarded. A revocation closes the stream, which forces a re-mint
    // and therefore a fresh JWT check — telling the browser about it would just
    // be an unauthenticated hint that somebody's rights changed.
    if (envelope.topic === REALTIME_TOPICS.SESSION_REVOKED) {
      for (const conn of [...targets]) this.close(conn, "revoked");
      return;
    }

    // No `event:` field: a named SSE event does NOT fire `onmessage`, which
    // would force the client to addEventListener per topic and therefore ship a
    // frontend release for every new topic. The client dispatches on
    // `envelope.topic` instead. `id:` is emitted for client-side dedupe;
    // `Last-Event-ID` is accepted and ignored (there is no replay buffer — a
    // reconnect refetches authoritative state, which IS the resync).
    const frame = `id: ${envelope.id}\ndata: ${payload}\n\n`;
    for (const conn of [...targets]) this.write(conn, frame);
  }

  private send(conn: RealtimeConnection, event: RealtimeControlEvent, data: Record<string, unknown>): void {
    this.write(conn, `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  /** One dead socket must never abort a fan-out loop. */
  private write(conn: RealtimeConnection, frame: string): void {
    if (conn.closed) return;
    try {
      conn.res.write(frame);
    } catch {
      this.close(conn, "write");
    }
  }

  /**
   * Idempotent teardown. Every leak in this class would be here:
   *  - the `closed` flag, because `res.end()` re-fires the request's `close`;
   *  - all three timers, including the short `expiring` grace timer, which would
   *    otherwise keep a disconnected client's response object reachable;
   *  - PRUNING EMPTY SETS, because otherwise `byUser` grows one empty Set per
   *    distinct user for the lifetime of the process.
   */
  private close(conn: RealtimeConnection, reason: string): void {
    if (conn.closed) return;
    conn.closed = true;

    if (conn.heartbeat) clearInterval(conn.heartbeat);
    if (conn.lifetime) clearTimeout(conn.lifetime);
    if (conn.grace) clearTimeout(conn.grace);

    for (const channel of conn.channels) {
      const set = this.byChannel.get(channel);
      if (!set) continue;
      set.delete(conn);
      if (set.size === 0) this.byChannel.delete(channel);
    }
    const mine = this.byUser.get(conn.uid);
    if (mine) {
      mine.delete(conn);
      if (mine.size === 0) this.byUser.delete(conn.uid);
    }
    this.connections.delete(conn);

    try {
      conn.res.end();
    } catch {
      /* already destroyed */
    }
    logger.debug({ operation: "realtime:close", uid: conn.uid, reason }, "realtime connection closed");
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    for (const conn of [...this.connections]) this.close(conn, "shutdown");
    await Promise.allSettled([this.sub.quit(), this.cmd.quit()]);
  }
}

// NOTE: `hashUa` / `equalsConstantTime` used to live here, for binding a ticket
// to the client's User-Agent. Removed rather than switched off, because a
// default-on binding that silently kills the whole feature is a trap. See
// `redeemTicket` for why it was unsatisfiable by construction.
