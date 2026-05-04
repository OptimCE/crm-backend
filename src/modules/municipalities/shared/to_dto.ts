import type { Municipality } from "../domain/municipality.models.js";
import type { MunicipalityPartialDTO } from "../api/municipality.dtos.js";

export function toMunicipalityPartialDTO(value: Municipality): MunicipalityPartialDTO {
  return {
    nis_code: value.nis_code,
    fr_name: value.fr_name,
    nl_name: value.nl_name,
    de_name: value.de_name,
    region_fr: value.region_fr,
    postal_codes: (value.postal_codes ?? []).map((pc) => pc.postal_code),
  };
}
