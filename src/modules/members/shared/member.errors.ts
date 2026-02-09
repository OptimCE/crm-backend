import {GLOBAL_ERRORS, LocalError} from "../../../shared/errors/errors.js";
// Errors range: 50000 - 59999
export const MEMBER_ERRORS = {
    ...GLOBAL_ERRORS,
    ADD_MEMBER:{
      DATABASE_ADD: new LocalError(50000, "member:add_member.database_add")
    },
    DELETE_MEMBER:{
        DATABASE_DELETE: new LocalError(50001, "member:delete_member.database_delete")
    },
    DELETE_MEMBER_LINK:{
        DATABASE_DELETE: new LocalError(50002, "member:delete_member_link.database_delete")
    },
    GET_MEMBER: {
        NOT_FOUND: new LocalError(50003, "member:get_member.member_not_found")
    },
    PATCH_MEMBER_STATUS:{
        MEMBER_NOT_FOUND: new LocalError(50004, "member:patch_member_status.member_not_found"),
        DATABASE_UPDATE: new LocalError(50005, "member:patch_member_status.database_update")
    },
    PATCH_MEMBER_LINK:{
        MEMBER_NOT_FOUND: new LocalError(50006, "member:patch_member_link.member_not_found"),
        DATABASE_ADD: new LocalError(50007, "member:patch_member_link.database_add")
    },
    UPDATE_MEMBER:{
        MEMBER_NOT_FOUND: new LocalError(50008, "member:update_member.member_not_found"),
        DATABASE_SAVE_ADDRESS: new LocalError(50009, "member:update_member.database_save_address"),
        DATABASE_SAVE_MEMBER: new LocalError(500010, "member:update_member.database_save_member"),
        DATABASE_SAVE_INDIVIDUAL: new LocalError(500011, "member:update_member.database_save_individual"),
        DATABASE_SAVE_COMPANY: new LocalError(50012, "member:update_member.database_save_company"),
    },
    VALIDATION:{
        WRONG_TYPE:{
            MEMBER_TYPE: new LocalError(55000, "member:validation.wrong_type.member_type"),
        },
    }
}