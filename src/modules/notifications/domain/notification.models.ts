import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { User } from "../../users/domain/user.models.js";

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
