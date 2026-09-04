import type { AddressDTO } from "./address.dtos.js";
import type { Address } from "./address.models.js";

export function toAddressDTO(address: Address): AddressDTO {
  return {
    city: address.city,
    number: address.number,
    street: address.street,
    postcode: address.postcode,
    supplement: address.supplement,
    country: address.country,
    id: address.id,
    latitude: address.latitude,
    longitude: address.longitude,
    geo_precision: address.geo_precision,
  };
}
