import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { SharingOperationMetersQueryType } from "../../../src/modules/sharing_operations/api/sharing_operation.dtos.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { existingEAN, existingSharingOpId1, existingSharingOpId2, newWindMeterEANs } from "./sharing_op.const.js";

// Seeded on Op 2 since 2024-01-01: the company meter of member 2, and wind meters W1..W4 held by
// members 4..7. Op 1 holds existingEAN, held by member 1.
const COMPANY_EAN = "987654321098765432";
const [WIND_1, WIND_2, WIND_3, WIND_4] = newWindMeterEANs;
const OP_2_HOLDERS = { [COMPANY_EAN]: 2, [WIND_1]: 4, [WIND_2]: 5, [WIND_3]: 6, [WIND_4]: 7 };

const COMMUNITY_1 = { auth_id: AUTH_COMMUNITY_1, orgs: ORGS_GESTIONNAIRE, user: "auth0|admin" };
const COMMUNITY_2 = { auth_id: "2", orgs: "[orgId:2 orgPath:/org2 roles:[MANAGER]]", user: "auth0|manager" };

interface ListedMeter {
  EAN: string;
  holder?: { id: number; name: string; member_type: number; status: number };
}

async function list(id_sharing: number, query: Record<string, string | number>, caller = COMMUNITY_1): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get(`/sharing_operations/${id_sharing}/meters`)
    .query(query)
    .set("x-user-id", caller.user)
    .set("x-community-id", caller.auth_id)
    .set("x-user-orgs", caller.orgs);
}

async function sql(statement: string, params: unknown[]): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(statement, params);
}

function holdersByEan(meters: ListedMeter[]): Record<string, number | undefined> {
  return Object.fromEntries(meters.map((m) => [m.EAN, m.holder?.id]));
}

/**
 * The operation's meter list names the holder of the record it exposes for each meter. It used to
 * join that record but not its member, so the Holder column of the import dialog always read "—".
 */
describe("(Functional) GET /sharing_operations/:id/meters names each meter's holder", () => {
  useFunctionalTestDb();

  it("returns the holder as a partial member, and nothing more", async () => {
    const response = await list(existingSharingOpId1, { type: SharingOperationMetersQueryType.NOW });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([existingEAN]);
      // toEqual rejects extra keys: the member's IBAN and addresses never leave.
      expect(meters[0].holder).toEqual({ id: 1, name: "Member One", member_type: MemberType.INDIVIDUAL, status: MemberStatus.ACTIVE });
    });
  });

  it("names a company holder the same way", async () => {
    const response = await list(existingSharingOpId2, { type: SharingOperationMetersQueryType.NOW, EAN: COMPANY_EAN });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([COMPANY_EAN]);
      expect(meters[0].holder).toEqual({ id: 2, name: "Member Two", member_type: MemberType.COMPANY, status: MemberStatus.ACTIVE });
    });
  });

  // AT_DATE is what the import dialog asks for; NOW and FUTURE are the operation's own tabs.
  it.each([
    ["AT_DATE", { type: SharingOperationMetersQueryType.AT_DATE }],
    ["NOW", { type: SharingOperationMetersQueryType.NOW }],
    ["FUTURE", { type: SharingOperationMetersQueryType.FUTURE }],
  ])("names every holder of the operation, one row per meter (%s)", async (_label, query) => {
    const response = await list(existingSharingOpId2, { ...query, page: 1, limit: 100 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(holdersByEan(meters)).toEqual(OP_2_HOLDERS);
      // The member join is many-to-one: it must neither duplicate a meter nor move the count the
      // pagination is built from.
      expect(response.body.pagination.total).toBe(meters.length);
    });
  });

  it("keeps the paginated count when a page is smaller than the operation", async () => {
    const response = await list(existingSharingOpId2, { type: SharingOperationMetersQueryType.AT_DATE, page: 2, limit: 2 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      // Ordered by EAN (W1..W4, then the company meter): page 2 is W3 and W4.
      expect(holdersByEan(meters)).toEqual({ [WIND_3]: 6, [WIND_4]: 7 });
      expect(response.body.pagination.total).toBe(Object.keys(OP_2_HOLDERS).length);
    });
  });

  it("names the holder of a past participation, not the meter's current one", async () => {
    // W1 left the operation on 2025-06-30, then member 5 took it over outside any operation.
    await sql("UPDATE meter_data SET start_date = '2025-01-01', end_date = '2025-06-30' WHERE ean = $1", [WIND_1]);
    await sql(
      `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
       VALUES ($1, 1, 1, 1, '2025-07-01', NULL, 1, 5)`,
      [WIND_1],
    );

    const response = await list(existingSharingOpId2, { type: SharingOperationMetersQueryType.PAST });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(holdersByEan(meters)).toEqual({ [WIND_1]: 4 });
    });
  });

  it("still filters by holder_id, which reads the same relation", async () => {
    const response = await list(existingSharingOpId2, { type: SharingOperationMetersQueryType.AT_DATE, holder_id: 5 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => [m.EAN, m.holder?.id])).toEqual([[WIND_2, 5]]);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  it("omits the holder when the record has none", async () => {
    await sql("UPDATE meter_data SET id_member = NULL WHERE ean = $1", [existingEAN]);

    const response = await list(existingSharingOpId1, { type: SharingOperationMetersQueryType.NOW });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const meters = response.body.data as ListedMeter[];
      expect(meters.map((m) => m.EAN)).toEqual([existingEAN]);
      expect(meters[0]).not.toHaveProperty("holder");
    });
  });

  it("names no holder to another community: the community scope still applies", async () => {
    const response = await list(existingSharingOpId2, { type: SharingOperationMetersQueryType.AT_DATE }, COMMUNITY_2);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });
});
