import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { User } from "../../users/domain/user.models.js";
import { NotificationCategory, NotificationChannel, OutboundStatus, PreferenceMode } from "../shared/notification.types.js";

/**
 * Durable, per-user notification row.
 *
 * The recipient (`id_user` / `user`) is the mandatory scope — every notification
 * belongs to exactly one user and is cascade-deleted with them. `id_community`
 * is intentionally *nullable*: a user can receive notifications outside of any
 * community context, so community is an optional scope used as a filter only when
 * a request carries an active community. The `data` JSONB column holds the
 * type-specific payload (e.g. `{ "simulationId": 42 }`).
 *
 * Real-time delivery (SSE / LISTEN-NOTIFY) is deliberately not part of this layer.
 */
@Entity("notification")
// List ordering + future cursor: newest-first per recipient.
@Index("idx_notification_user_id", ["id_user", "id"])
// Cheap unread-count badge: partial index on unread rows only.
@Index("idx_notification_user_unread", ["id_user"], { where: '"read_at" IS NULL' })
@Index("idx_notification_community", ["id_community"])
export class Notification {
  // bigint surfaced as string to avoid silent precision loss past 2^53.
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id!: string;

  @Column({ name: "id_community", type: "int", nullable: true })
  id_community!: number | null;

  @ManyToOne(() => Community, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_community" })
  community!: Community | null;

  @Column({ name: "id_user", type: "int" })
  id_user!: number;

  // The recipient. Named `user` so the shared `withUserScope` helper joins it.
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_user" })
  user!: User;

  @Column({ name: "type", type: "varchar", length: 128 })
  type!: string;

  @Column({ name: "data", type: "jsonb", default: () => "'{}'::jsonb" })
  data!: Record<string, unknown>;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  read_at!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at!: Date;
}

/**
 * One queued outbound message: (message, channel, recipient).
 *
 * Written by `OutboundService` inside `publish`'s SAVEPOINT, on the producer's
 * transaction, so "the business write committed ⇒ the message is queued" is an
 * invariant rather than a hope. Read and driven to completion by the
 * `notification-dispatch` worker, which is the only thing that ever writes a
 * status past PENDING.
 *
 * Two columns look redundant and are not:
 *
 * - `id_notification` is NULLABLE. An invitation to an address with no account
 *   has no notification row to hang off, because `notification.id_user` is NOT
 *   NULL. That case is the reason this table exists. `ON DELETE SET NULL` (not
 *   CASCADE) so a notification purge cannot silently delete unsent mail.
 * - `recipient` / `recipient_name` are resolved at enqueue time and stored
 *   literally, so a later change of address never redirects an already-queued
 *   message. There is deliberately no `id_user` column and no join back to
 *   `app_user`.
 *
 * `category` is persisted because the dispatcher decides from it whether to
 * render an opt-out footer — deriving that from `type` would duplicate the
 * producer's policy declaration, which is exactly what the orthogonal
 * (category, channels) contract exists to prevent.
 */
@Entity("outbound_message")
// The claim query. Partial so the index stays the size of the backlog.
@Index("ix_outbound_message_due", ["scheduled_for"], { where: '"status" = 1' })
// The reaper query: rows a worker claimed and then died holding.
@Index("ix_outbound_message_stale", ["claimed_at"], { where: '"status" = 5' })
@Index("uq_outbound_message_dedupe", ["dedupe_key"], { unique: true })
export class OutboundMessage {
  // bigint surfaced as string to avoid silent precision loss past 2^53.
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id!: string;

  @Column({ name: "id_notification", type: "bigint", nullable: true })
  id_notification!: string | null;

  @Column({ name: "id_community", type: "int", nullable: true })
  id_community!: number | null;

  @Column({ name: "channel", type: "smallint", enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ name: "recipient", type: "varchar", length: 320 })
  recipient!: string;

  @Column({ name: "recipient_name", type: "varchar", length: 255, nullable: true })
  recipient_name!: string | null;

  /** `''` means "unknown" — the dispatcher applies its own default locale. */
  @Column({ name: "locale", type: "varchar", length: 8, default: "" })
  locale!: string;

  @Column({ name: "type", type: "varchar", length: 128 })
  type!: string;

  @Column({ name: "category", type: "smallint", enum: NotificationCategory })
  category!: NotificationCategory;

  @Column({ name: "data", type: "jsonb", default: () => "'{}'::jsonb" })
  data!: Record<string, unknown>;

  @Column({ name: "dedupe_key", type: "varchar", length: 200 })
  dedupe_key!: string;

  @Column({ name: "status", type: "smallint", enum: OutboundStatus, default: OutboundStatus.PENDING })
  status!: OutboundStatus;

  @Column({ name: "attempts", type: "smallint", default: 0 })
  attempts!: number;

  @Column({ name: "last_error", type: "text", nullable: true })
  last_error!: string | null;

  @Column({ name: "scheduled_for", type: "timestamptz", default: () => "NOW()" })
  scheduled_for!: Date;

  @Column({ name: "claimed_at", type: "timestamptz", nullable: true })
  claimed_at!: Date | null;

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sent_at!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at!: Date;
}

/**
 * What a recipient wants done with a (type prefix, channel) pair.
 *
 * Consulted only for INFORMATIONAL notifications: TRANSACTIONAL overrides
 * preference entirely and never reads this table (§1.3 — an invoice or a missed
 * regulatory deadline is not opt-out-able).
 *
 * `type_prefix` is `''` for the default, else the FIRST dot-segment of a type
 * key (`invoice`, `admin_deadline`, …). Resolution is most-specific-wins per
 * (user, channel); absence means IMMEDIATE. The composite PK
 * `(id_user, type_prefix, channel)` is also the read index — the lookup is
 * `id_user = ANY(...) AND type_prefix IN ('', <prefix>)`, whose leading column
 * it already serves.
 */
@Entity("notification_preference")
export class NotificationPreference {
  @PrimaryColumn({ name: "id_user", type: "int" })
  id_user!: number;

  @PrimaryColumn({ name: "type_prefix", type: "varchar", length: 128 })
  type_prefix!: string;

  @PrimaryColumn({ name: "channel", type: "smallint", enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ name: "mode", type: "smallint", enum: PreferenceMode })
  mode!: PreferenceMode;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_user" })
  user!: User;
}
