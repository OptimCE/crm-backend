import type { QueryRunner } from "typeorm";
import type { NotificationTypeKey } from "./notification.taxonomy.js";
import type { NotificationCategory } from "../shared/notification.types.js";

/** One recipient of the EMAIL channel, as resolved by `publish`. */
export interface OutboundRecipient {
  id_user: number;
  /** The in-app row this message accompanies, or null when INAPP was not effective. */
  id_notification: string | null;
}

/** An email to an address that has no `app_user` row — the invitation case. */
export interface OutboundDirectInput {
  type: NotificationTypeKey;
  /** The literal address, resolved now. */
  recipient: string;
  category: NotificationCategory;
  data?: Record<string, unknown>;
  id_community?: number | null;
  locale?: string | null;
  /** Overrides the derived idempotency key. See `buildDedupeKey`. */
  dedupe_key?: string;
}

/**
 * The only thing in this codebase that writes `outbound_message`.
 *
 * Two entry points, one row builder: `enqueueForRecipients` is called from
 * inside `NotificationService.publish`'s SAVEPOINT once the notification ids are
 * flushed, and `enqueueDirect` is called for a recipient who has no account and
 * therefore no notification row to accompany. Keeping both here is what stops
 * the dedupe key, the locale fallback and the address guard from being
 * implemented twice and drifting.
 *
 * Deliberately NOT a method on `INotificationService`: the contract test rebinds
 * that token with `toConstantValue(spy)`, which erases the interface, so an
 * extra method there fails at runtime as a `TypeError` swallowed into a 400.
 * It is also not part of the producer-facing contract the Python annexes
 * mirror — none of them invites an account-less address.
 */
export interface IOutboundService {
  /**
   * Stage one EMAIL row per recipient. Never raises; the caller is already
   * inside a SAVEPOINT and a delivery failure must not abort the business write.
   * Returns the number of rows staged.
   */
  enqueueForRecipients(
    input: {
      type: string;
      category: NotificationCategory;
      data: Record<string, unknown>;
      id_community: number | null;
      dedupe_key?: string;
    },
    recipients: OutboundRecipient[],
    query_runner?: QueryRunner,
  ): Promise<number>;

  /**
   * Stage one EMAIL row for a literal address with no account. Runs in its own
   * SAVEPOINT on the caller's transaction and never raises, so a failure cannot
   * take down the invitation it accompanies.
   */
  enqueueDirect(input: OutboundDirectInput, query_runner?: QueryRunner): Promise<number>;
}
