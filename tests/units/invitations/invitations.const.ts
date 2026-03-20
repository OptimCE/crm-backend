import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { GestionnaireInvitation, UserMemberInvitation } from "../../../src/modules/invitations/domain/invitation.models.js";
import type { UserMemberInvitationDTO, UserManagerInvitationDTO } from "../../../src/modules/invitations/api/invitation.dtos.js";
import { INVITATION_ERRORS } from "../../../src/modules/invitations/shared/invitation.errors.js";
import { type HttpMethod, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { Member } from "../../../src/modules/members/domain/member.models.js";
import type { User } from "../../../src/modules/users/domain/user.models.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";

// --- Mock Data ---

export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockUserMemberInvitation: UserMemberInvitation = {
  id: 1,
  member: { id: 1, name: "John Doe" } as Member,
  memberName: "John Doe",
  userEmail: "john@example.com",
  user: { id: 10, email: "john@example.com" } as User,
  toBeEncoded: false,
  community: { id: 1, name: "Community A", auth_community_id: "org1" } as Community,
  created_at: mockDate,
  updated_at: mockDate,
};

export const mockUserManagerInvitation: GestionnaireInvitation = {
  id: 2,
  userEmail: "manager@example.com",
  user: { id: 11, email: "manager@example.com" } as User,
  community: { id: 1, name: "Community A", auth_community_id: "org1" } as Community,
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
  community: { id: 1, name: "Community A" } as Community,
};

export const mockUserManagerInvitationDTO: UserManagerInvitationDTO = {
  id: 2,
  user_email: "manager@example.com",
  created_at: mockDate,
  community: { id: 1, name: "Community A" } as Community,
};

const mockUserMemberInvitationDTOJSON = JSON.parse(JSON.stringify(mockUserMemberInvitationDTO));
const mockUserManagerInvitationDTOJSON = JSON.parse(JSON.stringify(mockUserManagerInvitationDTO));

// --- Test Cases Data ---

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
        getUserByEmail: jest.fn(() => Promise.resolve({ id: 99, email: "new@example.com" })),
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
        getUserByEmail: jest.fn(() => Promise.resolve({ id: 100, email: "new_manager@example.com" })),
      },
      invitationRepo: {
        inviteUserToBecomeManager: jest.fn(() => Promise.resolve({})),
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
