import { describe, expect, it } from "@jest/globals";
import { AUDIT_ACTIONS, type AuditAction } from "../../../src/modules/audit_log/domain/audit-log.actions.js";

describe("(Unit) AUDIT_ACTIONS registry", () => {
  it("registers the wired action codes following the domain.entity.verb convention", () => {
    expect(AUDIT_ACTIONS).toEqual({
      COMMUNITY_SUBSCRIPTION_CREATED: "crm.community_subscription.created",
      COMMUNITY_SUBSCRIPTION_REACTIVATED: "crm.community_subscription.reactivated",
      COMMUNITY_SUBSCRIPTION_UNSUBSCRIBED: "crm.community_subscription.unsubscribed",
      COMMUNITY_CREATED: "crm.community.created",
      COMMUNITY_UPDATED: "crm.community.updated",
      COMMUNITY_DELETED: "crm.community.deleted",
      COMMUNITY_MEMBER_KICKED: "crm.community_member.kicked",
      COMMUNITY_MEMBER_LEFT: "crm.community_member.left",
      COMMUNITY_MEMBER_ROLE_UPDATED: "crm.community_member.role_updated",
      DOCUMENT_CREATED: "crm.document.created",
      DOCUMENT_DELETED: "crm.document.deleted",
      MANAGER_INVITATION_CREATED: "crm.manager_invitation.created",
      MANAGER_INVITATION_DELETED: "crm.manager_invitation.deleted",
      MEMBER_INVITATION_CREATED: "crm.member_invitation.created",
      MEMBER_INVITATION_DELETED: "crm.member_invitation.deleted",
      ALLOCATION_KEY_CREATED: "crm.allocation_key.created",
      ALLOCATION_KEY_UPDATED: "crm.allocation_key.updated",
      ALLOCATION_KEY_DELETED: "crm.allocation_key.deleted",
      MANAGER_INVITATION_ACCEPTED: "crm.manager_invitation.accepted",
      MANAGER_INVITATION_REFUSED: "crm.manager_invitation.refused",
      MEMBER_INVITATION_ACCEPTED: "crm.member_invitation.accepted",
      MEMBER_INVITATION_REFUSED: "crm.member_invitation.refused",
      MEMBER_CREATED: "crm.member.created",
      MEMBER_UPDATED: "crm.member.updated",
      MEMBER_DELETED: "crm.member.deleted",
      MEMBER_USER_LINK_INVITED: "crm.member_user_link.invited",
      MEMBER_USER_LINK_DELETED: "crm.member_user_link.deleted",
      METER_CREATED: "crm.meter.created",
      METER_UPDATED: "crm.meter.updated",
      METER_DELETED: "crm.meter.deleted",
      METER_DATA_UPDATED: "crm.meter_data.updated",
      METER_DATA_DELETED: "crm.meter_data.deleted",
      METER_DATA_CREATED: "crm.meter_data.created",
      METER_DATA_DEACTIVATED: "crm.meter_data.deactivated",
      SHARING_OPERATION_CREATED: "crm.sharing_operation.created",
      SHARING_OPERATION_UPDATED: "crm.sharing_operation.updated",
      SHARING_OPERATION_DELETED: "crm.sharing_operation.deleted",
      SHARING_OPERATION_KEY_CREATED: "crm.sharing_operation_key.created",
      SHARING_OPERATION_KEY_APPROVED: "crm.sharing_operation_key.approved",
      SHARING_OPERATION_KEY_REJECTED: "crm.sharing_operation_key.rejected",
      SHARING_OP_CONSUMPTION_UPLOADED: "crm.sharing_op_consumption.uploaded",
    });
    for (const code of Object.values(AUDIT_ACTIONS)) {
      expect(code).toMatch(/^[a-z]+(?:_[a-z]+)*\.[a-z]+(?:_[a-z]+)*\.[a-z]+(?:_[a-z]+)*$/);
    }
  });

  it("AuditAction accepts arbitrary strings via the (string & {}) escape hatch", () => {
    // Compile-time check: the assignment compiles, so the type is open.
    const example: AuditAction = "crm.member.invited";
    expect(typeof example).toBe("string");
  });
});
