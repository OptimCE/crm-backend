import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingIndividualId = 1;
export const existingCompanyId = 2;
export const existingCommunityId = 1;
export const existingMemberOtherCommunityId = 3;

export const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

// --- Test Cases ---

// 1. Get Members List
export const testCasesGetMembersList = [
  {
    description: "Success - List Members",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length >= 2 && (data as Array<{ id: number }>).some((m) => m.id === existingIndividualId);
    },
  },
  {
    description: "Success - Filter by Name",
    query: { name: "Member One" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length === 1 && (data[0] as { name: string }).name === "Member One";
    },
  },
];

// 2. Get Member
export const testCasesGetMember = [
  {
    description: "Success - Get Individual",
    member_id: existingIndividualId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as { id: number; member_type: number };
      return d.id === existingIndividualId && d.member_type === 1;
    },
  },
  {
    description: "Success - Get Company",
    member_id: existingCompanyId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const d = data as { id: number; member_type: number };
      return d.id === existingCompanyId && d.member_type === 2;
    },
  },
  {
    description: "Fail - Not Found / Wrong Community",
    member_id: existingMemberOtherCommunityId, // Member 3 is in Comm 2
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400,
    expected_error_code: MEMBER_ERRORS.GET_MEMBER.NOT_FOUND.errorCode,
  },
];

// 3. Get Member Link
export const testCasesGetMemberLink = [
  {
    description: "Success - Get Link Status (Inactive/None for seed)",
    member_id: existingIndividualId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    query: { email: "john@test.com" },
    check_data: (data: unknown): boolean => {
      return typeof (data as { status: unknown }).status === "number";
    },
  },
];

// 4. Add Member
export const testCasesAddMember = [
  {
    description: "Success - Add Individual",
    body: {
      name: "New Func Member",
      member_type: MemberType.INDIVIDUAL,
      status: MemberStatus.ACTIVE,
      iban: "BE9999999999",
      first_name: "Func",
      NRN: "99999999999",
      email: "newfunc@test.com",
      social_rate: false,
      home_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
      billing_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    // Company (and any member with a guardian) also creates a Manager row.
    // Regression guard for the Manager insert missing the NOT NULL id_community
    // (previously failed as member:add_member.database_add / 50000).
    description: "Success - Add Company with legal representative (Manager)",
    body: {
      name: "New Func Company",
      member_type: MemberType.COMPANY,
      status: MemberStatus.ACTIVE,
      iban: "BE8888888888",
      vat_number: "BE0123456789",
      home_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
      billing_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
      manager: {
        NRN: "80000000097",
        name: "Legal",
        surname: "Rep",
        email: "legalrep_func@test.com",
        phone_number: "+32400000000",
      },
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 5. Update Member
export const testCasesUpdateMember = [
  {
    description: "Success - Update Name",
    body: {
      id: existingIndividualId,
      name: "Updated Member One",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Update Individual-specific fields (NRN, first_name)",
    body: {
      id: existingIndividualId,
      name: "Updated Individual",
      first_name: "Updated First",
      NRN: "11111111111",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Update Company-specific fields (vat_number)",
    body: {
      id: existingCompanyId,
      name: "Updated Company",
      vat_number: "BE0987654321",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 6. Patch Status
export const testCasesPatchStatus = [
  {
    // existingIndividualId has an ACTIVE meter in the seed → the integrity guard blocks deactivation.
    description: "Blocked - Deactivate member with active meters (409)",
    body: {
      id_member: existingIndividualId,
      status: MemberStatus.INACTIVE,
    },
    orgs: ORGS_ADMIN,
    status_code: 409,
    expected_error_code: MEMBER_ERRORS.INTEGRITY.MEMBER_HAS_ACTIVE_METERS.errorCode,
  },
  {
    description: "Success - Reactivate (INACTIVE → ACTIVE)",
    body: {
      id_member: existingCompanyId,
      status: MemberStatus.ACTIVE,
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 7. Patch Link (Invite)
export const testCasesPatchLink = [
  {
    description: "Success - Invite User to Individual",
    body: {
      id_member: existingIndividualId,
      user_email: "invite_link@test.com",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Success - Invite User to Company member",
    body: {
      id_member: existingCompanyId,
      user_email: "invite_company@test.com",
    },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 8. Delete Member Link
export const testCasesDeleteLink = [
  {
    description: "Success - Delete Link",
    member_id: existingIndividualId,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 9. Delete Member
export const testCasesDeleteMember = [
  {
    // existingIndividualId has an ACTIVE meter in the seed → deletion is blocked by the guard.
    description: "Blocked - Delete member with active meters (409)",
    member_id: existingIndividualId,
    orgs: ORGS_ADMIN,
    status_code: 409,
    expected_error_code: MEMBER_ERRORS.INTEGRITY.MEMBER_HAS_ACTIVE_METERS.errorCode,
  },
  {
    // Deactivating the member's only meter first clears the guard, so the delete then succeeds.
    description: "Success - Delete Company after deactivating its meter",
    member_id: existingCompanyId,
    deactivate_ean: "987654321098765432",
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];
