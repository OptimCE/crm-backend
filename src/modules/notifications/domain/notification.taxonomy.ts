/**
 * Central registry of notification type keys — the taxonomy
 * IMPLEMENTATION_PLAN §1.2 wants in one place.
 *
 * Convention: `<feature>.<event>`, lowercase, EXACTLY two dot-separated
 * segments. Two is not stylistic. The frontend localizes via
 * `NOTIFICATIONS.TYPES.<feature>.<event>.title`, and because the key contains a
 * dot, ngx-translate resolves it as a NESTED JSON path — so a three-segment key
 * would silently need a third level in every locale file. (Contrast
 * `AUDIT_ACTIONS`, which is three segments and is not used as an i18n path.)
 *
 * Adding a key here is half the work. The other half, in crm-frontend:
 *   - an entry in `features/notifications/services/notification-type.registry.ts`
 *   - a `title` in ALL FOUR `src/assets/i18n/{en,fr,nl,de}.json`
 * A missing title renders the raw key to the user with no error anywhere.
 *
 * The keys published by the Python annexes are listed too, so the frontend
 * registry has one complete list to diff against. Their producing constants live
 * in each service's `core/notifications/types.py`.
 */
export const NOTIFICATION_TYPES = {
  // crm-backend (this service)
  MANAGER_INVITATION_RECEIVED: "manager_invitation.received",
  MEMBER_INVITATION_RECEIVED: "member_invitation.received",
  MEMBER_UPDATED: "member.updated",
  DOCUMENT_UPLOADED: "document.uploaded",
  // news-board
  NEWS_POST_PUBLISHED: "news_post.published",
  NEWS_POLL_PUBLISHED: "news_poll.published",
  // billing
  INVOICE_ISSUED: "invoice.issued",
  INVOICE_OVERDUE: "invoice.overdue",
  BILLING_RUN_COMPLETED: "billing_run.completed",
  // administrative-document
  ADMIN_DEADLINE_DUE_SOON: "admin_deadline.due_soon",
  ADMIN_DEADLINE_MISSED: "admin_deadline.missed",
  ADMIN_DOSSIER_ACKNOWLEDGED: "admin_dossier.acknowledged",
} as const;

/**
 * The `type_prefix` values `notification_preference` recognises: the first
 * dot-segment of every registered type, de-duplicated and sorted.
 *
 * Derived rather than listed so it cannot drift from the taxonomy the frontend
 * already diffs against. The preferences endpoint returns this to the client, so
 * there is no hardcoded list in crm-frontend either.
 *
 * `''` — the "applies to every type" default row — is deliberately not here: it
 * is a wildcard, not a prefix, and the endpoint surfaces it separately.
 *
 * A prefix appearing here does NOT promise that muting it has any effect: a
 * TRANSACTIONAL notification bypasses preference entirely, so `invoice` only
 * governs a future informational invoice type, and `admin_deadline` governs
 * `due_soon` but never `missed`.
 */
export const NOTIFICATION_TYPE_PREFIXES: readonly string[] = Object.freeze(
  [...new Set(Object.values(NOTIFICATION_TYPES).map((type) => type.split(".")[0]))].sort(),
);

/**
 * A notification type key. The `(string & {})` escape hatch is copied
 * deliberately from `AuditAction`: `notification.type` is a free-form
 * `varchar(128)` and the test suite publishes ad-hoc keys, so a closed union
 * would buy no safety and break existing callers.
 */
export type NotificationTypeKey = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES] | (string & {});
