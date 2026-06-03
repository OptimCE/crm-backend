import { Expose, Type } from "class-transformer";
import { IsDate, IsInt, IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQuery, type Sort } from "../../../shared/dtos/query.dtos.js";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import type { AuditAction } from "../domain/audit-log.actions.js";

/**
 * Query parameters for listing audit-log entries.
 *
 * All filters are optional and intersected (AND). Community scope is applied
 * implicitly from the request context — never via this DTO.
 */
export class AuditLogQueryDTO extends PaginationQuery {
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  action?: string;

  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  entity_type?: string;

  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  entity_id?: string;

  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  user_id?: number;

  @Type(() => Date)
  @IsDate(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  to?: Date;

  @IsIn(["ASC", "DESC"], withError(GLOBAL_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_timestamp?: Sort;
}

/**
 * Internal contract used by callers of `AuditLogService.log()`.
 * Not validated via class-validator — this is a code-level interface, not a
 * request body.
 */
export interface AuditLogInputDTO {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  /** Override the default `crm-backend` source — e.g. for background jobs. */
  source?: string;
}

/**
 * Output shape returned by the list endpoint.
 * `id` stays a string to avoid silent precision loss on bigint PKs.
 */
export class AuditLogDTO {
  @Expose()
  id!: string;

  @Expose()
  timestamp!: Date;

  @Expose()
  action!: string;

  @Expose()
  source!: string;

  @Expose()
  entity_type!: string;

  @Expose()
  entity_id!: string | null;

  @Expose()
  user_id!: number | null;

  @Expose()
  user_email!: string | null;

  @Expose()
  payload!: Record<string, unknown>;
}
