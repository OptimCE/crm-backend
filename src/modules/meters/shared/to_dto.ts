import type { Meter, MeterConsumption, MeterData } from "../domain/meter.models.js";
import { MeterConsumptionDTO, type MeterMapPointDTO, MetersDataDTO, MetersDTO, type PartialMeterDTO } from "../api/meter.dtos.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";
import { toMemberPartialDTO } from "../../members/shared/to_dto.js";
import { toSharingOperationPartialDTO } from "../../sharing_operations/shared/to_dto.js";
import { MeterDataStatus, type InjectionStatus } from "./meter.types.js";
import { classifyMeterDataByDate } from "./meter-data.classifier.js";
import { appTodayISO } from "../../../shared/utils/date.utils.js";

export function toMeterPartialDTO(meter: Meter): PartialMeterDTO {
  const activeData = meter.meter_data && meter.meter_data.length > 0 ? meter.meter_data[0] : null;
  let holder = undefined;
  let status = MeterDataStatus.INACTIVE;
  let sharing_op = undefined;
  let start_date: string | undefined = undefined;
  let end_date: string | undefined = undefined;
  let injection_status: InjectionStatus | null = null;
  if (activeData) {
    status = activeData.status;
    start_date = activeData.start_date;
    end_date = activeData.end_date ?? undefined;
    injection_status = activeData.injection_status;
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
    start_date: start_date,
    end_date: end_date,
    address: toAddressDTO(meter.address),
    sharing_operation: sharing_op,
    injection_status: injection_status,
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

export function toMeterDTO(meter: Meter): MetersDTO {
  const dto = new MetersDTO();
  dto.EAN = meter.EAN;
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

export function toMeterConsumptionDTO(ean: string, values: MeterConsumption[]): MeterConsumptionDTO {
  const dto = new MeterConsumptionDTO();
  dto.EAN = ean;

  dto.timestamps = values.map((v) => v.timestamp.toISOString());
  dto.gross = values.map((v) => v.gross ?? 0);
  dto.net = values.map((v) => v.net ?? 0);
  dto.shared = values.map((v) => v.shared ?? 0);

  // Mapping properties from snake_case entity columns to DTO
  dto.inj_gross = values.map((v) => v.inj_gross ?? 0);
  dto.inj_net = values.map((v) => v.inj_net ?? 0);
  dto.inj_shared = values.map((v) => v.inj_shared ?? 0);

  return dto;
}

/**
 * Maps a meter onto its map point.
 *
 * Only ever called for rows the repository already filtered to
 * `latitude IS NOT NULL`, and the DB CHECK keeps the pair atomic — hence the
 * non-null assertions rather than a runtime guard that could never fire.
 */
export function toMeterMapPointDTO(meter: Meter): MeterMapPointDTO {
  const activeData = meter.meter_data && meter.meter_data.length > 0 ? meter.meter_data[0] : null;
  const holder = activeData?.member ?? null;
  const operation = activeData?.sharing_operation ?? null;

  return {
    EAN: meter.EAN,
    latitude: meter.address.latitude as number,
    longitude: meter.address.longitude as number,
    geo_precision: meter.address.geo_precision,
    status: activeData ? activeData.status : MeterDataStatus.INACTIVE,
    injection_status: activeData ? activeData.injection_status : null,
    // `Member.name` is the display name for both individuals and companies —
    // the type-specific detail rows are not joined here, and the popup only
    // needs a label.
    holder_name: holder ? holder.name : undefined,
    sharing_operation_id: operation ? operation.id : undefined,
    sharing_operation_name: operation ? operation.name : undefined,
  };
}

/**
 * The /me variant: same point, plus the owning community.
 *
 * A member's meters can sit in several communities at once, so the popup needs
 * the label. Kept as a wrapper rather than a flag on the base mapper so the
 * community-scoped endpoint cannot accidentally start shipping a redundant
 * field on every one of two thousand points.
 */
export function toMeMeterMapPointDTO(meter: Meter): MeterMapPointDTO {
  return { ...toMeterMapPointDTO(meter), community_name: meter.community?.name };
}
