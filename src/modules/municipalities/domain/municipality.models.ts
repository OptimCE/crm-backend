import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Reference table of Belgian municipalities.
 * Source: opendata.brussels.be — "codes-ins-nis-postaux-belgique".
 *
 * The dataset is loaded separately. This module only reads from these tables.
 */
@Entity("municipality")
@Index("idx_municipality_fr_name", ["fr_name"])
@Index("idx_municipality_nl_name", ["nl_name"])
export class Municipality {
  /** NIS (Institut national de statistique) code — stable national identifier. */
  @PrimaryColumn({ name: "nis_code", type: "int" })
  nis_code!: number;

  @Column({ name: "fr_name", type: "varchar", length: 255 })
  fr_name!: string;

  @Column({ name: "nl_name", type: "varchar", length: 255, nullable: true })
  nl_name!: string | null;

  @Column({ name: "de_name", type: "varchar", length: 255, nullable: true })
  de_name!: string | null;

  @Column({ name: "region_fr", type: "varchar", length: 64, nullable: true })
  region_fr!: string | null;

  @Column({ name: "region_nl", type: "varchar", length: 64, nullable: true })
  region_nl!: string | null;

  @Column({ name: "geo_point", type: "jsonb", nullable: true })
  geo_point!: unknown;

  @Column({ name: "geo_shape", type: "jsonb", nullable: true })
  geo_shape!: unknown;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @OneToMany(() => MunicipalityPostalCode, (pc) => pc.municipality)
  postal_codes!: MunicipalityPostalCode[];
}

/**
 * Lookup row pairing a postal code with a municipality.
 * A municipality can have several postal codes; a postal code can span several
 * municipalities (e.g., 1000 covers parts of Bruxelles and surrounding communes).
 */
@Entity("municipality_postal_code")
@Index("idx_municipality_postal_code_nis", ["municipality"])
export class MunicipalityPostalCode {
  @PrimaryColumn({ name: "postal_code", type: "varchar", length: 10 })
  postal_code!: string;

  @PrimaryColumn({ name: "nis_code", type: "int" })
  nis_code!: number;

  @ManyToOne(() => Municipality, (m) => m.postal_codes, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "nis_code" })
  municipality!: Municipality;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}
