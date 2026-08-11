import type { DeepPartial, QueryRunner } from "typeorm";
import type { Role } from "../../../shared/dtos/role.js";
import type { Notification } from "./notification.models.js";
import type { NotificationQueryDTO } from "../api/notification.dtos.js";
import type { NotificationChannel, PreferenceMode } from "../shared/notification.types.js";

/** One resolved (user, channel) preference. `type_prefix` is already collapsed away. */
export interface ResolvedPreference {
  id_user: number;
  channel: NotificationChannel;
  mode: PreferenceMode;
}

/** One stored preference row, as the read/write endpoints exchange it. */
export interface PreferenceRow {
  type_prefix: string;
  channel: NotificationChannel;
  mode: PreferenceMode;
}

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

  /**
   * Bulk-insert notification rows (one per recipient). No-op on an empty array.
   *
   * Returns the saved entities, in the order given, with their generated ids
   * populated — the delivery layer needs `id_notification` to link each queued
   * email back to the in-app row it accompanies, and the ids only exist after
   * the insert has flushed.
   */
  insertMany(rows: DeepPartial<Notification>[], query_runner?: QueryRunner): Promise<Notification[]>;

  /**
   * Resolve the effective (user, channel) preferences for one notification type,
   * most-specific-wins: a row whose `type_prefix` is the type's first
   * dot-segment beats the `''` default row. Users and channels absent from the
   * result have expressed no preference and default to IMMEDIATE.
   *
   * Only ever called for INFORMATIONAL notifications — TRANSACTIONAL bypasses
   * preference entirely and must not reach this query.
   */
  findPreferences(user_ids: number[], type_prefix: string, query_runner?: QueryRunner): Promise<ResolvedPreference[]>;

  /** Every preference row the current user has stored. */
  listPreferences(query_runner?: QueryRunner): Promise<PreferenceRow[]>;

  /**
   * Replace the current user's preferences wholesale. Rows absent from `rows`
   * are deleted, which is what makes "reset to default" expressible.
   */
  replacePreferences(rows: PreferenceRow[], query_runner?: QueryRunner): Promise<void>;
}
