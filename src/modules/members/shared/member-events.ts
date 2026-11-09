import { CORE_EVENTS } from "../../../shared/outbox/core-events.js";
import type { OutboxEventInput } from "../../../shared/outbox/i-outbox.writer.js";
import { MemberStatus } from "./member.types.js";

/** A member counts as part of the community unless it is INACTIVE (PENDING is a member being onboarded). */
function isIn(status: MemberStatus | null): boolean {
  return status !== null && status !== MemberStatus.INACTIVE;
}

/**
 * The event a member's status change produces: joining when it enters the community (created, or
 * reactivated from INACTIVE), leaving when it exits (deleted, or set INACTIVE). `null` stands for
 * "does not exist". Any other change (PENDING to ACTIVE, a name, an IBAN) produces nothing.
 */
export function memberEvent(
  id_community: number,
  id_member: number,
  before: MemberStatus | null,
  after: MemberStatus | null,
  member_type: number | null,
): OutboxEventInput | null {
  if (isIn(before) === isIn(after)) {
    return null;
  }
  return {
    id_community,
    aggregate_type: "community",
    aggregate_id: id_community,
    event_type: isIn(after) ? CORE_EVENTS.COMMUNITY_MEMBER_JOINED : CORE_EVENTS.COMMUNITY_MEMBER_LEFT,
    payload: { id_member, member_type, status: after },
  };
}
