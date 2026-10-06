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
  status: number;
  id_member: number | null;
  id_sharing_operation: number | null;
}

type Method = "patch" | "post" | "delete";

async function send(method: Method, url: string, body: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  return agent[method](url).send(body).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
}

async function meterDataRows(): Promise<MeterDataRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(
    `SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
            status, id_member, id_sharing_operation
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [existingEAN],
  );
}

/**
 * Flows that only change part of a meter's configuration must carry its holder over to the new
 * window. The seeded meter belongs to member 1 and sharing operation 1 since 2024-01-01.
 */
describe("(Functional) A new meter-data window keeps the holder", () => {
  useFunctionalTestDb();

  it("when the meter is deactivated", async () => {
    const response = await send("patch", "/meters/data/deactivate", { EAN: existingEAN, date: "2025-01-01" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual(expect.objectContaining({ start_date: "2025-01-01", status: MeterDataStatus.INACTIVE, id_member: 1 }));
  });

  it("when the meter is deactivated on the day its current window starts", async () => {
    const response = await send("patch", "/meters/data/deactivate", { EAN: existingEAN, date: "2024-01-01" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await meterDataRows()).toEqual([expect.objectContaining({ status: MeterDataStatus.INACTIVE, id_member: 1 })]);
  });

  it("when the meter is added to a sharing operation", async () => {
    const response = await send("post", "/sharing_operations/meter", { id_sharing: 2, date: "2025-01-01", ean_list: [existingEAN] });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual(
      expect.objectContaining({ start_date: "2025-01-01", status: MeterDataStatus.WAITING_GRD, id_member: 1, id_sharing_operation: 2 }),
    );
  });

  it("when the meter's status in its sharing operation changes", async () => {
    const response = await send("patch", "/sharing_operations/meter", {
      id_sharing: 1,
      id_meter: existingEAN,
      status: MeterDataStatus.WAITING_MANAGER,
      date: "2025-01-01",
    });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual(
      expect.objectContaining({ start_date: "2025-01-01", status: MeterDataStatus.WAITING_MANAGER, id_member: 1, id_sharing_operation: 1 }),
    );
  });

  it("when the meter is removed from its sharing operation", async () => {
    const response = await send("delete", "/sharing_operations/1/meter", { id_sharing: 1, id_meter: existingEAN, date: "2025-01-01" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows[1]).toEqual(
      expect.objectContaining({ start_date: "2025-01-01", status: MeterDataStatus.INACTIVE, id_member: 1, id_sharing_operation: null }),
    );
  });
});

/**
 * The update dialog always sends the holder it shows, so an absent `member_id` means "no holder".
 * Carrying the previous holder over must not override that, on either repository path.
 */
describe("(Functional) PATCH /meters/data sets exactly the holder it is sent", () => {
  useFunctionalTestDb();

  const dialogPayload = (start_date: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    EAN: existingEAN,
    start_date,
    status: MeterDataStatus.ACTIVE,
    rate: MeterRate.SIMPLE,
    client_type: ClientType.RESIDENTIAL,
    ...extra,
  });

  it("clears the holder on a new window", async () => {
    const response = await send("patch", "/meters/data", dialogPayload("2025-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    const rows = await meterDataRows();
    expect(rows.map((r) => r.id_member)).toEqual([1, null]);
  });

  it("clears the holder when the current window is updated in place", async () => {
    const response = await send("patch", "/meters/data", dialogPayload("2024-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await meterDataRows()).map((r) => r.id_member)).toEqual([null]);
  });

  it("transfers the holder when the current window is updated in place", async () => {
    const response = await send("patch", "/meters/data", dialogPayload("2024-01-01", { member_id: 2 }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await meterDataRows()).map((r) => r.id_member)).toEqual([2]);
  });
});

/**
 * Deactivating a meter ends its participation in its sharing operation, whatever the date — the
 * same state the sharing operation's own "remove meter" flow writes (INACTIVE, no operation).
 */
describe("(Functional) Deactivating a meter takes it out of its sharing operation", () => {
  useFunctionalTestDb();

  it("on a later date", async () => {
    const response = await send("patch", "/meters/data/deactivate", { EAN: existingEAN, date: "2025-01-01" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await meterDataRows()).map((r) => r.id_sharing_operation)).toEqual([1, null]);
  });

  it("on the day its current window starts", async () => {
    const response = await send("patch", "/meters/data/deactivate", { EAN: existingEAN, date: "2024-01-01" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await meterDataRows()).map((r) => r.id_sharing_operation)).toEqual([null]);
  });
});

describe("(Functional) PATCH /meters/data records the holder change in the audit log", () => {
  useFunctionalTestDb();

  async function lastMeterDataUpdate(): Promise<Record<string, unknown>> {
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    const rows: { payload: Record<string, unknown> }[] = await AppDataSource.manager.query(
      `SELECT payload FROM audit_log WHERE action = 'crm.meter_data.updated' ORDER BY id DESC LIMIT 1`,
    );
    return rows[0]?.payload ?? {};
  }

  it("records the previous and the new holder of a transfer", async () => {
    const response = await send("patch", "/meters/data", {
      EAN: existingEAN,
      start_date: "2025-01-01",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
      member_id: 2,
    });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await lastMeterDataUpdate()).toEqual(expect.objectContaining({ meter_ean: existingEAN, previous_member_id: 1, member_id: 2 }));
  });

  it("records a removed holder as null", async () => {
    const response = await send("patch", "/meters/data", {
      EAN: existingEAN,
      start_date: "2025-01-01",
      status: MeterDataStatus.ACTIVE,
      rate: MeterRate.SIMPLE,
      client_type: ClientType.RESIDENTIAL,
    });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await lastMeterDataUpdate()).toEqual(expect.objectContaining({ previous_member_id: 1, member_id: null }));
  });
});
