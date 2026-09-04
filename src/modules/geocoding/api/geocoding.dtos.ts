import config from "config";
import { Expose, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { GEOCODING_ERRORS } from "../shared/geocoding.errors.js";

/** Upper bound on one batch, so a typo cannot start an hours-long run. */
const BATCH_MAX: number = config.has("geocoding.batch_max") ? config.get("geocoding.batch_max") : 1000;

/** Body of `POST /geocoding/backfill`. */
export class GeocodeBackfillDTO {
  /**
   * How many addresses to attempt. Defaults to 100 — small enough that an
   * operator gets feedback quickly, and the endpoint is meant to be looped.
   */
  @Expose()
  @Type(() => Number)
  @IsInt(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Min(1, withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Max(BATCH_MAX, withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  limit?: number;
}

/** Outcome of one backfill batch. */
export class GeocodeBackfillResultDTO {
  @Expose()
  attempted!: number;
  @Expose()
  succeeded!: number;
  @Expose()
  not_found!: number;
  @Expose()
  errored!: number;
  /** Addresses still queued after this batch — loop while it is non-zero. */
  @Expose()
  remaining!: number;
}

/** Upper bound on one suggestion page. A picker shows a handful, never a list. */
const SUGGEST_MAX = 20;

/** Query of `GET /geocoding/suggest`. */
export class AddressSuggestQueryDTO {
  /** Free text as typed. Short queries return nothing rather than the register. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.EMPTY))
  @MaxLength(120, withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  q!: string;

  @Expose()
  @Type(() => Number)
  @IsInt(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Min(1, withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Max(SUGGEST_MAX, withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  limit?: number;
}

/**
 * Query of `GET /geocoding/preview`.
 *
 * A GET, not a POST, deliberately. It is idempotent and side-effect free, and
 * the frontend's `ServiceBase` only has `cachedGet` — as a POST it would forfeit
 * in-flight deduplication, the response cache, the timeout and the retry policy,
 * and gain nothing. Six debounced forms make that difference real.
 */
export class AddressPreviewQueryDTO {
  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.EMPTY))
  street!: string;

  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.EMPTY))
  number!: string;

  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.EMPTY))
  postcode!: string;

  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.EMPTY))
  city!: string;

  @Expose()
  @Type(() => String)
  @IsString(withError(GEOCODING_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  supplement?: string;
}

/** One pickable row. Mirrors `domain/address-suggestion.types.ts`. */
export class AddressSuggestionDTO {
  @Expose()
  id!: string;
  @Expose()
  kind!: string;
  @Expose()
  label!: string;
  @Expose()
  street!: string;
  @Expose()
  number?: string;
  @Expose()
  postcode!: string;
  @Expose()
  city!: string;
  @Expose()
  country!: string;
  @Expose()
  latitude?: number;
  @Expose()
  longitude?: number;
  @Expose()
  precision?: number;
  @Expose()
  best_address_id?: string;
  @Expose()
  nis_code?: number;
}

/**
 * Whether an address can be placed on the map, and what to offer instead.
 *
 * `found: false` is a normal answer, not an error: the form shows a warning and
 * the user saves anyway if they want to.
 */
export class AddressPreviewDTO {
  @Expose()
  found!: boolean;
  @Expose()
  latitude?: number;
  @Expose()
  longitude?: number;
  /** 1 MANUAL / 2 ROOFTOP / 3 STREET / 4 MUNICIPALITY — 4 means an approximate pin. */
  @Expose()
  precision?: number;
  @Expose()
  source?: string;
  /** "Did you mean" rows, so a warning comes with a way out of it. */
  @Expose()
  suggestions!: AddressSuggestionDTO[];
}
