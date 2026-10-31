import { Expose, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { RegulatorySubjectType } from "../domain/regulatory-link-status.models.js";

/**
 * Which subjects' regulatory status to read. An operation is required: a badge
 * is always about a meter or a key IN an operation. Community scope comes from
 * the request context, never from this DTO.
 */
export class RegulatoryStatusQueryDTO {
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  id_sharing_operation!: number;

  @Type(() => Number)
  @IsIn([RegulatorySubjectType.METER, RegulatorySubjectType.KEY], withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  subject_type?: RegulatorySubjectType;

  /** One EAN (or key id); every subject of the operation when omitted. */
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(64, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  subject_ref?: string;

  /**
   * `YYYY-MM-DD`: of a subject's episodes, the one whose authorised period
   * (from `valid_from`, never NULL there) covers this day wins over the
   * newest. Bare date, no time zone.
   */
  @Type(() => String)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  date?: string;
}

/**
 * What the core holds as authorised for one subject of an operation: its
 * latest episode (`regulatory_link_status`), written by the administrative
 * annexe. `valid_to` is the last day in the operation. `regulatory_ref` is the
 * annexe procedure that drives the status, for the badge's link.
 */
export class RegulatoryStatusDTO {
  @Expose()
  id!: string;

  @Expose()
  id_sharing_operation!: number;

  /** 1 meter (subject_ref = EAN), 2 key (subject_ref = key id). */
  @Expose()
  subject_type!: number;

  @Expose()
  subject_ref!: string;

  /**
   * 1 to notify, 2 pending GRD, 3 pending regulator, 4 authorised, 5 active,
   * 6 leaving, 7 ended, 8 refused, 9 withdrawn.
   */
  @Expose()
  regulatory_status!: number;

  @Expose()
  valid_from!: string | null;

  @Expose()
  valid_to!: string | null;

  @Expose()
  regulatory_ref!: string | null;

  @Expose()
  updated_at!: Date;
}
