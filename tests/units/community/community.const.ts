import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { Community, CommunityUser } from "../../../src/modules/communities/domain/community.models.js";
import { toMyCommunityDTO, toUsersCommunityDTO } from "../../../src/modules/communities/shared/to_dto.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

// --- Mock Data ---

export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockCommunityEntity: Community = {
  id: 100,
  name: "Developers Community",
  auth_community_id: "auth0|org_123",
  created_at: mockDate,
  updated_at: mockDate,
  users: [],
};

export const mockUserEntity = {
  id: 1,
  auth_user_id: "auth0|user_123",
  email: "test@test.com",
  memberships: [],
} as any;

export const mockCommunityUserEntity: CommunityUser = {
  id_community: 100,
  id_user: 1,
  role: Role.GESTIONNAIRE,
  community: mockCommunityEntity,
  user: mockUserEntity,
};

export const mockMyCommunityDTO = toMyCommunityDTO(mockCommunityUserEntity);
export const mockUsersCommunityDTO = toUsersCommunityDTO(mockCommunityUserEntity);

// JSON compatible versions
export const mockMyCommunityDTOJSON = JSON.parse(JSON.stringify(mockMyCommunityDTO));
export const mockUsersCommunityDTOJSON = JSON.parse(JSON.stringify(mockUsersCommunityDTO));

// --- Test Cases Data ---

export const testCasesGetMyCommunities = [
  {
    description: "Success",
    id_user: 1,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockMyCommunityDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      communityRepo: {
        getMyCommunities: jest.fn(() => Promise.resolve([[mockCommunityUserEntity], 1])),
      },
    },
  },
  {
    description: "Success (Empty)",
    id_user: 1,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [],
    expected_pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    mocks: {
      communityRepo: {
        getMyCommunities: jest.fn(() => Promise.resolve([[], 0])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    query: {},
    status_code: 500,
    expected_error_code: COMMUNITY_ERRORS.EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.EXCEPTION.message,
    mocks: {
      communityRepo: {
        getMyCommunities: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesGetUsers = [
  {
    description: "Success (Gestionnaire)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUsersCommunityDTOJSON],
    mocks: {
      communityRepo: {
        getUsers: jest.fn(() => Promise.resolve([[mockCommunityUserEntity], 1])),
      },
    },
  },
  {
    description: "Fail (Role Member - Unauthorized)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 403,
    expected_error_code: COMMUNITY_ERRORS.UNAUTHORIZED.errorCode,
    expected_data: COMMUNITY_ERRORS.UNAUTHORIZED.message,
    mocks: {}, // Middleware blocks before service
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 500,
    expected_error_code: COMMUNITY_ERRORS.EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.EXCEPTION.message,
    mocks: {
      communityRepo: {
        getUsers: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesGetAdmins = [
  {
    description: "Success",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUsersCommunityDTOJSON],
    mocks: {
      communityRepo: {
        getAdmins: jest.fn(() => Promise.resolve([[mockCommunityUserEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 500,
    expected_error_code: COMMUNITY_ERRORS.EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.EXCEPTION.message,
    mocks: {
      communityRepo: {
        getAdmins: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesCreateCommunity = [
  {
    description: "Success Create",
    id_user: 1,
    orgs: ORGS_MEMBER,
    query: { name: "New Community" },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      iamService: {
        createCommunity: jest.fn(() => Promise.resolve("new_auth_id")),
        addUserCommunity: jest.fn(() => Promise.resolve("new_auth_id")),
      },
      communityRepo: {
        addCommunity: jest.fn(() => Promise.resolve({ id: 1, name: "New Community" })),
        addUserCommunity: jest.fn(() => Promise.resolve("new_auth_id")),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
  {
    description: "Invalid DTO (name empty)",
    id_user: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 422,
    expected_error_code: COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
    expected_data: COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY.message,
    translation_field: { field: "name" },
    mocks: {
      iamService: {
        createCommunity: jest.fn(() => Promise.resolve("new_auth_id")),
      },
      communityRepo: {
        createCommunity: jest.fn(() => Promise.resolve({ id: 1, name: "New Community" })),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
  {
    description: "Fail (IAM Error)",
    id_user: 1,
    query: { name: "Fail Community" },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.ADD_COMMUNITY.IAM_ERROR_CREATE.errorCode,
    expected_data: COMMUNITY_ERRORS.ADD_COMMUNITY.IAM_ERROR_CREATE.message,
    mocks: {
      iamService: {
        createCommunity: jest.fn(() => Promise.reject(new Error("IAM Fail"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    query: { name: "Fail Community" },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.ADD_COMMUNITY.DATABASE_SAVE_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.ADD_COMMUNITY.DATABASE_SAVE_EXCEPTION.message,
    mocks: {
      iamService: {
        createCommunity: jest.fn(() => Promise.resolve("new_auth_id")),
      },
      communityRepo: {
        addCommunity: jest.fn(() => Promise.reject(new Error("DB Fail"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
];

export const testCasesUpdateCommunity = [
  {
    description: "Success Update",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { name: "Updated Name" },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        updateCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        updateCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (name empty)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 422,
    expected_error_code: COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
    expected_data: COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY.message,
    translation_field: { field: "name" },
    mocks: {
      communityRepo: {
        updateCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        updateCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (DB Update Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { name: "Updated Name" },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_COMMUNITY.DATABASE_UPDATE_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_COMMUNITY.DATABASE_UPDATE_EXCEPTION.message,
    mocks: {
      communityRepo: {
        updateCommunity: jest.fn(() => Promise.reject(new Error("DB Fail"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (Community not existing)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { name: "Updated Name" },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_COMMUNITY.COMMUNITY_NOT_FOUND.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_COMMUNITY.COMMUNITY_NOT_FOUND.message,
    mocks: {
      communityRepo: {
        updateCommunity: jest.fn(() => Promise.reject(new AppError(COMMUNITY_ERRORS.UPDATE_COMMUNITY.COMMUNITY_NOT_FOUND, 400))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (IAM Update Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { name: "Updated Name" },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_COMMUNITY.IAM_ERROR_UPDATE.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_COMMUNITY.IAM_ERROR_UPDATE.message,
    mocks: {
      communityRepo: {
        updateCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        updateCommunity: jest.fn(() => Promise.reject(new Error("IAM Fail"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
];

export const testCasesPatchRole = [
  {
    description: "Success Patch Role",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        patchRoleUser: jest.fn(() => Promise.resolve({ ...mockCommunityUserEntity, role: Role.ADMIN })),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Repo Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_USER_ROLE.DATABASE_PATCH_ROLE_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_USER_ROLE.DATABASE_PATCH_ROLE_EXCEPTION.message,
    mocks: {
      communityRepo: {
        patchRoleUser: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (IAM Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_USER_ROLE.IAM_UPDATE_USER_ROLE.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_USER_ROLE.IAM_UPDATE_USER_ROLE.message,
    mocks: {
      communityRepo: {
        patchRoleUser: jest.fn(() => Promise.resolve({ ...mockCommunityUserEntity, role: Role.ADMIN })),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Success Promote to Admin (Downgrade Self)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        patchRoleUser: jest.fn(() => Promise.resolve({ ...mockCommunityUserEntity, role: Role.ADMIN })),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Downgrade Repo Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_USER_ROLE.DATABASE_PATCH_ROLE_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_USER_ROLE.DATABASE_PATCH_ROLE_EXCEPTION.message,
    mocks: {
      communityRepo: {
        patchRoleUser: jest
          .fn()
          .mockImplementationOnce(() => Promise.resolve({ ...mockCommunityUserEntity, role: Role.ADMIN }))
          .mockImplementationOnce(() => Promise.reject(new Error("DB Error - Downgrade"))),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Downgrade IAM Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    query: { id_user: 2, new_role: Role.ADMIN },
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.UPDATE_USER_ROLE.IAM_UPDATE_USER_ROLE.errorCode,
    expected_data: COMMUNITY_ERRORS.UPDATE_USER_ROLE.IAM_UPDATE_USER_ROLE.message,
    mocks: {
      communityRepo: {
        patchRoleUser: jest.fn(() => Promise.resolve({ ...mockCommunityUserEntity, role: Role.ADMIN })), // Target & Self success
      },
      iamService: {
        updateUserRole: jest
          .fn()
          .mockImplementationOnce(() => Promise.resolve()) // Target User
          .mockImplementationOnce(() => Promise.reject(new Error("IAM Error - Downgrade"))), // Self User
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
];

export const testCasesKick = [
  {
    description: "Success Kick User",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_ADMIN,
    target_user_id: 2,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.resolve(mockCommunityUserEntity)),
      },
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (Role GESTIONNAIRE - Insufficient)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    target_user_id: 2,
    status_code: 403,
    expected_error_code: COMMUNITY_ERRORS.UNAUTHORIZED.errorCode,
    expected_data: COMMUNITY_ERRORS.UNAUTHORIZED.message,
    mocks: {},
  },
  {
    description: "Fail (Repo Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_ADMIN,
    target_user_id: 2,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.DATABASE_DELETE_USER_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.DATABASE_DELETE_USER_EXCEPTION.message,
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
  {
    description: "Fail (IAM Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_ADMIN,
    target_user_id: 2,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.IAM_DELETE_USER_FROM_COMMUNITY.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.IAM_DELETE_USER_FROM_COMMUNITY.message,
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.resolve(mockCommunityUserEntity)),
      },
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(100)),
      },
    },
  },
];

export const testCasesLeave = [
  {
    description: "Success Leave",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.resolve(mockCommunityUserEntity)),
      },
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Repo Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.DATABASE_DELETE_USER_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.DATABASE_DELETE_USER_EXCEPTION.message,
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (IAM Error)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.IAM_DELETE_USER_FROM_COMMUNITY.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.IAM_DELETE_USER_FROM_COMMUNITY.message,
    mocks: {
      communityRepo: {
        deleteUserCommunity: jest.fn(() => Promise.resolve(mockCommunityUserEntity)),
      },
      iamService: {
        deleteUserFromCommunity: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
];

export const testCasesDeleteCommunity = [
  {
    description: "Success Delete Community",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      communityRepo: {
        deleteCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        deleteCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Missmatch community id)",
    id_user: 1,
    id_community: 100,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_COMMUNITY.MISMATCH_ID.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_COMMUNITY.MISMATCH_ID.message,
    mocks: {
      communityRepo: {
        deleteCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        deleteCommunity: jest.fn(() => Promise.resolve()),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Repo Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_COMMUNITY.DATABASE_DELETE_EXCEPTION.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_COMMUNITY.DATABASE_DELETE_EXCEPTION.message,
    mocks: {
      communityRepo: {
        deleteCommunity: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (Community not found)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_COMMUNITY.COMMUNITY_NOT_FOUND.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_COMMUNITY.COMMUNITY_NOT_FOUND.message,
    mocks: {
      communityRepo: {
        deleteCommunity: jest.fn(() => Promise.reject(new AppError(COMMUNITY_ERRORS.DELETE_COMMUNITY.COMMUNITY_NOT_FOUND, 400))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
  {
    description: "Fail (IAM Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: COMMUNITY_ERRORS.DELETE_COMMUNITY.IAM_DELETE_COMMUNITY.errorCode,
    expected_data: COMMUNITY_ERRORS.DELETE_COMMUNITY.IAM_DELETE_COMMUNITY.message,
    mocks: {
      communityRepo: {
        deleteCommunity: jest.fn(() => Promise.resolve(mockCommunityEntity)),
      },
      iamService: {
        deleteCommunity: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
      authContext: {
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
    },
  },
];
