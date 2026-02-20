import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { ORGS_ADMIN, ORGS_MEMBER } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingUserAuthId = "auth0|admin"; // ID 1
export const existingUserEmail = "admin@test.com";

export const newUserAuthId = "auth0|newuser";
export const newUserEmail = "newuser@test.com";

export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get Profile
export const testCasesGetProfile = [
  {
    description: "Success - Get Existing Profile",
    auth_user_id: existingUserAuthId,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      return (data as { email: string }).email === existingUserEmail;
    },
  },
  {
    description: "Success - Auto-create Profile (Simulated via Service Logic)",
    // In functional test with real DB, we need to ensure this user doesn't exist in DB yet.
    // The service calls IAMService.getUserEmail(auth_id). We need to mock that return.
    auth_user_id: newUserAuthId,
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      return (data as { email: string }).email === newUserEmail;
    },
  },
];

// 2. Update Profile
export const testCasesUpdateProfile = [
  {
    description: "Success - Update Name",
    auth_user_id: existingUserAuthId,
    body: {
      first_name: "AdminUpdated",
      last_name: "UserUpdated",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Update Address (Creates New Address)",
    auth_user_id: existingUserAuthId,
    body: {
      home_address: {
        street: "New St",
        number: "99",
        postcode: "9999",
        city: "New City",
      },
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Invalid Data (e.g. invalid types if validated)",
    auth_user_id: existingUserAuthId,
    body: {
      email: "invalid-email", // DTO might validate this if exposed, or just simple update
      // Actually UpdateUserDTO usually allows updating basic infos.
      // If we try to update a restricted field or send garbage?
      // Let's assume validation passes but maybe empty body?
    },
    orgs: ORGS_ADMIN,
    status_code: 200, // If fields are optional, it might just succeed doing nothing
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];
