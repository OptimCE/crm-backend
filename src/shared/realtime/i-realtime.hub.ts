import type { Request, Response } from "express";
import type { RealtimeEventInput, TicketClaims } from "./realtime.types.js";

/**
 * The realtime fan-out port.
 *
 * Bound as `"RealtimeHub"` ONLY when `realtime.enabled` and `realtime.redis_url`
 * are both set — mirroring the `"CacheService"` seam. Every consumer must guard:
 *
 *     const hub = container.isBound("RealtimeHub")
 *       ? container.get<IRealtimeHub>("RealtimeHub") : null;
 *
 * With the feature off nothing is bound, no connection is opened, and the
 * application behaves exactly as it did before realtime existed.
 */
export interface IRealtimeHub {
  /**
   * Publish to one user's channel. Fire-and-forget: returns immediately, never
   * throws, never rejects, and drops the event on any failure. A realtime
   * failure must never affect a business write.
   */
  publishToUsers(internal_user_ids: number[], event: RealtimeEventInput): void;

  /** Publish to one tier of one community. Same fire-and-forget contract. */
  publishToCommunity(internal_community_id: number, tier: string, event: RealtimeEventInput): void;

  /** Mint a single-use ticket. Resolves to the opaque token. Rejects when Redis
   *  is unreachable, so the caller can answer 503 rather than hang. */
  mintTicket(claims: Omit<TicketClaims, "iat">): Promise<string>;

  /**
   * Redeem a ticket, atomically and exactly once. `null` on miss, expiry, a
   * corrupt payload, or an unreachable Redis — i.e. it fails CLOSED, and logs a
   * stable `reason` for each so a failure is diagnosable from the logs alone.
   *
   * The token is the ONLY credential. Do not add a check against any request
   * attribute (User-Agent, IP, …): the mint traverses the gateway and the redeem
   * bypasses it, so the two legs observe different values and any such binding
   * can never match. See the implementation's comment.
   */
  redeemTicket(token: string): Promise<TicketClaims | null>;

  /** True when this user is under the per-minute mint cap. Increments the counter. */
  allowMint(internal_user_id: number): Promise<boolean>;

  /** False when the global connection cap is reached. Checked BEFORE redeeming a
   *  ticket, so a saturated server answers 503 instead of burning the client's
   *  single-use credential and one of its rate-limited mints. */
  hasCapacity(): boolean;

  /**
   * Take ownership of an SSE response: register it for fan-out, start the
   * heartbeat and the absolute-lifetime timer, and wire up cleanup.
   *
   * NOTE ON AsyncLocalStorage: `res.write` is later invoked from the Redis
   * message callback, a completely different async context that ALS cannot
   * survive even with `preserveContext()`. The hub therefore holds the resolved
   * identity as plain fields on the connection and never consults `getContext()`
   * in the fan-out path.
   */
  attach(claims: TicketClaims, req: Request, res: Response): void;

  /** Redis is connected and subscribed. Reported once in the `ready` frame. */
  healthy(): boolean;

  /** Close every connection and both Redis clients. For SIGTERM and tests. */
  dispose(): Promise<void>;
}
