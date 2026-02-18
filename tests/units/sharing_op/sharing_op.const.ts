import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { SharingOperation } from "../../../src/modules/sharing_operations/domain/sharing_operation.models.js";
import {
  toSharingOperation,
  toSharingOperationPartialDTO,
  toSharingOperationConsumptions,
} from "../../../src/modules/sharing_operations/shared/to_dto.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import { SharingKeyStatus, SharingOperationType } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";

// --- Mock Data ---
export const mockDate = new Date("2024-01-01T12:00:00.000Z");
const mockCommunity = { id: 1 };

export const mockSharingOperationEntity: SharingOperation = {
  id: 1,
  name: "Sharing Op 1",
  type: SharingOperationType.LOCAL,
  created_at: mockDate,
  updated_at: mockDate,
  community: mockCommunity as any,
  keys: [],
};

export const mockSharingOpConsumption = [
  {
    id: 1,
    timestamp: mockDate,
    gross: 10,
    net: 8,
    shared: 2,
    inj_gross: 5,
    inj_net: 4,
    inj_shared: 1,
    sharing_operation: mockSharingOperationEntity,
    community: mockCommunity as any,
    created_at: mockDate,
    updated_at: mockDate,
  },
];

export const mockSharingOperationDTO = toSharingOperation(mockSharingOperationEntity);
export const mockSharingOperationPartialDTO = toSharingOperationPartialDTO(mockSharingOperationEntity);
export const mockSharingOpConsumptionDTO = toSharingOperationConsumptions(mockSharingOpConsumption);

// JSON compatible
export const mockSharingOperationDTOJSON = JSON.parse(JSON.stringify(mockSharingOperationDTO));
export const mockSharingOperationPartialDTOJSON = JSON.parse(JSON.stringify(mockSharingOperationPartialDTO));
export const mockSharingOpConsumptionDTOJSON = JSON.parse(JSON.stringify(mockSharingOpConsumptionDTO));

export const mockFileBuffer = Buffer.from("mock-excel-content");
export const mockFileUpload = {
  buffer: mockFileBuffer,
  originalname: "data.xlsx",
  mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size: 1024,
};

// --- Test Cases ---

// 1. Get List
export const testCasesGetSharingOperationList = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: [mockSharingOperationPartialDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      sharingOpRepo: {
        getSharingOperationList: jest.fn(() => Promise.resolve([[mockSharingOperationEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.EXCEPTION.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.EXCEPTION.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationList: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 2. Get One
export const testCasesGetSharingOperation = [
  {
    description: "Success",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockSharingOperationDTOJSON,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: 999,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
];

// 3. Get Consumptions
export const testCasesGetSharingOperationConsumptions = [
  {
    description: "Success",
    id: 1,
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockSharingOpConsumptionDTOJSON,
    mocks: {
      sharingOpRepo: {
        getSharingOperationConsumption: jest.fn(() => Promise.resolve(mockSharingOpConsumption)),
      },
    },
  },
  {
    description: "Fail (Not Found/Empty)",
    id: 1,
    query: {},
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationConsumption: jest.fn(() => Promise.resolve([])),
      },
    },
  },
];

// 4. Download Consumptions
export const testCasesDownload = [
  {
    description: "Success",
    id: 1,
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: undefined,
    mocks: {
      sharingOpRepo: {
        getSharingOperationConsumption: jest.fn(() => Promise.resolve(mockSharingOpConsumption)),
      },
    },
  },
  {
    description: "Fail (Empty)",
    id: 1,
    query: {},
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationConsumption: jest.fn(() => Promise.resolve([])),
      },
    },
  },
];

// 5. Create
export const testCasesCreate = [
  {
    description: "Success",
    body: { name: "New Op", type: SharingOperationType.LOCAL },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        createSharingOperation: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    body: { name: "New Op", type: SharingOperationType.LOCAL },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.CREATE_SHARING_OPERATION.DATABASE_ADD.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.CREATE_SHARING_OPERATION.DATABASE_ADD.message,
    mocks: {
      sharingOpRepo: {
        createSharingOperation: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
    },
  },
];

// 6. Add Key
export const testCasesAddKey = [
  {
    description: "Success",
    body: { id_key: 10, id_sharing: 1 },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
        addKeyToSharing: jest.fn(() => Promise.resolve({})),
      },
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve({ id: 10 })),
      },
    },
  },
  {
    description: "Fail (Sharing Op Not Found)",
    body: { id_key: 10, id_sharing: 999 },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (Key Not Found)",
    body: { id_key: 999, id_sharing: 1 },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.ALLOCATION_KEY_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.ALLOCATION_KEY_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
];

// 7. Add Meter
export const testCasesAddMeter = [
  {
    description: "Success",
    body: { id_sharing: 1, date: "2024-01-01", ean_list: ["123"] },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (sharing not found)",
    body: { id_sharing: 999, date: "2024-01-01", ean_list: ["123"] },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (Meters Not In Community)",
    body: { id_sharing: 1, date: "2024-01-01", ean_list: ["999"] },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.METERS_INVALID.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.METERS_INVALID.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
  {
    description: "Fail (add meter)",
    body: { id_sharing: 1, date: "2024-01-01", ean_list: ["123"] },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.DATABASE_ADD.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.DATABASE_ADD.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        addMeterData: jest.fn(() => Promise.reject(new Error("DB fail"))),
      },
    },
  },
];

// 8. Add Consumption Data (File Upload)
export const testCasesAddData = [
  {
    description: "Success",
    body: { id_sharing_operation: 1 },
    file: mockFileUpload,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getAuthorizedEans: jest.fn(() => Promise.resolve(new Set(["123"]))),
        addConsumptions: jest.fn(() => Promise.resolve({})),
      },
      meterRepo: {
        addMeterConsumptions: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (Validation - No File)",
    body: { id_sharing_operation: 1 },
    file: undefined, // Missing file
    status_code: 422,
    translation_field: { field: "file" },
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.GENERIC_VALIDATION.EMPTY.message,
  },
  {
    description: "Fail (no meter authorized)",
    body: { id_sharing_operation: 1 },
    file: mockFileUpload,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.NO_METER_AUTHORIZED.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.NO_METER_AUTHORIZED.message,
    mocks: {
      sharingOpRepo: {
        getAuthorizedEans: jest.fn(() => Promise.resolve(new Set([]))),
        addConsumptions: jest.fn(() => Promise.resolve({})),
      },
      meterRepo: {
        addMeterConsumptions: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  // {
  //     description: "Fail (add consumption error)",
  //     body: { id_sharing_operation: 1 },
  //     file: mockFileUpload,
  //     status_code: 400,
  //     expected_error_code: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.DATABASE_ADD.errorCode,
  //     expected_data: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.DATABASE_ADD.message,
  //     mocks: {
  //         sharingOpRepo: {
  //             getAuthorizedEans: jest.fn(() => Promise.resolve(new Set(["123"]))),
  //             addConsumptions: jest.fn(() => Promise.reject(new Error("DB fail")))
  //         },
  //         meterRepo: {
  //             addMeterConsumptions: jest.fn(() => Promise.resolve({}))
  //         }
  //     }
  // },
  // {
  //     description: "Fail (add meter consumption error)",
  //     body: { id_sharing_operation: 1 },
  //     file: mockFileUpload,
  //     status_code: 400,
  //     expected_error_code: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.DATABASE_ADD.errorCode,
  //     expected_data: SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.DATABASE_ADD.message,
  //     mocks: {
  //         sharingOpRepo: {
  //             getAuthorizedEans: jest.fn(() => Promise.resolve(new Set(["123"]))),
  //             addConsumptions: jest.fn(() => Promise.resolve({}))
  //         },
  //         meterRepo: {
  //             addMeterConsumptions: jest.fn(() => Promise.reject(new Error("DB fail")))
  //         }
  //     }
  // },
];

// 9. Patch Key Status
export const testCasesPatchKey = [
  {
    description: "Success",
    body: { id_key: 10, id_sharing: 1, status: SharingKeyStatus.APPROVED, date: "2024-02-01" },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
        closeSpecificKeyEntry: jest.fn(() => Promise.resolve({})),
        closeActiveApprovedKey: jest.fn(() => Promise.resolve({})),
        addSharingKeyEntry: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (Op Not Found)",
    body: { id_key: 10, id_sharing: 999, status: SharingKeyStatus.APPROVED, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (patch key)",
    body: { id_key: 10, id_sharing: 1, status: SharingKeyStatus.APPROVED, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
        closeSpecificKeyEntry: jest.fn(() => Promise.reject(new Error("DB fail"))),
        closeActiveApprovedKey: jest.fn(() => Promise.resolve({})),
        addSharingKeyEntry: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (patch key 2)",
    body: { id_key: 10, id_sharing: 1, status: SharingKeyStatus.APPROVED, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
        closeSpecificKeyEntry: jest.fn(() => Promise.resolve({})),
        closeActiveApprovedKey: jest.fn(() => Promise.reject(new Error("DB fail"))),
        addSharingKeyEntry: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (patch key 3)",
    body: { id_key: 10, id_sharing: 1, status: SharingKeyStatus.APPROVED, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
        closeSpecificKeyEntry: jest.fn(() => Promise.resolve({})),
        closeActiveApprovedKey: jest.fn(() => Promise.resolve({})),
        addSharingKeyEntry: jest.fn(() => Promise.reject(new Error("DB fail"))),
      },
    },
  },
];

// 10. Patch Meter Status
export const testCasesPatchMeter = [
  {
    description: "Success",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 1 } })),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (sharing not found)",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (no meter in community)",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_IN_COMMUNITY.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_IN_COMMUNITY.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
  {
    description: "Fail (no latest data)",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.LATEST_METER_DATA_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.LATEST_METER_DATA_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve(null)), // Linked to Op 2
      },
    },
  },
  {
    description: "Fail (Wrong Sharing Op Link)",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_PART_OF_SHARING.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_PART_OF_SHARING.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 2 } })), // Linked to Op 2
      },
    },
  },
  {
    description: "Fail (add)",
    body: { id_meter: "123", id_sharing: 1, status: MeterDataStatus.ACTIVE, date: "2024-02-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.DATABASE_ADD.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.DATABASE_ADD.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 1 } })),
        addMeterData: jest.fn(() => Promise.reject(new Error("DB fail"))),
      },
    },
  },
];

// 11. Delete Op
export const testCasesDelete = [
  {
    description: "Success",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        deleteSharingOperation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "Fail (Delete Failed)",
    id: 1,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE.message,
    mocks: {
      sharingOpRepo: {
        deleteSharingOperation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
];

// 12. Delete Meter From Op
export const testCasesDeleteMeter = [
  {
    description: "Success",
    id: 1,
    body: { id_meter: "123", id_sharing: 1, date: "2024-03-01" },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 1 } })),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (sharing not found)",
    id: 1,
    body: { id_meter: "123", id_sharing: 999, date: "2024-03-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.SHARING_OPERATION_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.SHARING_OPERATION_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (no meters valid)",
    id: 1,
    body: { id_meter: "123", id_sharing: 1, date: "2024-03-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_IN_COMMUNITY.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_IN_COMMUNITY.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
  {
    description: "Fail (no latest data)",
    id: 1,
    body: { id_meter: "123", id_sharing: 1, date: "2024-03-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.LATEST_METER_DATA_NOT_FOUND.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.LATEST_METER_DATA_NOT_FOUND.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve(null)),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (meter not part of sharing)",
    id: 1,
    body: { id_meter: "123", id_sharing: 999, date: "2024-03-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_PART_OF_SHARING.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_PART_OF_SHARING.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 1 } })),
      },
    },
  },
  {
    description: "Fail (add meter)",
    id: 1,
    body: { id_meter: "123", id_sharing: 1, date: "2024-03-01" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.DATABASE_ADD.errorCode,
    expected_data: SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.DATABASE_ADD.message,
    mocks: {
      sharingOpRepo: {
        getSharingOperationById: jest.fn(() => Promise.resolve(mockSharingOperationEntity)),
      },
      meterRepo: {
        areMetersInCommunity: jest.fn(() => Promise.resolve(true)),
        getLastMeterData: jest.fn(() => Promise.resolve({ sharing_operation: { id: 1 } })),
        addMeterData: jest.fn(() => Promise.reject(new Error("Fail DB"))),
      },
    },
  },
];
