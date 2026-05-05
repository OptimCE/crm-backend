import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { AllocationKey } from "../../keys/domain/key.models.js";
import { Municipality } from "../../municipalities/domain/municipality.models.js";
import { SharingKeyStatus, SharingOperationType } from "../shared/sharing_operation.types.js";

/**
 * Entity representing a sharing operation (e.g., Energy Sharing Group).
 */
@Entity("sharing_operation")
@Index("idx_sharing_operation_community", ["community"])
export class SharingOperation {
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * Name of the sharing operation.
   */
  @Column({ type: "varchar", length: 255 })
  name!: string;

  /**
   * Type of sharing operation (enum).
   */
  @Column({ type: "int", enum: SharingOperationType })
  type!: SharingOperationType;

  @Column({ name: "is_public", type: "boolean", default: false })
  is_public!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  /**
   * Community the sharing operation belongs to.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;

  /**
   * History of keys associated with this operation.
   */
  @OneToMany(() => SharingOperationKey, (key) => key.sharing_operation)
  keys!: SharingOperationKey[];

  /**
   * Municipalities (Belgian communes) covered by this operation.
   */
  @OneToMany(() => SharingOperationMunicipality, (link) => link.sharing_operation)
  municipalities!: SharingOperationMunicipality[];
}

/**
 * Join entity linking a sharing operation to one of the Belgian municipalities
 * it covers. Composite primary key (id_sharing_operation, nis_code).
 */
@Entity("sharing_operation_municipality")
@Index("idx_sharing_op_muni_nis", ["municipality"])
export class SharingOperationMunicipality {
  @PrimaryColumn({ name: "id_sharing_operation", type: "int" })
  id_sharing_operation!: number;

  @PrimaryColumn({ name: "nis_code", type: "int" })
  nis_code!: number;

  @ManyToOne(() => SharingOperation, (so) => so.municipalities, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_sharing_operation" })
  sharing_operation!: SharingOperation;

  @ManyToOne(() => Municipality, { onDelete: "RESTRICT", nullable: false })
  @JoinColumn({ name: "nis_code" })
  municipality!: Municipality;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}

/**
 * Entity linking a sharing operation to an allocation key with a validty period.
 */
@Entity("sharing_operation_key")
@Index("idx_sharing_operation_key_sharing_op", ["sharing_operation"])
@Index("idx_sharing_operation_key_key", ["allocation_key"])
@Index("idx_sharing_operation_key_community", ["community"])
export class SharingOperationKey {
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  @ManyToOne(() => SharingOperation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_sharing_operation" })
  sharing_operation!: SharingOperation;

  /**
   * The allocation key being used.
   */
  @ManyToOne(() => AllocationKey, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_key" })
  allocation_key!: AllocationKey;

  /**
   * Start date of the key validity.
   */
  @Column({ name: "start_date", type: "date" })
  start_date!: string;

  /**
   * End date of the key validity (null if active indefinitely).
   */
  @Column({ name: "end_date", type: "date", nullable: true })
  end_date!: string | null;

  /**
   * Status of this key association (Active, Waiting, etc.).
   */
  @Column({ type: "int", enum: SharingKeyStatus })
  status!: SharingKeyStatus;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;
}

/**
 * Entity storing aggregated consumption timestamps for a sharing operation.
 */
@Entity("sharing_op_consumption")
@Index("idx_sharing_op_consumption_sharing_op", ["sharing_operation"])
@Index("idx_sharing_op_consumption_community", ["community"])
export class SharingOpConsumption {
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  @ManyToOne(() => SharingOperation, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_sharing_operation" })
  sharing_operation!: SharingOperation | null;

  @Column({ type: "timestamptz" })
  timestamp!: Date;

  @Column({ type: "float", nullable: true })
  gross!: number | null;

  @Column({ type: "float", nullable: true })
  net!: number | null;

  @Column({ type: "float", nullable: true })
  shared!: number | null;

  @Column({ name: "inj_gross", type: "float", nullable: true })
  inj_gross!: number | null;

  @Column({ name: "inj_shared", type: "float", nullable: true })
  inj_shared!: number | null;

  @Column({ name: "inj_net", type: "float", nullable: true })
  inj_net!: number | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;
}
