import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { Member } from "../../../src/modules/members/domain/member.models.js";
import type { Document } from "../../../src/modules/documents/domain/document.models.js";
import type { Meter } from "../../../src/modules/meters/domain/meter.models.js";
import type { Address } from "../../../src/shared/address/address.models.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";
import type { User } from "../../../src/modules/users/domain/user.models.js";
import type { GestionnaireInvitation, UserMemberInvitation } from "../../../src/modules/invitations/domain/invitation.models.js";
import type { UserMemberInvitationDTO, UserManagerInvitationDTO } from "../../../src/modules/invitations/api/invitation.dtos.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { ClientType, MeterDataStatus, MeterRate, ReadingFrequency, TarifGroup } from "../../../src/modules/meters/shared/meter.types.js";
import { toMemberPartialDTO, toMemberDTO, toDocumentExposed, toMeterDTO, toMeterPartialDTO } from "../../../src/modules/me/shared/to_dto.js";
import { ME_ERRORS } from "../../../src/modules/me/shared/me.errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { DOCUMENT_ERRORS } from "../../../src/modules/documents/shared/document.errors.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { type HttpMethod, ORGS_MEMBER } from "../../utils/shared.consts.js";
import { mockIndividualEntity as mockMemberIndividualEntity, mockMemberDTOJSON } from "../member/member.const.js";

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

const mockCommunity = { id: 1, name: "Test Community" };

// --- Member Mock ---
export const mockIndividualEntity: Member = {
  id: 1,
  name: "John Doe",
  IBAN: "BE1234567890",
  status: MemberStatus.ACTIVE,
  member_type: MemberType.INDIVIDUAL,
  created_at: mockDate,
  updated_at: mockDate,
  home_address: mockAddress as Address,
  billing_address: mockAddress as Address,
  community: mockCommunity as Community,
  individual_details: {
    id: 1,
    first_name: "John",
    NRN: "12345678901",
    email: "john@example.com",
    phone_number: "0470123456",
    social_rate: false,
    manager: null,
    member: {} as Member,
  },
  company_details: undefined,
};

export const mockMemberPartialDTO = toMemberPartialDTO(mockIndividualEntity);
export const mockMemberDTO = toMemberDTO(mockIndividualEntity);
export const mockMemberPartialDTOJSON = JSON.parse(JSON.stringify(mockMemberPartialDTO));
export const mockMemberDTOJSON = JSON.parse(JSON.stringify(mockMemberDTO));

// --- Document Mock ---
export const mockDocumentEntity: Document = {
  id: 100,
  member: { id: 1 } as Member,
  community: mockCommunity as Community,
  file_name: "test_report.pdf",
  file_url: "http://storage.com/bucket/test_report.pdf",
  file_size: 1024,
  file_type: "application/pdf",
  upload_date: mockDate,
  created_at: mockDate,
  updated_at: mockDate,
};

export const mockDocumentExposed = toDocumentExposed(mockDocumentEntity);
export const mockDocumentExposedJSON = JSON.parse(JSON.stringify(mockDocumentExposed));
export const mockDocumentBuffer = Buffer.from("fake-pdf-content");

// --- Meter Mock ---
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
export const mockMeterDTOJSON = JSON.parse(JSON.stringify(mockMeterDTO));
export const mockMeterPartialDTOJSON = JSON.parse(JSON.stringify(mockMeterPartialDTO));

// --- Test Cases ---

// 1. Get Documents
export const testCasesGetDocuments = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_MEMBER,
    expected_error_code: SUCCESS,
    expected_data: [mockDocumentExposedJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meRepo: {
        getDocuments: jest.fn(() => Promise.resolve([[mockDocumentEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getDocuments: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 2. Download Document
export const testCasesDownloadDocument = [
  {
    description: "Success Download",
    id: 100,
    status_code: 200,
    orgs: ORGS_MEMBER,
    is_binary: true,
    mocks: {
      meRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        getDocument: jest.fn(() => Promise.resolve(mockDocumentBuffer)),
      },
    },
  },
  {
    description: "Fail (Document Not Found)",
    id: 999,
    status_code: 400,
    orgs: ORGS_MEMBER,
    expected_error_code: DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND.errorCode,
    expected_data: DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND.message,
    mocks: {
      meRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (Storage Error)",
    id: 100,
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        getDocument: jest.fn(() => Promise.reject(new Error("Storage Error"))),
      },
    },
  },
];

// 3. Get Members
export const testCasesGetMembers = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_MEMBER,
    expected_error_code: SUCCESS,
    expected_data: [mockMemberPartialDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meRepo: {
        getMembersList: jest.fn(() => Promise.resolve([[mockIndividualEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getMembersList: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 4. Get Member By Id
export const testCasesGetMemberById = [
  {
    description: "Success (Individual)",
    id: 1,
    status_code: 200,
    orgs: ORGS_MEMBER,
    expected_error_code: SUCCESS,
    expected_data: mockMemberDTOJSON,
    mocks: {
      meRepo: {
        getMemberById: jest.fn(() => Promise.resolve(mockIndividualEntity)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: 999,
    status_code: 400,
    orgs: ORGS_MEMBER,
    expected_error_code: MEMBER_ERRORS.GET_MEMBER.NOT_FOUND.errorCode,
    expected_data: MEMBER_ERRORS.GET_MEMBER.NOT_FOUND.message,
    mocks: {
      meRepo: {
        getMemberById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: 1,
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getMemberById: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 5. Get Meters
export const testCasesGetMeters = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_MEMBER,
    expected_error_code: SUCCESS,
    expected_data: [mockMeterPartialDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meRepo: {
        getMeters: jest.fn(() => Promise.resolve([[mockMeterEntity], 1])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getMeters: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 6. Get Meter By Id
export const testCasesGetMeterById = [
  {
    description: "Success",
    id: "123456789012345678",
    status_code: 200,
    orgs: ORGS_MEMBER,
    expected_error_code: SUCCESS,
    expected_data: mockMeterDTOJSON,
    mocks: {
      meRepo: {
        getMeterById: jest.fn(() => Promise.resolve(mockMeterEntity)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: "999",
    status_code: 400,
    orgs: ORGS_MEMBER,
    expected_error_code: METER_ERRORS.GET_METER.METER_NOT_FOUND.errorCode,
    expected_data: METER_ERRORS.GET_METER.METER_NOT_FOUND.message,
    mocks: {
      meRepo: {
        getMeterById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: "123",
    status_code: 500,
    orgs: ORGS_MEMBER,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getMeterById: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// ==========================================
// Invitation-related mock data and test cases
// ==========================================

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

// 7. Get Own Invitation Member by Id
export const testCaseGetInvitationById = [
  {
    description: "GET /me/invitations/member/:id Success",
    endpoint: "/me/invitations/member/",
    id_user: 1,
    id_invitation: 1,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: mockMemberDTOJSON,
    translation_field: undefined,
    mocks: {
      meRepo: {
        getOwnMembersPendingInvitationById: jest.fn(() => Promise.resolve(mockMemberIndividualEntity)),
      },
    },
  },
  {
    description: "GET /me/invitations/member/:id Fail (Invitation not member)",
    endpoint: "/me/invitations/member/",
    id_user: 1,
    id_invitation: 1,
    status_code: 400,
    expected_error_code: ME_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND.errorCode,
    expected_data: ME_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND.message,
    translation_field: undefined,
    mocks: {
      meRepo: {
        getOwnMembersPendingInvitationById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
];

// 8. Get Pending Invitations Own Members
export const testCasesGetPendingOwnMembers = [
  {
    description: "GET /me/invitations (Own Members) Success",
    endpoint: "/me/invitations",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserMemberInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meRepo: {
        getOwnMembersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserMemberInvitation], 1])),
      },
    },
  },
  {
    description: "GET /me/invitations (Own Members) DB Error",
    endpoint: "/me/invitations",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 500,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getOwnMembersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "GET /me/invitations (Own Members) Validation Error",
    endpoint: "/me/invitations",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { page: "invalid" },
    status_code: 422,
    translation_field: { field: "page" },
    expected_error_code: ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

// 9. Get Pending Invitations Own Managers
export const testCasesGetPendingOwnManagers = [
  {
    description: "GET /me/invitations/managers (Own Managers) Success",
    endpoint: "/me/invitations/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockUserManagerInvitationDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      meRepo: {
        getOwnManagersPendingInvitation: jest.fn(() => Promise.resolve([[mockUserManagerInvitation], 1])),
      },
    },
  },
  {
    description: "GET /me/invitations/managers (Own Managers) DB Error",
    endpoint: "/me/invitations/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: {},
    status_code: 500,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
        getOwnManagersPendingInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
  {
    description: "GET /me/invitations/managers (Own Managers) Validation Error",
    endpoint: "/me/invitations/managers",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { limit: "invalid" },
    status_code: 422,
    translation_field: { field: "limit" },
    expected_error_code: ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.errorCode,
    expected_data: ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER.message,
    mocks: {},
  },
];

// 10. Accept Invitation Member
export const testCasesAcceptMember = [
  {
    description: "POST /me/invitations/accept Success (no user in community)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept Success (user existing)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept Fail (Invitation Not Found)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 999 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept Fail (User Mismatch)",
    endpoint: "/me/invitations/accept",
    id_user: 99, // Wrong user
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept Fail (Link Save Error)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(10)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept Fail (DB Error getCommunityUser)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 500,
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept Fail (DB Error Add User)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept Fail (IAM Error)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY.message,
    mocks: {
      meRepo: {
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
  {
    description: "POST /me/invitations/accept Fail (delete user member invitation failed)",
    endpoint: "/me/invitations/accept",
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 1 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
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
];

// 11. Accept Invitation Manager
export const testCasesAcceptManager = [
  {
    description: "POST /me/invitations/accept/manager Success (User not existing)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
        deleteGestionnaireInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept/manager Success (User existing)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
        deleteGestionnaireInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept/manager Fail (Invitation Not Found)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 999 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND.message,
    mocks: {
      meRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept/manager Fail (User Mismatch)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 99,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID.message,
    mocks: {
      meRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept/manager Fail (DB Error while adding user to community)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/manager Fail (User existing but Admin)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/manager Fail (User existing but Manager)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/manager Fail (Patch db fail)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/manager Fail (User not existing) (IAM AddUser fail)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/manager Success (User existing) (Fail IAM UpdateUserRole)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE.message,
    mocks: {
      meRepo: {
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
  {
    description: "POST /me/invitations/accept/manager Fail (fail deleting the invitation)",
    endpoint: "/me/invitations/accept/manager",
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    query: { invitation_id: 2 },
    status_code: 400,
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DELETE_INVITATION_FAILED.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MANAGER.DELETE_INVITATION_FAILED.message,
    mocks: {
      meRepo: {
        getInvitationManagerById: jest.fn(() => Promise.resolve(mockUserManagerInvitation)),
        deleteGestionnaireInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
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
];

// 12. Accept Invitation Encoded
export const testCasesAcceptEncoded = [
  {
    description: "POST /me/invitations/accept/encoded Success (User not existing)",
    endpoint: "/me/invitations/accept/encoded",
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
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept/encoded Success (User existing)",
    endpoint: "/me/invitations/accept/encoded",
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
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
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
    description: "POST /me/invitations/accept/encoded Fail (Invitation Not Found)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept/encoded Fail (User Mismatch)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
      },
      authContext: {
        getInternalUserId: jest.fn(() => Promise.resolve(99)),
      },
    },
  },
  {
    description: "POST /me/invitations/accept/encoded Fail (Member Creation Failed)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/encoded Fail (Member Creation Failed 2)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/encoded Fail (Link Save Error)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/encoded Fail (Fail db exception getUser)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.EXCEPTION.errorCode,
    expected_data: ME_ERRORS.EXCEPTION.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/encoded Fail (Fail db exception when add user)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY.message,
    mocks: {
      meRepo: {
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
    description: "POST /me/invitations/accept/encoded Fail (IAM ADD USER)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY.message,
    mocks: {
      meRepo: {
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
  {
    description: "POST /me/invitations/accept/encoded Fail (fail deleting the invitation)",
    endpoint: "/me/invitations/accept/encoded",
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
    expected_error_code: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED.errorCode,
    expected_data: ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED.message,
    mocks: {
      meRepo: {
        getInvitationMemberById: jest.fn(() => Promise.resolve(mockUserMemberInvitation)),
        saveUserMemberLink: jest.fn(() => Promise.resolve({})),
        deleteUserMemberInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
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
];

// 13. Refuse Invitation Member
export const testCasesRefuseMember = [
  {
    description: "DELETE /me/invitations/:id/member (Refuse Member) Success",
    endpoint: "/me/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /me/invitations/:id/member Fail (Not Found/Not Affected)",
    endpoint: "/me/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      meRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /me/invitations/:id/member Fail (DB Error)",
    endpoint: "/me/invitations/1/member",
    method: "delete" as HttpMethod,
    id_user: 10,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      meRepo: {
        refuseMemberInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 14. Refuse Invitation Manager
export const testCasesRefuseManager = [
  {
    description: "DELETE /me/invitations/:id/manager (Refuse Manager) Success",
    endpoint: "/me/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      meRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "DELETE /me/invitations/:id/manager Fail (Not Found/Not Affected)",
    endpoint: "/me/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      meRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "DELETE /me/invitations/:id/manager Fail (DB Error)",
    endpoint: "/me/invitations/2/manager",
    method: "delete" as HttpMethod,
    id_user: 11,
    id_community: 1,
    orgs: ORGS_MEMBER,
    status_code: 400,
    expected_error_code: ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.errorCode,
    expected_data: ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE.message,
    mocks: {
      meRepo: {
        refuseManagerInvitation: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];
