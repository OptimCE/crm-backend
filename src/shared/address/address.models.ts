import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Community } from "../../modules/communities/domain/community.models.js";
import { AddressGeocodeStatus, AddressGeoPrecision } from "./address.types.js";
import { houseNumberToString, numericToNumber } from "./numeric.transformer.js";
type CommunityType = Community;
/**
 * Entity representing a physical address.
 */
@Entity("address")
export class Address {
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  @Column({ type: "varchar", length: 255 })
  street!: string;

  /**
   * House number. A STRING, because a Belgian house number is not a number:
   * `12A`, `12-14`, `1/3`, `12 bis` are all real BeSt Address entries.
   *
   * The declared type runs ahead of the database on purpose. Until
   * `database_script/2026-08-30_address_number_country_best.sql` is applied the
   * column is still `int`; the transformer stringifies on read, and a
   * digits-only string parameter is accepted by an `int` column on write, so
   * this build is correct against both schemas.
   */
  @Column({ type: "varchar", length: 32, transformer: houseNumberToString })
  number!: string;

  @Column({ type: "varchar", length: 255 })
  postcode!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  supplement?: string;

  @Column({ type: "varchar", length: 255 })
  city!: string;

  /** ISO-3166-1 alpha-2. The schema had no country at all before 2026-08-30. */
  @Column({ type: "char", length: 2, default: "BE" })
  country!: string;

  /**
   * The BeSt Address register's stable object id for this address, e.g.
   * `geodata.wallonie.be/id/Address/1948446/2`. Null until matched.
   */
  @Column({ name: "best_address_id", type: "varchar", length: 64, nullable: true })
  best_address_id!: string | null;

  /**
   * WGS84 latitude. Null until the address has been geocoded.
   *
   * `numeric` arrives from node-postgres as a string; the transformer is what
   * keeps this a real number all the way to the JSON response.
   */
  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, transformer: numericToNumber })
  latitude!: number | null;

  /** WGS84 longitude. Always set together with {@link latitude} (DB CHECK). */
  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, transformer: numericToNumber })
  longitude!: number | null;

  /** How good the coordinate is — drives pin styling and backfill eligibility. */
  @Column({ name: "geo_precision", type: "smallint", nullable: true })
  geo_precision!: AddressGeoPrecision | null;

  /** Id of the geocoder that produced the coordinate, e.g. `wallonia_icar`. */
  @Column({ name: "geo_source", type: "varchar", length: 32, nullable: true })
  geo_source!: string | null;

  /** When the last geocoding attempt ran — success or not. */
  @Column({ name: "geocoded_at", type: "timestamp", nullable: true })
  geocoded_at!: Date | null;

  /** Outcome of that attempt. `NEVER` is the backfill work queue. */
  @Column({ name: "geocode_status", type: "smallint", default: AddressGeocodeStatus.NEVER })
  geocode_status!: AddressGeocodeStatus;

  @ManyToOne(() => Community, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "id_community" })
  community!: CommunityType | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
