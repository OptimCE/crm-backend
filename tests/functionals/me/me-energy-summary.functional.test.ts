import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { MeEnergyMeterDTO, MeEnergySummaryDTO } from "../../../src/modules/me/api/me.dtos.js";

/** Seeded, holds EAN_ONE since 2024-01-01 with no end date. */
const AUTH_USER_MEMBER_1 = "auth0|member";
/** Seeded, has no user_member_link row at all. */
const AUTH_USER_UNLINKED = "auth0|admin";
/** Created per test; linked to whichever member the test needs. */
const AUTH_USER_SECOND = "auth0|second-holder";

const EAN_ONE = "123456789012345678"; // member 1, community 1
const MONTH = "2026-03";

async function sql(query: string, params: unknown[] = []): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(query, params);
}

async function linkUserToMember(auth_user_id: string, email: string, id_member: number): Promise<void> {
  await sql(`INSERT INTO app_user (email, first_name, last_name, auth_user_id) VALUES ($1, 'Test', 'User', $2)`, [email, auth_user_id]);
  await sql(`INSERT INTO user_member_link (id_user, id_member) SELECT id, $2 FROM app_user WHERE auth_user_id = $1`, [
    auth_user_id,
    id_member,
  ]);
}

/**
 * One reading on a given local day. The timestamp is written in UTC and the
 * endpoint buckets it by Brussels calendar day, so 12:00Z is unambiguously the
 * same civil day in either offset.
 */
async function addReading(ean: string, day: string, gross: number, shared: number): Promise<void> {
  await sql(
    `INSERT INTO meter_consumption (ean, id_sharing_operation, timestamp, gross, net, shared, id_community)
     VALUES ($1, 1, $2, $3, $3, $4, 1)`,
    [ean, `${day} 12:00:00+00`, gross, shared],
  );
}

async function getSummary(user: string, query: Record<string, string> = {}): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get("/me/energy-summary")
    .query(query)
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_MEMBER);
}

function body(response: request.Response): MeEnergySummaryDTO {
  return response.body.data as MeEnergySummaryDTO;
}

function meterFor(response: request.Response, ean: string): MeEnergyMeterDTO | undefined {
  return body(response).meters.find((m) => m.ean === ean);
}

describe("(Functional) GET /me/energy-summary", () => {
  useFunctionalTestDb();

  describe("authorization", () => {
    it("refuses a request with no user id", async () => {
      const appModule = await import("../../../src/app.js");
      const response = await request(appModule.default).get("/me/energy-summary");
      await expectWithLog(response, () => {
        // `idChecker` answers 400 UNAUTHENTICATED, not 401 — see user.check.middleware.
        expect(response.status).toBe(400);
      });
    });

    it("returns an empty summary for a user linked to no member", async () => {
      await addReading(EAN_ONE, `${MONTH}-05`, 4, 1);

      const response = await getSummary(AUTH_USER_UNLINKED, { month: MONTH });

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        // 200 with nothing, not 403: refusing would leak whether the caller
        // represents anybody, and "you hold no meters" is a real answer.
        expect(body(response).meters).toEqual([]);
        expect(body(response).totals.gross_kwh).toBe(0);
      });
    });

    /**
     * The reason this endpoint uses the windowed ownership predicate rather than
     * `getMeters`' looser "any member of mine ever held this EAN". Without the
     * window, the member who transferred the meter away would keep seeing the
     * new holder's consumption — and mid-month meter transfer is a modelled
     * case in this product, not a hypothetical one.
     */
    it("excludes readings taken after the caller stopped holding the meter", async () => {
      // Member 1 holds EAN_ONE until 2026-03-10; member 2 holds it from the 11th.
      await sql(`UPDATE meter_data SET end_date = $1 WHERE ean = $2 AND id_member = 1`, [`${MONTH}-10`, EAN_ONE]);
      await sql(
        `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
         VALUES ($1, 1, 1, 1, $2, 1, 1, 2)`,
        [EAN_ONE, `${MONTH}-11`],
      );
      await addReading(EAN_ONE, `${MONTH}-05`, 10, 3); // member 1's
      await addReading(EAN_ONE, `${MONTH}-20`, 99, 88); // member 2's

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        const meter = meterFor(response, EAN_ONE);
        expect(meter?.totals.gross_kwh).toBe(10);
        expect(meter?.totals.shared_kwh).toBe(3);
      });
    });

    it("gives each holder of the same meter only their own slice", async () => {
      await sql(`UPDATE meter_data SET end_date = $1 WHERE ean = $2 AND id_member = 1`, [`${MONTH}-10`, EAN_ONE]);
      await sql(
        `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
         VALUES ($1, 1, 1, 1, $2, 1, 1, 2)`,
        [EAN_ONE, `${MONTH}-11`],
      );
      await linkUserToMember(AUTH_USER_SECOND, "second@holder.test", 2);
      await addReading(EAN_ONE, `${MONTH}-05`, 10, 3);
      await addReading(EAN_ONE, `${MONTH}-20`, 7, 2);

      const [first, second] = await Promise.all([
        getSummary(AUTH_USER_MEMBER_1, { month: MONTH }),
        getSummary(AUTH_USER_SECOND, { month: MONTH }),
      ]);

      await expectWithLog(first, () => {
        expect(meterFor(first, EAN_ONE)?.totals.gross_kwh).toBe(10);
      });
      await expectWithLog(second, () => {
        expect(meterFor(second, EAN_ONE)?.totals.gross_kwh).toBe(7);
      });
    });
  });

  describe("the period", () => {
    it("summarises the requested month, inclusive of both boundary days", async () => {
      await addReading(EAN_ONE, `${MONTH}-01`, 1, 0);
      await addReading(EAN_ONE, `${MONTH}-31`, 2, 0);
      await addReading(EAN_ONE, "2026-04-01", 100, 0); // outside

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        expect(body(response).period).toEqual({ start: "2026-03-01", end: "2026-03-31" });
        expect(meterFor(response, EAN_ONE)?.totals.gross_kwh).toBe(3);
      });
    });

    it("resolves February to the 28th or 29th rather than a fixed length", async () => {
      const response = await getSummary(AUTH_USER_MEMBER_1, { month: "2024-02" });

      await expectWithLog(response, () => {
        // 2024 is a leap year; a naive `start + 30 days` would say 03-02.
        expect(body(response).period).toEqual({ start: "2024-02-01", end: "2024-02-29" });
      });
    });

    it("defaults to a month that is already over", async () => {
      const response = await getSummary(AUTH_USER_MEMBER_1);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        const today = new Date();
        const firstOfThisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
        // A partial month is not comparable to anything: a member opening the
        // app on the 2nd would read two days of data as a collapse in usage.
        expect(body(response).period.end < firstOfThisMonth).toBe(true);
      });
    });

    it("rejects a month that is not YYYY-MM", async () => {
      const response = await getSummary(AUTH_USER_MEMBER_1, { month: "2026-13" });
      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
      });
    });
  });

  describe("the numbers", () => {
    it("sums every reading in the window and totals across meters", async () => {
      await addReading(EAN_ONE, `${MONTH}-05`, 1.5, 0.5);
      await addReading(EAN_ONE, `${MONTH}-06`, 2.25, 0.75);

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        const meter = meterFor(response, EAN_ONE);
        expect(meter?.totals.gross_kwh).toBe(3.75);
        expect(meter?.totals.shared_kwh).toBe(1.25);
        expect(meter?.has_data).toBe(true);
        expect(body(response).totals.gross_kwh).toBe(3.75);
      });
    });

    it("returns numbers, not the strings node-postgres hands back", async () => {
      await addReading(EAN_ONE, `${MONTH}-05`, 1, 0.5);

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        const meter = meterFor(response, EAN_ONE);
        // COUNT() and SUM() come back as strings for some column types. Left
        // uncoerced, the frontend concatenates instead of adding.
        expect(typeof meter?.totals.gross_kwh).toBe("number");
        expect(typeof body(response).totals.shared_kwh).toBe("number");
      });
    });

    /**
     * The distinction this endpoint exists to preserve. A meter with no readings
     * must be ABSENT, so the client can say "no reading yet" — rendering it as
     * `0 kWh` would tell the member they consumed nothing, which is a different
     * and false statement.
     */
    it("omits a meter that produced no reading in the window", async () => {
      await addReading(EAN_ONE, "2026-01-15", 42, 10); // a different month

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(meterFor(response, EAN_ONE)).toBeUndefined();
        expect(body(response).totals.gross_kwh).toBe(0);
      });
    });
  });

  describe("cross-community", () => {
    it("answers with no active-community header at all", async () => {
      await addReading(EAN_ONE, `${MONTH}-05`, 4, 1);

      const appModule = await import("../../../src/app.js");
      const response = await request(appModule.default)
        .get("/me/energy-summary")
        .query({ month: MONTH })
        .set("x-user-id", AUTH_USER_MEMBER_1);

      await expectWithLog(response, () => {
        // The whole point: the user dashboard renders before a community is
        // picked, so `contextMiddleware` leaves community_id and role undefined.
        expect(response.status).toBe(200);
        expect(meterFor(response, EAN_ONE)?.totals.gross_kwh).toBe(4);
      });
    });

    it("carries the owning community on every meter", async () => {
      await addReading(EAN_ONE, `${MONTH}-05`, 4, 1);

      const response = await getSummary(AUTH_USER_MEMBER_1, { month: MONTH });

      await expectWithLog(response, () => {
        const meter = meterFor(response, EAN_ONE);
        expect(meter?.community.id).toBe(1);
        expect(meter?.community.name).toBeTruthy();
      });
    });
  });
});
