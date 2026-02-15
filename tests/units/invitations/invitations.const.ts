import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { GestionnaireInvitation, UserMemberInvitation } from "../../../src/modules/invitations/domain/invitation.models.js";
import { UserMemberInvitationDTO, UserManagerInvitationDTO } from "../../../src/modules/invitations/api/invitation.dtos.js";
import { INVITATION_ERRORS } from "../../../src/modules/invitations/shared/invitation.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { HttpMethod, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import {mockIndividualEntity, mockMemberDTOJSON} from "../member/member.const.js";

// --- Mock Data ---

export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockUserMemberInvitation: UserMemberInvitation = {
  id: 1,
  member: { id: 1, name: "John Doe" } as any,
  memberName: "John Doe",
  userEmail: "john@example.com",
  user: { id: 10, email: "john@example.com" } as any,
  toBeEncoded: false,
  community: { id: 1, name: "Community A", auth_community_id: "org1" } as any,
  created_at: mockDate,
  updated_at: mockDate,
};

export const mockUserManagerInvitation: GestionnaireInvitation = {
  id: 2,
  userEmail: "manager@example.com",
  user: { id: 11, email: "manager@example.com" } as any,
  community: { id: 1, name: "Community A", auth_community_id: "org1" } as any,
  created_at: mockDate,
  updated_at: mockDate,
};

// DTOs that satisfy the expected response structure
export const mockUserMemberInvitationDTO: UserMemberInvitationDTO = {
  id: 1,
  member_id: 1,
  member_name: "John Doe",
  user_email: "john@example.com",
  created_at: mockDate,
  to_be_encoded: false,
  community: { id: 1, name: "Community A" } as any,
};

export const mockUserManagerInvitationDTO: UserManagerInvitationDTO = {
  id: 2,
  user_email: "manager@example.com",
  created_at: mockDate,
  community: { id: 1, name: "Community A" } as any,
};

const mockUserMemberInvitationDTOJSON = JSON.parse(JSON.stringify(mockUserMemberInvitationDTO));
const mockUserManagerInvitationDTOJSON = JSON.parse(JSON.stringify(mockUserManagerInvitationDTO));

// --- Test Cases Data ---
// Example:

export const testCasesGetPendingMembers = [
  {
    description: "GET /invitations (Members) Success",
    endpoint: "/invitations",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserMemberInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      invitationRepo: {
        getMembersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserMemberInvitation], 1])),
      },
    },
  },
  {
    description: "GET /invitations (Members) DB Error",
    endpoint: "/invitations",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getMembersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "Fail (Unauthorized) - Manager trying to access invites without role",
    endpoint: "/invitations",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 403,
    expected_error_code: INVITATION_ERRORS.UNAUTHORIZED.errorCode,
    expected_data: INVITATION_ERRORS.UNAUTHORIZED.message,
    mocks: {},
  },
  {
    description: "GET /invitations (Members) Validation Error",
    endpoint: "/invitations",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: { limit: "invalid" },
    status_code: 422,
    translation_field: { field: "limit" },
    expected_error_code: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

export const testCaseGetInvitationById = [
  {
    description: 'GET /invitations/own/member/:id Success',
    endpoint: "/invitations/own/member/",
    id_user: 1,
    id_invitation: 1,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: mockMemberDTOJSON,
    translation_field: undefined,
    mocks:{
      invitationRepo:{
        getOwnMembersPendingInvitationById: jest.fn(() => Promise.resolve(mockIndividualEntity))
      }
    }
  },
  {
    description: 'GET /invitations/own/member/:id Fail (Invitation not member)',
    endpoint: "/invitations/own/member/",
    id_user: 1,
    id_invitation: 1,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND.errorCode,
    expected_data: INVITATION_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND.message,
    translation_field: undefined,
    mocks:{
      invitationRepo:{
        getOwnMembersPendingInvitationById: jest.fn(() => Promise.resolve(null))
      }
    }
  }
]

export const testCasesGetPendingManagers = [
  {
    description: "GET /invitations/managers (Managers) Success",
    endpoint: "/invitations/managers",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserManagerInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      invitationRepo: {
        getManagersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserManagerInvitation], 1])),
      },
    },
  },
  {
    description: "GET /invitations/managers (Managers) DB Error",
    endpoint: "/invitations/managers",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: {},
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getManagersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "GET /invitations/managers (Managers) Validation Error",
    endpoint: "/invitations/managers",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    query: { page: "invalid" },
    status_code: 422,
    translation_field: { field: "page" },
    expected_error_code: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

export const testCasesGetPendingOwnMembers = [
  {
    description: "GET /invitations/own (Own Members) Success",
    endpoint: "/invitations/own",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserMemberInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      invitationRepo: {
        getOwnMembersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserMemberInvitation], 1])),
      },
    },
  },
  {
    description: "GET /invitations/own (Own Members) DB Error",
    endpoint: "/invitations/own",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getOwnMembersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "GET /invitations/own (Own Members) Validation Error",
    endpoint: "/invitations/own",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { page: "invalid" },
    status_code: 422,
    translation_field: { field: "page" },
    expected_error_code: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

export const testCasesGetPendingOwnManagers = [
  {
    description: "GET /invitations/own/managers (Own Managers) Success",
    endpoint: "/invitations/own/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserManagerInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      invitationRepo: {
        getOwnManagersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserManagerInvitation], 1])),
      },
    },
  },
  {
    description: "GET /invitations/own/managers (Own Managers) DB Error",
    endpoint: "/invitations/own/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getOwnManagersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "GET /invitations/own/managers (Own Managers) Validation Error",
    endpoint: "/invitations/own/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { limit: "invalid" },
    status_code: 422,
    translation_field: { field: "limit" },
    expected_error_code: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

export const testCasesInvite = [
  {
    description: "POST /invitations/member Success",
    endpoint: "/invitations/member",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    query: { user_email: "new@example.com" },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      userRepo: {
        getUserByEmail: jest.fn(() => Promise.resolve({ id: 99, email: "new@example.com" } as any)),
      },
      invitationRepo: {
        inviteUserToBecomeMember: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "POST /invitations/member Fail DB Error",
    endpoint: "/invitations/member",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    query: { user_email: "new@example.com" },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.INVITE_USER_TO_BECOME_MEMBER.DATABASE_SAVE.errorCode,
    expected_data: INVITATION_ERRORS.INVITE_USER_TO_BECOME_MEMBER.DATABASE_SAVE.message,
    mocks: {
      userRepo: {
        getUserByEmail: jest.fn(() => Promise.resolve(null)),
      },
      invitationRepo: {
        inviteUserToBecomeMember: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "POST /invitations/manager Success",
    endpoint: "/invitations/manager",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    query: { user_email: "new_manager@example.com" },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      userRepo: {
        getUserByEmail: jest.fn(() => Promise.resolve({ id: 100, email: "new_manager@example.com" } as any)),
      },
      invitationRepo: {
        inviteUserToBecomeManager: jest.fn(() => Promise.resolve({})),
      },
    },
  },
];

export const testCasesAcceptMember = [
  {
    description: "POST /invitations/accept Success (no user in community)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept Success (user existing)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 1 })),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (Invitation Not Found)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 999 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (User Mismatch)",
    endpoint: "/invitations/accept",
    id_user: 99, // Wrong user
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (Link Save Error)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (DB Error getCommunityUser)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.reject(new Error("DB Error"))),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (DB Error Add User)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept Fail (IAM Error)",
    endpoint: "/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
    },
  },
];

export const testCasesAcceptManager = [
  {
    description: "POST /invitations/accept/manager Success (User not existing)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Success (User existing)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 11, id_community: 1, role: Role.MEMBER })),
        patchRoleUser: jest.fn(() => Promise.resolve(null)),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (Invitation Not Found)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 999 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (User Mismatch)",
    endpoint: "/invitations/accept/manager",
    id_user: 99,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (DB Error while adding user to community)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (User existing but Admin)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 11, id_community: 1, role: Role.ADMIN })),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (User existing but Manager)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 11, id_community: 1, role: Role.GESTIONNAIRE })),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (Patch db fail)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 11, id_community: 1, role: Role.MEMBER })),
        patchRoleUser: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Fail (User not existing) (IAM AddUser fail)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve(null)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.reject(new Error("IAM Exception"))),
      },
    },
  },
  {
    description: "POST /invitations/accept/manager Success (User existing) (Fail IAM UpdateUserRole)",
    endpoint: "/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.message,
    mocks: {
      invitationRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(11)),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 11, id_community: 1, role: Role.MEMBER })),
        patchRoleUser: jest.fn(() => Promise.resolve(null)),
      },
      iamService: {
        updateUserRole: jest.fn(() => Promise.reject(new Error("IAM Exception"))),
      },
    },
  },
];

export const testCasesAcceptEncoded = [
  {
    description: "POST /invitations/accept/encoded Success (User not existing)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve({})),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Success (User existing)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve({ id: 10 })),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Invitation Not Found)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 999,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (User Mismatch)",
    endpoint: "/invitations/accept/encoded",
    id_user: 99,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Member Creation Failed)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.reject(new Error("Member Creation Failed"))),
      },
      addressRepo: {
        addAddress: jest
          .fn()
          .mockImplementationOnce(() => Promise.resolve({ id: 100 }))
          .mockImplementationOnce(() => Promise.resolve({ id: 101 })),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Member Creation Failed 2)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve(null)),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Link Save Error)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.reject(new Error("Link Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Fail db exception getUser)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 500,
    expected_error_code: INVITATION_ERRORS.EXCEPTION.errorCode,
    expected_data: INVITATION_ERRORS.EXCEPTION.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.reject(new Error("db error"))),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (Fail db exception when add user)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.resolve()),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(undefined)),
        addUserCommunity: jest.fn(() => Promise.reject(new Error("db error"))),
      },
    },
  },
  {
    description: "POST /invitations/accept/encoded Fail (IAM ADD USER)",
    endpoint: "/invitations/accept/encoded",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {
      invitation_id: 1,
      member: {
        name: "New Member",
        member_type: MemberType.INDIVIDUAL,
        status: MemberStatus.ACTIVE,
        email: "new@member.com",
        iban: "BE1234567890",
        first_name: "John",
        NRN: "123456789",
        phone_number: "123456789",
        social_rate: false,
        home_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Rue", number: 1, city: "City", postcode: "1000" },
      },
    },
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY.message,
    mocks: {
      invitationRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
        getInternalCommunityId: jest.fn(() => Promise.resolve(1)),
      },
      iamService: {
        addUserToCommunity: jest.fn(() => Promise.reject(new Error("IAM Error"))),
      },
      memberRepo: {
        saveMember: jest.fn(() => Promise.resolve({ id: 50, home_address: {}, billing_address: {} })),
        saveIndividual: jest.fn(() => Promise.resolve({ id: 50, member: { id: 50 } })),
      },
      addressRepo: {
        addAddress: jest.fn(() => Promise.resolve({ id: 100 })),
      },
      communityRepo: {
        getCommunityUser: jest.fn(() => Promise.resolve(null)),
        addUserCommunity: jest.fn(() => Promise.resolve({})),
      },
    },
  },
];

export const testCasesCancelMember = [
  {
    description: "DELETE /invitations/:id/member (Cancel Member) Success",
    endpoint: "/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        cancelMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/member Fail (Not Found/Not Affected)",
    endpoint: "/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL.errorCode,
    expected_data: INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL.message,
    mocks: {
      invitationRepo: {
        cancelMemberInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/member Fail (DB Error)",
    endpoint: "/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400, // Service catches and throws default exception 400
    expected_error_code: INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL.errorCode,
    expected_data: INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL.message,
    mocks: {
      invitationRepo: {
        cancelMemberInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesCancelManager = [
  {
    description: "DELETE /invitations/:id/manager (Cancel Manager) Success",
    endpoint: "/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        cancelManagerInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/manager Fail (Not Found/Not Affected)",
    endpoint: "/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL.errorCode,
    expected_data: INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL.message,
    mocks: {
      invitationRepo: {
        cancelManagerInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/manager Fail (DB Error)",
    endpoint: "/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 1,
    id_community: 1,
    orgs: ORGS_ADMIN,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL.errorCode,
    expected_data: INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL.message,
    mocks: {
      invitationRepo: {
        cancelManagerInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesRefuseMember = [
  {
    description: "DELETE /invitations/:id/own/member (Refuse Member) Success",
    endpoint: "/invitations/1/own/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/own/member Fail (Not Found/Not Affected)",
    endpoint: "/invitations/1/own/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      invitationRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/own/member Fail (DB Error)",
    endpoint: "/invitations/1/own/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      invitationRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesRefuseManager = [
  {
    description: "DELETE /invitations/:id/own/manager (Refuse Manager) Success",
    endpoint: "/invitations/2/own/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      invitationRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/own/manager Fail (Not Found/Not Affected)",
    endpoint: "/invitations/2/own/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      invitationRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /invitations/:id/own/manager Fail (DB Error)",
    endpoint: "/invitations/2/own/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      invitationRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];
