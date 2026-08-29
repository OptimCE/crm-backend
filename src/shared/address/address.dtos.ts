import { Expose, Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { withError } from "../errors/dtos.errors.validation.js";
import type { AddressGeoPrecision } from "./address.types.js";
/**
 * DTO for creating a new address.
 */
export class CreateAddressDTO {
  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  street!: string;

  @Expose()
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
  number!: number;

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

  @Expose()
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  number?: number;

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
  number!: number;
  @Expose()
  postcode!: string;
  @Expose()
  supplement?: string;
  @Expose()
  city!: string;
  @Expose()
  latitude?: number | null;
  @Expose()
  longitude?: number | null;
  @Expose()
  geo_precision?: AddressGeoPrecision | null;
}
