import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import {METER_ERRORS} from "../../../src/modules/meters/shared/meter.errors.js";
import {
    ClientType,
    MeterDataStatus,
    MeterRate,
    ReadingFrequency, TarifGroup
} from "../../../src/modules/meters/shared/meter.types.js";
import {ORGS_ADMIN, ORGS_GESTIONNAIRE} from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingEAN = "123456789012345678";
export const existingEAN2 = "987654321098765432";
export const existingMemberId = 1;
export const existingCommunityId = 1;

export const newEAN = "999999999999999999"; // Distinct EAN for creation test

export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get Meters List
export const testCasesGetMetersList = [
    {
        description: "Success - List Meters",
        query: {},
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.length >= 2 && data.some((m: any) => m.EAN === existingEAN);
        }
    },
    {
        description: "Success - Filter by EAN",
        query: { EAN: "12345" }, // Partial match
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.length === 1 && data[0].EAN === existingEAN;
        }
    }
];

// 2. Get Meter Detail
export const testCasesGetMeter = [
    {
        description: "Success - Get Meter",
        ean: existingEAN,
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return (data.EAN === existingEAN && data.meter_data !== undefined);
        }
    },
    {
        description: "Fail - Not Found",
        ean: "000000000000000000",
        orgs: ORGS_GESTIONNAIRE,
        expected_error_code: METER_ERRORS.GET_METER.METER_NOT_FOUND.errorCode,
        status_code: 400 // Assuming usage of AppError(EXCEPTION, 400) like others
    }
];

// 3. Get Consumptions
export const testCasesGetConsumptions = [
    {
        description: "Success - List Consumptions",
        ean: existingEAN,
        query: {},
        orgs: ORGS_GESTIONNAIRE,
        status_code: 200,
        expected_error_code: SUCCESS,
        check_data: (data: any) => {
            return data.EAN === existingEAN && data.timestamps.length === 1 ; // init.sql has 1 row
        }
    }
];

// 4. Add Meter
export const testCasesAddMeter = [
    {
        description: "Success - Create New Meter",
        body: {
            EAN: newEAN,
            meter_number: "M999",
            phases_number: 1,
            tarif_group: TarifGroup.LOW_TENSION,
            reading_frequency: ReadingFrequency.MONTHLY,
            address: { street: "New St", number: 1, postcode: "1000", city: "Bruxelles" },
            initial_data: {
                start_date: "2024-06-01T00:00:00.000Z",
                status: MeterDataStatus.ACTIVE,
                rate: MeterRate.SIMPLE,
                client_type: ClientType.RESIDENTIAL
            }
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    },
    {
        description: "Fail - Duplicate EAN",
        body: {
            EAN: existingEAN, // Already exists
            meter_number: "M999",
            phases_number: 1,
            tarif_group: TarifGroup.LOW_TENSION,
            reading_frequency: ReadingFrequency.MONTHLY,
            address: { street: "New St", number: 1, postcode: "1000", city: "Bruxelles" },
            initial_data: {
                start_date: "2024-06-01T00:00:00.000Z",
                status: MeterDataStatus.ACTIVE,
                rate: MeterRate.SIMPLE,
                client_type: ClientType.RESIDENTIAL
            }
        },
        orgs: ORGS_ADMIN,
        status_code: 409, // Service likely checks uniqueness or catches duplicate key error
        expected_error_code: METER_ERRORS.ADD_METER.ALREADY_EXIST.errorCode
    }
];

// 5. Patch Meter Data (History)
export const testCasesPatchMeterData = [
    {
        description: "Success - Add New Configuration",
        body: {
            EAN: existingEAN,
            start_date: "2025-01-01T00:00:00.000Z", // Future date relative to seeded '2024-01-01'
            status: MeterDataStatus.INACTIVE, // Changing status
            rate: MeterRate.SIMPLE,
            client_type: ClientType.RESIDENTIAL
        },
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    }
];

// 6. Delete Meter
export const testCasesDeleteMeter = [
    {
        description: "Success - Delete Meter",
        ean: existingEAN, // Delete the one we created
        orgs: ORGS_ADMIN,
        status_code: 200,
        expected_error_code: SUCCESS,
        expected_data: "success"
    },
    {
        description: "Fail - Not Found / Already Deleted",
        ean: newEAN,
        orgs: ORGS_ADMIN,
        status_code: 400,
        expected_error_code: METER_ERRORS.DELETE_METER.DATABASE_DELETE.errorCode
    }
];
