import type { Response } from "express";
import type { RealtimeTopic } from "./realtime.topics.js";

/**
 * Wire shape of a realtime event.
 *
 * An envelope is a HINT — "something about resource X changed" — never data.
 * The rules below are enforced by `realtime.envelope.ts` on the way out of the
 * hub, on bytes that arrived from any process holding the Redis password:
 *
 *  - No business data. No names, emails, EANs, amounts, invoice numbers,
 *    storage keys, error messages.
 *  - No display strings. Toast text is chosen client-side from `topic` +
 *    `hint.status` against the i18n bundle. This is a security control: a
 *    compromised publisher gets a nuisance channel, never a text-injection
 *    channel into every open browser.
 *  - No recipient field. The channel already says who. A recipient in the body
 *    invites a subscriber-side "is this for me?" check — authorization on the
 *    wrong leg.
 *
 * `ref.id` is permitted: any authorized reader can already see it, and the
 * client needs it to decide *which* row to refetch. It discloses row existence
 * and cardinality to other members of the same community, which is
 * within-tenant and acceptable.
 */
export interface RealtimeEnvelope {
  /** Envelope version. Clients drop anything they do not recognise. */
  v: 1;
  /** Random 16 hex chars. A client-side dedupe key, not an ordering key —
   *  there is no replay, so nothing is gained by making it sortable. */
  id: string;
  topic: RealtimeTopic;
  /** ISO-8601 UTC. Informational; never used for ordering or expiry. */
  at: string;
  scope: { community_id: number | null };
  /** Which row changed, so the client can refetch precisely. */
  ref: { kind: string; id: string };
  /** Flat map of JSON scalars. `status` is the only field a client may branch on. */
  hint: Record<string, string | number | boolean | null>;
}

/** The closed set of values `hint.status` may take. */
export type RealtimeHintStatus = "success" | "failed" | "ready";

/** What a producer supplies; the envelope builder fills in `v`, `id` and `at`. */
export interface RealtimeEventInput {
  topic: RealtimeTopic;
  ref: { kind: string; id: string };
  scope?: { community_id: number | null };
  hint?: Record<string, string | number | boolean | null>;
}

/**
 * Everything the SSE leg needs to know about who is on the other end.
 *
 * Produced by the ticket mint (which runs behind KrakenD, with verified claims)
 * and consumed verbatim. The stream handler never parses an identity, never
 * queries the database and never consults a role — an unauthenticated endpoint
 * that interprets no claims cannot be tricked into interpreting the wrong one.
 */
export interface TicketClaims {
  /** Internal `app_user.id`. */
  uid: number;
  /** The exact channel strings this connection may subscribe to. */
  ch: string[];
  /** Unix seconds at mint. */
  iat: number;
  // NOTHING ELSE BELONGS HERE. In particular no client fingerprint (User-Agent,
  // IP, …): the mint is reached through KrakenD and the redeem bypasses it, so
  // the two legs observe different values for every such attribute and a
  // comparison can never match. A `uah` field once did exactly that and made
  // every stream 401 — invisibly, because the pollers kept the UI correct.
}

/** One attached SSE client. */
export interface RealtimeConnection {
  uid: number;
  channels: Set<string>;
  res: Response;
  /** Epoch ms. Used to evict the OLDEST when a user exceeds the per-user cap. */
  openedAt: number;
  /** Set by `close()` so every path is idempotent. */
  closed: boolean;
  heartbeat?: NodeJS.Timeout;
  /** Fires `expiring` shortly before the absolute lifetime cap. */
  lifetime?: NodeJS.Timeout;
  /** The grace timer between `expiring` and the actual close. */
  grace?: NodeJS.Timeout;
}

/** Named SSE control frames. Distinct from topics: the client registers an
 *  explicit listener for each, and they never reach the topic dispatch. */
export type RealtimeControlEvent = "ready" | "degraded" | "superseded" | "expiring";
