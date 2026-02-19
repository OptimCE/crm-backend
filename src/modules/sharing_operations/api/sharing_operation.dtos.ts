import { Expose, Type } from "class-transformer";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import type { Sort } from "../../../shared/dtos/query.dtos.js";
import { IsArray, IsDate, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { KeyPartialDTO } from "../../keys/api/key.dtos.js";
import { HasMimeType, IsFile, MaxFileSize } from "../../../shared/dtos/file.validators.js";
import { SHARING_OPERATION_ERRORS } from "../shared/sharing_operation.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { SharingKeyStatus, SharingOperationType } from "../shared/sharing_operation.types.js";
import { MeterDataStatus } from "../../meters/shared/meter.types.js";
/**
 * Query parameters for filtering and paginating a list of sharing operations.
 */
export class SharingOperationPartialQuery extends PaginationQuery {
  /**
   * Filter by name.
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  name?: string;

  /**
   * Filter by type of sharing operation.
   */
  @Type(() => Number)
  @IsEnum(SharingOperationType, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.SHARING_OPERATION_TYPE))
  @IsOptional()
  type?: string;

  /**
   * Sort by name (ASC or DESC).
   */
  @IsIn(["ASC", "DESC"], withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_name?: Sort;

  /**
   * Sort by type (ASC or DESC).
   */
  @IsIn(["ASC", "DESC"], withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_type?: Sort;
}

export enum SharingOperationMetersQueryType {
  PAST = 1,
  NOW = 2,
  FUTURE = 3,
}

export class SharingOperationMetersQuery extends PaginationQuery {
  /**
   * Filter by street name.
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  street?: string;

  /**
   * Filter by postcode.
   */
  @Type(() => Number)
  @Min(1, withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.MIN_1))
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  postcode?: number;

  /**
   * Filter by address number.
   */
  @Type(() => Number)
  @Min(1, withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.MIN_1))
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  address_number?: number;

  /**
   * Filter by city name.
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  city?: string;

  /**
   * Filter by address supplement (box, etc.).
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  supplement?: string;

  /**
   * Filter by EAN code.
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  EAN?: string;

  /**
   * Filter by meter number.
   */
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  meter_number?: string;

  /**
   * Filter by current status (active, inactive, etc.).
   */
  @Type(() => Number)
  @IsEnum(MeterDataStatus, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.METER_DATA_STATUS))
  @IsOptional()
  status?: MeterDataStatus;

  /**
   * Filter by generic member ID holder.
   */
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  holder_id?: number;
  /**
   * Filter by street name.
   */
  @Type(() => Number)
  @IsEnum(SharingOperationMetersQueryType, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.METER_DATA_STATUS))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  type!: SharingOperationMetersQueryType;
}

/**
 * Query parameters for retrieving sharing operation consumption data.
 */
export class SharingOperationConsumptionQuery {
  /**
   * Start date for the data range.
   */
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  date_start?: Date;
  /**
   * End date for the data range.
   */
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  date_end?: Date;
}

/**
 * Simplified DTO for a sharing operation (partial view), typically used in lists.
 */
export class SharingOperationPartialDTO {
  /**
   * Unique identifier.
   */
  @Expose()
  id!: number;
  /**
   * Name of the sharing operation.
   */
  @Expose()
  name!: string;
  /**
   * Type of sharing operation (e.g., Peer-to-Peer).
   */
  @Expose()
  type!: SharingOperationType;
}
/**
 * DTO representing a key associated with a sharing operation.
 */
export class SharingOperationKeyDTO {
  @Expose()
  id!: number;
  @Expose()
  key!: KeyPartialDTO;
  @Expose()
  start_date!: Date;
  @Expose()
  end_date?: Date;
  @Expose()
  status!: SharingKeyStatus;
}
/**
 * Full DTO including keys and history for a sharing operation.
 */
export class SharingOperationDTO extends SharingOperationPartialDTO {
  /**
   * Current active key.
   */
  @Expose()
  key!: SharingOperationKeyDTO;
  /**
   * Key waiting for approval, if any.
   */
  @Expose()
  key_waiting_approval!: SharingOperationKeyDTO;
}

/**
 * DTO containing time-series consumption/injection data for a sharing operation.
 */
export class SharingOpConsumptionDTO {
  @Expose()
  id!: number;
  @Expose()
  timestamps!: string[];
  @Expose()
  gross!: number[];
  @Expose()
  net!: number[];
  @Expose()
  shared!: number[];
  @Expose()
  inj_gross!: number[];
  @Expose()
  inj_net!: number[];
  @Expose()
  inj_shared!: number[];
}

/**
 * DTO for creating a new sharing operation.
 */
export class CreateSharingOperationDTO {
  @Expose()
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  name!: string;
  @Expose()
  @Type(() => Number)
  @IsEnum(SharingOperationType, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.SHARING_OPERATION_TYPE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  type!: SharingOperationType;
}

/**
 * DTO for associating a key with a sharing operation.
 */
export class AddKeyToSharingOperationDTO {
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_key!: number;
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing!: number;
}

/**
 * DTO for adding meters to a sharing operation.
 */
export class AddMeterToSharingOperationDTO {
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing!: number;
  @Expose()
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  date!: Date;
  @Expose()
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING, { each: true }))
  @IsArray(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.ARRAY))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  ean_list!: string[];
}

/**
 * DTO for uploading consumption data (file upload).
 */
export class AddConsumptionDataDTO {
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing_operation!: number;

  @Expose()
  @HasMimeType(
    ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    withError(SHARING_OPERATION_ERRORS.VALIDATION.ADD_CONSUMPTION_DATA.HAS_MIME_TYPE),
  )
  @MaxFileSize(5 * 1024 * 1024, withError(SHARING_OPERATION_ERRORS.VALIDATION.ADD_CONSUMPTION_DATA.FILE_TOO_BIG)) // 5MB limit
  @IsFile(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.FILE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  file!: Express.Multer.File;
}

/**
 * DTO for updating the status of a key in a sharing operation.
 */
export class PatchKeyToSharingOperationDTO {
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_key!: number;
  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing!: number;
  @Expose()
  @Type(() => Number)
  @IsEnum(SharingKeyStatus, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.SHARING_KEY_STATUS))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  status!: SharingKeyStatus;
  @Expose()
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  date!: Date;
}

/**
 * DTO for updating the status of a meter within a sharing operation.
 */
export class PatchMeterToSharingOperationDTO {
  @Expose()
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_meter!: string;

  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing!: number;

  @Expose()
  @Type(() => Number)
  @IsIn(
    [MeterDataStatus.ACTIVE, MeterDataStatus.WAITING_GRD, MeterDataStatus.WAITING_MANAGER],
    withError(SHARING_OPERATION_ERRORS.VALIDATION.PATCH_METER_TO_SHARING_OPERATION.STATUS_OUT_OF_RANGE),
  )
  @IsEnum(MeterDataStatus, withError(SHARING_OPERATION_ERRORS.VALIDATION.WRONG_TYPE.METER_DATA_STATUS))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  status!: MeterDataStatus;

  @Expose()
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  date!: Date;
}

/**
 * DTO for removing a meter from a sharing operation.
 */
export class RemoveMeterFromSharingOperationDTO {
  @Expose()
  @Type(() => String)
  @IsString(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_meter!: string;

  @Expose()
  @Type(() => Number)
  @IsInt(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_sharing!: number;

  @Expose()
  @Type(() => Date)
  @IsDate(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY))
  date!: Date;
}
