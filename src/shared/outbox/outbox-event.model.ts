import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/**
 * One domain event waiting for (or past) publication. Written only by
 * OutboxWriter, inside the business transaction; read and stamped only by the
 * relay. See shared/outbox/core-events.ts for the event catalogue.
 */
@Entity("outbox_event")
// The relay's claim query. Partial so the index stays the size of the backlog.
@Index("ix_outbox_event_unpublished", ["id"], { where: '"published_at" IS NULL' })
export class OutboxEvent {
  // bigint surfaced as string to avoid silent precision loss past 2^53.
  @PrimaryGeneratedColumn("identity", { type: "bigint", generatedIdentity: "ALWAYS" })
  id!: string;

  /** Published as `Nats-Msg-Id`: JetStream drops a republished duplicate. */
  @Column({ name: "event_id", type: "uuid", unique: true })
  event_id!: string;

  @Column({ name: "id_community", type: "int" })
  id_community!: number;

  @Column({ name: "aggregate_type", type: "varchar", length: 32 })
  aggregate_type!: string;

  @Column({ name: "aggregate_id", type: "varchar", length: 64 })
  aggregate_id!: string;

  @Column({ name: "event_type", type: "varchar", length: 64 })
  event_type!: string;

  @Column({ name: "payload", type: "jsonb", default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;

  @Column({ name: "occurred_at", type: "timestamptz", default: () => "NOW()" })
  occurred_at!: Date;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  published_at!: Date | null;

  @Column({ name: "attempts", type: "smallint", default: 0 })
  attempts!: number;

  @Column({ name: "last_error", type: "text", nullable: true })
  last_error!: string | null;
}
