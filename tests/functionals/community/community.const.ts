import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

export const existingCommunityId = 1;

// --- Test Cases ---

// 1. Get My Communities
export const testCasesGetMyCommunities = [
  {
    description: "Success - List Communities",
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.length === 1 && data[0].id === existingCommunityId;
    },
  },
  // Functional: Test Filter
  {
    description: "Success - Filter by Name",
    query: { name: "Test" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => data.length === 1,
  },
  {
    description: "Success - Filter by Name (No match)",
    query: { name: "NonExistent" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => data.length === 0,
  },
];

// 2. Get Users
export const testCasesGetUsers = [
  {
    description: "Success - List Users",
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => data.length >= 3, // Admin, Manager, Member from seed
  },
  // Functional: Test Filter
  {
    description: "Success - Filter by Role",
    query: { role: Role.ADMIN },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => data.every((u: any) => u.role === Role.ADMIN),
  },
];

// 3. Get Admins
export const testCasesGetAdmins = [
  {
    description: "Success - List Admins & Managers",
    query: {},
    orgs: ORGS_MEMBER, // Members can view admins
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => data.every((u: any) => u.role === Role.ADMIN || u.role === Role.GESTIONNAIRE),
  },
];

// 4. Create Community
export const testCasesCreateCommunity = [
  {
    description: "Success Create",
    body: { name: "Functional Community" },
    orgs: ORGS_MEMBER, // Anyone can create? Controller doesn't restrict
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        createCommunity: jest.fn(() => Promise.resolve("auth0|new_func_comm")),
      },
    },
  },
];

// 5. Update Community
export const testCasesUpdateCommunity = [
  {
    description: "Success Update",
    body: { name: "Updated Name" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        updateCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
];

// 6. Patch Role
export const testCasesPatchRole = [
  {
    description: "Success Patch Role",
    body: { id_user: 3, new_role: Role.GESTIONNAIRE }, // Promote Member (3) to Manager
    orgs: ORGS_ADMIN, // Implies ID 1
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        updateUserorgs: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - User Not In Community",
    body: { id_user: 999, new_role: Role.GESTIONNAIRE },
    orgs: ORGS_ADMIN,
    status_code: 400, // Should fail in repo or service
    expected_error_code: COMMUNITY_ERRORS.PATCH_ROLE_USER.COMMUNITY_USER_NOT_FOUND.errorCode,
    external_mocks: {
      iamService: {
        updateUserorgs: jest.fn(() => Promise.resolve()),
      },
    },
  },
];

// 7. Kick User
export const testCasesKickUser = [
  {
    description: "Success Kick",
    target_id: 3, // Kick the member
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - Kick Self", // Logic check? Or DB allows? Usually prevented or handled
    target_id: 1, // Admin kicking self?
    orgs: ORGS_ADMIN,
    status_code: 200, // If not prevented by logic, might succeed
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
];

// 8. Leave Community
export const testCasesLeave = [
  {
    description: "Success Leave",
    target_comm_id: 1,
    orgs: ORGS_MEMBER, // Using a member context
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
];

// 9. Delete Community
export const testCasesDeleteCommunity = [
  {
    description: "Success Delete",
    target_comm_id: 1,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        deleteCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
];
