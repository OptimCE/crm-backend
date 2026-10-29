import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/** What a `regulatory_link_status` row is about. */
export enum RegulatorySubjectType {
  METER = 1,
  KEY = 2,
}

/**
 * The authorised state of a subject in an operation, as the administrative annexe derives it
 * from its dossiers. Generic to every regulator: the regulator-specific steps stay in the annexe.
 */
export enum RegulatoryStatus {
  TO_NOTIFY = 1,
  PENDING_GRD = 2,
  PENDING_REGULATOR = 3,
  AUTHORIZED = 4,
  ACTIVE = 5,
  LEAVING = 6,
  ENDED = 7,
  REFUSED = 8,
}

/**
 * One episode of a meter (EAN) or key in a sharing operation, opened by one dossier of the
 * administrative annexe. READ-ONLY for the core: only the annexe writes it, through the four effect
 * columns its DB role may update (postgres/provision/30-crm-grants.sql). The core never emits an
 * outbox event for it. See database_script/2026-10-29_regulatory_link_status.sql for the
 * exclusion constraint that keeps an EAN in one operation per date.
 */
@Entity("regulatory_link_status")
@Index("ix_regulatory_link_operation", ["id_community", "id_sharing_operation"])
export class RegulatoryLinkStatus {
  // bigint surfaced as string to avoid silent precision loss past 2^53.
  @PrimaryGeneratedColumn("identity", { type: "bigint", generatedIdentity: "ALWAYS" })
  id!: string;

  @Column({ name: "id_community", type: "int" })
  id_community!: number;

  @Column({ name: "id_sharing_operation", type: "int" })
  id_sharing_operation!: number;

  @Column({ name: "subject_type", type: "smallint", enum: RegulatorySubjectType })
  subject_type!: RegulatorySubjectType;

  @Column({ name: "subject_ref", type: "varchar", length: 64 })
  subject_ref!: string;

  @Column({ name: "id_dossier_origin", type: "bigint" })
  id_dossier_origin!: string;

  @Column({ name: "regulatory_status", type: "smallint", enum: RegulatoryStatus })
  regulatory_status!: RegulatoryStatus;

  @Column({ name: "valid_from", type: "date", nullable: true })
  valid_from!: string | null;

  @Column({ name: "valid_to", type: "date", nullable: true })
  valid_to!: string | null;

  @Column({ name: "regulatory_ref", type: "varchar", length: 64, nullable: true })
  regulatory_ref!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updated_at!: Date;
}
