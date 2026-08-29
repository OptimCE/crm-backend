import type { Municipality } from "../domain/municipality.models.js";
import type { MunicipalityGeometryDTO, MunicipalityPartialDTO } from "../api/municipality.dtos.js";

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

/**
 * Maps a municipality onto its geometry DTO.
 *
 * Takes the already-simplified shape as an argument rather than simplifying
 * here, because the service memoizes per (nis_code, tolerance) and that cache
 * must sit above the mapper.
 */
export function toMunicipalityGeometryDTO(
  value: Municipality,
  simplified: { geometry: unknown; original_points: number; simplified_points: number },
  tolerance: number,
): MunicipalityGeometryDTO {
  return {
    nis_code: value.nis_code,
    fr_name: value.fr_name,
    geo_point: value.geo_point ?? null,
    geo_shape: simplified.geometry,
    tolerance,
    original_points: simplified.original_points,
    simplified_points: simplified.simplified_points,
  };
}
