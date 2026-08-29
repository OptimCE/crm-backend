import type { Manager, Member } from "../../members/domain/member.models.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";
import { MemberType } from "../../members/shared/member.types.js";
import type { ManagerDTO } from "../../members/api/member.dtos.js";
import {
  type MeAllocationIterationShareDTO,
  type MeAllocationShareDTO,
  type MeAllocationSharesDTO,
  type MeCompanyDTO,
  type MeDocumentDTO,
  type MeEnergyMeterDTO,
  type MeEnergySummaryDTO,
  type MeIndividualDTO,
  type MeMembersPartialDTO,
  MeMeterDTO,
  type MePartialMeterDTO,
} from "../api/me.dtos.js";
import type {
  MeEnergyMeterRow,
  MeKeyConsumerRow,
  MeKeyInForceRow,
  MeKeyIterationRow,
  MeMeterHoldingRow,
  RawDate,
} from "../domain/i-me.repository.js";
import type { SharingOperationType } from "../../sharing_operations/shared/sharing_operation.types.js";
import type { Document } from "../../documents/domain/document.models.js";
import type { Meter, MeterData } from "../../meters/domain/meter.models.js";
import { MetersDataDTO } from "../../meters/api/meter.dtos.js";
import { classifyMeterDataByDate } from "../../meters/shared/meter-data.classifier.js";
import { appTodayISO } from "../../../shared/utils/date.utils.js";
import { toSharingOperationPartialDTO } from "../../sharing_operations/shared/to_dto.js";
import { MeterDataStatus } from "../../meters/shared/meter.types.js";
import { memberMissingFields } from "../../../shared/member/completeness.js";

export function toManagerDTO(manager: Manager): ManagerDTO {
  return {
    name: manager.name,
    NRN: manager.NRN,
    email: manager.email,
    phone_number: manager.phone_number,
    surname: manager.surname,
    id: manager.id,
  };
}

export function toMemberPartialDTO(member: Member): MeMembersPartialDTO {
  return {
    member_type: member.member_type,
    status: member.status,
    name: member.name,
    id: member.id,
    community: {
      id: member.community.id,
      name: member.community.name,
      logo_url: member.community.logo_url,
    },
  };
}

/**
 * The same partial DTO, plus which of the member's fields are still blank.
 *
 * Separate from `toMemberPartialDTO` because completeness is only ANSWERABLE
 * when the sub-type row and both addresses are loaded. `getMembersList` and
 * `getMemberById` join them; the meter queries that embed a member as a
 * `holder` reference do not, and running the check there would report every
 * holder as missing an address. An absent `missing_fields` therefore means "not
 * evaluated", never "complete" — which is why the field is optional rather than
 * defaulting to `[]`.
 */
export function toMemberPartialWithCompletenessDTO(member: Member): MeMembersPartialDTO {
  return { ...toMemberPartialDTO(member), missing_fields: memberMissingFields(member) };
}

export function toMemberDTO(member: Member): MeIndividualDTO | MeCompanyDTO {
  // 1. Map common fields
  const baseDto = {
    id: member.id,
    name: member.name,
    member_type: member.member_type,
    status: member.status,
    iban: member.IBAN,
    home_address: toAddressDTO(member.home_address),
    billing_address: toAddressDTO(member.billing_address),
  };

  // 2. Switch based on Type
  if (member.member_type === MemberType.INDIVIDUAL && member.individual_details) {
    return {
      ...baseDto,
      NRN: member.individual_details.NRN,
      first_name: member.individual_details.first_name,
      email: member.individual_details.email,
      phone_number: member.individual_details.phone_number,
      social_rate: member.individual_details.social_rate,
      manager: member.individual_details.manager ? toManagerDTO(member.individual_details.manager) : undefined,
      community: {
        id: member.community.id,
        name: member.community.name,
      },
    } as MeIndividualDTO;
  } else if (member.member_type === MemberType.COMPANY && member.company_details) {
    return {
      ...baseDto,
      vat_number: member.company_details.vat_number,
      manager: toManagerDTO(member.company_details.manager), // Required for company
      community: {
        id: member.community.id,
        name: member.community.name,
      },
    } as MeCompanyDTO;
  }

  throw new Error("Data inconsistency: Member type does not match available details");
}

export function toDocumentExposed(document: Document): MeDocumentDTO {
  return {
    file_name: document.file_name,
    file_size: document.file_size,
    file_type: document.file_type,
    upload_date: document.upload_date,
    id: document.id,
    community: {
      id: document.community.id,
      name: document.community.name,
      logo_url: document.community.logo_url,
    },
  };
}
function toMetersDataDTO(data: MeterData): MetersDataDTO {
  const dto = new MetersDataDTO();
  dto.id = data.id;
  dto.description = data.description || "";
  dto.sampling_power = data.sampling_power || 0;
  dto.status = data.status;
  dto.amperage = data.amperage || 0;
  dto.rate = data.rate;
  dto.client_type = data.client_type;
  dto.start_date = data.start_date;
  if (data.end_date) dto.end_date = data.end_date;
  dto.injection_status = data.injection_status!;
  dto.production_chain = data.production_chain!;
  dto.totalGenerating_capacity = data.total_generating_capacity || 0;
  dto.grd = data.grd || "";

  if (data.member) {
    dto.member = toMemberPartialDTO(data.member);
  }

  if (data.sharing_operation) {
    dto.sharing_operation = toSharingOperationPartialDTO(data.sharing_operation);
  }

  return dto;
}
export function toMeterDTO(meter: Meter): MeMeterDTO {
  const dto = new MeMeterDTO();
  dto.EAN = meter.EAN;
  dto.community = {
    id: meter.community.id,
    name: meter.community.name,
    logo_url: meter.community.logo_url,
  };
  dto.meter_number = meter.meter_number;

  if (meter.address) {
    dto.address = toAddressDTO(meter.address);
  }

  dto.tarif_group = meter.tarif_group;
  dto.phases_number = meter.phases_number;
  dto.reading_frequency = meter.reading_frequency;

  const { active, history, future } = classifyMeterDataByDate(meter.meter_data, toMetersDataDTO, appTodayISO());

  dto.meter_data = active;
  dto.meter_data_history = history;
  dto.futur_meter_data = future;

  if (active && active.member) {
    dto.holder = active.member;
  }

  return dto;
}

export function toMeterPartialDTO(meter: Meter): MePartialMeterDTO {
  const activeData = meter.meter_data && meter.meter_data.length > 0 ? meter.meter_data[0] : null;
  let holder = undefined;
  let status = MeterDataStatus.INACTIVE;
  let sharing_op = undefined;
  if (activeData) {
    status = activeData.status;
    if (activeData.member) {
      holder = toMemberPartialDTO(activeData.member);
    }
    if (activeData.sharing_operation) {
      sharing_op = toSharingOperationPartialDTO(activeData.sharing_operation);
    }
  }
  return {
    EAN: meter.EAN,
    meter_number: meter.meter_number,
    holder: holder,
    status: status,
    address: toAddressDTO(meter.address),
    sharing_operation: sharing_op,
    community: {
      id: meter.community.id,
      name: meter.community.name,
      logo_url: meter.community.logo_url,
    },
  };
}

/**
 * The PRORATA sentinel stored in `consumer.energy_allocated_percentage`.
 * Documented on the Consumer entity; excluded from the sum-to-one validators
 * because it is resolved at settlement, not statically.
 */
const PRORATA_SENTINEL = -1;

/**
 * Float sums accumulate error: 0.6*0.5 + 0.4*0.25 lands on 0.4000000000000001.
 * The key validators already work in a ±0.001 tolerance band, so rounding to ten
 * decimals is well inside what the domain considers the same number.
 */
function roundShare(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

/**
 * Normalises a raw `date` column to `YYYY-MM-DD`.
 *
 * `getRawMany` skips TypeORM's entity transform, so a `date` column arrives as a
 * JS `Date` at LOCAL midnight. Letting that reach `JSON.stringify` produces an
 * ISO instant — `2026-06-16` becomes `"2026-06-15T22:00:00.000Z"` in Brussels
 * summer time — so any client slicing the first ten characters reads the wrong
 * day. Local components are the right ones to read back, because that is how
 * node-postgres built the value.
 */
function toDateOnly(value: RawDate): string;
function toDateOnly(value: RawDate | null): string | null;
function toDateOnly(value: RawDate | null): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

/**
 * Composes one member's share of the key in force for a single (operation, EAN).
 *
 * Iterations sum to 1, and within an iteration the non-prorata consumers sum to 1
 * (AreIterationsSumOneConstraint / AreConsumersSumOneConstraint), so the member's
 * slice is Σ over iterations of `iteration_share × consumer_share`.
 *
 * Four outcomes, and the distinction between the last two is the whole point:
 *  - EAN present, no prorata anywhere → `effective_share` is the sum;
 *  - any contributing iteration is prorata → `is_prorata`, `effective_share` null;
 *  - EAN absent from an iteration → that iteration contributes 0, not null;
 *  - EAN absent from EVERY iteration, or no key in force → `matched: false` and
 *    `effective_share` null. It must never render as "0 %": the key simply does
 *    not identify this meter, which is a data-quality fact about the key, not a
 *    statement that the member receives nothing.
 *
 * `consumer.name` has no uniqueness constraint, so two consumers in one iteration
 * may carry the same EAN. They are summed rather than silently deduplicated.
 */
export function toMeAllocationShareDTO(
  holding: MeMeterHoldingRow,
  key: MeKeyInForceRow | undefined,
  iterations: MeKeyIterationRow[],
  consumersByIteration: Map<number, MeKeyConsumerRow[]>,
): MeAllocationShareDTO {
  const base = {
    community: { id: holding.community_id, name: holding.community_name, logo_url: holding.community_logo_url },
    sharing_operation: {
      id: holding.operation_id,
      name: holding.operation_name,
      type: holding.operation_type as SharingOperationType,
    },
    ean: holding.ean,
    member: { id: holding.member_id, name: holding.member_name },
    holding_start_date: toDateOnly(holding.holding_start_date),
    holding_end_date: toDateOnly(holding.holding_end_date),
  };

  if (!key) {
    return {
      ...base,
      key: null,
      matched: false,
      match_basis: null,
      is_prorata: false,
      effective_share: null,
      iterations: [],
    };
  }

  let matched = false;
  let anyProrata = false;
  let total = 0;

  const iterationDtos: MeAllocationIterationShareDTO[] = iterations.map((iteration) => {
    const consumers = consumersByIteration.get(iteration.iteration_id) ?? [];
    if (consumers.length === 0) {
      return {
        iteration_id: iteration.iteration_id,
        iteration_number: iteration.iteration_number,
        iteration_share: iteration.iteration_share,
        consumer_share: null,
        is_prorata: false,
        contribution: 0,
      };
    }

    matched = true;
    const prorata = consumers.some((c) => c.consumer_share === PRORATA_SENTINEL);
    if (prorata) {
      anyProrata = true;
      return {
        iteration_id: iteration.iteration_id,
        iteration_number: iteration.iteration_number,
        iteration_share: iteration.iteration_share,
        consumer_share: PRORATA_SENTINEL,
        is_prorata: true,
        contribution: null,
      };
    }

    const consumer_share = consumers.reduce((sum, c) => sum + c.consumer_share, 0);
    const contribution = roundShare(iteration.iteration_share * consumer_share);
    total += contribution;
    return {
      iteration_id: iteration.iteration_id,
      iteration_number: iteration.iteration_number,
      iteration_share: iteration.iteration_share,
      consumer_share,
      is_prorata: false,
      contribution,
    };
  });

  return {
    ...base,
    key: {
      id: key.key_id,
      name: key.key_name,
      start_date: toDateOnly(key.key_start_date),
      end_date: toDateOnly(key.key_end_date),
    },
    matched,
    match_basis: matched ? "ean_consumer_name" : null,
    is_prorata: anyProrata,
    effective_share: !matched || anyProrata ? null : roundShare(total),
    iterations: iterationDtos,
  };
}

export function toMeAllocationSharesDTO(at: string, shares: MeAllocationShareDTO[]): MeAllocationSharesDTO {
  return { at, shares };
}

/**
 * Coerces an aggregate column to a number.
 *
 * node-postgres parses `double precision` to a JS number but hands back
 * `bigint` — which is what `COUNT()` returns — as a string, and `SUM()` over an
 * empty group is `NULL`. Letting any of those through means the frontend
 * concatenates instead of adding, or renders "null kWh".
 */
function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Rounds kWh to three decimals.
 *
 * The readings are `float`, so summing a month of quarter-hourly values drifts
 * into the fifteenth decimal. Three is well below what any meter resolves and
 * keeps the payload readable.
 */
function toKwh(value: string | number | null | undefined): number {
  return Math.round(toNumber(value) * 1e3) / 1e3;
}

export function toMeEnergySummaryDTO(
  period_start: string,
  period_end: string,
  rows: MeEnergyMeterRow[],
): MeEnergySummaryDTO {
  const meters: MeEnergyMeterDTO[] = rows.map((row) => ({
    ean: row.ean,
    meter_number: row.meter_number,
    community: { id: row.community_id, name: row.community_name, logo_url: row.community_logo_url },
    totals: {
      gross_kwh: toKwh(row.gross),
      shared_kwh: toKwh(row.shared),
      inj_gross_kwh: toKwh(row.inj_gross),
      inj_shared_kwh: toKwh(row.inj_shared),
    },
    // The query groups readings, so a meter with none produces no row at all and
    // never reaches here with a false flag. The check is kept because the
    // opposite — a row of zeroes read as "you consumed nothing" — is the exact
    // misstatement this field exists to prevent, and a future LEFT JOIN would
    // introduce it silently.
    has_data: toNumber(row.reading_count) > 0,
  }));

  return {
    period: { start: period_start, end: period_end },
    totals: {
      gross_kwh: toKwh(meters.reduce((sum, m) => sum + m.totals.gross_kwh, 0)),
      shared_kwh: toKwh(meters.reduce((sum, m) => sum + m.totals.shared_kwh, 0)),
      inj_gross_kwh: toKwh(meters.reduce((sum, m) => sum + m.totals.inj_gross_kwh, 0)),
      inj_shared_kwh: toKwh(meters.reduce((sum, m) => sum + m.totals.inj_shared_kwh, 0)),
    },
    meters,
  };
}
