import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { User } from "../../users/domain/user.models.js";
import { Community } from "../../communities/domain/community.models.js";
import type { ExportLocale, ExportPartStatus, ExportScopeType, ExportStatus } from "./export.types.js";

export * from "./export.types.js";

/**
 * One request for all the data about a user or a community. Its id is the exportId of the NATS
 * messages. scope_id and requester_user_id are Keycloak ids (what the contract carries);
 * id_community and id_requester are the same, as internal ids.
 * See database_script/2026-11-15_data_export.sql.
 */
@Entity("export_job")
export class ExportJob {
  @PrimaryColumn({ name: "id", type: "uuid" })
  id!: string;

  @Column({ name: "scope_type", type: "varchar", length: 16 })
  scope_type!: ExportScopeType;

  @Column({ name: "scope_id", type: "varchar", length: 255 })
  scope_id!: string;

  @Column({ name: "id_community", type: "int", nullable: true })
  id_community!: number | null;

  @Column({ name: "requester_user_id", type: "varchar", length: 255 })
  requester_user_id!: string;

  @Column({ name: "id_requester", type: "int" })
  id_requester!: number;

  @Column({ name: "status", type: "varchar", length: 16, default: "pending" })
  status!: ExportStatus;

  @Column({ name: "schema_version", type: "varchar", length: 16 })
  schema_version!: string;

  @Column({ name: "locale", type: "varchar", length: 8 })
  locale!: ExportLocale;

  @Column({ name: "created_at", type: "timestamptz", default: () => "NOW()" })
  created_at!: Date;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  started_at!: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completed_at!: Date | null;

  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expires_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "NOW()" })
  updated_at!: Date;

  @Column({ name: "object_key", type: "text", nullable: true })
  object_key!: string | null;

  /** bigint: node-postgres returns it as a string. */
  @Column({ name: "size_bytes", type: "bigint", nullable: true })
  size_bytes!: string | null;

  @Column({ name: "sha256", type: "char", length: 64, nullable: true })
  sha256!: string | null;

  @Column({ name: "assembly_attempts", type: "smallint", default: 0 })
  assembly_attempts!: number;

  @Column({ name: "error_code", type: "varchar", length: 64, nullable: true })
  error_code!: string | null;

  @Column({ name: "error_detail", type: "text", nullable: true })
  error_detail!: string | null;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_requester" })
  requester?: User;

  @ManyToOne(() => Community, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_community" })
  community?: Community | null;

  @OneToMany(() => ExportPart, (part) => part.job)
  parts?: ExportPart[];
}

/** One service's share of an export. Its id is the partId of the NATS messages. */
@Entity("export_part")
export class ExportPart {
  @PrimaryColumn({ name: "id", type: "uuid" })
  id!: string;

  @Column({ name: "export_job_id", type: "uuid" })
  export_job_id!: string;

  @Column({ name: "service", type: "varchar", length: 64 })
  service!: string;

  @Column({ name: "status", type: "varchar", length: 16, default: "pending" })
  status!: ExportPartStatus;

  /** How many times the worker published the request (export.request.<service>). */
  @Column({ name: "attempts", type: "smallint", default: 0 })
  attempts!: number;

  @Column({ name: "requested_at", type: "timestamptz", nullable: true })
  requested_at!: Date | null;

  /** The export.part.done message the worker received. */
  @Column({ name: "result", type: "jsonb", nullable: true })
  result!: Record<string, unknown> | null;

  @Column({ name: "last_error", type: "text", nullable: true })
  last_error!: string | null;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "NOW()" })
  updated_at!: Date;

  @ManyToOne(() => ExportJob, (job) => job.parts, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "export_job_id" })
  job?: ExportJob;
}
