import {GLOBAL_ERRORS, LocalError} from "../../../shared/errors/errors.js";
// Errors range: 70000 - 79999
export const SHARING_OPERATION_ERRORS = {
    ...GLOBAL_ERRORS,
    ADD_CONSUMPTION_DATA: {
        DATABASE_ADD: new LocalError(70000, "sharing_operation:add_consumption_data.database_add"),
        NO_METER_AUTHORIZED: new LocalError(70001, "sharing_operation:add_consumption_data.no_meter_authorized"),
    },
    PARSE_EXCEL_DATA:{
        INVALID_DATE_FORMAT: new LocalError(70001, "sharing_operation:parse_excel_data.invalid_date_format"),
    },
    ADD_KEY_TO_SHARING:{
        SHARING_OPERATION_NOT_FOUND: new LocalError(70002, "sharing_operation:add_key_to_sharing.sharing_operation_not_found"),
        ALLOCATION_KEY_NOT_FOUND: new LocalError(70003, "sharing_operation:add_key_to_sharing.allocation_key_not_found"),
        DATABASE_ADD: new LocalError(70004, "sharing_operation:add_key_to_sharing.database_add")
    },
    ADD_METER_TO_SHARING:{
        SHARING_OPERATION_NOT_FOUND: new LocalError(70005, "sharing_operation:add_meter_to_sharing.sharing_operation_not_found"),
        METERS_INVALID: new LocalError(70006, "sharing_operation:add_meter_to_sharing.meters_invalid"),
        DATABASE_ADD:new LocalError(70007, "sharing_operation:add_meter_to_sharing.database_add"),
    },
    CREATE_SHARING_OPERATION: {
        DATABASE_ADD: new LocalError(70008, "sharing_operation:create_sharing_operation.database_add")
    },
    GET_SHARING_OPERATION: {
        SHARING_OPERATION_NOT_FOUND: new LocalError(70009, "sharing_operation:get_sharing_operation.sharing_operation_not_found"),
    },
    PATCH_KEY_STATUS:{
        SHARING_OPERATION_NOT_FOUND: new LocalError(70010, "sharing_operation:patch_key_status.sharing_operation_not_found"),
        DATABASE_UPDATE: new LocalError(70011, "sharing_operation:patch_key_status.database_update"),
    },
    PATCH_METER_STATUS:{
        SHARING_OPERATION_NOT_FOUND: new LocalError(70012, "sharing_operation:patch_meter_status.sharing_operation_not_found"),
        METER_NOT_IN_COMMUNITY: new LocalError(70013, "sharing_operation:patch_meter_status.meter_not_in_community"),
        LATEST_METER_DATA_NOT_FOUND: new LocalError(70014, "sharing_operation:patch_meter_status.latest_meter_data_not_found"),
        METER_NOT_PART_OF_SHARING: new LocalError(70015, "sharing_operation:patch_meter_status.meter_not_part_of_sharing"),
        DATABASE_ADD: new LocalError(70016, "sharing_operation:patch_meter_status.database_add"),
    },
    DELETE_SHARING_OPERATION: {
        DATABASE_DELETE: new LocalError(70017, "sharing_operation:delete_sharing_operation.database_delete")
    },
    DELETE_METER_FROM_SHARING:{
        SHARING_OPERATION_NOT_FOUND: new LocalError(70018, "sharing_operation:delete_meter_from_sharing.sharing_operation_not_found"),
        METER_NOT_IN_COMMUNITY: new LocalError(70019, "sharing_operation:delete_meter_from_sharing.meter_not_in_community"),
        LATEST_METER_DATA_NOT_FOUND: new LocalError(70020, "sharing_operation:delete_meter_from_sharing.latest_meter_data_not_found"),
        METER_NOT_PART_OF_SHARING: new LocalError(70021, "sharing_operation:delete_meter_from_sharing.meter_not_part_of_sharing"),
        DATABASE_ADD: new LocalError(70022, "sharing_operation:delete_meter_from_sharing.database_add"),
    },
    GET_SHARING_OPERATION_CONSUMPTION:{
        NO_CONSUMPTION_FOUND: new LocalError(70023, "sharing_operation:get_sharing_operation_consumption.no_consumption_found"),
    },
    VALIDATION:{
        WRONG_TYPE:{
            SHARING_OPERATION_TYPE: new LocalError(75000, "sharing_operation:validation.wrong_type.sharing_operation_type"),
            SHARING_KEY_STATUS: new LocalError(75001, "sharing_operation:validation.wrong_type.sharing_key_status"),
            METER_DATA_STATUS: new LocalError(75002, "sharing_operation:validation.wrong_type.meter_data_status"),
        },
        ADD_CONSUMPTION_DATA:{
            FILE_TOO_BIG: new LocalError(75003, "sharing_operation:validation.add_consumption_data.file_too_big"),
            HAS_MIME_TYPE: new LocalError(75004,"sharing_operation:validation.add_consumption_data.has_mime_type")
        },
        PATCH_METER_TO_SHARING_OPERATION:{
            STATUS_OUT_OF_RANGE: new LocalError(75005, "sharing_operation:validation.patch_meter_to_sharing_operation.status_out_of_range"),
        }
    }
}