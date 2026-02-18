import { AddressDTO } from "./address.dtos.js";
import { Address } from "./address.models.js";

export function toAddressDTO(address: Address): AddressDTO {
  return {
    city: address.city,
    number: address.number,
    street: address.street,
    postcode: address.postcode,
    supplement: address.supplement,
    id: address.id,
  };
}
