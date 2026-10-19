import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { ClientType, MeterDataStatus, MeterRate, ReadingFrequency, TarifGroup } from "../../../src/modules/meters/shared/meter.types.js";
import { AUTH_COMMUNITY_1, existingEAN, newEAN } from "./meter.const.js";

interface GrdRow {
  start_date: string;
  grd: string | null;
  grd_source: string | null;
  grd_data_version: string | null;
}

async function send(method: "post" | "patch", path: string, body: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = method === "post" ? agent.post(path) : agent.patch(path);
  return req.send(body).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
}

async function grdRows(ean: string): Promise<GrdRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(
    `SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date, grd, grd_source, grd_data_version
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [ean],
  );
}

/**
 * meter_data.grd stores the DSO's stable id, and grd_source / grd_data_version
 * record where it came from. The three travel together on both repository
 * paths: a new window and a same-day correction. The seeded meter has one
 * window since 2024-01-01 and no grd at all, like every row older than the
 * 2026-10-13 script.
 */
describe("(Functional) meter_data GRD provenance", () => {
  useFunctionalTestDb();

  const dialogPayload = (start_date: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    EAN: existingEAN,
    start_date,
    status: MeterDataStatus.ACTIVE,
    rate: MeterRate.SIMPLE,
    client_type: ClientType.RESIDENTIAL,
    member_id: 1,
    ...extra,
  });

  it("stores a prefilled GRD as its id, with its source and data version, on a new meter", async () => {
    const response = await send("post", "/meters/", {
      EAN: newEAN,
      meter_number: "M999",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: { street: "Rue de Fer", number: "1", postcode: "5000", city: "Namur" },
      initial_data: {
        start_date: "2026-10-01",
        status: MeterDataStatus.ACTIVE,
        rate: MeterRate.SIMPLE,
        client_type: ClientType.RESIDENTIAL,
        grd: "ores",
        grd_source: "auto",
        grd_data_version: "2026.10.0-draft",
      },
    });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await grdRows(newEAN)).toEqual([{ start_date: "2026-10-01", grd: "ores", grd_source: "auto", grd_data_version: "2026.10.0-draft" }]);
  });

  it("rewrites a legacy display name to its id", async () => {
    const response = await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "Fluvius Midden-Vlaanderen", grd_source: "manual" }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await grdRows(existingEAN)).at(-1)).toEqual({
      start_date: "2025-01-01",
      grd: "fluvius-midden-vlaanderen",
      grd_source: "manual",
      grd_data_version: null,
    });
  });

  it("carries grd, source and version over to a later window that omits grd", async () => {
    await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }));
    const response = await send("patch", "/meters/data", dialogPayload("2025-06-01", { status: MeterDataStatus.INACTIVE }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await grdRows(existingEAN)).map((r) => [r.start_date, r.grd, r.grd_source, r.grd_data_version])).toEqual([
      ["2024-01-01", null, null, null],
      ["2025-01-01", "resa", "auto", "2026.10.0"],
      ["2025-06-01", "resa", "auto", "2026.10.0"],
    ]);
  });

  it("does not keep the old provenance next to a new grd sent without one", async () => {
    await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }));
    const response = await send("patch", "/meters/data", dialogPayload("2025-06-01", { grd: "ores" }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await grdRows(existingEAN)).at(-1)).toEqual({ start_date: "2025-06-01", grd: "ores", grd_source: null, grd_data_version: null });
  });

  it("clears the provenance on a same-day correction that changes grd without one", async () => {
    await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }));
    const response = await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "aieg" }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await grdRows(existingEAN)).at(-1)).toEqual({ start_date: "2025-01-01", grd: "aieg", grd_source: null, grd_data_version: null });
  });

  it("keeps all three on a same-day correction that omits grd, ignoring a stray provenance", async () => {
    await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }));
    const response = await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd_source: "manual" }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await grdRows(existingEAN)).at(-1)).toEqual({ start_date: "2025-01-01", grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" });
  });

  it("refuses an unknown grd_source without writing anything", async () => {
    const response = await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "guessed" }));

    expect(response.status).toBe(422);
    expect(await grdRows(existingEAN)).toHaveLength(1);
  });

  it("serves the provenance on GET /meters/:ean", async () => {
    await send("patch", "/meters/data", dialogPayload("2025-01-01", { grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }));
    const appModule = await import("../../../src/app.js");
    const response = await request(appModule.default)
      .get(`/meters/${existingEAN}`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(response.body.data.meter_data).toEqual(
      expect.objectContaining({ start_date: "2025-01-01", grd: "resa", grd_source: "auto", grd_data_version: "2026.10.0" }),
    );
    // Rows older than the prefill have no provenance: null, not a guess.
    expect(response.body.data.meter_data_history).toEqual([
      expect.objectContaining({ start_date: "2024-01-01", grd: "", grd_source: null, grd_data_version: null }),
    ]);
  });
});
