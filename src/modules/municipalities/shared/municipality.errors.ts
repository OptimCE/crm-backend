import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 10000 - 19999
export const MUNICIPALITY_ERRORS = {
  ...GLOBAL_ERRORS,
  SEARCH: {
    DATABASE: new LocalError(10000, "municipality:search.database"),
  },
  LOOKUP: {
    UNKNOWN_NIS_CODES: new LocalError(10001, "municipality:lookup.unknown_nis_codes"),
  },
};
