import type { QueryRunner } from "typeorm";
import type { Municipality } from "./municipality.models.js";
import type { MunicipalitySearchQuery } from "../api/municipality.dtos.js";

export interface IMunicipalityRepository {
  /**
   * Paginated municipality search. Optionally filter by name fragment (matches
   * fr_name OR nl_name OR de_name) and/or postal code.
   * Loaded municipalities include their full `postal_codes` relation.
   */
  searchMunicipalities(query: MunicipalitySearchQuery, query_runner?: QueryRunner): Promise<[Municipality[], number]>;

  /**
   * Look up municipalities by their NIS codes (used to validate a code list
   * passed by clients). Returns only the municipalities that actually exist.
   */
  findManyByNisCodes(nis_codes: number[], query_runner?: QueryRunner): Promise<Municipality[]>;
}
