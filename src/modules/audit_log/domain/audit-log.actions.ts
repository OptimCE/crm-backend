/**
 * Central registry of audit-log action codes.
 *
 * Convention: `domain.entity.verb` (lowercase, dot-separated).
 *   - `domain` is the bounded context that owns the action (e.g. `crm`,
 *     `billing`, `allocation`).
 *   - `entity` is the singular primary entity being acted on (e.g. `member`,
 *     `meter`, `community`).
 *   - `verb` is the past-tense outcome (e.g. `created`, `updated`, `deleted`,
 *     `invited`, `subscribed`).
 *
 * Examples (not yet defined — added as features are wired):
 *   crm.member.invited
 *   crm.meter.created
 *   crm.community.updated
 *   billing.invoice.issued
 *
 * Entity IDs are always stored as strings (audit_log.entity_id is VARCHAR),
 * so callers must stringify int and UUID PKs alike.
 *
 * Frontend i18n is handled via a shared catalog keyed off these action codes —
 * never localize the string itself before storing.
 */
export const AUDIT_ACTIONS = {
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
} as const;

/**
 * Type derived from {@link AUDIT_ACTIONS} with an open-ended escape hatch.
 * The `(string & {})` union lets the helper accept arbitrary strings while
 * still surfacing the registered codes via autocomplete once they exist.
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | (string & {});
