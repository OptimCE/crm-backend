import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { ClientType, MeterDataStatus, MeterRate } from "../../../src/modules/meters/shared/meter.types.js";
import { AUTH_COMMUNITY_1, existingEAN } from "./meter.const.js";

interface MeterDataRow {
  start_date: string;
  end_date: string | null;
  id_member: number | null;
  id_sharing_operation: number | null;
}

/**
 * The shape the meter-data update dialog sends: the full configuration, including the holder,
 * but never `sharing_operation_id` — membership of a sharing operation is managed elsewhere.
 * The seeded meter belongs to member 1 and sharing operation 1 since 2024-01-01.
 */
function dialogPayload(start_date: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    EAN: existingEAN,
    start_date,
    status: MeterDataStatus.ACTIVE,
    rate: MeterRate.BI_HORAIRE,
    client_type: ClientType.RESIDENTIAL,
    member_id: 1,
    ...extra,
  };
}

async function patchMeterData(body: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .patch("/meters/data")
    .send(body)
    .set("x-user-id", "auth0|admin")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_ADMIN);
}

async function meterDataRows(): Promise<MeterDataRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(
    `SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
            id_member, id_sharing_operation
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [existingEAN],
  );
}

describe("(Functional) PATCH /meters/data keeps the sharing operation", () => {
  useFunctionalTestDb();

  it("keeps the sharing operation on the new window when none is sent", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await meterDataRows()).toEqual([
      { start_date: "2024-01-01", end_date: "2024-12-31", id_member: 1, id_sharing_operation: 1 },
      { start_date: "2025-01-01", end_date: null, id_member: 1, id_sharing_operation: 1 },
    ]);
  });

  it("keeps the sharing operation when the current window is updated in place", async () => {
    const response = await patchMeterData(dialogPayload("2024-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await meterDataRows()).toEqual([{ start_date: "2024-01-01", end_date: null, id_member: 1, id_sharing_operation: 1 }]);
  });

  it("keeps the sharing operation while the holder is transferred", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01", { member_id: 2 }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await meterDataRows()).toEqual([
      { start_date: "2024-01-01", end_date: "2024-12-31", id_member: 1, id_sharing_operation: 1 },
      { start_date: "2025-01-01", end_date: null, id_member: 2, id_sharing_operation: 1 },
    ]);
  });

  it("still moves the meter to the sharing operation it is given", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01", { sharing_operation_id: 2 }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual({ start_date: "2025-01-01", end_date: null, id_member: 1, id_sharing_operation: 2 });
  });

  it("still removes the meter from its sharing operation on an explicit null", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01", { sharing_operation_id: null }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual({ start_date: "2025-01-01", end_date: null, id_member: 1, id_sharing_operation: null });
  });
});
