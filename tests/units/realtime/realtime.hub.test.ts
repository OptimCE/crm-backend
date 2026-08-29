import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RedisRealtimeHub } from "../../../src/shared/realtime/redis.realtime.hub.js";
import { communityChannel, Tier, userChannel } from "../../../src/shared/realtime/realtime.channels.js";
import { buildEnvelope } from "../../../src/shared/realtime/realtime.envelope.js";
import { REALTIME_TOPICS } from "../../../src/shared/realtime/realtime.topics.js";
import type { TicketClaims } from "../../../src/shared/realtime/realtime.types.js";
import { FakeRedis, FakeRequest, FakeResponse } from "./realtime.fakes.js";
import logger from "../../../src/shared/monitor/logger.js";

const frame = (topic = REALTIME_TOPICS.GENERATION_FINISHED, communityId: number | null = 12): string =>
  JSON.stringify(
    buildEnvelope({ topic, ref: { kind: "generation", id: "418" }, scope: { community_id: communityId } }),
  );

describe("(Unit) RedisRealtimeHub", () => {
  let cmd: FakeRedis;
  let sub: FakeRedis;
  let hub: RedisRealtimeHub;
  const open: FakeResponse[] = [];

  const attach = (claims: Partial<TicketClaims> & { uid: number; ch: string[] }): FakeResponse => {
    const res = new FakeResponse();
    open.push(res);
    hub.attach({ iat: 0, ...claims }, new FakeRequest().asRequest(), res.asResponse());
    return res;
  };

  beforeEach(() => {
    cmd = new FakeRedis();
    sub = new FakeRedis();
    hub = new RedisRealtimeHub("redis://fake", { cmd: cmd.asRedis(), sub: sub.asRedis() });
  });

  afterEach(async () => {
    // Every attach() starts a heartbeat interval and a lifetime timeout; without
    // this the jest worker never exits.
    await hub.dispose();
    open.length = 0;
  });

  it("subscribes to the pattern eagerly, without waiting for a command", async () => {
    // The `lazyConnect` trap: if the subscriber only connects when a command is
    // issued, and the only command is the subscribe itself, PSUBSCRIBE never
    // happens and realtime is silently dead while looking perfectly healthy.
    await Promise.resolve();
    expect(sub.patterns).toContain("notify:v1:*");
  });

  // ---- The cross-tenant boundary. The most important test in this feature. --

  it("delivers ONLY to connections subscribed to the exact channel", async () => {
    await Promise.resolve();
    const managerOf12 = attach({ uid: 1, ch: [communityChannel(12, Tier.MANAGER)] });
    const managerOf13 = attach({ uid: 2, ch: [communityChannel(13, Tier.MANAGER)] });
    const memberOf12 = attach({ uid: 3, ch: [communityChannel(12, Tier.MEMBER)] });

    sub.deliver(communityChannel(12, Tier.MANAGER), frame());

    expect(managerOf12.dataFrames()).toHaveLength(1);
    // A different community must never see it — this is the tenant boundary.
    expect(managerOf13.dataFrames()).toHaveLength(0);
    // Nor may a lower tier of the SAME community: the tier is the role gate, and
    // it is enforced here and at ticket-mint time, nowhere else.
    expect(memberOf12.dataFrames()).toHaveLength(0);
  });

  it("routes a per-user event to that user only", async () => {
    await Promise.resolve();
    const mine = attach({ uid: 7, ch: [userChannel(7)] });
    const theirs = attach({ uid: 8, ch: [userChannel(8)] });

    sub.deliver(userChannel(7), frame(REALTIME_TOPICS.NOTIFICATION_CREATED, null));

    expect(mine.dataFrames()).toHaveLength(1);
    expect(theirs.dataFrames()).toHaveLength(0);
  });

  it("drops payloads that fail validation instead of forwarding them", async () => {
    await Promise.resolve();
    const res = attach({ uid: 1, ch: [userChannel(1)] });

    sub.deliver(userChannel(1), "not json");
    sub.deliver(userChannel(1), JSON.stringify({ v: 2, topic: "notification.created" }));
    sub.deliver(userChannel(1), JSON.stringify({ ...JSON.parse(frame()), topic: "evil.topic" }));

    expect(res.dataFrames()).toHaveLength(0);
  });

  it("emits no `event:` field on topic frames, so onmessage fires", async () => {
    await Promise.resolve();
    const res = attach({ uid: 1, ch: [userChannel(1)] });
    sub.deliver(userChannel(1), frame(REALTIME_TOPICS.NOTIFICATION_CREATED, null));

    const topicFrame = res.frames.find((f) => f.startsWith("id: "));
    expect(topicFrame).toBeDefined();
    // A named SSE event does NOT fire onmessage. Putting the topic there would
    // force addEventListener per topic, i.e. a frontend release per new topic.
    expect(topicFrame).not.toContain("event:");
  });

  it("closes the connection on session.revoked and never forwards it", async () => {
    await Promise.resolve();
    const res = attach({ uid: 1, ch: [userChannel(1)] });

    sub.deliver(userChannel(1), frame(REALTIME_TOPICS.SESSION_REVOKED, null));

    expect(res.dataFrames()).toHaveLength(0);
    expect(res.ended).toBe(true);
  });

  // ---- Caps and cleanup -------------------------------------------------

  it("evicts the OLDEST connection past the per-user cap, keeping the newest", async () => {
    await Promise.resolve();
    const first = attach({ uid: 1, ch: [userChannel(1)] });
    for (let i = 0; i < 3; i++) attach({ uid: 1, ch: [userChannel(1)] });
    const newest = attach({ uid: 1, ch: [userChannel(1)] }); // 5th, cap is 4

    // Rejecting the newest would break the tab the user is actually looking at.
    expect(first.controlEvents()).toContain("superseded");
    expect(first.ended).toBe(true);
    expect(newest.ended).toBe(false);

    sub.deliver(userChannel(1), frame(REALTIME_TOPICS.NOTIFICATION_CREATED, null));
    expect(newest.dataFrames()).toHaveLength(1);
  });

  it("keeps fanning out when one socket throws mid-loop", async () => {
    await Promise.resolve();
    const broken = attach({ uid: 1, ch: [userChannel(1)] });
    const healthy = attach({ uid: 2, ch: [userChannel(1)] });
    broken.throwOnWrite = true;

    sub.deliver(userChannel(1), frame(REALTIME_TOPICS.NOTIFICATION_CREATED, null));

    // One dead socket must not silently cost every other subscriber its event.
    expect(healthy.dataFrames()).toHaveLength(1);
    expect(broken.ended).toBe(true);
  });

  it("prunes its maps on disconnect so nothing leaks per user", async () => {
    await Promise.resolve();
    const req = new FakeRequest();
    const res = new FakeResponse();
    hub.attach({ uid: 99, ch: [userChannel(99)], iat: 0 }, req.asRequest(), res.asResponse());

    req.emit("close");
    // Delivering to a pruned channel must be a no-op, not a write to a dead res.
    sub.deliver(userChannel(99), frame(REALTIME_TOPICS.NOTIFICATION_CREATED, null));
    expect(res.dataFrames()).toHaveLength(0);

    // Idempotent: res.end() re-fires the request's close in the real world.
    req.emit("close");
    expect(res.ended).toBe(true);
  });

  // ---- Tickets ----------------------------------------------------------

  it("redeems a ticket exactly once", async () => {
    const token = await hub.mintTicket({ uid: 5, ch: [userChannel(5)] });
    expect(await hub.redeemTicket(token)).toMatchObject({ uid: 5 });
    // GETDEL: the second presentation of the same token gets nothing, whichever
    // replica serves it.
    expect(await hub.redeemTicket(token)).toBeNull();
  });

  it("is bound to the token ALONE — no client fingerprint", async () => {
    // The inverse of an assertion that used to live here, and the reason this
    // test exists: binding the ticket to a User-Agent hash was unsatisfiable by
    // construction. The mint runs behind KrakenD, which replaces the client UA
    // with its own because the generated input_headers allow-list does not carry
    // it; the redeem bypasses the gateway and sees the real browser UA. So every
    // stream 401'd, and because the pollers kept the UI correct it was invisible.
    //
    // If this ever fails, someone has re-added a cross-leg binding. Do not "fix"
    // it by forwarding the header — the generator cannot scope input_headers to
    // one endpoint, so that widens the allow-list for all 179 of them.
    const token = await hub.mintTicket({ uid: 5, ch: [userChannel(5)] });
    expect(await hub.redeemTicket(token)).toMatchObject({ uid: 5 });
  });

  it("fails CLOSED when the broker is unreachable at redeem time", async () => {
    const token = await hub.mintTicket({ uid: 5, ch: [userChannel(5)] });
    cmd.failNext = true;
    // An unreachable Redis must never admit an unauthenticated connection to a
    // service that authenticates nothing else.
    expect(await hub.redeemTicket(token)).toBeNull();
  });

  it("logs a stable reason for every rejection path", async () => {
    // Before this, all five paths collapsed into a bare 401 with no log line —
    // which is what turned a total realtime outage into something nobody could
    // see. These strings are a contract: they are what you grep for.
    const warn = jest.spyOn(logger, "warn").mockImplementation((() => logger) as never);
    const reasonOf = (call: unknown[]): string => (call[0] as { reason?: string }).reason ?? "";

    await hub.redeemTicket("");
    expect(warn.mock.calls.map(reasonOf)).toContain("malformed_token");

    warn.mockClear();
    await hub.redeemTicket("never-minted");
    expect(warn.mock.calls.map(reasonOf)).toContain("unknown_or_expired");

    warn.mockClear();
    cmd.store.set("rt:tk:corrupt", "{not json");
    await hub.redeemTicket("corrupt");
    expect(warn.mock.calls.map(reasonOf)).toContain("corrupt_payload");

    warn.mockClear();
    cmd.store.set("rt:tk:bad", JSON.stringify({ uid: "5", ch: [] }));
    await hub.redeemTicket("bad");
    expect(warn.mock.calls.map(reasonOf)).toContain("invalid_claims");

    warn.mockClear();
    cmd.failNext = true;
    await hub.redeemTicket("anything");
    expect(warn.mock.calls.map(reasonOf)).toContain("broker_unreachable");

    // And never the token itself.
    expect(JSON.stringify(warn.mock.calls)).not.toContain("never-minted");
    warn.mockRestore();
  });

  it("rejects an unknown or absurd token without touching the store", async () => {
    expect(await hub.redeemTicket("")).toBeNull();
    expect(await hub.redeemTicket("x".repeat(500))).toBeNull();
    expect(await hub.redeemTicket("never-minted")).toBeNull();
  });

  it("rate-limits minting per user per minute", async () => {
    for (let i = 0; i < 30; i++) expect(await hub.allowMint(1)).toBe(true);
    // Without this a bug in the client reconnect loop is a self-inflicted DoS on
    // Postgres: every mint costs a user lookup plus a community lookup.
    expect(await hub.allowMint(1)).toBe(false);
    // Per user, not global.
    expect(await hub.allowMint(2)).toBe(true);
  });

  // ---- Publish ----------------------------------------------------------

  it("publishes to one channel per recipient", () => {
    hub.publishToUsers([1, 2], {
      topic: REALTIME_TOPICS.NOTIFICATION_CREATED,
      ref: { kind: "notification", id: "0" },
    });
    expect(cmd.published.map((p) => p.channel)).toEqual([userChannel(1), userChannel(2)]);
  });

  it("swallows a publish failure without rejecting or throwing", async () => {
    cmd.failNext = true;
    const unhandled = jest.fn();
    process.once("unhandledRejection", unhandled);

    expect(() =>
      hub.publishToUsers([1], {
        topic: REALTIME_TOPICS.NOTIFICATION_CREATED,
        ref: { kind: "notification", id: "0" },
      }),
    ).not.toThrow();

    // The `.catch()` inside publish() is load-bearing: this runs from
    // flushAfterCommit, whose try/catch is synchronous and cannot see a rejected
    // promise. Node turns an unhandled rejection into process.exit — i.e. a
    // Redis blip would kill the process right after a business COMMIT.
    await new Promise((resolve) => setImmediate(resolve));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("refuses to publish an envelope it cannot build", () => {
    hub.publishToUsers([1], { topic: "bogus.topic" as never, ref: { kind: "x", id: "1" } });
    expect(cmd.published).toHaveLength(0);
  });
});
