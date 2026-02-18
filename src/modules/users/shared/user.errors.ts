import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 80000 - 89999
export const USER_ERRORS = {
  ...GLOBAL_ERRORS,
  GET_PROFILE: {
    DATABASE_ADD: new LocalError(80000, "user:get_profile.database_add"),
    USER_NOT_FOUND: new LocalError(80001, "user:get_profile.user_not_found"),
  },
  UPDATE_PROFILE: {
    USER_NOT_FOUND: new LocalError(80002, "user:update_profile.user_not_found"),
    DATABASE_UPDATE: new LocalError(80003, "user:update_profile.database_update"),
  },
  UPDATE_INVITATION: {
    INVITATION_NOT_UPDATED: new LocalError(80004, "user:update_invitation.invitation_not_updated"),
  },
};
