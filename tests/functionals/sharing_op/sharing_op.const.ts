import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import {SHARING_OPERATION_ERRORS} from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import {
    SharingKeyStatus,
    SharingOperationType
} from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import {MeterDataStatus} from "../../../src/modules/meters/shared/meter.types.js";
import {ORGS_ADMIN, ORGS_GESTIONNAIRE} from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingSharingOpId1 = 1; // "Op 1"
export const existingSharingOpId2 = 2; // "Op 2"
export const existingKeyId1 = 1; // "Key 1" linked to Op 1
export const existingKeyId2 = 2; // "Key 2" linked to Op 2
export const existingEAN = "123456789012345678"; // Linked to Op 1

export const newSharingOpName = "Functional Op";
export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get List
export const testCasesGetList = [
    {
        description: "Success - List Operations",
        query: {},
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.length >= 2 && data.some((op: any) => op.id === existingSharingOpId1);
        }
    },
    {
        description: "Success - Filter by Name",
        query: { name: "Op 1" },
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.length === 1 && data[0].id === existingSharingOpId1;
        }
    }
];

// 2. Get Detail
export const testCasesGetDetail = [
    {
        description: "Success - Get Detail with Keys",
        id: existingSharingOpId1,
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.id === existingSharingOpId1 && data.key !== undefined;
        }
    },
    {
        description: "Fail - Not Found",
        id: 999,
        orgs: ORGS_GESTIONNAIRE,
        expected_error_code: SHARING_OPERATION_ERRORS.EXCEPTION.errorCode,
        status_code: 400
    }
];

// 3. Create
export const testCasesCreate = [
    {
        description: "Success - Create Operation",
        body: {
            name: newSharingOpName,
            type: SharingOperationType.LOCAL
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 4. Add Key
export const testCasesAddKey = [
    {
        description: "Success - Link Key to Op 2",
        body: {
            id_sharing: existingSharingOpId2,
            id_key: existingKeyId1 // Using Key 1 (from Op 1) in Op 2 logic (should work if no overlap constraint on keys across ops? Or just link creation)
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 5. Add Meter
export const testCasesAddMeter = [
    {
        description: "Success - Link Meter to Op 2",
        body: {
            id_sharing: existingSharingOpId2,
            ean_list: [existingEAN], // EAN is currently in Op 1. Logic should handle transition or error if active?
            // Service adds new MeterData starting today.
            date: "2024-06-01"
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 6. Patch Key Status
export const testCasesPatchKey = [
    {
        description: "Success - Approve Key",
        body: {
            id_sharing: existingSharingOpId1,
            id_key: existingKeyId1,
            status: SharingKeyStatus.APPROVED,
            date: "2024-02-01"
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 7. Patch Meter Status
export const testCasesPatchMeter = [
    {
        description: "Success - Update Meter Status",
        body: {
            id_sharing: existingSharingOpId1,
            id_meter: existingEAN,
            status: MeterDataStatus.WAITING_GRD,
            date: "2024-03-01"
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 8. Delete Op
export const testCasesDelete = [
    {
        description: "Success - Delete Operation",
        id: existingSharingOpId2, // Delete Op 2
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    },
    {
        description: "Fail - Not Found / Already Deleted",
        id: 99,
        orgs: ORGS_ADMIN,
        status_code: 400,
        expected_error_code: SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE.errorCode
    }
];
