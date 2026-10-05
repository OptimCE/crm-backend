import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import xlsx from "xlsx";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import { SharingKeyStatus } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";

// Seeded in community 2 ("Other Community", auth id "2"): private sharing operation 3, covering
// municipality 25119 and linked (approved) to allocation key 1. Allocation key 2 belongs to community 1.
const FOREIGN_OPERATION = 3;
const COMMUNITY_1_KEY = 2;
const FOREIGN_EAN = "541448299999999999";

const COMMUNITY_2 = { auth_id: "2", orgs: "[orgId:2 orgPath:/org2 roles:[MANAGER]]", user: "auth0|manager" };
const COMMUNITY_1 = { auth_id: AUTH_COMMUNITY_1, orgs: ORGS_ADMIN, user: "auth0|admin" };

type Caller = typeof COMMUNITY_1;
type Method = "get" | "put" | "patch" | "post" | "delete";

async function send(caller: Caller, method: Method, url: string, body?: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = agent[method](url).set("x-user-id", caller.user).set("x-community-id", caller.auth_id).set("x-user-orgs", caller.orgs);
  return body ? req.send(body) : req;
}

async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(sql, params);
}

/** Everything a cross-community call could have changed on operation 3. */
async function foreignOperationState(): Promise<unknown> {
  return {
    operation: await query(`SELECT name, type, is_public, id_community FROM sharing_operation WHERE id = $1`, [FOREIGN_OPERATION]),
    municipalities: await query(`SELECT nis_code FROM sharing_operation_municipality WHERE id_sharing_operation = $1 ORDER BY nis_code`, [
      FOREIGN_OPERATION,
    ]),
    keys: await query(
      `SELECT id_key, status, to_char(end_date, 'YYYY-MM-DD') AS end_date, id_community
         FROM sharing_operation_key WHERE id_sharing_operation = $1 ORDER BY id`,
      [FOREIGN_OPERATION],
    ),
    consumptions: await query(`SELECT count(*)::int AS n FROM sharing_op_consumption WHERE id_sharing_operation = $1`, [FOREIGN_OPERATION]),
  };
}

const FOREIGN_OPERATION_UNTOUCHED = {
  operation: [{ name: "Private Local Sharing", type: 1, is_public: false, id_community: 2 }],
  municipalities: [{ nis_code: 25119 }],
  keys: [{ id_key: 1, status: SharingKeyStatus.APPROVED, end_date: null, id_community: 2 }],
  consumptions: [{ n: 0 }],
};

/** A meter of community 2 in operation 3, so an upload to operation 3 has an authorised EAN. */
async function seedForeignMeterInForeignOperation(): Promise<void> {
  await query(
    `INSERT INTO meter (ean, meter_number, id_address, tarif_group, phases_number, reading_frequency, id_community)
     VALUES ($1, 'X1', 1, 1, 1, 1, 2)`,
    [FOREIGN_EAN],
  );
  await query(
    `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
     VALUES ($1, 1, 1, 1, '2024-01-01', $2, 2, 3)`,
    [FOREIGN_EAN, FOREIGN_OPERATION],
  );
}

function consumptionWorkbook(ean: string): Buffer {
  const sheet = [["", "Prélèvement MWh"], ["", ean], [], [], ["2025-02-01 00:00:00", 1.5]];
  const workbook = xlsx.utils.book_new();
  for (const name of ["Brut Rep", "Partagé Rep", "Net Rep"]) {
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(sheet), name);
  }
  return Buffer.from(xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

/** Community 1 acting on community 2's operation 3: every call must fail and change nothing. */
describe("(Functional) Sharing operations of another community are out of reach", () => {
  useFunctionalTestDb();

  const cases: { description: string; method: Method; url: string; body?: Record<string, unknown>; error_code: number }[] = [
    {
      description: "GET /sharing_operations/:id",
      method: "get",
      url: `/sharing_operations/${FOREIGN_OPERATION}`,
      error_code: SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "PUT /sharing_operations/:id",
      method: "put",
      url: `/sharing_operations/${FOREIGN_OPERATION}`,
      body: { name: "Hijacked", municipality_nis_codes: [21001] },
      error_code: SHARING_OPERATION_ERRORS.UPDATE_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "PUT /sharing_operations/:id/municipalities",
      method: "put",
      url: `/sharing_operations/${FOREIGN_OPERATION}/municipalities`,
      body: { municipality_nis_codes: [21001] },
      error_code: SHARING_OPERATION_ERRORS.UPDATE_MUNICIPALITIES.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "PATCH /sharing_operations/visibility",
      method: "patch",
      url: "/sharing_operations/visibility",
      body: { id_sharing: FOREIGN_OPERATION, is_public: true },
      error_code: SHARING_OPERATION_ERRORS.PATCH_VISIBILITY.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "POST /sharing_operations/key",
      method: "post",
      url: "/sharing_operations/key",
      body: { id_sharing: FOREIGN_OPERATION, id_key: 1 },
      error_code: SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "PATCH /sharing_operations/key",
      method: "patch",
      url: "/sharing_operations/key",
      body: { id_sharing: FOREIGN_OPERATION, id_key: 1, status: SharingKeyStatus.REJECTED, date: "2025-01-01" },
      error_code: SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.SHARING_OPERATION_NOT_FOUND.errorCode,
    },
    {
      description: "DELETE /sharing_operations/:id",
      method: "delete",
      url: `/sharing_operations/${FOREIGN_OPERATION}`,
      error_code: SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE.errorCode,
    },
  ];

  it.each(cases)("$description", async ({ method, url, body, error_code }) => {
    const response = await send(COMMUNITY_1, method, url, body);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(error_code);
    });
    expect(await foreignOperationState()).toEqual(FOREIGN_OPERATION_UNTOUCHED);
  });

  it("POST /sharing_operations/consumptions", async () => {
    await seedForeignMeterInForeignOperation();

    const appModule = await import("../../../src/app.js");
    const response = await request(appModule.default)
      .post("/sharing_operations/consumptions")
      .field("id_sharing_operation", String(FOREIGN_OPERATION))
      .attach("file", consumptionWorkbook(FOREIGN_EAN), {
        filename: "consumption.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      .set("x-user-id", COMMUNITY_1.user)
      .set("x-community-id", COMMUNITY_1.auth_id)
      .set("x-user-orgs", COMMUNITY_1.orgs);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND.errorCode);
    });
    expect(await foreignOperationState()).toEqual(FOREIGN_OPERATION_UNTOUCHED);
  });
});

/** Community 2 on its own operation 3, but naming community 1's allocation key. */
describe("(Functional) PATCH /sharing_operations/key only accepts the caller's own allocation keys", () => {
  useFunctionalTestDb();

  it("rejects approving an allocation key of another community", async () => {
    const response = await send(COMMUNITY_2, "patch", "/sharing_operations/key", {
      id_sharing: FOREIGN_OPERATION,
      id_key: COMMUNITY_1_KEY,
      status: SharingKeyStatus.APPROVED,
      date: "2025-01-01",
    });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.ALLOCATION_KEY_NOT_FOUND.errorCode);
    });
    expect(await foreignOperationState()).toEqual(FOREIGN_OPERATION_UNTOUCHED);
  });
});
