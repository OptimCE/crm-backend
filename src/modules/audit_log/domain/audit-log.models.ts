import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/**
 * Append-only audit trail row.
 *
 * Owner fields (`user_id`, `user_email`) are denormalized at write time so the
 * log remains readable if a user is later deleted or anonymized — `user_id`
 * is intentionally NOT a foreign key. `id_community` is nullable so events
 * emitted outside a request context (background jobs, system tasks) can still
 * be recorded.
 */
@Entity("audit_log")
@Index("idx_audit_log_community_timestamp", ["id_community", "timestamp"])
@Index("idx_audit_log_community_entity", ["id_community", "entity_type", "entity_id"])
@Index("idx_audit_log_community_action", ["id_community", "action"])
export class AuditLog {
  // bigint surfaced as string to avoid silent precision loss past 2^53.
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id!: string;

  @Column({ name: "id_community", type: "int", nullable: true })
  id_community!: number | null;

  @CreateDateColumn({ name: "timestamp", type: "timestamptz" })
  timestamp!: Date;

  @Column({ name: "action", type: "varchar", length: 128 })
  action!: string;

  @Column({ name: "source", type: "varchar", length: 32 })
  source!: string;

  @Column({ name: "entity_type", type: "varchar", length: 64 })
  entity_type!: string;

  @Column({ name: "entity_id", type: "varchar", length: 64, nullable: true })
  entity_id!: string | null;

  @Column({ name: "user_id", type: "int", nullable: true })
  user_id!: number | null;

  @Column({ name: "user_email", type: "varchar", length: 256, nullable: true })
  user_email!: string | null;

  @Column({ name: "payload", type: "jsonb", default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;
}
