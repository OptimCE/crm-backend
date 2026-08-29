import { Expose, Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsInt, IsOptional, IsString, Matches } from "class-validator";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { MUNICIPALITY_ERRORS } from "../shared/municipality.errors.js";

/**
 * Query parameters for paginating + filtering municipalities.
 * Used by the autocomplete on the frontend.
 */
export class MunicipalitySearchQuery extends PaginationQuery {
  /**
   * Substring match against fr_name, nl_name and de_name.
   */
  @Type(() => String)
  @IsString(withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  name?: string;

  /**
   * Exact-match postal code (e.g. "1000").
   */
  @Type(() => String)
  @IsString(withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(/^\d{4,10}$/, withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  postal_code?: string;
}

/**
 * Partial DTO returned by the search endpoint and embedded inside other entities
 * (e.g. sharing operations) to describe the municipalities they cover.
 */
export class MunicipalityPartialDTO {
  @Expose()
  nis_code!: number;
  @Expose()
  fr_name!: string;
  @Expose()
  nl_name!: string | null;
  @Expose()
  de_name!: string | null;
  @Expose()
  region_fr!: string | null;
  @Expose()
  postal_codes!: string[];
}

/**
 * Tolerances the geometry endpoint will accept, in WGS84 degrees.
 *
 * An allowlist rather than a range, and not cosmetic: the value lands in the
 * cache key, so a free-form float lets one client mint unlimited distinct keys
 * and defeat the cache entirely. 0.0005 is ~55 m at Belgian latitudes.
 */
export const MUNICIPALITY_GEOMETRY_TOLERANCES = [0, 0.0001, 0.0005, 0.001, 0.005] as const;

export const DEFAULT_MUNICIPALITY_GEOMETRY_TOLERANCE = 0.0005;

/** Upper bound on one request. Belgium has 581 communes; a zone never needs 60. */
export const MUNICIPALITY_GEOMETRY_MAX_CODES = 60;

/**
 * Query for `GET /municipalities/geometry`.
 */
export class MunicipalityGeometryQuery {
  /**
   * NIS codes to return geometry for. Accepts a comma-separated list
   * (`?nis_codes=21004,21009`) or repeated params.
   */
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const raw: unknown[] = Array.isArray(value) ? value : String(value).split(",");
    return raw.map((v) => Number(String(v).trim())).filter((v) => Number.isFinite(v));
  })
  @IsArray(withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.ARRAY))
  @ArrayNotEmpty(withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ArrayMaxSize(MUNICIPALITY_GEOMETRY_MAX_CODES, withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.ARRAY))
  @IsInt(withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER, { each: true }))
  nis_codes!: number[];

  /** Simplification tolerance in degrees. See {@link MUNICIPALITY_GEOMETRY_TOLERANCES}. */
  @Type(() => Number)
  @IsIn(MUNICIPALITY_GEOMETRY_TOLERANCES as unknown as number[], withError(MUNICIPALITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsOptional()
  tolerance?: number;
}

/**
 * One municipality's geometry, simplified.
 *
 * `geo_shape` and `geo_point` are raw GeoJSON geometries, not Features — the
 * frontend feeds them straight to MapLibre, and the point/count fields let the
 * caller see what the simplification actually bought.
 */
export class MunicipalityGeometryDTO {
  @Expose()
  nis_code!: number;
  @Expose()
  fr_name!: string;
  @Expose()
  geo_point!: unknown;
  @Expose()
  geo_shape!: unknown;
  @Expose()
  tolerance!: number;
  @Expose()
  original_points!: number;
  @Expose()
  simplified_points!: number;
}
