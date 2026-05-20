import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";

export const ANNEXES_SERVICES_ERRORS = {
  ...GLOBAL_ERRORS,
  CATALOG: {
    LOAD_FAILED: new LocalError(31000, "annexes_services:catalog.load_failed"),
    INVALID_FORMAT: new LocalError(31001, "annexes_services:catalog.invalid_format"),
  },
  SUBSCRIPTION: {
    FEATURE_NOT_FOUND: new LocalError(31002, "annexes_services:subscription.feature_not_found"),
    ALREADY_SUBSCRIBED: new LocalError(31003, "annexes_services:subscription.already_subscribed"),
    NOT_SUBSCRIBED: new LocalError(31004, "annexes_services:subscription.not_subscribed"),
  },
};
