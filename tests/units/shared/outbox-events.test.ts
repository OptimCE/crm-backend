import { describe, expect, it } from "@jest/globals";
import { membershipEvents, type MembershipSnapshot } from "../../../src/modules/meters/shared/membership-events.js";
import { memberEvent } from "../../../src/modules/members/shared/member-events.js";
import { MemberStatus } from "../../../src/modules/members/shared/member.types.js";
import { CORE_EVENTS, subjectFor } from "../../../src/shared/outbox/core-events.js";

const SNAPSHOT: MembershipSnapshot = {
  ean: "541448200000000001",
  effective_date: "2026-11-01",
  id_member: 7,
  grd: "ores",
  injection_status: null,
  status: 3,
};

describe("(Unit) Outbox event derivation", () => {
  describe("meter membership", () => {
    it("records nothing when the operation does not change", () => {
      expect(membershipEvents(1, 4, 4, SNAPSHOT, "configuration")).toEqual([]);
      expect(membershipEvents(1, null, null, SNAPSHOT, "configuration")).toEqual([]);
    });

    it("records an entry", () => {
      const events = membershipEvents(1, null, 4, SNAPSHOT, "configuration");
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id_community: 1,
        aggregate_type: "operation",
        aggregate_id: 4,
        event_type: CORE_EVENTS.OPERATION_METER_ADDED,
        payload: { ...SNAPSHOT, id_sharing_operation: 4, reason: "configuration" },
      });
    });

    it("records an exit", () => {
      const events = membershipEvents(1, 4, null, SNAPSHOT, "meter_deleted");
      expect(events.map((e) => [e.event_type, e.aggregate_id])).toEqual([[CORE_EVENTS.OPERATION_METER_REMOVED, 4]]);
      expect(events[0].payload.reason).toBe("meter_deleted");
    });

    it("records a move as the exit, then the entry", () => {
      const events = membershipEvents(1, 4, 9, SNAPSHOT, "configuration");
      expect(events.map((e) => [e.event_type, e.aggregate_id])).toEqual([
        [CORE_EVENTS.OPERATION_METER_REMOVED, 4],
        [CORE_EVENTS.OPERATION_METER_ADDED, 9],
      ]);
    });
  });

  describe("member status", () => {
    it.each([
      [null, MemberStatus.ACTIVE, CORE_EVENTS.COMMUNITY_MEMBER_JOINED],
      [null, MemberStatus.PENDING, CORE_EVENTS.COMMUNITY_MEMBER_JOINED],
      [MemberStatus.INACTIVE, MemberStatus.ACTIVE, CORE_EVENTS.COMMUNITY_MEMBER_JOINED],
      [MemberStatus.ACTIVE, MemberStatus.INACTIVE, CORE_EVENTS.COMMUNITY_MEMBER_LEFT],
      [MemberStatus.PENDING, null, CORE_EVENTS.COMMUNITY_MEMBER_LEFT],
    ])("%s -> %s records %s", (before, after, expected) => {
      expect(memberEvent(1, 5, before, after, 1)?.event_type).toBe(expected);
    });

    it.each([
      [MemberStatus.PENDING, MemberStatus.ACTIVE],
      [MemberStatus.ACTIVE, MemberStatus.ACTIVE],
      [null, MemberStatus.INACTIVE],
      [MemberStatus.INACTIVE, null],
    ])("%s -> %s records nothing", (before, after) => {
      expect(memberEvent(1, 5, before, after, 1)).toBeNull();
    });
  });

  it("publishes each event type on core.evt.<type>", () => {
    expect(subjectFor(CORE_EVENTS.OPERATION_METER_ADDED)).toBe("core.evt.operation.meter_added");
    expect(subjectFor(CORE_EVENTS.COMMUNITY_CREATED)).toBe("core.evt.community.created");
  });
});
