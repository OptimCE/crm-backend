import { describe, expect, it } from "@jest/globals";
import { CORE_EVENTS } from "../../../src/shared/outbox/core-events.js";
import { regulatoryIdentityEvents } from "../../../src/modules/communities/shared/regulatory-identity.js";

const BLANK = {
  representative_first_name: null,
  representative_last_name: null,
  representative_email: null,
  statutes_date: null,
  internal_rules_date: null,
};
const RECORDED = {
  representative_first_name: "Anne",
  representative_last_name: "Dupont",
  representative_email: "anne@ce.be",
  statutes_date: "2024-03-01",
  internal_rules_date: "2024-03-01",
};

describe("(Unit) regulatoryIdentityEvents", () => {
  it("recording the representative and the dates for the first time is no event", () => {
    expect(regulatoryIdentityEvents(BLANK, RECORDED)).toEqual([]);
  });

  it("a new representative names the fields that changed, never their values", () => {
    const events = regulatoryIdentityEvents(RECORDED, { ...RECORDED, representative_last_name: "Martin", representative_email: "anne.martin@ce.be" });
    expect(events).toEqual([
      {
        event_type: CORE_EVENTS.COMMUNITY_REPRESENTATIVE_CHANGED,
        payload: { fields: ["representative_last_name", "representative_email"] },
      },
    ]);
  });

  it("the same representative written differently is no change", () => {
    expect(regulatoryIdentityEvents(RECORDED, { ...RECORDED, representative_first_name: " Anne ", representative_email: "ANNE@ce.be" })).toEqual([]);
  });

  it("clearing the representative gives the regulator nothing to hear", () => {
    expect(
      regulatoryIdentityEvents(RECORDED, { ...RECORDED, representative_first_name: null, representative_last_name: null, representative_email: null }),
    ).toEqual([]);
  });

  it("new statutes and new internal rules are one event each, with both dates", () => {
    const events = regulatoryIdentityEvents(RECORDED, { ...RECORDED, statutes_date: "2026-10-01", internal_rules_date: "2026-10-15" });
    expect(events).toEqual([
      { event_type: CORE_EVENTS.COMMUNITY_STATUTES_CHANGED, payload: { statutes_date: "2026-10-01", previous_statutes_date: "2024-03-01" } },
      {
        event_type: CORE_EVENTS.COMMUNITY_ROI_CHANGED,
        payload: { internal_rules_date: "2026-10-15", previous_internal_rules_date: "2024-03-01" },
      },
    ]);
  });
});
