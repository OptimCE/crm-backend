/**
 * Delivery channels a producer may REQUEST. Effective delivery is
 * `channels ∩ user preference`, with TRANSACTIONAL bypassing preference — the
 * producer states intent, the notification layer owns policy
 * (IMPLEMENTATION_PLAN §1.3). That split is the whole reason the layer can be
 * extracted later, so it holds from day one.
 *
 * 1-based numeric, matching the repo convention for coded values. These values
 * ARE the on-disk encoding: they land verbatim in `outbound_message.channel` and
 * `notification_preference.channel`, and in the Phase 2 wire payload. The Python
 * annexes' `core/notifications/contract.py` declares the same numbers. Never
 * renumber them.
 *
 * Not to be confused with `NotificationType` in
 * `src/shared/dtos/NotificationMessage.ts` (EMAIL = 0, NOTIFICATION = 1), which
 * belongs to an unbound, unreachable HTTP notifier. Never import that one here.
 */
export enum NotificationChannel {
  INAPP = 1,
  EMAIL = 2,
}

/**
 * The producer's statement of KIND, orthogonal to `channels`.
 *
 * - TRANSACTIONAL — an invoice, an invitation, a missed regulatory deadline.
 *   Consequential, so it overrides the recipient's preferences and must never
 *   offer an unsubscribe link.
 * - INFORMATIONAL — news, digests, reminders. An opt-out must exist and be
 *   honoured, and an unsubscribe link becomes mandatory once email ships (§1.6).
 */
export enum NotificationCategory {
  TRANSACTIONAL = 1,
  INFORMATIONAL = 2,
}

/**
 * Lifecycle of one queued outbound message. Persisted in
 * `outbound_message.status`.
 *
 * CLAIMED is not decoration. The dispatch worker flips a row to CLAIMED and
 * increments `attempts` in the *same* statement that claims it, then sends
 * outside any transaction. That is what makes a message which kills the worker
 * mid-send exhaust its attempts instead of being reclaimed forever, and it is
 * why a reaper can tell "being sent right now" from "abandoned by a dead
 * process" via `claimed_at`.
 *
 * crm-backend only ever writes PENDING (the default). Everything past it belongs
 * to `notification-dispatch`.
 */
export enum OutboundStatus {
  PENDING = 1,
  SENT = 2,
  FAILED = 3,
  SUPPRESSED = 4,
  CLAIMED = 5,
}

/**
 * What a recipient wants done with a given (type prefix, channel) pair.
 *
 * `2 DAILY_DIGEST` is deliberately NOT declared: there is no digest runner, and
 * a value the enum accepts while the code silently treats it as IMMEDIATE is a
 * value somebody eventually writes by hand. The number stays reserved in the
 * encoding and the DB `CHECK` rejects it; both are relaxed when digests ship.
 */
export enum PreferenceMode {
  IMMEDIATE = 1,
  OFF = 3,
}

/** Why an address was added to `email_suppression`. Written by the dispatcher. */
export enum SuppressionReason {
  HARD_BOUNCE = 1,
  COMPLAINT = 2,
  UNSUBSCRIBED = 3,
  MANUAL = 4,
}
