import type {
  SharingOpConsumption,
  SharingOperation,
  SharingOperationKey,
  SharingOperationMunicipality,
} from "../domain/sharing_operation.models.js";
import {
  SharingOpConsumptionCoverageDTO,
  SharingOpConsumptionDTO,
  SharingOperationDTO,
  SharingOperationKeyDTO,
  type SharingOperationPartialDTO,
} from "../api/sharing_operation.dtos.js";
import { toKeyPartialDTO } from "../../keys/shared/to_dto.js";
import { SharingKeyStatus } from "./sharing_operation.types.js";
import { toMunicipalityPartialDTO } from "../../municipalities/shared/to_dto.js";
import type { MunicipalityPartialDTO } from "../../municipalities/api/municipality.dtos.js";
import { appTodayISO } from "../../../shared/utils/date.utils.js";

function municipalitiesFromLinks(links: SharingOperationMunicipality[] | undefined): MunicipalityPartialDTO[] {
  if (!links) return [];
  return links.filter((link) => link.municipality).map((link) => toMunicipalityPartialDTO(link.municipality));
}

export function toSharingOperationPartialDTO(value: SharingOperation): SharingOperationPartialDTO {
  return {
    id: value.id,
    type: value.type,
    name: value.name,
    municipalities: municipalitiesFromLinks(value.municipalities),
  };
}
export function toSharingOperationKeyDTO(entity: SharingOperationKey): SharingOperationKeyDTO {
  const dto = new SharingOperationKeyDTO();
  dto.id = entity.id;
  dto.start_date = new Date(entity.start_date);
  // Handle nullable end_date
  dto.end_date = entity.end_date ? new Date(entity.end_date) : undefined;
  dto.status = entity.status;

  if (entity.allocation_key) {
    dto.key = toKeyPartialDTO(entity.allocation_key);
  }

  return dto;
}

/** Latest start wins, then the highest id — the same tie-break as the "keys in force" query in `me`. */
function isMoreRecent(candidate: SharingOperationKey, current: SharingOperationKey): boolean {
  return candidate.start_date > current.start_date || (candidate.start_date === current.start_date && candidate.id > current.id);
}

/**
 * Picks, among all of an operation's key rows, the key in force on `today` and the proposal
 * still awaiting a decision.
 *
 * Rows are never updated into their next state. Approving a proposal closes its PENDING row
 * (`end_date` set, status left at PENDING) and inserts a new APPROVED row starting on the decision
 * date, after closing the APPROVED row it replaces. So status alone says nothing about the present:
 * - current: APPROVED and `start_date <= today <= end_date` (both bounds inclusive, an open
 *   `end_date` never ends). A key approved for a later date is not current yet: the key it replaces
 *   stays in force until the day before.
 * - waiting: PENDING with no `end_date`. A closed PENDING row is a proposal that was decided.
 *
 * The same predicates as the community dashboard counters (`operations_without_valid_key`,
 * `operations_with_pending_key`). Comparisons are on `YYYY-MM-DD` strings; pass `appTodayISO()`.
 */
export function selectOperationKeys(keys: SharingOperationKey[], today: string): { current?: SharingOperationKey; waiting?: SharingOperationKey } {
  let current: SharingOperationKey | undefined;
  let waiting: SharingOperationKey | undefined;

  for (const row of keys) {
    if (row.status === SharingKeyStatus.APPROVED && row.start_date <= today && (!row.end_date || row.end_date >= today)) {
      if (!current || isMoreRecent(row, current)) current = row;
    } else if (row.status === SharingKeyStatus.PENDING && !row.end_date) {
      if (!waiting || isMoreRecent(row, waiting)) waiting = row;
    }
  }

  return { current, waiting };
}

export function toSharingOperation(value: SharingOperation, today: string = appTodayISO()): SharingOperationDTO {
  const dto = new SharingOperationDTO();

  // Map parent fields (from SharingOperationPartialDTO)
  dto.id = value.id;
  dto.name = value.name;
  dto.type = value.type;
  dto.is_public = value.is_public;
  // Inherited, read-only from the parent community (loaded via the `community` relation).
  dto.community_regulator = value.community?.regulator;
  dto.municipalities = municipalitiesFromLinks(value.municipalities);

  // Safety check if keys are not loaded
  const { current, waiting } = selectOperationKeys(value.keys || [], today);
  if (current) dto.key = toSharingOperationKeyDTO(current);
  if (waiting) dto.key_waiting_approval = toSharingOperationKeyDTO(waiting);

  return dto;
}

export function toSharingOperationConsumptions(values: SharingOpConsumption[]): SharingOpConsumptionDTO {
  const dto = new SharingOpConsumptionDTO();

  if (values.length > 0) {
    // Attempt to extract the ID from the first element if the relation is loaded.
    // Note: Since the repository filter uses 'consumption.sharing_operation = :id',
    // the full relation object might not be loaded. We default to 0 if missing.
    dto.id = values[0].sharing_operation?.id ?? 0;
  } else {
    dto.id = 0;
  }

  // Map fields to arrays (Structure of Arrays)
  dto.timestamps = values.map((v) => v.timestamp.toISOString());
  dto.gross = values.map((v) => v.gross ?? 0);
  dto.net = values.map((v) => v.net ?? 0);
  dto.shared = values.map((v) => v.shared ?? 0);

  // Map camelCase entity fields to snake_case DTO fields
  dto.inj_gross = values.map((v) => v.inj_gross ?? 0);
  dto.inj_net = values.map((v) => v.inj_net ?? 0);
  dto.inj_shared = values.map((v) => v.inj_shared ?? 0);

  return dto;
}

/**
 * Maps the raw monthly-aggregate rows (from the repository GROUP BY query) into
 * `SharingOpConsumptionCoverageDTO[]`. `month` already arrives as the exact
 * `YYYY-MM` string (the DB computes it with `to_char(date_trunc(... AT TIME ZONE
 * 'Europe/Brussels'), 'YYYY-MM')`, so no timezone re-shift happens here);
 * `count` comes back as a Postgres bigint string and is coerced to `number`.
 */
export function toSharingOperationConsumptionCoverage(rows: { month: string; count: string }[]): SharingOpConsumptionCoverageDTO[] {
  return rows.map((row) => {
    const dto = new SharingOpConsumptionCoverageDTO();
    dto.month = row.month;
    dto.count = Number(row.count);
    return dto;
  });
}
