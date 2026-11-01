/**
 * The domain events the core publishes, and how they reach the broker.
 *
 * Each event is written to `outbox_event` IN THE SAME TRANSACTION as the CRM
 * change it describes (see OutboxWriter), then published by crm-outbox-relay on
 * `core.evt.<event_type>` with the event id as `Nats-Msg-Id`. The core does not
 * know who consumes them: the administrative annexe is one consumer among
 * possible others, and it filters by community activation on its side.
 *
 * Reserved, no emitter yet (the CRM has no such concept today): `operation.closed`,
 * `operation.installation_added` / `_removed` (an injection meter is a meter, its
 * `injection_status` travels in the meter events).
 *
 * The community's representative, statutes and internal rules (2026-11-01): emitted by
 * `CommunityService.updateCommunity` when a RECORDED value changes. Recording one for the
 * first time is the CRM catching up, not a change the regulator must hear about.
 */
export const CORE_EVENTS = {
  OPERATION_CREATED: "operation.created",
  OPERATION_DELETED: "operation.deleted",
  OPERATION_METER_ADDED: "operation.meter_added",
  OPERATION_METER_REMOVED: "operation.meter_removed",
  OPERATION_KEY_ASSIGNED: "operation.key_assigned",
  COMMUNITY_CREATED: "community.created",
  COMMUNITY_MEMBER_JOINED: "community.member_joined",
  COMMUNITY_MEMBER_LEFT: "community.member_left",
  COMMUNITY_REPRESENTATIVE_CHANGED: "community.representative_changed",
  COMMUNITY_STATUTES_CHANGED: "community.statutes_changed",
  COMMUNITY_ROI_CHANGED: "community.roi_changed",
} as const;

export type CoreEventType = (typeof CORE_EVENTS)[keyof typeof CORE_EVENTS];

export type OutboxAggregateType = "operation" | "community";

/** The JetStream stream the relay owns; consumers bind to it, never create it. */
export const CORE_EVENTS_STREAM = "CORE_EVENTS";
export const CORE_EVENT_SUBJECT_PREFIX = "core.evt.";
/** Bumped only on a breaking change of the envelope below. */
export const CORE_EVENT_SCHEMA_VERSION = 1;

export function subjectFor(event_type: string): string {
  return `${CORE_EVENT_SUBJECT_PREFIX}${event_type}`;
}

/** What goes on the wire. `payload` is event-specific and carries its own snapshot. */
export interface CoreEventEnvelope {
  event_id: string;
  event_type: string;
  schema_version: number;
  occurred_at: string;
  id_community: number;
  aggregate: { type: string; id: string };
  payload: Record<string, unknown>;
}

/** Why a meter entered or left an operation, so a consumer can tell a correction from a move. */
export type MeterMembershipReason = "configuration" | "configuration_deleted" | "meter_deleted";
