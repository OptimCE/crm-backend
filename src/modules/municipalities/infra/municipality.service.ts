import { inject, injectable } from "inversify";
import type { IMunicipalityService } from "../domain/i-municipality.service.js";
import type { IMunicipalityRepository } from "../domain/i-municipality.repository.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import {
  DEFAULT_MUNICIPALITY_GEOMETRY_TOLERANCE,
  type MunicipalityGeometryDTO,
  type MunicipalityGeometryQuery,
  type MunicipalityPartialDTO,
  type MunicipalitySearchQuery,
} from "../api/municipality.dtos.js";
import { toMunicipalityGeometryDTO, toMunicipalityPartialDTO } from "../shared/to_dto.js";
import { simplifyGeometry } from "../shared/simplify.js";
import { getCachedGeometry, setCachedGeometry } from "./municipality.geometry.cache.js";

@injectable()
export class MunicipalityService implements IMunicipalityService {
  constructor(@inject("MunicipalityRepository") private readonly repo: IMunicipalityRepository) {}

  async searchMunicipalities(query: MunicipalitySearchQuery): Promise<[MunicipalityPartialDTO[], Pagination]> {
    const [values, total] = await this.repo.searchMunicipalities(query);
    const dtos = values.map(toMunicipalityPartialDTO);
    const total_pages = total === 0 ? 0 : Math.ceil(total / query.limit);
    return [dtos, { page: query.page, limit: query.limit, total, total_pages }];
  }

  async getGeometries(query: MunicipalityGeometryQuery): Promise<MunicipalityGeometryDTO[]> {
    const tolerance = query.tolerance ?? DEFAULT_MUNICIPALITY_GEOMETRY_TOLERANCE;
    const unique = [...new Set(query.nis_codes)];

    const municipalities = await this.repo.findManyByNisCodes(unique);

    return municipalities.map((municipality) => {
      let simplified = getCachedGeometry(municipality.nis_code, tolerance);
      if (!simplified) {
        simplified = simplifyGeometry(municipality.geo_shape, tolerance);
        setCachedGeometry(municipality.nis_code, tolerance, simplified);
      }
      return toMunicipalityGeometryDTO(municipality, simplified, tolerance);
    });
  }
}
