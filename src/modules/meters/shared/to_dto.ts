import { Meter, MeterConsumption, MeterData } from "../domain/meter.models.js";
import { MeterConsumptionDTO, MetersDataDTO, MetersDTO, PartialMeterDTO } from "../api/meter.dtos.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";
import { toMemberPartialDTO } from "../../members/shared/to_dto.js";
import { toSharingOperationPartialDTO } from "../../sharing_operations/shared/to_dto.js";
import { MeterDataStatus } from "./meter.types.js";

export function toMeterPartialDTO(meter: Meter): PartialMeterDTO {
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
  dto.start_date = new Date(data.start_date);
  if (data.end_date) dto.end_date = new Date(data.end_date);
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

  // Temporal classification
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const history: MetersDataDTO[] = [];
  const future: MetersDataDTO[] = [];
  let active: MetersDataDTO | undefined;

  if (meter.meter_data) {
    for (const data of meter.meter_data) {
      const dataDto = toMetersDataDTO(data);
      const start = new Date(data.start_date);
      const end = data.end_date ? new Date(data.end_date) : null;

      // Future: Starts after today
      if (start > today) {
        future.push(dataDto);
      }
      // History: Ended before today
      else if (end && end < today) {
        history.push(dataDto);
      }
      // Active: Started on or before today, and either no end date or ends on/after today
      else {
        if (!active) {
          active = dataDto;
        } else {
          // Logic to handle overlaps if necessary, generally shouldn't happen with valid data
          // Treating additional overlaps as history for now
          history.push(dataDto);
        }
      }
    }
  }

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
