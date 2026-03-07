import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 30000 - 39999
export const INVITATION_ERRORS = {
  ...GLOBAL_ERRORS,

  CANCEL_MANAGER_INVITATION: {
    DATABASE_CANCEL: new LocalError(30017, "invitation:cancel_manager_invitation.database_cancel"),
  },
  CANCEL_MEMBER_INVITATION: {
    DATABASE_CANCEL: new LocalError(30018, "invitation:cancel_member_invitation.database_cancel"),
  },
  INVITE_USER_TO_BECOME_MANAGER: {
    DATABASE_SAVE: new LocalError(30021, "invitation:invite_user_to_become_manager.database_save"),
  },
  INVITE_USER_TO_BECOME_MEMBER: {
    DATABASE_SAVE: new LocalError(30022, "invitation:invite_user_to_become_member.database_save"),
  },
};
