import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, existingSharingOpId1, existingSharingOpId2 } from "./sharing_op.const.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

interface CoverageEntry {
  month: string;
  count: number;
}

// Op 3 belongs to community 2 (Other Community); used to prove tenant scoping.
const otherCommunityOpId = 3;

/**
 * Seeds aggregated sharing-op consumption rows directly (mirrors the
 * meter-consumption-dates functional seeding helper).
 */
async function seedSharingOpConsumptions(rows: { timestamp: Date; opId: number; communityId: number }[]): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { SharingOpConsumption } = await import("../../../src/modules/sharing_operations/domain/sharing_operation.models.js");

  for (const row of rows) {
    const entity = AppDataSource.manager.create(SharingOpConsumption, {
      sharing_operation: { id: row.opId },
      community: { id: row.communityId },
      timestamp: row.timestamp,
      gross: 1,
      net: 1,
      shared: 0,
    });
    await AppDataSource.manager.save(entity);
  }
}

describe("(Functional) Sharing operation consumption coverage", () => {
  useFunctionalTestDb();

  it("aggregates rows by Brussels month, counts, orders ascending, and honours the month boundary", async () => {
    // Op 1 already has one seeded row at 2024-01-01 12:00Z (Brussels 13:00 -> 2024-01).
    await seedSharingOpConsumptions([
      // Brussels-local 2026-01-31 23:45 (CET = UTC+1) -> must land in 2026-01, NOT 2026-02.
      { timestamp: new Date("2026-01-31T22:45:00.000Z"), opId: existingSharingOpId1, communityId: 1 },
      // Two rows in February -> count 2.
      { timestamp: new Date("2026-02-15T10:00:00.000Z"), opId: existingSharingOpId1, communityId: 1 },
      { timestamp: new Date("2026-02-20T10:00:00.000Z"), opId: existingSharingOpId1, communityId: 1 },
      // UTC 2026-02-28 23:30 = Brussels-local 2026-03-01 00:30 -> must land in 2026-03, NOT 2026-02.
      { timestamp: new Date("2026-02-28T23:30:00.000Z"), opId: existingSharingOpId1, communityId: 1 },
    ]);

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .get(`/sharing_operations/${existingSharingOpId1}/consumptions/coverage`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);

      const data = response.body.data as CoverageEntry[];

      // Ascending by month, aggregated counts, Brussels calendar boundaries.
      expect(data).toEqual([
        { month: "2024-01", count: 1 }, // pre-seeded in init.sql
        { month: "2026-01", count: 1 }, // Brussels 2026-01-31 23:45 stays in January
        { month: "2026-02", count: 2 }, // the two February rows only
        { month: "2026-03", count: 1 }, // Brussels 2026-03-01 00:30 rolled into March
      ]);

      // count must be a JSON number (Postgres COUNT bigint coerced in the mapper).
      expect(typeof data[0].count).toBe("number");

      // Ascending order sanity check.
      const months = data.map((d) => d.month);
      expect(months).toEqual([...months].sort());
    });
  });

  it("returns an empty array (HTTP 200) when the operation has no consumption data", async () => {
    // Op 2 belongs to community 1 but has no seeded consumption rows.
    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .get(`/sharing_operations/${existingSharingOpId2}/consumptions/coverage`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      expect(response.body.data).toEqual([]);
    });
  });

  it("scopes to the caller's community (no cross-tenant coverage leakage)", async () => {
    // Seed a row for op 3, which belongs to community 2 (Other Community).
    await seedSharingOpConsumptions([
      { timestamp: new Date("2026-05-10T10:00:00.000Z"), opId: otherCommunityOpId, communityId: 2 },
    ]);

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    // Caller is authenticated for community 1; op 3 is in community 2 -> must see nothing.
    const response = await request(app)
      .get(`/sharing_operations/${otherCommunityOpId}/consumptions/coverage`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      expect(response.body.data).toEqual([]);
    });
  });
});
