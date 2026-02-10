import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { DEFAULT_ELEMENT_BY_PAGE } from "../middlewares/pagination.middleware.js";
import { withError } from "../errors/dtos.errors.validation.js";
export type Sort = "ASC" | "DESC";

/**
 * Standard query parameters for pagination.
 */
export class PaginationQuery {
  /**
   * Page number to retrieve (1-based index).
   * Defaults to 1.
   */
  @Type(() => Number)
  @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.MIN_1))
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  page: number = 1;

  /**
   * Number of items per page.
   * Defaults to system configuration.
   */
  @Type(() => Number)
  @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.MIN_1))
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  limit: number = DEFAULT_ELEMENT_BY_PAGE;
}
