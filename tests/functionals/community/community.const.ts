import { jest } from "@jest/globals";
import { Role } from "../../../src/shared/dtos/role.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

export const existingCommunityId = 1;
interface UserResponse {
  role: Role;
}
// --- Test Cases ---

// 0. Get All Communities (public list)
export const testCasesGetAllPublicCommunities = [
  {
    description: "Success - Returns only communities with public sharing ops",
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length === 1 && (data[0] as { id: number }).id === existingCommunityId;
    },
  },
  {
    description: "Success - Filter by name (matching)",
    query: { name: "Test" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 1,
  },
  {
    description: "Success - Filter by name (no match)",
    query: { name: "NonExistent" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 0,
  },
];

// 1. Get My Communities
export const testCasesGetMyCommunities = [
  {
    description: "Success - List Communities",
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length === 3 && (data[0] as { id: number }).id === existingCommunityId;
    },
  },
  // Functional: Test Filter
  {
    description: "Success - Filter by Name",
    query: { name: "Test" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 1,
  },
  {
    description: "Success - Filter by Name (No match)",
    query: { name: "NonExistent" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 0,
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
    check_data: (data: unknown[]): boolean => data.length >= 3, // Admin, Manager, Member from seed
  },
  // Functional: Test Filter
  {
    description: "Success - Filter by Role",
    query: { role: Role.ADMIN },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean =>
      data.every((u): u is UserResponse => typeof u === "object" && u !== null && "role" in u) &&
      data.every((u: UserResponse): boolean => u.role === Role.ADMIN),
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
    check_data: (data: unknown[]): boolean =>
      data.every((u): u is UserResponse => typeof u === "object" && u !== null && "role" in u) &&
      data.every((u: UserResponse): boolean => u.role === Role.ADMIN || u.role === Role.GESTIONNAIRE),
  },
];

// 4. Create Community
export const testCasesCreateCommunity = [
  {
    description: "Success Create",
    body: { name: "Functional Community", regulator: "BE-WAL-CWAPE" },
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
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        updateCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Success Update Bank & Legal Info",
    body: {
      vat_number: "BE0123456789",
      legal_name: "Energy Community SCRL",
      iban: "BE68539007547034",
      account_holder_name: "Energy Community SCRL Treasury",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      iamService: {
        updateCommunity: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - Invalid IBAN",
    body: { iban: "NOT-AN-IBAN" },
    orgs: ORGS_ADMIN,
    status_code: 422,
    expected_error_code: COMMUNITY_ERRORS.VALIDATION.INVALID_IBAN.errorCode,
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
        updateUserRole: jest.fn(() => Promise.resolve()),
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
        updateUserRole: jest.fn(() => Promise.resolve()),
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

// 8b. Get Community Public Sharing Operations
export const testCasesGetCommunityPublicSharingOps = [
  {
    description: "Success - Returns only public sharing operations for community 1",
    community_id: 1,
    query: {},
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 2,
  },
  {
    description: "Success - Community with no public sharing operations returns empty",
    community_id: 2,
    query: {},
    orgs: ORGS_MEMBER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 0,
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

// 10. Get Community By Id (GET /communities/:id) — covers toCommunityDetailDTO with presigned logo URL (commit 926a12c)
export const presignedLogoUrl = "https://signed.example.com/logo.png?token=abc";

export const testCasesGetCommunityById = [
  {
    description: "Success - Returns CommunityDetailDTO with presigned logo URL when logo_url is set",
    id: existingCommunityId, // Test Community has logo_url populated
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as { id: number; logo_url: string | null; logo_presigned_url: string | null };
      return d.id === existingCommunityId && d.logo_url !== null && d.logo_presigned_url === presignedLogoUrl;
    },
    external_mocks: {
      storageService: {
        getDocumentUrl: jest.fn(() => Promise.resolve(presignedLogoUrl)),
      },
    },
  },
  {
    description: "Success - Returns null logo_presigned_url and bank/legal fields when community has no logo",
    id: 2, // Other Community has logo_url = NULL and seeded bank/legal info
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as {
        id: number;
        logo_url: string | null;
        logo_presigned_url: string | null;
        vat_number: string | null;
        legal_name: string | null;
        iban: string | null;
        account_holder_name: string | null;
      };
      return (
        d.id === 2 &&
        d.logo_url === null &&
        d.logo_presigned_url === null &&
        d.vat_number === "BE0477109346" &&
        d.legal_name === "Other Community ASBL" &&
        d.iban === "BE68539007547034" &&
        d.account_holder_name === null
      );
    },
    external_mocks: undefined,
  },
  {
    description: "Fail - Community not found",
    id: 999,
    orgs: ORGS_ADMIN,
    status_code: 404,
    expected_error_code: COMMUNITY_ERRORS.GET_COMMUNITY.COMMUNITY_NOT_FOUND.errorCode,
    check_data: undefined,
    external_mocks: undefined,
  },
];

// 11. Get All Public Communities — verify logo_presigned_url field on PublicCommunityDTO (commit 926a12c)
export const testCasesGetAllPublicCommunitiesWithLogo = [
  {
    description: "Success - PublicCommunityDTO includes logo_presigned_url for communities with logo_url",
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      // Community 1 (Test Community) has logo_url so it should also have a presigned_url
      const arr = data as Array<{ id: number; logo_url: string | null; logo_presigned_url: string | null }>;
      const c1 = arr.find((c) => c.id === existingCommunityId);
      return c1 !== undefined && c1.logo_url !== null && c1.logo_presigned_url === presignedLogoUrl;
    },
    external_mocks: {
      storageService: {
        getDocumentUrl: jest.fn(() => Promise.resolve(presignedLogoUrl)),
      },
    },
  },
];

// 12. Upload Logo (POST /communities/logo)
export const uploadedLogoUrl = "documents/abc-uploaded-logo.png";

export const testCasesUploadLogo = [
  {
    description: "Success - Upload PNG logo (returns logo_url + presigned URL)",
    file: {
      buffer: Buffer.from("fake-png-content"),
      originalname: "logo.png",
      mimetype: "image/png",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as { logo_url: string; logo_presigned_url: string };
      return d.logo_url === uploadedLogoUrl && d.logo_presigned_url === presignedLogoUrl;
    },
    external_mocks: {
      storageService: {
        uploadDocument: jest.fn(() => Promise.resolve({ url: uploadedLogoUrl })),
        getDocumentUrl: jest.fn(() => Promise.resolve(presignedLogoUrl)),
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - Non-admin role rejected",
    file: {
      buffer: Buffer.from("fake-png-content"),
      originalname: "logo.png",
      mimetype: "image/png",
    },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 403,
    expected_error_code: undefined as number | undefined,
    check_data: undefined,
    external_mocks: undefined,
  },
];

// 13. Delete Logo (DELETE /communities/logo)
export const testCasesDeleteLogo = [
  {
    description: "Success - Delete logo of the active community",
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    external_mocks: {
      storageService: {
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - Non-admin role rejected",
    orgs: ORGS_GESTIONNAIRE,
    status_code: 403,
    expected_error_code: undefined as number | undefined,
    expected_data: undefined as string | undefined,
    external_mocks: undefined,
  },
];
