import { Expose, Transform, Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { withError } from "../errors/dtos.errors.validation.js";
import type { AddressGeoPrecision } from "./address.types.js";
import { HOUSE_NUMBER_PATTERN, normaliseHouseNumber } from "./house-number.js";
/**
 * DTO for creating a new address.
 */
export class CreateAddressDTO {
  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  street!: string;

  /**
   * House number, as text. `12A`, `12-14` and `1/3` are all real BeSt Address
   * entries, so this is not a number and never was.
   *
   * `@Type(() => String)` is load-bearing, not decoration: every client that
   * still sends `number: 12` would take a 422 the moment this stopped being an
   * `@IsInt`, including this repo's own functional fixtures.
   *
   * REQUIRES `database_script/2026-08-30_address_number_country_best.sql` to have
   * been applied. {@link HOUSE_NUMBER_PATTERN} accepts `12A`, and `'12A'` into a
   * column that is still `int` is a hard Postgres error — a 500, not a 422. That
   * is why widening the pattern was the last step of the migration rather than
   * part of it.
   *
   * `@MaxLength` earns its place separately: without it an over-long value is a
   * raw Postgres 22001 and therefore an unhandled 500, not a validation error.
   */
  @Expose()
  @Type(() => String)
  // Normalise BEFORE validating, so `"  "` fails @IsNotEmpty with a clear error
  // rather than slipping past as a non-empty string. This has to live on the DTO
  // and not only in AddressRepository: meter.repository.ts builds its Address
  // directly with manager.create() and never goes through that repository, so a
  // fix in one place only would silently apply to members but not to meters.
  @Transform(({ value }) => (typeof value === "string" ? normaliseHouseNumber(value) : value))
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  @MaxLength(32, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(HOUSE_NUMBER_PATTERN, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  number!: string;

  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  city!: string;

  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  postcode!: string;

  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  supplement?: string;

  /** ISO-3166-1 alpha-2, upper case. Defaults to BE in the database. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(/^[A-Z]{2}$/, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  country?: string;

  /**
   * The BeSt Address register's stable object id, when this address was picked
   * from the register rather than typed. Free text stays free text — this is
   * simply absent then.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(64, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  best_address_id?: string;

  /**
   * Optional hand-placed coordinate (pin drop). When both are present the
   * geocoder chain short-circuits on them and stores
   * {@link AddressGeoPrecision.MANUAL}, which no later backfill overwrites.
   */
  @Expose()
  @Type(() => Number)
  @IsLatitude(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsOptional()
  latitude?: number;

  @Expose()
  @Type(() => Number)
  @IsLongitude(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsOptional()
  longitude?: number;
}
/**
 * DTO for updating an existing address.
 * All fields are optional.
 */
export class UpdateAddressDTO {
  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  street?: string;

  /**
   * See {@link CreateAddressDTO.number}. `@IsNotEmpty` matters MORE here than on
   * create: `member.service.ts` merges with `??`, which only falls back on
   * null/undefined, so a client sending `number: ""` would otherwise write a
   * blank house number straight through.
   */
  @Expose()
  @Type(() => String)
  // Normalise BEFORE validating, so `"  "` fails @IsNotEmpty with a clear error
  // rather than slipping past as a non-empty string. This has to live on the DTO
  // and not only in AddressRepository: meter.repository.ts builds its Address
  // directly with manager.create() and never goes through that repository, so a
  // fix in one place only would silently apply to members but not to meters.
  @Transform(({ value }) => (typeof value === "string" ? normaliseHouseNumber(value) : value))
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  @MaxLength(32, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(HOUSE_NUMBER_PATTERN, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  number?: string;

  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  city?: string;

  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  postcode?: string;

  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  supplement?: string;

  /** ISO-3166-1 alpha-2, upper case. Defaults to BE in the database. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(/^[A-Z]{2}$/, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  country?: string;

  /**
   * The BeSt Address register's stable object id, when this address was picked
   * from the register rather than typed. Free text stays free text — this is
   * simply absent then.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(64, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  best_address_id?: string;

  /**
   * Optional hand-placed coordinate (pin drop). When both are present the
   * geocoder chain short-circuits on them and stores
   * {@link AddressGeoPrecision.MANUAL}, which no later backfill overwrites.
   */
  @Expose()
  @Type(() => Number)
  @IsLatitude(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsOptional()
  latitude?: number;

  @Expose()
  @Type(() => Number)
  @IsLongitude(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsOptional()
  longitude?: number;
}
/**
 * DTO representing a full address.
 *
 * `geo_source`, `geocoded_at` and `geocode_status` are deliberately NOT exposed:
 * they are operational state for the backfill, not something a client acts on.
 * `geo_precision` is exposed because the UI renders an approximate pin
 * differently from an exact one.
 */
export class AddressDTO {
  @Expose()
  id!: number;
  @Expose()
  street!: string;
  @Expose()
  number!: string;
  @Expose()
  postcode!: string;
  @Expose()
  supplement?: string;
  @Expose()
  city!: string;
  @Expose()
  country!: string;
  @Expose()
  latitude?: number | null;
  @Expose()
  longitude?: number | null;
  @Expose()
  geo_precision?: AddressGeoPrecision | null;
}
