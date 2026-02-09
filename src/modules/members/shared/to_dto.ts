import {Manager, Member} from "../domain/member.models.js";
import {CompanyDTO, IndividualDTO, ManagerDTO, MembersPartialDTO} from "../api/member.dtos.js";
import {toAddressDTO} from "../../../shared/address/to_dto.js";
import {MemberType} from "./member.types.js";
export function toManagerDTO(manager: Manager): ManagerDTO {
    return {
        name: manager.name,
        NRN: manager.NRN,
        email: manager.email,
        phone_number: manager.phone_number,
        surname: manager.surname,
        id: manager.id
    }
}

export function toMemberPartialDTO(member: Member): MembersPartialDTO{
    return {
        member_type: member.member_type,
        status: member.status,
        name: member.name,
        id: member.id,
    }
}

export function toMemberDTO(member: Member): IndividualDTO | CompanyDTO {
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
            manager: member.individual_details.manager ? toManagerDTO(member.individual_details.manager) : undefined
        } as IndividualDTO;
    }

    else if (member.member_type === MemberType.COMPANY && member.company_details) {
        return {
            ...baseDto,
            vat_number: member.company_details.vat_number,
            manager: toManagerDTO(member.company_details.manager) // Required for company
        } as CompanyDTO;
    }

    throw new Error("Data inconsistency: Member type does not match available details");
}