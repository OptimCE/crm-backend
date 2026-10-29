import { CORE_EVENTS, type MeterMembershipReason } from "../../../shared/outbox/core-events.js";
import type { OutboxEventInput } from "../../../shared/outbox/i-outbox.writer.js";

/** The configuration fields a consumer needs to file the change without reading the CRM back. */
export interface MembershipSnapshot {
  ean: string;
  effective_date: string;
  id_member: number | null;
  grd: string | null;
  injection_status: number | null;
  status: number | null;
}

/**
 * The events a change of a meter's sharing operation produces: leaving the
 * previous one, then joining the next. A move between two operations is both,
 * in that order. No change of operation (a holder, rate or GRD correction)
 * produces nothing — those are not regulatory changes of the sharing.
 */
export function membershipEvents(
  id_community: number,
  before: number | null,
  after: number | null,
  snapshot: MembershipSnapshot,
  reason: MeterMembershipReason,
): OutboxEventInput[] {
  if (before === after) {
    return [];
  }
  const events: OutboxEventInput[] = [];
  if (before !== null) {
    events.push({
      id_community,
      aggregate_type: "operation",
      aggregate_id: before,
      event_type: CORE_EVENTS.OPERATION_METER_REMOVED,
      payload: { ...snapshot, id_sharing_operation: before, reason },
    });
  }
  if (after !== null) {
    events.push({
      id_community,
      aggregate_type: "operation",
      aggregate_id: after,
      event_type: CORE_EVENTS.OPERATION_METER_ADDED,
      payload: { ...snapshot, id_sharing_operation: after, reason },
    });
  }
  return events;
}
