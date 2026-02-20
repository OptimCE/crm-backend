import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { Meter, MeterConsumption } from "../../../src/modules/meters/domain/meter.models.js";
import { toMeterDTO, toMeterPartialDTO, toMeterConsumptionDTO } from "../../../src/modules/meters/shared/to_dto.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { ClientType, MeterDataStatus, MeterRate, ReadingFrequency, TarifGroup } from "../../../src/modules/meters/shared/meter.types.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";
import type { Address } from "../../../src/shared/address/address.models.js";

// --- Mock Data ---
export const mockDate = new Date("2024-01-01T12:00:00.000Z");

const mockAddress = {
  id: 1,
  street: "Main St",
  number: 1,
  city: "Brussels",
  postcode: "1000",
  created_at: mockDate,
  updated_at: mockDate,
};

const mockCommunity = { id: 1 };

export const mockMeterEntity: Meter = {
  EAN: "123456789012345678",
  meter_number: "M123",
  phases_number: 1,
  tarif_group: TarifGroup.LOW_TENSION,
  reading_frequency: ReadingFrequency.MONTHLY,
  created_at: mockDate,
  updated_at: mockDate,
  address: mockAddress as Address,
  community: mockCommunity as Community,
  meter_data: [
    {
      id: 1,
      start_date: "2024-01-01",
      end_date: null,
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
      description: "Default",
      sampling_power: null,
      amperage: null,
      grd: "Fluvius",
      injection_status: null,
      production_chain: null,
      total_generating_capacity: null,
      member: null,
      sharing_operation: null,
      meter: {} as Meter,
      community: {} as Community,
      created_at: mockDate,
      updated_at: mockDate,
    },
  ],
};

export const mockMeterDTO = toMeterDTO(mockMeterEntity);
export const mockMeterPartialDTO = toMeterPartialDTO(mockMeterEntity);

// JSON compatible
export const mockMeterDTOJSON = JSON.parse(JSON.stringify(mockMeterDTO));
export const mockMeterPartialDTOJSON = JSON.parse(JSON.stringify(mockMeterPartialDTO));

export const mockConsumptions = [
  {
    id: 1,
    timestamp: mockDate,
    gross: 10,
    net: 8,
    shared: 2,
    inj_gross: 5,
    inj_net: 4,
    inj_shared: 1,
    meter: {},
    sharing_operation: null,
    community: {},
    created_at: mockDate,
    updated_at: mockDate,
  },
];

export const mockMeterConsumptionDTO = toMeterConsumptionDTO(mockMeterEntity.EAN, mockConsumptions as MeterConsumption[]);
export const mockMeterConsumptionDTOJSON = JSON.parse(JSON.stringify(mockMeterConsumptionDTO));

// --- Test Cases ---

// 1. Get Meters List
export const testCasesGetMetersList = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: [mockMeterPartialDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meterRepo: {
        getMetersList: jest.fn(() => Promise.resolve([[mockMeterEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode,
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        getMetersList: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 2. Get Meter
export const testCasesGetMeter = [
  {
    description: "Success",
    id: "123456789012345678",
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockMeterDTOJSON,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(mockMeterEntity)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: "999",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.GET_METER.METER_NOT_FOUND.errorCode,
    expected_data: METER_ERRORS.GET_METER.METER_NOT_FOUND.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: "123",
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode,
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 3. Get Meter Consumptions
export const testCasesGetMeterConsumptions = [
  {
    description: "Success",
    id: mockMeterEntity.EAN,
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockMeterConsumptionDTOJSON,
    mocks: {
      meterRepo: {
        getMeterConsumptions: jest.fn(() => Promise.resolve(mockConsumptions)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: "123",
    query: {},
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode,
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        getMeterConsumptions: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 4. Download Meter Consumptions
export const testCasesDownloadMeterConsumptions = [
  {
    description: "Success",
    id: "123",
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: undefined, // Buffer response
    expected_data: Buffer.from("excel-content"),
    mocks: {
      meterRepo: {
        getMeterConsumptions: jest.fn(() => Promise.resolve(mockConsumptions)),
      },
    },
  },
  {
    description: "Fail (No Consumptions Found)",
    id: "123",
    query: {},
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.DOWNLOAD_METER_CONSUMPTIONS.NO_CONSUMPTIONS.errorCode,
    expected_data: METER_ERRORS.DOWNLOAD_METER_CONSUMPTIONS.NO_CONSUMPTIONS.message,
    mocks: {
      meterRepo: {
        getMeterConsumptions: jest.fn(() => Promise.resolve([])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: "123",
    query: {},
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode,
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        getMeterConsumptions: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 5. Add Meter
export const testCasesAddMeter = [
  {
    description: "Success",
    body: {
      EAN: "123",
      meter_number: "M1",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: { street: "S", number: "1", city: "C", postcode: "1000" },
      initial_data: {
        start_date: "2024-01-01T00:00:00.000Z",
        status: MeterDataStatus.ACTIVE,
        rate: MeterRate.SIMPLE,
        client_type: ClientType.RESIDENTIAL,
      },
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(null)),
        createMeter: jest.fn(() => Promise.resolve(mockMeterEntity)),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (Duplicate EAN)",
    body: {
      EAN: "123",
      meter_number: "M1",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: { street: "S", number: "1", city: "C", postcode: "1000" },
      initial_data: {
        start_date: "2024-01-01T00:00:00.000Z",
        status: MeterDataStatus.ACTIVE,
        rate: MeterRate.SIMPLE,
        client_type: ClientType.RESIDENTIAL,
      },
    },
    status_code: 409,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.ADD_METER.ALREADY_EXIST.errorCode,
    expected_data: METER_ERRORS.ADD_METER.ALREADY_EXIST.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(mockMeterEntity)), // Exists
      },
    },
  },
  {
    description: "Fail (DB Error)",
    body: {
      EAN: "123",
      meter_number: "M1",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: { street: "S", number: "1", city: "C", postcode: "1000" },
      initial_data: {
        start_date: "2024-01-01T00:00:00.000Z",
        status: MeterDataStatus.ACTIVE,
        rate: MeterRate.SIMPLE,
        client_type: ClientType.RESIDENTIAL,
      },
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.ADD_METER.DATABASE_ADD.errorCode,
    expected_data: METER_ERRORS.ADD_METER.DATABASE_ADD.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(null)),
        createMeter: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
    },
  },
];

// 6. Patch Meter Data
export const testCasesPatchMeterData = [
  {
    description: "Success",
    body: {
      EAN: "123",
      start_date: "2024-02-01T00:00:00.000Z",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(mockMeterEntity)),
        addMeterData: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    body: {
      EAN: "999",
      start_date: "2024-02-01T00:00:00.000Z",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.PATCH_METER_DATA.METER_NOT_FOUND.errorCode,
    expected_data: METER_ERRORS.PATCH_METER_DATA.METER_NOT_FOUND.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (fail database)",
    body: {
      EAN: "123",
      start_date: "2024-02-01T00:00:00.000Z",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE.errorCode,
    expected_data: METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(mockMeterEntity)),
        addMeterData: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
    },
  },
  {
    description: "Fail (fail database - app error throws from repository)",
    body: {
      EAN: "123",
      start_date: "2024-02-01T00:00:00.000Z",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.ADD_METER_DATA.CONFLICT_CONFIG_ALREADY_EXISTING.errorCode,
    expected_data: METER_ERRORS.ADD_METER_DATA.CONFLICT_CONFIG_ALREADY_EXISTING.message,
    mocks: {
      meterRepo: {
        getMeter: jest.fn(() => Promise.resolve(mockMeterEntity)),
        addMeterData: jest.fn(() => Promise.reject(new AppError(METER_ERRORS.ADD_METER_DATA.CONFLICT_CONFIG_ALREADY_EXISTING, 400))),
      },
    },
  },
];

// 7. Delete Meter
export const testCasesDeleteMeter = [
  {
    description: "Success",
    id: "123",
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meterRepo: {
        deleteMeter: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "Fail (Not Found/Affected != 1)",
    id: "123",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.DELETE_METER.DATABASE_DELETE.errorCode,
    expected_data: METER_ERRORS.DELETE_METER.DATABASE_DELETE.message,
    mocks: {
      meterRepo: {
        deleteMeter: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: "123",
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode,
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        deleteMeter: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
    },
  },
];
const mockMeterDataEntity = {
  id_meter_data: 1,
  start_date: "2024-02-01T00:00:00.000Z",
  end_date: "2024-03-01T00:00:00.000Z",
  meter: {
    EAN: "123456789",
  },
};
export const testCasesDeleteMeterData = [
  // 1. Success - Simple Delete
  {
    description: "Success - Delete without activating previous",
    body: {
      id_meter_data: 123,
      active_previous_meter_data: false,
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.resolve(mockMeterDataEntity)),
        deleteMeterData: jest.fn(() => Promise.resolve(true)),
      },
    },
  },
  // 2. Success - Delete and Activate Previous
  {
    description: "Success - Delete and activate previous",
    body: {
      id_meter_data: 123,
      active_previous_meter_data: true,
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.resolve(mockMeterDataEntity)),
        deleteMeterData: jest.fn(() => Promise.resolve(true)),
        activePreviousInactiveMeterData: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  // 3. Validation - Missing ID
  {
    description: "Fail (Validation) - Missing ID",
    body: {
      active_previous_meter_data: true,
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    translation_field: { field: "id_meter_data" },
    expected_error_code: METER_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
    // Note: exact data match for validation often depends on middleware, keeping generic here
    expected_data: METER_ERRORS.GENERIC_VALIDATION.EMPTY.message,
    mocks: {},
  },
  // 4. Validation - Wrong Type
  {
    description: "Fail (Validation) - ID Wrong Type",
    body: {
      id_meter_data: "not-a-number",
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    translation_field: { field: "id_meter_data" },
    expected_error_code: METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER.errorCode,
    expected_data: METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.NUMBER.message,
    mocks: {},
  },
  // 5. Fail - Meter Data Not Found
  {
    description: "Fail (Not Found) - Meter data does not exist",
    body: {
      id_meter_data: 999,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.DELETE_METER_DATA.NOT_FOUND.errorCode,
    expected_data: METER_ERRORS.DELETE_METER_DATA.NOT_FOUND.message,
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  // 6. Fail - Database Delete Error
  {
    description: "Fail (Database) - Delete operation failed",
    body: {
      id_meter_data: 123,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.DELETE_METER_DATA.DELETE_DATABASE.errorCode,
    expected_data: METER_ERRORS.DELETE_METER_DATA.DELETE_DATABASE.message,
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.resolve(mockMeterDataEntity)),
        deleteMeterData: jest.fn(() => Promise.resolve(false)), // Simulate delete failure
      },
    },
  },
  // 7. Fail - Update Previous Data Error
  {
    description: "Fail (Database) - Update previous data failed",
    body: {
      id_meter_data: 123,
      active_previous_meter_data: true,
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.DELETE_METER_DATA.UPDATE_DATABASE.errorCode,
    expected_data: METER_ERRORS.DELETE_METER_DATA.UPDATE_DATABASE.message,
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.resolve(mockMeterDataEntity)),
        deleteMeterData: jest.fn(() => Promise.resolve(true)),
        // affected is 0, triggering the error
        activePreviousInactiveMeterData: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  // 8. Fail - Repository Throws Unexpected Error
  {
    description: "Fail (Database) - Repository throws exception",
    body: {
      id_meter_data: 123,
    },
    status_code: 500, // Assuming default global handler maps unknown errors to 500
    orgs: ORGS_ADMIN,
    expected_error_code: METER_ERRORS.EXCEPTION.errorCode, // Or whatever your global handler returns
    expected_data: METER_ERRORS.EXCEPTION.message,
    mocks: {
      meterRepo: {
        getMeterData: jest.fn(() => Promise.reject(new Error("DB Connection Lost"))),
      },
    },
  },
];
