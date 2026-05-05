import { Expose, Type } from "class-transformer";
import { IsOptional, IsString, Matches } from "class-validator";
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
