import { User } from "../domain/user.models.js";
import { UserDTO } from "../api/user.dtos.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    phone_number: user.phoneNumber,
    first_name: user.firstName,
    last_name: user.lastName,
    billing_address: user.billingAddress ? toAddressDTO(user.billingAddress) : undefined,
    home_address: user.billingAddress ? toAddressDTO(user.billingAddress) : undefined,
    nrn: user.NRN,
    iban: user.iban,
  };
}
