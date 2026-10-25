import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 110000 - 119999
export const ONBOARDING_ERRORS = {
  ...GLOBAL_ERRORS,
  VALIDATION: {
    TOUR_KEY: new LocalError(110000, "onboarding:validation.tour_key"),
    OUTCOME: new LocalError(110001, "onboarding:validation.outcome"),
    TOUR_VERSION: new LocalError(110002, "onboarding:validation.tour_version"),
  },
  TRANSITION_FORBIDDEN: new LocalError(110003, "onboarding:transition_forbidden"),
  DATABASE: new LocalError(110004, "onboarding:database"),
};
