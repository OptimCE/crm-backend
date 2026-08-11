import type { QueryRunner } from "typeorm";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type {
  NotificationDTO,
  NotificationPreferenceDTO,
  NotificationPreferencesDTO,
  NotificationPublishInput,
  NotificationQueryDTO,
  UnreadCountDTO,
} from "../api/notification.dtos.js";

export interface INotificationService {
  /**
   * Publish a notification: fan out to one row per recipient resolved from the
   * target (a single user, an explicit set, or the members of a community —
   * optionally narrowed by role).
   *
   * Returns the number of IN-APP rows written: 0 when the target resolves to
   * nobody, when INAPP is not among the requested channels, when every resolved
   * recipient has muted the in-app channel for this type, and on any swallowed
   * failure. An email-only publish therefore returns 0 while still queueing
   * mail — the count is about in-app rows, not about delivery.
   *
   * **Never raises.** A notification failure must not abort the business write
   * that triggered it. The work runs in a SAVEPOINT on `query_runner`, so a
   * failure leaves the caller's transaction clean and committable — callers do
   * NOT need their own try/catch, and one would not have been enough anyway.
   *
   * Context-free; pass a `query_runner` to enlist in a caller's transaction.
   */
  publish(input: NotificationPublishInput, query_runner?: QueryRunner): Promise<number>;

  /**
   * Paginated, newest-first list for the current user, optionally filtered to a
   * single community (`query.community_id`).
   */
  list(query: NotificationQueryDTO): Promise<[NotificationDTO[], Pagination]>;

  /** Unread count for the current user, optionally filtered to a single community. */
  getUnreadCount(community_id?: number): Promise<UnreadCountDTO>;

  /**
   * Mark a single notification read. Throws NOT_FOUND (404) when the id is not a
   * notification belonging to the current user; re-marking an already-read one
   * resolves without error.
   */
  markRead(id: number): Promise<void>;

  /** Mark every unread notification read for the current user, optionally filtered to a community. */
  markAllRead(community_id?: number): Promise<void>;

  /**
   * The current user's channel preferences, plus the server-owned list of type
   * prefixes they may be expressed against. The list is served rather than
   * hardcoded client-side so it cannot drift from the taxonomy.
   */
  getPreferences(): Promise<NotificationPreferencesDTO>;

  /**
   * Replace the current user's preferences wholesale and return the new state.
   * Rejects an unknown `type_prefix`; `''` (the catch-all default) is always
   * accepted.
   */
  setPreferences(preferences: NotificationPreferenceDTO[]): Promise<NotificationPreferencesDTO>;
}
