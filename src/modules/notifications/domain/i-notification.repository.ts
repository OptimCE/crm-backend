import type { DeepPartial, QueryRunner } from "typeorm";
import type { Role } from "../../../shared/dtos/role.js";
import type { Notification } from "./notification.models.js";
import type { NotificationQueryDTO } from "../api/notification.dtos.js";

export interface INotificationRepository {
  /**
   * Paginated list of the current user's notifications (newest-first), optionally
   * narrowed to a single community via `query.community_id`. Recipient scope is
   * resolved from request context inside the repository — never passed by callers.
   * The source community (id + name) is loaded for display.
   */
  list(query: NotificationQueryDTO, query_runner?: QueryRunner): Promise<[Notification[], number]>;

  /**
   * Count the current user's unread notifications, optionally narrowed to a single
   * community.
   */
  countUnread(community_id?: number, query_runner?: QueryRunner): Promise<number>;

  /**
   * Mark a single notification read for the current user. Returns false when no
   * notification with that id belongs to the current user (so the service can
   * surface a 404); true when it exists (re-marking an already-read one is a no-op).
   */
  markOneRead(id: number, query_runner?: QueryRunner): Promise<boolean>;

  /**
   * Mark every unread notification read for the current user, optionally narrowed
   * to a single community. Returns the number of rows cleared.
   */
  markAllRead(community_id?: number, query_runner?: QueryRunner): Promise<number>;

  /**
   * Resolve the internal user ids that should receive a community notification —
   * every member of the community, optionally narrowed to the given community
   * roles. Context-free: the community is an explicit argument.
   */
  findCommunityRecipientIds(community_id: number, roles?: Role[], query_runner?: QueryRunner): Promise<number[]>;

  /** Bulk-insert notification rows (one per recipient). No-op on an empty array. */
  insertMany(rows: DeepPartial<Notification>[], query_runner?: QueryRunner): Promise<void>;
}
