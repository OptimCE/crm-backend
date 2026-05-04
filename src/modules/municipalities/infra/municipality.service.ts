import { inject, injectable } from "inversify";
import type { IMunicipalityService } from "../domain/i-municipality.service.js";
import type { IMunicipalityRepository } from "../domain/i-municipality.repository.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { MunicipalityPartialDTO, MunicipalitySearchQuery } from "../api/municipality.dtos.js";
import { toMunicipalityPartialDTO } from "../shared/to_dto.js";

@injectable()
export class MunicipalityService implements IMunicipalityService {
  constructor(@inject("MunicipalityRepository") private readonly repo: IMunicipalityRepository) {}

  async searchMunicipalities(query: MunicipalitySearchQuery): Promise<[MunicipalityPartialDTO[], Pagination]> {
    const [values, total] = await this.repo.searchMunicipalities(query);
    const dtos = values.map(toMunicipalityPartialDTO);
    const total_pages = total === 0 ? 0 : Math.ceil(total / query.limit);
    return [dtos, { page: query.page, limit: query.limit, total, total_pages }];
  }
}
