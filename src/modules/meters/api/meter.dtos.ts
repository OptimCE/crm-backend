import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { Expose, Transform, Type } from "class-transformer";
import { AddressDTO, CreateAddressDTO } from "../../../shared/address/address.dtos.js";
import { MembersPartialDTO } from "../../members/api/member.dtos.js";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { HOUSE_NUMBER_PATTERN } from "../../../shared/address/house-number.js";
import { SharingOperationPartialDTO } from "../../sharing_operations/api/sharing_operation.dtos.js";
import { METER_ERRORS } from "../shared/meter.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { ClientType, InjectionStatus, MeterDataStatus, MeterRate, ProductionChain, ReadingFrequency, TarifGroup } from "../shared/meter.types.js";
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
   *
   * Text, because `address.number` is text: `?address_number=12A` is a legitimate
   * query.
   */
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(32, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(HOUSE_NUMBER_PATTERN, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  address_number?: string;

  /**
   * Restrict to meters that ARE (true) or are NOT (false) usably on the map.
   *
   * `false` is the repair queue, and it means more than "no coordinate": an
   * address pinned to its commune centroid has a latitude but is not usefully
   * located. Those are the majority on an existing database, because the
   * 2026-08-20 migration seeded a centroid for every unambiguous postcode.
   *
   * A filter on the ordinary meters list rather than a bespoke `/unlocated`
   * endpoint: it inherits the pagination, community scoping and sort that
   * already exist, and can become a list filter chip without a second path.
   */
  @Expose()
  @Transform(({ value }) => (value === undefined ? undefined : value === "true" || value === true))
  @IsBoolean(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.BOOLEAN))
  @IsOptional()
  located?: boolean;

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
  holder?: MembersPartialDTO;
  /**
   * Current status of the meter data.
   */
  @Expose()
  status!: MeterDataStatus;
  /**
   * Start date (`YYYY-MM-DD`) of the meter data record selected for this view.
   * In the sharing-operation tabs, lets the UI tell whether the row is a future-only
   * scheduled record (eligible for hard delete) or already-active.
   */
  @Expose()
  start_date?: string;
  /**
   * End date (`YYYY-MM-DD`) of the meter data record selected for this view, if closed.
   */
  @Expose()
  end_date?: string;
  /**
   * Active sharing operation details, if any.
   */
  @Expose()
  sharing_operation?: SharingOperationPartialDTO;
  /**
   * Injection status of the meter data record selected for this view.
   * `null` means the meter is a pure offtake point (a consumer) — used by the UI to tell
   * consumers apart from injection points when importing meters as allocation-key participants.
   */
  @Expose()
  injection_status?: InjectionStatus | null;
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
  start_date!: string;
  @Expose()
  end_date!: string;
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
  holder?: MembersPartialDTO;
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
   * Start date of validity for this configuration (`YYYY-MM-DD`, calendar date, no time/zone).
   */
  @Expose()
  @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
  start_date!: string;

  /**
   * End date of validity (`YYYY-MM-DD`, optional).
   */
  @Expose()
  @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  end_date?: string;

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

/**
 * Body of `PATCH /meters/address` — the repair flow's write.
 *
 * Deliberately NOT reusing UpdateMeterDTO: that one is a full replace and also
 * carries meter_number, tarif_group, phases_number and reading_frequency. A
 * repair dialog fed by the meters LIST does not have those, and echoing guessed
 * values back would silently overwrite real configuration.
 */
export class UpdateMeterAddressDTO {
  @Expose()
  @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
  EAN!: string;

  @Expose()
  @ValidateNested()
  @Type(() => CreateAddressDTO)
  address!: CreateAddressDTO;
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

/**
 * DTO for deactivating a meter.
 * Appends an INACTIVE MeterData record starting on `date`; the remaining configuration
 * (rate, client type, holder, …) is inherited from the current record by the repository.
 */
export class DeactivateMeterDTO {
  /**
   * EAN Code of the meter to deactivate.
   */
  @Expose()
  @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
  EAN!: string;

  /**
   * Effective date of deactivation (`YYYY-MM-DD`, calendar date, no time/zone).
   */
  @Expose()
  @IsString(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
  date!: string;
}

/**
 * DTO for deleting future meter data
 * Require ID Meter data to identify the entry to remove
 */
export class DeleteFutureMeterDataDTO {
  /**
   * ID meter data to delete
   */
  @Expose()
  @Type(() => Number)
  @IsNumber({}, withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER))
  @IsNotEmpty(withError(METER_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_meter_data!: number;

  /**
   * If true, take the previous meter data and reactive it
   */
  @Expose()
  @Type(() => Boolean)
  @IsBoolean(withError(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.BOOLEAN))
  @IsOptional()
  active_previous_meter_data?: boolean;
}

/**
 * Query for `GET /meters/map`.
 *
 * Extends {@link MeterPartialQuery} rather than re-declaring its fields, so the
 * map is guaranteed to honour exactly the filters the list honours — a
 * hand-copied field list drifts the first time someone adds a filter and only
 * touches one of the two. `page` and `limit` are inherited and ignored: the map
 * is not paginated, it is capped.
 */
export class MeterMapQuery extends MeterPartialQuery {}

/**
 * The filter keys the map actually reads, in a fixed order.
 *
 * Used to build the cache key. Fixing the order means `?city=X&EAN=Y` and
 * `?EAN=Y&city=X` share one entry, and dropping page/limit means paging the
 * list does not mint a new map entry for identical data.
 */
export function pickMeterFilters(query: Record<string, unknown>): Record<string, unknown> {
  const keys = [
    "EAN",
    "meter_number",
    "street",
    "city",
    "postcode",
    "address_number",
    "supplement",
    "status",
    "holder_id",
    "sharing_operation_id",
    "not_sharing_operation_id",
    // /me/meters/map only. Omitting it would make two members' different
    // community filters share one cache entry inside the same user scope.
    "community_name",
  ];
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (query[key] !== undefined) {
      picked[key] = query[key];
    }
  }
  return picked;
}

/** One plottable meter. Deliberately flat and small — thousands of these ship at once. */
export class MeterMapPointDTO {
  @Expose()
  EAN!: string;
  @Expose()
  latitude!: number;
  @Expose()
  longitude!: number;
  /** See AddressGeoPrecision. MUNICIPALITY means the pin is a commune centroid. */
  @Expose()
  geo_precision!: number | null;
  @Expose()
  status!: MeterDataStatus;
  /** Null/absent means a pure offtake point, i.e. a consumer. */
  @Expose()
  injection_status?: InjectionStatus | null;
  /** Flattened to a display string — the popup needs a label, not a member record. */
  @Expose()
  holder_name?: string;
  @Expose()
  sharing_operation_id?: number;
  @Expose()
  sharing_operation_name?: string;
  /**
   * Only set by `GET /me/meters/map`: a member's own meters can span several
   * communities, and the popup has to say which one each pin belongs to. The
   * community-scoped endpoint leaves it undefined, because there it would be
   * the same value on every point.
   */
  @Expose()
  community_name?: string;
}

/**
 * The meters map payload.
 *
 * The three counters are the point of this envelope. At launch most addresses
 * are un-geocoded, so a bare array would let the map silently show a fraction
 * of the community as though it were all of it.
 */
export class MeterMapDTO {
  @Expose()
  points!: MeterMapPointDTO[];
  /** Meters passing the filters, geocoded or not. */
  @Expose()
  total_matching!: number;
  /** Of those, the ones that have coordinates. */
  @Expose()
  total_plottable!: number;
  /** total_matching - total_plottable. Surfaced so the UI can prompt a backfill. */
  @Expose()
  missing_coordinates!: number;
  /**
   * Of the plottable ones, how many sit on a commune centroid rather than a
   * building. They ARE drawn (styled as approximate), so they are not
   * "missing" — but they are what the repair flow exists to improve.
   */
  @Expose()
  approximate!: number;
  /** True when `cap` cut the result short. */
  @Expose()
  truncated!: boolean;
  @Expose()
  cap!: number;
}
