import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingIndividualId = 1;
export const existingCompanyId = 2;
export const existingCommunityId = 1;
export const existingMemberOtherCommunityId = 3;

export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get Members List
export const testCasesGetMembersList = [
  {
    description: "Success - List Members",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.length >= 2 && data.some((m: any) => m.id === existingIndividualId);
    },
  },
  {
    description: "Success - Filter by Name",
    query: { name: "Member One" },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.length === 1 && data[0].name === "Member One";
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
    check_data: (data: any) => {
      return data.id === existingIndividualId && data.member_type === 1; // 1 = Individual
    },
  },
  {
    description: "Success - Get Company",
    member_id: existingCompanyId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: any) => {
      return data.id === existingCompanyId && data.member_type === 2; // 2 = Company
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
    query: {email: 'john@test.com'},
    check_data: (data: any) => {
      return typeof data.status === "number";
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
];

// 6. Patch Status
export const testCasesPatchStatus = [
  {
    description: "Success - Deactivate",
    body: {
      id_member: existingIndividualId,
      status: MemberStatus.INACTIVE,
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
    description: "Success - Invite User",
    body: {
      id_member: existingIndividualId,
      user_email: "invite_link@test.com",
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
    description: "Success - Delete Member",
    member_id: existingIndividualId,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];
