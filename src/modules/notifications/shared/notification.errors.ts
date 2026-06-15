import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";

export const NOTIFICATION_ERRORS = {
  ...GLOBAL_ERRORS,
  // Raised when marking a notification that does not exist or is not the
  // current user's. Code lives in the notification range (33xxx).
  NOT_FOUND: new LocalError(33000, "notification:not_found"),
};
