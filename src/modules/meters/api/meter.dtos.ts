import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { Expose, Type } from "class-transformer";
import { AddressDTO, CreateAddressDTO } from "../../../shared/address/address.dtos.js";
import { MembersPartialDTO } from "../../members/api/member.dtos.js";
import {
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from "class-validator";
import { SharingOperationPartialDTO } from "../../sharing_operations/api/sharing_operation.dtos.js";
import { METER_ERRORS } from "../shared/meter.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import {
    ClientType,
    InjectionStatus,
    MeterDataStatus,
    MeterRate,
    ProductionChain,
    ReadingFrequency, TarifGroup
} from "../shared/meter.types.js";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";

/**
 * Query parameters for filtering and paginating a list of meters.
 */
export class MeterPartialQuery extends PaginationQuery {
    /**
     * Filter by street name.
     */
    @Type(() => String)
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    street?: string;

    /**
     * Filter by postcode.
     */
    @Type(() => Number)
    @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.MIN_1))
    @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    postcode?: number;

    /**
     * Filter by address number.
     */
    @Type(() => Number)
    @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.MIN_1))
    @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    address_number?: number;

    /**
     * Filter by city name.
     */
    @Type(() => String)
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    city?: string;

    /**
     * Filter by address supplement (box, etc.).
     */
    @Type(() => String)
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    supplement?: string;

    /**
     * Filter by EAN code.
     */
    @Type(() => String)
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    EAN?: string;

    /**
     * Filter by meter number.
     */
    @Type(() => String)
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    meter_number?: string;

    /**
     * Filter by current status (active, inactive, etc.).
     */
    @Type(() => Number)
    @IsEnum(MeterDataStatus, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.METER_DATA_STATUS))
    @IsOptional()
    status?: MeterDataStatus;

    /**
     * Filter by active sharing operation ID.
     */
    @Type(() => Number)
    @IsInt(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    sharing_operation_id?: number;

    /**
     * Filter by explicitly NOT being in a specific sharing operation ID.
     */
    @Type(() => Number)
    @IsInt(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    not_sharing_operation_id?: number;

    /**
     * Filter by generic member ID holder.
     */
    @Type(() => Number)
    @IsInt(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    holder_id?: number;
}

/**
 * Query parameters for retrieving meter consumption data.
 */
export class MeterConsumptionQuery {
    /**
     * Start date for the data range.
     */
    @Type(() => Date)
    @IsDate(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
    @IsOptional()
    date_start?: Date;
    /**
     * End date for the data range.
     */
    @Type(() => Date)
    @IsDate(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
    @IsOptional()
    date_end?: Date;
}

/**
 * Simplified DTO for a meter (partial view), typically used in lists.
 */
export class PartialMeterDTO {
    /**
     * EAN code of the meter.
     */
    @Expose()
    EAN!: string;
    /**
     * Physical meter number.
     */
    @Expose()
    meter_number!: string;
    /**
     * Address of the meter.
     */
    @Expose()
    address!: AddressDTO;
    /**
     * Current holder (member) of the meter.
     */
    @Expose()
    holder?: MembersPartialDTO
    /**
     * Current status of the meter data.
     */
    @Expose()
    status!: MeterDataStatus;
    /**
     * Active sharing operation details, if any.
     */
    @Expose()
    sharing_operation?: SharingOperationPartialDTO;
}

/**
 * DTO representing detailed meter configuration and status for a specific period (history/current/future).
 */
export class MetersDataDTO {
    @Expose()
    id!: number;
    @Expose()
    description!: string;
    @Expose()
    sampling_power!: number;
    @Expose()
    status!: MeterDataStatus;
    @Expose()
    amperage!: number;
    @Expose()
    rate!: MeterRate;
    @Expose()
    client_type!: ClientType;
    @Expose()
    start_date!: Date;
    @Expose()
    end_date!: Date;
    @Expose()
    injection_status!: InjectionStatus;
    @Expose()
    production_chain!: ProductionChain;
    @Expose()
    totalGenerating_capacity!: number;
    @Expose()
    member?: MembersPartialDTO;
    @Expose()
    grd!: string;
    @Expose()
    sharing_operation?: SharingOperationPartialDTO;
}

/**
 * Full DTO including physical properties and timeline of data configurations.
 */
export class MetersDTO {
    @Expose()
    EAN!: string;
    @Expose()
    meter_number!: string;
    @Expose()
    address!: AddressDTO;
    @Expose()
    holder?: MembersPartialDTO
    @Expose()
    tarif_group!: TarifGroup;
    @Expose()
    phases_number!: number;
    @Expose()
    reading_frequency!: ReadingFrequency;

    /**
     * Currently active meter data configuration.
     */
    @Expose()
    meter_data?: MetersDataDTO;

    /**
     * Historical meter data configurations.
     */
    @Expose()
    meter_data_history?: MetersDataDTO[];

    /**
     * Future scheduled meter data configurations.
     */
    @Expose()
    futur_meter_data?: MetersDataDTO[];
}

/**
 * DTO containing time-series consumption/injection data.
 */
export class MeterConsumptionDTO {
    /**
     * EAN code.
     */
    @Expose()
    EAN!: string;
    /**
     * Array of timestamps.
     */
    @Expose()
    timestamps!: string[];
    /**
     * Gross consumption values.
     */
    @Expose()
    gross!: number[];
    /**
     * Net consumption values.
     */
    @Expose()
    net!: number[];
    /**
     * Shared consumption values.
     */
    @Expose()
    shared!: number[];
    /**
     * Gross injection values.
     */
    @Expose()
    inj_gross!: number[];
    /**
     * Net injection values.
     */
    @Expose()
    inj_net!: number[];
    /**
     * Shared injection values.
     */
    @Expose()
    inj_shared!: number[];
}

/**
 * DTO for creating or updating a MeterData configuration period.
 */
export class CreateMeterDataDTO {
    /**
     * Start date of validity for this configuration.
     */
    @Expose()
    @Type(() => Date)
    @IsDate(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    start_date!: Date;

    /**
     * End date of validity (optional).
     */
    @Expose()
    @Type(() => Date)
    @IsDate(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
    @IsOptional()
    end_date?: Date;

    /**
     * Status of the meter during this period.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(MeterDataStatus, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.METER_DATA_STATUS))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    status!: MeterDataStatus;

    /**
     * Rate type (single, double, etc.).
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(MeterRate, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.METER_RATE))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    rate!: MeterRate;

    /**
     * Type of client (residential, professional, etc.).
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(ClientType, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.CLIENT_TYPE))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    client_type!: ClientType;

    // --- Optional Configuration Fields ---

    /**
     * Description or label.
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    description?: string;

    /**
     * Sampling power.
     */
    @Expose()
    @Type(() => Number)
    @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
    @IsOptional()
    sampling_power?: number;

    /**
     * Amperage.
     */
    @Expose()
    @Type(() => Number)
    @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
    @IsOptional()
    amperage?: number;

    /**
     * GRD (DSO) identifier.
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    grd?: string;

    // --- Production / Injection Fields ---

    /**
     * Injection status.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(InjectionStatus, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.INJECTION_STATUS))
    @IsOptional()
    injection_status?: InjectionStatus;

    /**
     * Production chain type.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(ProductionChain, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.PRODUCTION_CHAIN))
    @IsOptional()
    production_chain?: ProductionChain;

    /**
     * Total generating capacity.
     */
    @Expose()
    @Type(() => Number)
    @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
    @IsOptional()
    total_generating_capacity?: number;

    // --- Relations ---

    /**
     * ID of the associated member (holder).
     */
    @Expose()
    @Type(() => Number)
    @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    member_id?: number;

    /**
     * ID of the associated sharing operation.
     */
    @Expose()
    @Type(() => Number)
    @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    sharing_operation_id?: number;
}

/**
 * DTO for creating a new physical meter and its initial configuration.
 */
export class CreateMeterDTO {
    // ========================================================================
    // PHYSICAL METER FIELDS
    // ========================================================================

    /**
     * EAN Code (Unique Identifier).
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    EAN!: string;

    /**
     * Physical Meter Number.
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    meter_number!: string;

    /**
     * Address of the meter.
     */
    @Expose()
    @Type(() => CreateAddressDTO)
    @ValidateNested()
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    address!: CreateAddressDTO;

    /**
     * Tariff group classification.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(TarifGroup, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.TARIF_GROUP))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    tarif_group!: TarifGroup;

    /**
     * Number of phases (min 1).
     */
    @Expose()
    @Type(() => Number)
    @Min(1, withError(METER_ERRORS.VALIDATION.CREATE_METER.PHASE_NUMBER_MIN_1))
    @IsInt(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    phases_number!: number;

    /**
     * Frequency of readings.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(ReadingFrequency, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.READING_FREQUENCY))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    reading_frequency!: ReadingFrequency;

    // ========================================================================
    // INITIAL CONFIGURATION (Reused DTO)
    // ========================================================================

    /**
     * Initial data configuration (status, holder, etc.).
     */
    @Expose()
    @Type(() => CreateMeterDataDTO)
    @ValidateNested()
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    initial_data!: CreateMeterDataDTO;
}

export class UpdateMeterDTO {
    /**
     * EAN Code (Unique Identifier).
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    EAN!: string;

    /**
     * Physical Meter Number.
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    meter_number!: string;

    /**
     * Address of the meter.
     */
    @Expose()
    @Type(() => CreateAddressDTO)
    @ValidateNested()
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    address!: CreateAddressDTO;

    /**
     * Tariff group classification.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(TarifGroup, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.TARIF_GROUP))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    tarif_group!: TarifGroup;

    /**
     * Number of phases (min 1).
     */
    @Expose()
    @Type(() => Number)
    @Min(1, withError(METER_ERRORS.VALIDATION.CREATE_METER.PHASE_NUMBER_MIN_1))
    @IsInt(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    phases_number!: number;

    /**
     * Frequency of readings.
     */
    @Expose()
    @Type(() => Number)
    @IsEnum(ReadingFrequency, withError(METER_ERRORS.VALIDATION.WRONG_TYPE.READING_FREQUENCY))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    reading_frequency!: ReadingFrequency;
}


/**
 * DTO for patching meter data configuration.
 * Requires EAN to identify the meter to update.
 */
export class PatchMeterDataDTO extends CreateMeterDataDTO {
    /**
     * EAN Code of the meter to update.
     */
    @Expose()
    @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
    EAN!: string;
}