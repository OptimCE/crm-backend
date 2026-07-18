import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import { SharingKeyStatus, SharingOperationType } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingSharingOpId1 = 1; // "Op 1"
export const existingSharingOpId2 = 2; // "Op 2"
export const existingKeyId1 = 1; // "Key 1" linked to Op 1
export const existingKeyId2 = 2; // "Key 2" linked to Op 2
export const existingEAN = "123456789012345678"; // Linked to Op 1
// The 4 dedicated wind meters seeded on Op 2 (Public Wind Sharing), one per new member
export const newWindMeterEANs = [
  "541448200000000001",
  "541448200000000002",
  "541448200000000003",
  "541448200000000004",
];

export const newSharingOpName = "Functional Op";
export const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

// --- Test Cases ---

// 1. Get List
export const testCasesGetList = [
  {
    description: "Success - List Operations",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length >= 2 && (data as Array<{ id: number }>).some((op) => op.id === existingSharingOpId1);
    },
  },
  {
    description: "Success - Filter by Name",
    query: { name: "Public" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length === 2 && (data[0] as { id: number }).id === existingSharingOpId1;
    },
  },
];

// 2. Get Detail
export const testCasesGetDetail = [
  {
    description: "Success - Get Detail with Keys",
    id: existingSharingOpId1,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as { id: number; key: unknown };
      return d.id === existingSharingOpId1 && d.key !== undefined;
    },
  },
  {
    description: "Fail - Not Found",
    id: 999,
    orgs: ORGS_GESTIONNAIRE,
    expected_error_code: SHARING_OPERATION_ERRORS.EXCEPTION.errorCode,
    status_code: 400,
  },
];

// 2b. Get Meters List — the wind operation now exposes its 4 dedicated meters
export const testCasesGetSharingOpMeters = [
  {
    description: "Success - Wind op (Op 2) exposes its 4 new dedicated meters",
    id: existingSharingOpId2,
    query: { type: 2 }, // SharingOperationMetersQueryType.NOW
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      const eans = (data as Array<{ EAN: string }>).map((m) => m.EAN);
      return data.length >= 4 && newWindMeterEANs.every((ean) => eans.includes(ean));
    },
  },
];

// 3. Create
export const testCasesCreate = [
  {
    description: "Success - Create Operation",
    body: {
      name: newSharingOpName,
      type: SharingOperationType.LOCAL,
      municipality_nis_codes: [21001],
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Unknown municipality",
    body: {
      name: "Bad Op",
      type: SharingOperationType.LOCAL,
      municipality_nis_codes: [999999],
    },
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.CREATE_SHARING_OPERATION.UNKNOWN_MUNICIPALITY.errorCode,
  },
];

// 3b. Update Municipalities
export const testCasesUpdateMunicipalities = [
  {
    description: "Success - Replace municipalities",
    id: existingSharingOpId1,
    body: { municipality_nis_codes: [21009] },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Unknown municipality",
    id: existingSharingOpId1,
    body: { municipality_nis_codes: [999999] },
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.UPDATE_MUNICIPALITIES.UNKNOWN_MUNICIPALITY.errorCode,
  },
  {
    description: "Fail - Sharing operation not found",
    id: 999,
    body: { municipality_nis_codes: [21001] },
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.UPDATE_MUNICIPALITIES.SHARING_OPERATION_NOT_FOUND.errorCode,
  },
];

// 4. Add Key
export const testCasesAddKey = [
  {
    description: "Success - Link Key to Op 2",
    body: {
      id_sharing: existingSharingOpId2,
      id_key: existingKeyId1, // Using Key 1 (from Op 1) in Op 2 logic (should work if no overlap constraint on keys across ops? Or just link creation)
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 5. Add Meter
export const testCasesAddMeter = [
  {
    description: "Success - Link Meter to Op 2",
    body: {
      id_sharing: existingSharingOpId2,
      ean_list: [existingEAN], // EAN is currently in Op 1. Logic should handle transition or error if active?
      // Service adds new MeterData starting today.
      date: "2024-06-01",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 6. Patch Key Status
export const testCasesPatchKey = [
  {
    description: "Success - Approve Key",
    body: {
      id_sharing: existingSharingOpId1,
      id_key: existingKeyId1,
      status: SharingKeyStatus.APPROVED,
      date: "2024-02-01",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 7. Patch Meter Status
export const testCasesPatchMeter = [
  {
    description: "Success - Update Meter Status",
    body: {
      id_sharing: existingSharingOpId1,
      id_meter: existingEAN,
      status: MeterDataStatus.WAITING_GRD,
      date: "2024-03-01",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 8. Patch Visibility
export const testCasesPatchVisibility = [
  {
    description: "Success - Set to private",
    body: {
      id_sharing: existingSharingOpId1,
      is_public: false,
    },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Set to public",
    body: {
      id_sharing: existingSharingOpId1,
      is_public: true,
    },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Sharing operation not found",
    body: {
      id_sharing: 999,
      is_public: true,
    },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_VISIBILITY.SHARING_OPERATION_NOT_FOUND.errorCode,
  },
];

// 9b. Update Sharing Operation (PUT /:id) — commit 71ebaea
export const testCasesUpdate = [
  {
    description: "Success - Update name only",
    id: existingSharingOpId1,
    body: { name: "Renamed Op 1" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Update type only",
    id: existingSharingOpId1,
    body: { type: SharingOperationType.CER },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Replace municipalities only",
    id: existingSharingOpId1,
    body: { municipality_nis_codes: [21009] },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Update name + type + municipalities",
    id: existingSharingOpId1,
    body: { name: "Combined Update", type: SharingOperationType.CEC, municipality_nis_codes: [21001] },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - No fields provided",
    id: existingSharingOpId1,
    body: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.UPDATE_SHARING_OPERATION.NO_FIELDS_TO_UPDATE.errorCode,
  },
  {
    description: "Fail - Operation not found",
    id: 999,
    body: { name: "Renamed" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.UPDATE_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.errorCode,
  },
  {
    description: "Fail - Unknown municipality NIS code",
    id: existingSharingOpId1,
    body: { municipality_nis_codes: [999999] },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.UPDATE_SHARING_OPERATION.UNKNOWN_MUNICIPALITY.errorCode,
  },
];

// 9. Delete Op
export const testCasesDelete = [
  {
    description: "Success - Delete Operation",
    id: existingSharingOpId2, // Delete Op 2
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Not Found / Already Deleted",
    id: 99,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE.errorCode,
  },
];
