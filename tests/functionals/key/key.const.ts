import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { KEY_ERRORS } from "../../../src/modules/keys/shared/key.errors.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingKeyId = 1;
export const existingKeyId2 = 2; // For delete/update tests without affecting the first one if needed
export const notExistingKeyId2 = 99; // For delete/update tests without affecting the first one if needed
export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get Keys List
export const testCasesGetKeysList = [
  {
    description: "Success - List Keys",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.length >= 2 && data.some((k: any) => k.id === existingKeyId);
    },
  },
  {
    description: "Success - Filter by Name",
    query: { name: "Key 1" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.length === 1 && data[0].name === "Key 1";
    },
  },
];

// 2. Get Key / Download
export const testCasesGetKey = [
  {
    description: "Success - Get Key Detail",
    key_id: existingKeyId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.id === existingKeyId && data.iterations.length > 0;
    },
  },
  {
    description: "Fail - Not Found",
    key_id: 999,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: KEY_ERRORS.GET_KEY.KEY_NOT_FOUND.errorCode,
  },
];

// 3. Add Key
export const testCasesAddKey = [
  {
    description: "Success - Add Key with Children",
    body: {
      name: "Functional Key",
      description: "Created by Test",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1.0,
          consumers: [
            { name: "C1", energy_allocated_percentage: 0.5 },
            { name: "C2", energy_allocated_percentage: 0.5 },
          ],
        },
      ],
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Validation Error (Sum != 1)",
    body: {
      name: "Invalid Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 0.7,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    orgs: ORGS_ADMIN,
    status_code: 422,
    expected_error_code: KEY_ERRORS.VALIDATION.CREATE_KEY.ITERATION_SUM_1.errorCode,
  },
];

// 4. Update Key
export const testCasesUpdateKey = [
  {
    description: "Success - Update Key (Replace Iterations)",
    body: {
      id: existingKeyId2, // Using key 2 to avoid messing up key 1
      name: "Updated Key 2",
      description: "Updated Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1.0,
          consumers: [{ name: "OnlyConsumer", energy_allocated_percentage: 1.0 }],
        },
      ],
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Key Not Found",
    body: {
      id: 999,
      name: "Ghost Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1.0,
          consumers: [{ name: "OnlyConsumer", energy_allocated_percentage: 1.0 }],
        },
      ],
    },
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: KEY_ERRORS.UPDATE_KEY.KEY_NOT_FOUND.errorCode,
  },
];

// 5. Delete Key
export const testCasesDeleteKey = [
  {
    description: "Success - Delete Key",
    key_id: existingKeyId2, // Delete Key 2 (which we updated)
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Not Found / Already Deleted",
    key_id: notExistingKeyId2,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: KEY_ERRORS.DELETE_KEY.DATABASE_DELETE.errorCode,
  },
];
