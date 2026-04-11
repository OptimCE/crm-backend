import type { Manager, Member } from "../../members/domain/member.models.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";
import { MemberType } from "../../members/shared/member.types.js";
import type { ManagerDTO } from "../../members/api/member.dtos.js";
import {
  type MeCompanyDTO,
  type MeDocumentDTO,
  type MeIndividualDTO,
  type MeMembersPartialDTO,
  MeMeterDTO,
  type MePartialMeterDTO,
} from "../api/me.dtos.js";
import type { Document } from "../../documents/domain/document.models.js";
import type { Meter, MeterData } from "../../meters/domain/meter.models.js";
import { MetersDataDTO } from "../../meters/api/meter.dtos.js";
import { toSharingOperationPartialDTO } from "../../sharing_operations/shared/to_dto.js";
import { MeterDataStatus } from "../../meters/shared/meter.types.js";

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
