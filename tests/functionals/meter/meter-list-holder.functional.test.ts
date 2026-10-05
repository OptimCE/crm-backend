import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { existingEAN, existingEAN2 } from "./meter.const.js";

// Seeded wind meters W1..W4 of community 1, held by members 4..7 since 2024-01-01.
const WIND_1 = "541448200000000001";
const WIND_2 = "541448200000000002";
const WIND_3 = "541448200000000003";
const WIND_4 = "541448200000000004";

interface ListedMeter {
  EAN: string;
  status: number;
  holder?: { id: number; name: string; member_type: number; status: number };
}

/** Every request is made by a manager of community 1, the role the live-data picker runs under. */
async function list(query: Record<string, string>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get("/meters/")
    .query(query)
    .set("x-user-id", "auth0|admin")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_GESTIONNAIRE);
}

async function sql(statement: string, params: unknown[]): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(statement, params);
}

/**
 * The list names the holder of each meter's window in force. It used to join that window but not
 * its member, so the Holder column always read "/" and the live-data device picker could not label
 * a meter by its holder.
 */
describe("(Functional) GET /meters/ names each meter's current holder", () => {
  useFunctionalTestDb();

  it("returns the holder as a partial member, and nothing more", async () => {
    const response = await list({ EAN: WIND_1 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([WIND_1]);
      // toEqual rejects extra keys: the member's IBAN and addresses never leave.
      expect(meters[0].holder).toEqual({ id: 4, name: "Wind Producer Alpha", member_type: MemberType.INDIVIDUAL, status: MemberStatus.ACTIVE });
    });
  });

  it("names a company holder the same way", async () => {
    const response = await list({ EAN: existingEAN2 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([existingEAN2]);
      expect(meters[0].holder).toEqual({ id: 2, name: "Member Two", member_type: MemberType.COMPANY, status: MemberStatus.ACTIVE });
    });
  });

  it("names every holder on the ACTIVE list the live-data picker loads, one row per meter", async () => {
    const response = await list({ status: String(MeterDataStatus.ACTIVE), page: "1", limit: "500" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(Object.fromEntries(meters.map((m) => [m.EAN, m.holder?.id]))).toEqual(
        expect.objectContaining({ [existingEAN]: 1, [existingEAN2]: 2, [WIND_1]: 4, [WIND_2]: 5, [WIND_3]: 6, [WIND_4]: 7 }),
      );
      // The member join is many-to-one: it must neither duplicate a meter nor move the count the
      // pagination is built from.
      expect(new Set(meters.map((m) => m.EAN)).size).toBe(meters.length);
      expect(response.body.pagination.total).toBe(meters.length);
    });
  });

  it("still filters by holder_id, which reads the same relation", async () => {
    const response = await list({ holder_id: "4" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => [m.EAN, m.holder?.id])).toEqual([[WIND_1, 4]]);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  it("omits the holder when the window in force has none", async () => {
    await sql("UPDATE meter_data SET id_member = NULL WHERE ean = $1", [existingEAN]);

    const response = await list({ EAN: existingEAN });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([existingEAN]);
      expect(meters[0].status).toBe(MeterDataStatus.ACTIVE);
      expect(meters[0]).not.toHaveProperty("holder");
    });
  });

  it("does not name the holder of a past window", async () => {
    // The seeded window keeps member 1; it simply is no longer in force.
    await sql("UPDATE meter_data SET end_date = '2024-12-31' WHERE ean = $1", [existingEAN]);

    const response = await list({ EAN: existingEAN });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([existingEAN]);
      expect(meters[0].status).toBe(MeterDataStatus.INACTIVE);
      expect(meters[0]).not.toHaveProperty("holder");
    });
  });
});
