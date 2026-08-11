import type { QueryRunner } from "typeorm";
import type { NotificationCategory, NotificationChannel } from "../shared/notification.types.js";

/** Everything the delivery layer needs to address one recipient, read once at enqueue. */
export interface RecipientContact {
  id_user: number;
  email: string;
  locale: string | null;
  first_name: string | null;
  last_name: string | null;
}

/**
 * One row to stage in `outbound_message`.
 *
 * `recipient` / `recipient_name` / `locale` are already resolved: the queue
 * stores the address literally so a later profile change never redirects or
 * relabels an already-queued message, and so the dispatch worker needs no join
 * back to `app_user`.
 */
export interface OutboundRowInput {
  id_notification: string | null;
  id_community: number | null;
  channel: NotificationChannel;
  recipient: string;
  recipient_name: string | null;
  locale: string;
  type: string;
  category: NotificationCategory;
  data: Record<string, unknown>;
  dedupe_key: string;
}

export interface IOutboundRepository {
  /**
   * Resolve email, locale and display name for a set of internal user ids.
   * Users with no row are simply absent — the caller queues nothing for them.
   */
  findRecipientContacts(user_ids: number[], query_runner?: QueryRunner): Promise<RecipientContact[]>;

  /**
   * Stage outbound rows, skipping any whose `dedupe_key` already exists.
   * Returns the number of rows actually inserted. No-op on an empty array.
   */
  insertMany(rows: OutboundRowInput[], query_runner?: QueryRunner): Promise<number>;
}
