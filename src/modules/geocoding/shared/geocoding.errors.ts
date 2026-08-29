import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 90000 - 99999
export const GEOCODING_ERRORS = {
  ...GLOBAL_ERRORS,
  BACKFILL: {
    DATABASE: new LocalError(90000, "geocoding:backfill.database"),
    DISABLED: new LocalError(90001, "geocoding:backfill.disabled"),
  },
};
