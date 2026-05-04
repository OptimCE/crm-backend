import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { MunicipalityPartialDTO, MunicipalitySearchQuery } from "../api/municipality.dtos.js";

/**
 * Read-only service exposed for autocomplete and reference lookups.
 * The reference dataset is loaded out-of-band; this service does not write to it.
 */
export interface IMunicipalityService {
  searchMunicipalities(query: MunicipalitySearchQuery): Promise<[MunicipalityPartialDTO[], Pagination]>;
}
