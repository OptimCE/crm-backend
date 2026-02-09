import {GLOBAL_ERRORS, LocalError} from "../../../shared/errors/errors.js";
// Error range: 10000 - 19999
export const COMMUNITY_ERRORS = {
    ...GLOBAL_ERRORS,
    ADD_COMMUNITY:{
      IAM_ERROR_CREATE: new LocalError(10000, "community:add_community.iam_creation"),
      DATABASE_SAVE_EXCEPTION: new LocalError(10001, "community:add_community.database_save")
    },
    UPDATE_COMMUNITY:{
        COMMUNITY_NOT_FOUND: new LocalError(10002, "community:update_community.community_not_found"),
        IAM_ERROR_UPDATE: new LocalError(10003, "community:update_community.iam_update"),
        DATABASE_UPDATE_EXCEPTION: new LocalError(10004, "community:update_community.database_update")
    },
    DELETE_USER_COMMUNITY:{
        COMMUNITY_USER_NOT_FOUND: new LocalError(10005, "community:delete_user_community.community_user_not_found"),
        DATABASE_DELETE_USER_EXCEPTION: new LocalError(10006, "community:delete_user_community.database_delete_user"),
        IAM_DELETE_USER_FROM_COMMUNITY: new LocalError(10007, "community:delete_user_community.iam_delete_user")
    },
    UPDATE_USER_ROLE:{
      DATABASE_PATCH_ROLE_EXCEPTION: new LocalError(10008, "community:update_user_role.database_update_user_role"),
      IAM_UPDATE_USER_ROLE: new LocalError(10009, "community:update_user_role.iam_update_user_role"),
    },
    PATCH_ROLE_USER:{
        COMMUNITY_USER_NOT_FOUND: new LocalError(10010, "community:patch_user_role.community_user_not_found"),
        EXCEPTION: new LocalError(10011, "community:patch_user_role.exception"),
    },
    DELETE_COMMUNITY: {
        COMMUNITY_NOT_FOUND: new LocalError(10012, "community:delete_community.community_not_found"),
        MISMATCH_ID: new LocalError(10013, "community:delete_community.mismatch_id"),
        DATABASE_DELETE_EXCEPTION: new LocalError(10014, "community:delete_community.database_delete_exception"),
        IAM_DELETE_COMMUNITY: new LocalError(10015, "community:delete_community.iam_delete_community"),
    }
}