import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";

export const AUDIT_LOG_ERRORS = {
  ...GLOBAL_ERRORS,
  EXPORT: {
    TOO_LARGE: new LocalError(32000, "audit_log:export.too_large"),
  },
};
