import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type {
  MunicipalityGeometryDTO,
  MunicipalityGeometryQuery,
  MunicipalityPartialDTO,
  MunicipalitySearchQuery,
} from "../api/municipality.dtos.js";

/**
 * Read-only service exposed for autocomplete and reference lookups.
 * The reference dataset is loaded out-of-band; this service does not write to it.
 */
export interface IMunicipalityService {
  searchMunicipalities(query: MunicipalitySearchQuery): Promise<[MunicipalityPartialDTO[], Pagination]>;

  /**
   * Simplified GeoJSON geometry for the requested NIS codes.
   *
   * Unknown codes are simply absent from the result — the endpoint is a
   * best-effort lookup for drawing a map, and 404-ing a whole zone because
   * one commune was merged in a past reform would be worse than drawing the
   * rest of it.
   */
  getGeometries(query: MunicipalityGeometryQuery): Promise<MunicipalityGeometryDTO[]>;
}
