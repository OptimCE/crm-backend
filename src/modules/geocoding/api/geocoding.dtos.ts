import config from "config";
import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
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
