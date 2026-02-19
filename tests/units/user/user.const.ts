import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { User } from "../../../src/modules/users/domain/user.models.js";
import { toUserDTO } from "../../../src/modules/users/shared/to_dto.js";
import { USER_ERRORS } from "../../../src/modules/users/shared/user.errors.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";

// --- Mock Data ---
export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockUserEntity: User = {
  id: 1,
  email: "test@test.com",
  firstName: "John",
  lastName: "Doe",
  NRN: "123",
  phoneNumber: "000000",
  iban: "BE123",
  auth_user_id: "auth|123",
  homeAddress: {
    id: 1,
    street: "Home St",
    number: "1",
    city: "City",
    postcode: "1000",
    created_at: mockDate,
    updated_at: mockDate,
  } as any,
  billingAddress: {
    id: 2,
    street: "Billing St",
    number: "2",
    city: "City",
    postcode: "1000",
    created_at: mockDate,
    updated_at: mockDate,
  } as any,
  created_at: mockDate,
  updated_at: mockDate,
  memberships: [],
};

export const mockUserDTO = toUserDTO(mockUserEntity);
export const mockUserDTOJSON = JSON.parse(JSON.stringify(mockUserDTO));

// --- Test Cases ---

// 1. Get Profile
export const testCasesGetProfile = [
  {
    description: "Success (Existing User)",
    id_user: "1",
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockUserDTOJSON,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(mockUserEntity)),
      },
    },
  },
  {
    description: "Success (Auto-create User)",
    id_user: "2",
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockUserDTOJSON,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
        createUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateInvitation: jest.fn(() => Promise.resolve({})),
      },
      iamService: {
        getUserEmail: jest.fn(() => Promise.resolve("test@test.com")),
      },
    },
  },
  {
    description: "Fail (User Not Found in IAM)",
    id_user: "3",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.GET_PROFILE.USER_NOT_FOUND.errorCode,
    expected_data: USER_ERRORS.GET_PROFILE.USER_NOT_FOUND.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
      },
      iamService: {
        getUserEmail: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (Creation Failed)",
    id_user: "4",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.GET_PROFILE.DATABASE_ADD.errorCode,
    expected_data: USER_ERRORS.GET_PROFILE.DATABASE_ADD.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
        createUser: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
      iamService: {
        getUserEmail: jest.fn(() => Promise.resolve("test@test.com")),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id_user: "1",
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.EXCEPTION.errorCode,
    expected_data: USER_ERRORS.EXCEPTION.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "Fail (DB fail add invitation)",
    id_user: "2",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.GET_PROFILE.DATABASE_ADD.errorCode,
    expected_data: USER_ERRORS.GET_PROFILE.DATABASE_ADD.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
        createUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateInvitations: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      iamService: {
        getUserEmail: jest.fn(() => Promise.resolve("test@test.com")),
      },
    },
  },
  {
    description: "Fail (DB fail add invitation and throw exception)",
    id_user: "2",
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.UPDATE_INVITATION.INVITATION_NOT_UPDATED.errorCode,
    expected_data: USER_ERRORS.UPDATE_INVITATION.INVITATION_NOT_UPDATED.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
        createUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateInvitations: jest.fn(() => Promise.reject(new AppError(USER_ERRORS.UPDATE_INVITATION.INVITATION_NOT_UPDATED, 400))),
      },
      iamService: {
        getUserEmail: jest.fn(() => Promise.resolve("test@test.com")),
      },
    },
  },
];

// 2. Update Profile
export const testCasesUpdateProfile = [
  {
    description: "Success (Simple Update)",
    body: { first_name: "Jane", last_name: "Doe" },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateUser: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "Success (Update Address)",
    body: {
      home_address: { street: "New St", number: "10", city: "New City", postcode: "2000" },
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateUser: jest.fn(() => Promise.resolve({})),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 10 })),
      },
    },
  },
  {
    description: "Fail (User Not Found)",
    body: { first_name: "Jane" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.UPDATE_PROFILE.USER_NOT_FOUND.errorCode,
    expected_data: USER_ERRORS.UPDATE_PROFILE.USER_NOT_FOUND.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error Update)",
    body: { first_name: "Jane" },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: USER_ERRORS.UPDATE_PROFILE.DATABASE_UPDATE.errorCode,
    expected_data: USER_ERRORS.UPDATE_PROFILE.DATABASE_UPDATE.message,
    mocks: {
      userRepo: {
        getUser: jest.fn(() => Promise.resolve(mockUserEntity)),
        updateUser: jest.fn(() => Promise.reject(new Error("Fail"))),
      },
    },
  },
];
