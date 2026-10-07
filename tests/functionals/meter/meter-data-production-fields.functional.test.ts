import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { ClientType, InjectionStatus, MeterDataStatus, MeterRate, ProductionChain } from "../../../src/modules/meters/shared/meter.types.js";
import { AUTH_COMMUNITY_1, existingEAN } from "./meter.const.js";

interface ProductionFields {
  start_date: string;
  injection_status: number | null;
  production_chain: number | null;
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

async function productionFields(): Promise<ProductionFields[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(
    `SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date, injection_status, production_chain
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [existingEAN],
  );
}

/**
 * "No production" (the dialog's "Aucun") is stored as null. The update dialog sends it as an explicit
 * null, which must clear a producer's values on both repository paths, while an omitted field keeps
 * them. The seeded meter is a photovoltaic self-producer (injection status 1, chain 1) since 2024-01-01.
 */
describe("(Functional) PATCH /meters/data clears the production fields on an explicit null", () => {
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

  it("clears them on a new window", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01", { injection_status: null, production_chain: null }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await productionFields()).toEqual([
      { start_date: "2024-01-01", injection_status: InjectionStatus.AUTOPROD_OWNER, production_chain: ProductionChain.PHOTOVOLTAIC },
      { start_date: "2025-01-01", injection_status: null, production_chain: null },
    ]);
  });

  it("clears them when the current window is updated in place", async () => {
    const response = await patchMeterData(dialogPayload("2024-01-01", { injection_status: null, production_chain: null }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await productionFields()).toEqual([{ start_date: "2024-01-01", injection_status: null, production_chain: null }]);
  });

  it("keeps them on a new window when they are omitted", async () => {
    const response = await patchMeterData(dialogPayload("2025-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await productionFields()).map((r) => [r.injection_status, r.production_chain])).toEqual([
      [InjectionStatus.AUTOPROD_OWNER, ProductionChain.PHOTOVOLTAIC],
      [InjectionStatus.AUTOPROD_OWNER, ProductionChain.PHOTOVOLTAIC],
    ]);
  });

  it("keeps them when the current window is updated in place and they are omitted", async () => {
    const response = await patchMeterData(dialogPayload("2024-01-01"));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await productionFields()).map((r) => [r.injection_status, r.production_chain])).toEqual([
      [InjectionStatus.AUTOPROD_OWNER, ProductionChain.PHOTOVOLTAIC],
    ]);
  });

  it("carries a cleared value over to a later window that omits it", async () => {
    await patchMeterData(dialogPayload("2025-01-01", { injection_status: null, production_chain: null }));
    const response = await patchMeterData(dialogPayload("2025-06-01", { status: MeterDataStatus.INACTIVE }));

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect((await productionFields()).map((r) => [r.injection_status, r.production_chain])).toEqual([
      [InjectionStatus.AUTOPROD_OWNER, ProductionChain.PHOTOVOLTAIC],
      [null, null],
      [null, null],
    ]);
  });

  it("serves the cleared values as null, which the dialog reopens as 'Aucun'", async () => {
    await patchMeterData(dialogPayload("2025-01-01", { injection_status: null, production_chain: null }));
    const appModule = await import("../../../src/app.js");
    const response = await request(appModule.default)
      .get(`/meters/${existingEAN}`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(response.body.data.meter_data).toEqual(
      expect.objectContaining({ start_date: "2025-01-01", injection_status: null, production_chain: null }),
    );
  });
});
