import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, existingEAN } from "../meter/meter.const.js";
import { ORGS_MEMBER } from "../../utils/shared.consts.js";

const AUTH_USER_MEMBER_1 = "auth0|member"; // seeded, linked to member 1
const AUTH_USER_MEMBER_2 = "auth0|member2"; // created below, linked to member 2
const AUTH_USER_BOTH = "auth0|member3"; // created below, linked to members 1 and 2
const AUTH_USER_UNLINKED = "auth0|admin"; // seeded, no user_member_link

interface ConsumptionTimestamps {
  EAN: string;
  timestamps: string[];
}

/**
 * Turns the seeded meter (member 1 since 2024-01-01, open-ended) into a
 * mid-month transfer: member 1 until 2026-06-15, member 2 from 2026-06-16.
 * Seeds June-2026 readings on both sides of the hand-over, plus users linked
 * to member 2 and to both members.
 */
async function seedMidMonthTransfer(): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { MeterConsumption } = await import("../../../src/modules/meters/domain/meter.models.js");

  await AppDataSource.manager.query(`UPDATE meter_data SET end_date = '2026-06-15' WHERE ean = $1 AND id_member = 1`, [existingEAN]);
  await AppDataSource.manager.query(
    `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
     VALUES ($1, 1, 1, 1, '2026-06-16', 1, 1, 2)`,
    [existingEAN],
  );

  await AppDataSource.manager.query(
    `INSERT INTO app_user (email, first_name, last_name, auth_user_id) VALUES ('member2@test.com', 'Member', 'Two', $1)`,
    [AUTH_USER_MEMBER_2],
  );
  await AppDataSource.manager.query(
    `INSERT INTO user_member_link (id_user, id_member) SELECT id, 2 FROM app_user WHERE auth_user_id = $1`,
    [AUTH_USER_MEMBER_2],
  );
  await AppDataSource.manager.query(
    `INSERT INTO app_user (email, first_name, last_name, auth_user_id) VALUES ('member3@test.com', 'Member', 'Three', $1)`,
    [AUTH_USER_BOTH],
  );
  await AppDataSource.manager.query(
    `INSERT INTO user_member_link (id_user, id_member) SELECT u.id, m.id FROM app_user u CROSS JOIN (VALUES (1), (2)) AS m (id) WHERE u.auth_user_id = $1`,
    [AUTH_USER_BOTH],
  );

  const readings = [
    "2026-06-05T10:00:00.000Z", // Brussels June 5 → member 1's window
    "2026-06-10T10:00:00.000Z", // Brussels June 10 → member 1's window
    "2026-06-15T22:30:00.000Z", // Brussels June 16 00:30 → member 2's window
    "2026-06-20T10:00:00.000Z", // Brussels June 20 → member 2's window
  ];
  for (const timestamp of readings) {
    const entity = AppDataSource.manager.create(MeterConsumption, {
      meter: { EAN: existingEAN },
      sharing_operation: { id: 1 },
      community: { id: 1 },
      timestamp: new Date(timestamp),
      gross: 1,
      net: 1,
      shared: 0.5,
    });
    await AppDataSource.manager.save(entity);
  }
}

async function getConsumptions(user: string, query: Record<string, string> = {}): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const app = appModule.default;
  return request(app)
    .get(`/me/meters/${existingEAN}/consumptions`)
    .query(query)
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_MEMBER);
}

describe("(Functional) Me meter consumptions — ownership-window scoping", () => {
  useFunctionalTestDb();

  it("shows the first owner only the readings inside their window", async () => {
    await seedMidMonthTransfer();

    const response = await getConsumptions(AUTH_USER_MEMBER_1, { date_start: "2026-06-01", date_end: "2026-06-30" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.timestamps).toEqual(["2026-06-05T10:00:00.000Z", "2026-06-10T10:00:00.000Z"]);
    });
  });

  it("shows the second owner only the readings from their start date, at Brussels-local day precision", async () => {
    await seedMidMonthTransfer();

    // No date filter: the window itself must exclude everything before June 16
    // Brussels time — including the seeded 2024 reading and the first half of
    // June, but including the 22:30 UTC instant that is already June 16 locally.
    const response = await getConsumptions(AUTH_USER_MEMBER_2);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.timestamps).toEqual(["2026-06-15T22:30:00.000Z", "2026-06-20T10:00:00.000Z"]);
    });
  });

  it("shows a user representing both members the full timeline", async () => {
    await seedMidMonthTransfer();

    const response = await getConsumptions(AUTH_USER_BOTH, { date_start: "2026-06-01", date_end: "2026-06-30" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.timestamps).toEqual([
        "2026-06-05T10:00:00.000Z",
        "2026-06-10T10:00:00.000Z",
        "2026-06-15T22:30:00.000Z",
        "2026-06-20T10:00:00.000Z",
      ]);
    });
  });

  it("returns empty series for a user with no member link to the meter", async () => {
    await seedMidMonthTransfer();

    const response = await getConsumptions(AUTH_USER_UNLINKED);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.EAN).toBe(existingEAN);
      expect(data.timestamps).toEqual([]);
    });
  });

  it("rejects the request when the user header is missing", async () => {
    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app).get(`/me/meters/${existingEAN}/consumptions`).set("x-community-id", AUTH_COMMUNITY_1);

    expect(response.status).toBe(400);
  });
});
