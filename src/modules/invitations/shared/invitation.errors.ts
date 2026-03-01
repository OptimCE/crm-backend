import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 30000 - 39999
export const INVITATION_ERRORS = {
  ...GLOBAL_ERRORS,

  ACCEPT_INVITATION_MANAGER: {
    INVITATION_MANAGER_NOT_FOUND: new LocalError(30000, "invitation:accept_invitation_manager.invitation_manager_not_found"),
    MISMATCH_USER_ID: new LocalError(30001, "invitation:accept_invitation_manager.mismatch_user_id"),
    ADMIN_CANT_ACCEPT_MANAGER_INVITATION: new LocalError(30002, "invitation:accept_invitation_manager.admin_cant_accept_manager_invitation"),
    ALREADY_MANAGER: new LocalError(30003, "invitation:accept_invitation_manager.already_manager"),
    DATABASE_SAVE_UPDATE: new LocalError(30004, "invitation:accept_invitation_manager.database_save_update"),
    IAM_SERVICE_SAVE_UPDATE: new LocalError(30005, "invitation:accept_invitation_manager.iam_service_save_update"),
  },
  ACCEPT_INVITATION_MEMBER: {
    INVITATION_MEMBER_NOT_FOUND: new LocalError(30006, "invitation:accept_invitation_member.invitation_member_not_found"),
    MISMATCH_USER_ID: new LocalError(30007, "invitation:accept_invitation_member.mismatch_user_id"),
    DATABASE_SAVE_USER_MEMBER_LINK: new LocalError(30008, "invitation:accept_invitation_member.database_save_user_member_link"),
    DATABASE_SAVE_USER_COMMUNITY: new LocalError(30009, "invitation:accept_invitation_member.database_save_user_community"),
    IAM_SERVICE_SAVE_USER_COMMUNITY: new LocalError(30010, "invitation:accept_invitation_member.iam_service_save_user_community"),
    DELETE_INVITATION_FAILED: new LocalError(3024, "invitation:accept_invitation_member.delete_invitation_failed"),
  },
  ACCEPT_INVITATION_MEMBER_ENCODED: {
    INVITATION_MEMBER_NOT_FOUND: new LocalError(30011, "invitation:accept_invitation_member_encoded.invitation_member_not_found"),
    MISMATCH_USER_ID: new LocalError(30012, "invitation:accept_invitation_member_encoded.mismatch_user_id"),
    DATABASE_SAVE_USER_MEMBER_LINK: new LocalError(30013, "invitation:accept_invitation_member_encoded.database_save_user_member_link"),
    DATABASE_SAVE_USER_COMMUNITY: new LocalError(30014, "invitation:accept_invitation_member_encoded.database_save_user_community"),
    IAM_SERVICE_SAVE_USER_COMMUNITY: new LocalError(30015, "invitation:accept_invitation_member_encoded.iam_service_save_user_community"),
    DATABASE_MEMBER_SAVE: new LocalError(30016, "invitation:accept_invitation_member_encoded.database_member_save"),
  },
  CANCEL_MANAGER_INVITATION: {
    DATABASE_CANCEL: new LocalError(30017, "invitation:cancel_manager_invitation.database_cancel"),
  },
  CANCEL_MEMBER_INVITATION: {
    DATABASE_CANCEL: new LocalError(30018, "invitation:cancel_member_invitation.database_cancel"),
  },
  REFUSE_MANAGER_INVITATION: {
    DATABASE_REFUSE: new LocalError(30019, "invitation:refuse_manager_invitation.database_refuse"),
  },
  REFUSE_MEMBER_INVITATION: {
    DATABASE_REFUSE: new LocalError(30020, "invitation:refuse_member_invitation.database_refuse"),
  },
  INVITE_USER_TO_BECOME_MANAGER: {
    DATABASE_SAVE: new LocalError(30021, "invitation:invite_user_to_become_manager.database_save"),
  },
  INVITE_USER_TO_BECOME_MEMBER: {
    DATABASE_SAVE: new LocalError(30022, "invitation:invite_user_to_become_member.database_save"),
  },
  GET_OWN_MEMBER_INVITATION_BY_ID: {
    NOT_FOUND: new LocalError(30023, "invitation:get_own_member_invitation_by_id.not_found"),
  },
};
