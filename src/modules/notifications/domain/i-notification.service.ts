import type { QueryRunner } from "typeorm";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { NotificationDTO, NotificationPublishInput, NotificationQueryDTO, UnreadCountDTO } from "../api/notification.dtos.js";

export interface INotificationService {
  /**
   * Publish a notification: fan out to one row per recipient resolved from the
   * target (a single user, or the members of a community — optionally narrowed by
   * role). Returns the number of rows written (0 when a community has no matching
   * members). Context-free; pass a `query_runner` to enlist in a caller's
   * transaction. Errors propagate to the caller.
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
}
