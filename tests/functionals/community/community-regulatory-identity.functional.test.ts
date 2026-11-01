import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog, mockIAMServiceModule } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { CORE_EVENTS } from "../../../src/shared/outbox/core-events.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";

interface OutboxRow {
  id_community: number;
  aggregate_type: string;
  event_type: string;
  payload: Record<string, unknown>;
}

async function put(body: object): Promise<request.Response> {
  await mockIAMServiceModule({ updateCommunity: jest.fn(() => Promise.resolve()) });
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .put("/communities/")
    .send(body)
    .set("x-user-id", "auth0|admin")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_ADMIN);
}

async function communityEvents(): Promise<OutboxRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.query(
    "SELECT id_community, aggregate_type, event_type, payload FROM outbox_event WHERE aggregate_type = 'community' ORDER BY id",
  ) as Promise<OutboxRow[]>;
}

async function stored(): Promise<Record<string, unknown>> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const [row] = (await AppDataSource.query(
    "SELECT representative_first_name, representative_last_name, representative_email, " +
      "to_char(statutes_date, 'YYYY-MM-DD') AS statutes_date, to_char(internal_rules_date, 'YYYY-MM-DD') AS internal_rules_date " +
      "FROM community WHERE id = 1",
  )) as Record<string, unknown>[];
  return row;
}

/**
 * Espace administratif, phase 4: the community's representative and the dates of its
 * statutes and internal rules, and the core events their changes are.
 */
describe("(Functional) Community representative and documents", () => {
  useFunctionalTestDb();

  it("records them; the first recording emits nothing", async () => {
    const response = await put({
      representative_first_name: "Anne",
      representative_last_name: "Dupont",
      representative_email: "anne@ce.be",
      statutes_date: "2024-03-01",
      internal_rules_date: "2024-03-01",
    });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await stored()).toEqual({
      representative_first_name: "Anne",
      representative_last_name: "Dupont",
      representative_email: "anne@ce.be",
      statutes_date: "2024-03-01",
      internal_rules_date: "2024-03-01",
    });
    expect(await communityEvents()).toEqual([]);
  });

  it("a new representative, new statutes and new internal rules are one event each", async () => {
    await put({ representative_first_name: "Anne", representative_last_name: "Dupont", statutes_date: "2024-03-01", internal_rules_date: "2024-03-01" });

    const response = await put({ representative_last_name: "Martin", statutes_date: "2026-10-01", internal_rules_date: "2026-10-15" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const events = await communityEvents();
    expect(events.map((e) => e.event_type)).toEqual([
      CORE_EVENTS.COMMUNITY_REPRESENTATIVE_CHANGED,
      CORE_EVENTS.COMMUNITY_STATUTES_CHANGED,
      CORE_EVENTS.COMMUNITY_ROI_CHANGED,
    ]);
    expect(events[0]).toMatchObject({ id_community: 1, payload: { id_community: 1, fields: ["representative_last_name"] } });
    expect(JSON.stringify(events[0].payload)).not.toContain("Martin");
    expect(events[1].payload).toMatchObject({ statutes_date: "2026-10-01", previous_statutes_date: "2024-03-01" });
    expect(events[2].payload).toMatchObject({ internal_rules_date: "2026-10-15", previous_internal_rules_date: "2024-03-01" });
  });

  it("an update that leaves them as they are emits nothing", async () => {
    await put({ representative_last_name: "Dupont", statutes_date: "2024-03-01" });
    const response = await put({ representative_last_name: "Dupont", statutes_date: "2024-03-01", description: "Autre texte" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await communityEvents()).toEqual([]);
  });

  it.each([
    [{ statutes_date: "01/10/2026" }, COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE.errorCode],
    [{ representative_email: "pas-un-email" }, COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL.errorCode],
  ])("refuses %o", async (body, error_code) => {
    const response = await put(body);

    await expectWithLog(response, () => {
      expect(response.status).toBe(422);
      expect(response.body.error_code).toBe(error_code);
    });
  });

  it("the community's detail returns them", async () => {
    await put({ representative_first_name: "Anne", representative_email: "anne@ce.be", internal_rules_date: "2025-06-30" });
    const appModule = await import("../../../src/app.js");

    const response = await request(appModule.default)
      .get("/communities/1")
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        representative_first_name: "Anne",
        representative_last_name: null,
        representative_email: "anne@ce.be",
        statutes_date: null,
        internal_rules_date: "2025-06-30",
      });
    });
  });
});
