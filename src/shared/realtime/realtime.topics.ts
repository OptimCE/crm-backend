/**
 * The realtime topic registry.
 *
 * A topic names *what changed*, never *what it changed to*. Every consumer
 * reacts by refetching through the API gateway, which is also the point at which
 * the read is re-authorized — so a demoted manager's refetch returns 403 or an
 * empty page even though the event reached their open stream.
 *
 * Adding a topic is additive on both ends: the frontend's `RealtimeService.on()`
 * takes topic strings, so a new one needs no frontend release to be *carried*,
 * only to be *acted on*. That is the whole reason envelopes put the topic in
 * `data:` rather than in an SSE `event:` field.
 *
 * Mirrors the shape of `modules/notifications/domain/notification.taxonomy.ts`,
 * but is a separate list on purpose: notification types are durable rows with an
 * i18n title and a preference prefix, realtime topics are transient hints. Most
 * realtime topics (generation/simulation) have no notification type at all.
 */
export const REALTIME_TOPICS = {
  /** One or more `notification` rows were inserted for the recipient. */
  NOTIFICATION_CREATED: "notification.created",
  /** An allocation-key generation reached SUCCESS or FAILED. */
  GENERATION_FINISHED: "generation.finished",
  /** A simulation reached SUCCESS or FAILED. */
  SIMULATION_FINISHED: "simulation.finished",
  /** A billing run finished computing. */
  BILLING_RUN_FINISHED: "billing_run.finished",
  /**
   * The recipient's session is no longer valid (membership or role revoked).
   *
   * Never forwarded to a browser: the hub intercepts it and closes the affected
   * connections, which forces a re-mint and therefore a fresh JWT check. Listed
   * here so `isKnownTopic` accepts it on the wire.
   */
  SESSION_REVOKED: "session.revoked",
} as const;

export type RealtimeTopic = (typeof REALTIME_TOPICS)[keyof typeof REALTIME_TOPICS];

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(REALTIME_TOPICS));

/**
 * True when `topic` is a registered topic.
 *
 * Unknown topics are dropped at the hub rather than forwarded. Anything holding
 * the Redis password can publish, so this is one of the shape checks that stands
 * between a compromised annexe and every connected browser.
 */
export function isKnownTopic(topic: unknown): topic is RealtimeTopic {
  return typeof topic === "string" && KNOWN.has(topic);
}
