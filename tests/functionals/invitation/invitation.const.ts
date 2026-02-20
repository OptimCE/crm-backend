import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { INVITATION_ERRORS } from "../../../src/modules/invitations/shared/invitation.errors.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

export const existingMemberInvitationId = 1; // invitee@test.com
export const notExistingMemberInvitationId = 99; // invitee@test.com
export const existingManagerInvitationId = 1; // future_admin@test.com

export const AUTH_COMMUNITY_1 = "1";

// --- Test Cases ---

// 1. Get Pending Members
export const testCasesGetPendingMembers = [
  {
    description: "Success - List Pending User Invitations",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return (data as Array<{ id: number; user_email: string }>).some(
        (i) => i.id === existingMemberInvitationId && i.user_email === "invitee@test.com",
      );
    },
  },
  {
    description: "Fail - Unauthorized (Member role)",
    query: {},
    orgs: ORGS_MEMBER,
    status_code: 403,
    expected_error_code: INVITATION_ERRORS.UNAUTHORIZED.errorCode,
  },
];

// 2. Get Pending Managers
export const testCasesGetPendingManagers = [
  {
    description: "Success - List Pending Manager Invitations",
    query: {},
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return (data as Array<{ id: number; user_email: string }>).some(
        (i) => i.id === existingManagerInvitationId && i.user_email === "future_admin@test.com",
      );
    },
  },
];

// 3. Invite User to Become Member
export const testCasesInviteMember = [
  {
    description: "Success - Invite New Member",
    body: {
      user_email: "new_func_invite@test.com",
      member: {
        name: "New Func Member",
        member_type: 1, // Individual
        status: 1, // Active
        email: "new_func_invite@test.com",
        iban: "BE9999999999",
        first_name: "Func",
        NRN: "123456789",
        home_address: { street: "Street", number: 1, city: "City", postcode: "1000" },
        billing_address: { street: "Street", number: 1, city: "City", postcode: "1000" },
      },
    },
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 4. Invite User to Become Manager
export const testCasesInviteManager = [
  {
    description: "Success - Invite New Manager",
    body: { user_email: "new_func_manager@test.com" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];

// 5. Cancel Member Invitation
export const testCasesCancelMember = [
  {
    description: "Success - Cancel Invitation",
    invitation_id: existingMemberInvitationId,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - Not Found / Already Cancelled",
    invitation_id: notExistingMemberInvitationId, // Will be deleted by previous test if run sequentially with fresh DB
    orgs: ORGS_GESTIONNAIRE,
    status_code: 400, // Service throws generic exception if affects 0 rows
    expected_error_code: INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL.errorCode,
  },
];

// 6. Cancel Manager Invitation
export const testCasesCancelManager = [
  {
    description: "Success - Cancel Manager Invitation",
    invitation_id: existingManagerInvitationId,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
];
