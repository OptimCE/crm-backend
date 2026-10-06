import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { ClientType, MeterDataStatus, MeterRate, ReadingFrequency, TarifGroup } from "../../../src/modules/meters/shared/meter.types.js";
import { AUTH_COMMUNITY_1, existingEAN, newEAN } from "./meter.const.js";

// Seeded in community 2 ("Other Community"): member 3 and sharing operation 3.
const FOREIGN_MEMBER = 3;
const FOREIGN_SHARING_OPERATION = 3;
const FOREIGN_EAN = "541448299999999999";

interface MeterDataRow {
  ean: string;
  start_date: string;
  end_date: string | null;
  id_member: number | null;
  id_sharing_operation: number | null;
  id_community: number;
}

type Method = "get" | "put" | "patch" | "post" | "delete";

/** Every request is made by a manager of community 1. */
async function send(method: Method, url: string, body?: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = agent[method](url).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
  return body ? req.send(body) : req;
}

/**
 * A meter of community 2, held by its member 3 in its sharing operation 3 since 2024-01-01.
 * @returns the id of its meter_data row.
 */
async function seedForeignMeter(): Promise<number> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(
    `INSERT INTO meter (ean, meter_number, id_address, tarif_group, phases_number, reading_frequency, id_community)
     VALUES ($1, 'X1', 1, 1, 1, 1, 2)`,
    [FOREIGN_EAN],
  );
  const rows: { id: number }[] = await AppDataSource.manager.query(
    `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
     VALUES ($1, 1, 1, 1, '2024-01-01', $2, 2, $3) RETURNING id`,
    [FOREIGN_EAN, FOREIGN_SHARING_OPERATION, FOREIGN_MEMBER],
  );
  return rows[0].id;
}

async function foreignMeterRow(): Promise<{ meter_number: string; id_address: number; id_community: number } | undefined> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const rows: { meter_number: string; id_address: number; id_community: number }[] = await AppDataSource.manager.query(
    `SELECT meter_number, id_address, id_community FROM meter WHERE ean = $1`,
    [FOREIGN_EAN],
  );
  return rows[0];
}

const FOREIGN_METER = { meter_number: "X1", id_address: 1, id_community: 2 };

async function meterDataRows(ean: string): Promise<MeterDataRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(
    `SELECT ean, to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
            id_member, id_sharing_operation, id_community
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [ean],
  );
}

const OWN_METER_UNTOUCHED: MeterDataRow[] = [
  { ean: existingEAN, start_date: "2024-01-01", end_date: null, id_member: 1, id_sharing_operation: 1, id_community: 1 },
];
const FOREIGN_METER_UNTOUCHED: MeterDataRow[] = [
  {
    ean: FOREIGN_EAN,
    start_date: "2024-01-01",
    end_date: null,
    id_member: FOREIGN_MEMBER,
    id_sharing_operation: FOREIGN_SHARING_OPERATION,
    id_community: 2,
  },
];

function patchPayload(ean: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    EAN: ean,
    start_date: "2025-01-01",
    status: MeterDataStatus.ACTIVE,
    rate: MeterRate.SIMPLE,
    client_type: ClientType.RESIDENTIAL,
    member_id: 1,
    ...extra,
  };
}

describe("(Functional) Meter data cannot reference another community", () => {
  useFunctionalTestDb();

  it("PATCH /meters/data rejects a sharing operation of another community", async () => {
    const response = await send("patch", "/meters/data", patchPayload(existingEAN, { sharing_operation_id: FOREIGN_SHARING_OPERATION }));

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.ADD_METER_DATA.SHARING_OPERATION_NOT_FOUND.errorCode);
    });
    expect(await meterDataRows(existingEAN)).toEqual(OWN_METER_UNTOUCHED);
  });

  it("PATCH /meters/data rejects a holder of another community", async () => {
    const response = await send("patch", "/meters/data", patchPayload(existingEAN, { member_id: FOREIGN_MEMBER }));

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.ADD_METER_DATA.MEMBER_NOT_FOUND.errorCode);
    });
    expect(await meterDataRows(existingEAN)).toEqual(OWN_METER_UNTOUCHED);
  });

  it("PATCH /meters/data rejects a meter of another community", async () => {
    await seedForeignMeter();

    const response = await send("patch", "/meters/data", patchPayload(FOREIGN_EAN));

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      // The service's own (community-scoped) meter lookup refuses it before addMeterData's guard.
      expect(response.body.error_code).toBe(METER_ERRORS.PATCH_METER_DATA.METER_NOT_FOUND.errorCode);
    });
    expect(await meterDataRows(FOREIGN_EAN)).toEqual(FOREIGN_METER_UNTOUCHED);
  });

  it("PATCH /meters/data/deactivate rejects a meter of another community", async () => {
    await seedForeignMeter();

    const response = await send("patch", "/meters/data/deactivate", { EAN: FOREIGN_EAN, date: "2025-01-01" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      // The service's own (community-scoped) meter lookup refuses it before addMeterData's guard.
      expect(response.body.error_code).toBe(METER_ERRORS.PATCH_METER_DATA.METER_NOT_FOUND.errorCode);
    });
    expect(await meterDataRows(FOREIGN_EAN)).toEqual(FOREIGN_METER_UNTOUCHED);
  });

  it("POST /meters rejects an initial holder of another community, and creates nothing", async () => {
    const response = await send("post", "/meters/", {
      EAN: newEAN,
      meter_number: "M999",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: { street: "New St", number: 1, postcode: "1000", city: "Bruxelles" },
      initial_data: {
        start_date: "2024-06-01",
        status: MeterDataStatus.ACTIVE,
        rate: MeterRate.SIMPLE,
        client_type: ClientType.RESIDENTIAL,
        member_id: FOREIGN_MEMBER,
      },
    });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.ADD_METER_DATA.MEMBER_NOT_FOUND.errorCode);
    });
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    expect(await AppDataSource.manager.query(`SELECT ean FROM meter WHERE ean = $1`, [newEAN])).toEqual([]);
  });

  it("POST /sharing_operations/meter rejects a sharing operation of another community", async () => {
    const response = await send("post", "/sharing_operations/meter", {
      id_sharing: FOREIGN_SHARING_OPERATION,
      date: "2025-01-01",
      ean_list: [existingEAN],
    });

    await expectWithLog(response, () => expect(response.status).toBe(400));
    expect(await meterDataRows(existingEAN)).toEqual(OWN_METER_UNTOUCHED);
  });
});

/**
 * A meter of another community must answer exactly like a meter that does not exist, and stay
 * untouched. Every request is made by a manager of community 1 against community 2's meter.
 */
describe("(Functional) Meter endpoints cannot reach a meter of another community", () => {
  useFunctionalTestDb();

  const foreignAddress = { street: "Rue Étrangère", number: 9, postcode: "4000", city: "Liège" };

  it("GET /meters/:id does not return it", async () => {
    await seedForeignMeter();

    const response = await send("get", `/meters/${FOREIGN_EAN}`);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.GET_METER.METER_NOT_FOUND.errorCode);
    });
  });

  it("PUT /meters does not update it", async () => {
    await seedForeignMeter();

    const response = await send("put", "/meters/", {
      EAN: FOREIGN_EAN,
      meter_number: "HIJACKED",
      address: foreignAddress,
      tarif_group: TarifGroup.LOW_TENSION,
      phases_number: 3,
      reading_frequency: ReadingFrequency.MONTHLY,
    });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE.errorCode);
    });
    expect(await foreignMeterRow()).toEqual(FOREIGN_METER);
  });

  it("PATCH /meters/address does not move it", async () => {
    await seedForeignMeter();

    const response = await send("patch", "/meters/address", { EAN: FOREIGN_EAN, address: foreignAddress });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE.errorCode);
    });
    expect(await foreignMeterRow()).toEqual(FOREIGN_METER);
  });

  it("DELETE /meters/:id does not delete it", async () => {
    await seedForeignMeter();

    const response = await send("delete", `/meters/${FOREIGN_EAN}`);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.DELETE_METER.DATABASE_DELETE.errorCode);
    });
    expect(await foreignMeterRow()).toEqual(FOREIGN_METER);
    expect(await meterDataRows(FOREIGN_EAN)).toEqual(FOREIGN_METER_UNTOUCHED);
  });

  it("PATCH /meters/data/delete does not delete its configuration", async () => {
    const foreignMeterDataId = await seedForeignMeter();

    const response = await send("patch", "/meters/data/delete", { id_meter_data: foreignMeterDataId });

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(METER_ERRORS.DELETE_METER_DATA.NOT_FOUND.errorCode);
    });
    expect(await meterDataRows(FOREIGN_EAN)).toEqual(FOREIGN_METER_UNTOUCHED);
  });

  // EANs are globally unique: creating one that another community already registered must keep
  // answering 409 — and must never take the existing meter over.
  it("POST /meters with its EAN is a duplicate, and does not take it over", async () => {
    await seedForeignMeter();

    const response = await send("post", "/meters/", {
      EAN: FOREIGN_EAN,
      meter_number: "HIJACKED",
      phases_number: 1,
      tarif_group: TarifGroup.LOW_TENSION,
      reading_frequency: ReadingFrequency.MONTHLY,
      address: foreignAddress,
      initial_data: { start_date: "2025-01-01", status: MeterDataStatus.ACTIVE, rate: MeterRate.SIMPLE, client_type: ClientType.RESIDENTIAL },
    });

    await expectWithLog(response, () => {
      expect(response.status).toBe(409);
      expect(response.body.error_code).toBe(METER_ERRORS.ADD_METER.ALREADY_EXIST.errorCode);
    });
    expect(await foreignMeterRow()).toEqual(FOREIGN_METER);
    expect(await meterDataRows(FOREIGN_EAN)).toEqual(FOREIGN_METER_UNTOUCHED);
  });

  // The foreign member holds an active meter: answering 409 "has active meters" instead of the
  // plain "could not delete" would reveal it.
  it("DELETE /members/:id answers for a member of another community like for an unknown one", async () => {
    await seedForeignMeter();

    const response = await send("delete", `/members/${FOREIGN_MEMBER}`);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE.errorCode);
    });
  });
});
