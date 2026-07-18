import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, existingEAN } from "./meter.const.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

interface ConsumptionTimestamps {
  timestamps: string[];
}

async function seedMeterConsumptions(
  rows: { timestamp: Date; gross?: number }[],
): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { MeterConsumption } = await import("../../../src/modules/meters/domain/meter.models.js");

  for (const row of rows) {
    const entity = AppDataSource.manager.create(MeterConsumption, {
      meter: { EAN: existingEAN },
      sharing_operation: { id: 1 },
      community: { id: 1 },
      timestamp: row.timestamp,
      gross: row.gross ?? 1,
      net: row.gross ?? 1,
      shared: 0,
    });
    await AppDataSource.manager.save(entity);
  }
}

describe("(Functional) Meter consumption Brussels date filters", () => {
  useFunctionalTestDb();

  it("includes Brussels Feb 1 00:00 stored as prior-day UTC instant", async () => {
    await seedMeterConsumptions([{ timestamp: new Date("2025-01-31T23:00:00.000Z") }]);

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .get(`/meters/${existingEAN}/consumptions`)
      .query({ date_start: "2025-02-01", date_end: "2025-02-01" })
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.timestamps).toHaveLength(1);
      expect(data.timestamps[0]).toBe("2025-01-31T23:00:00.000Z");
    });
  });

  it("includes Brussels end-of-day on date_end and excludes next local midnight", async () => {
    await seedMeterConsumptions([
      { timestamp: new Date("2025-02-28T22:45:00.000Z") },
      { timestamp: new Date("2025-02-28T23:00:00.000Z") },
    ]);

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .get(`/meters/${existingEAN}/consumptions`)
      .query({ date_start: "2025-02-01", date_end: "2025-02-28" })
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const data = response.body.data as ConsumptionTimestamps;
      expect(data.timestamps).toHaveLength(1);
      expect(data.timestamps[0]).toBe("2025-02-28T22:45:00.000Z");
    });
  });
});
