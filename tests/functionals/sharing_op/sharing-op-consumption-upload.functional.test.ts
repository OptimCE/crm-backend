import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import xlsx from "xlsx";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, existingEAN, existingSharingOpId1 } from "./sharing_op.const.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";

const UPLOAD_TIMESTAMP = "2025-02-01 00:00:00";

function buildMinimalConsumptionWorkbook(ean: string | number): Buffer {
  // `ean` is deliberately `string | number`: passing a number is what makes
  // SheetJS write a NUMERIC cell, which is the only way to reach the
  // precision-loss branch. Every committed fixture stores EANs as text, so
  // without this the branch is unreachable from the suite.
  const sheetData = [["", "Prélèvement MWh"], ["", ean], [], [], [UPLOAD_TIMESTAMP, 1.5]];

  const workbook = xlsx.utils.book_new();
  for (const sheetName of ["Brut Rep", "Partagé Rep", "Net Rep"]) {
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(sheetData), sheetName);
  }

  return Buffer.from(xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

interface Reading {
  timestamp: string;
  gross: number;
  net: number;
  shared: number;
  inj_gross: number;
  inj_net: number;
  inj_shared: number;
}

/**
 * `count` quarter-hours from `first` (a quarter-hour index from 2025-03-01
 * 00:00 UTC), every column distinct and exact in binary so they compare with
 * toEqual. `base` tells two uploads of the same quarter-hours apart.
 */
function readings(first: number, count: number, base: number): Reading[] {
  return Array.from({ length: count }, (_, k) => {
    const i = first + k;
    const step = i / 8;
    return {
      timestamp: new Date(Date.UTC(2025, 2, 1) + i * 15 * 60_000).toISOString(),
      gross: base + step,
      net: base + 1 + step,
      shared: base + 2 + step,
      inj_gross: base + 3 + step,
      inj_net: base + 4 + step,
      inj_shared: base + 5 + step,
    };
  });
}

/** A RESA-shaped workbook for one prosumer meter: a Prélèvement and an Injection column on each sheet. */
function buildProsumerWorkbook(ean: string, rows: Reading[]): Buffer {
  const columnsBySheet = {
    "Brut Rep": ["gross", "inj_gross"],
    "Partagé Rep": ["shared", "inj_shared"],
    "Net Rep": ["net", "inj_net"],
  } as const;
  const workbook = xlsx.utils.book_new();
  for (const [sheetName, [consumption, injection]] of Object.entries(columnsBySheet)) {
    const sheetData = [
      ["", "Prélèvement 1", "Injection 1"],
      ["EAN", ean, ean],
      [],
      [],
      ...rows.map((row) => [row.timestamp, row[consumption], row[injection]]),
    ];
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(sheetData), sheetName);
  }
  return Buffer.from(xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

async function uploadWorkbook(fileBuffer: Buffer): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .post("/sharing_operations/consumptions")
    .field("id_sharing_operation", String(existingSharingOpId1))
    .attach("file", fileBuffer, {
      filename: "consumption.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    .set("x-user-id", "auth0|admin")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_ADMIN);
}

type StoredRow = Reading & { id: number; id_sharing_operation: number; id_community: number };

/** The rows these tests wrote (the seed's only reading is in 2024), oldest first. */
async function storedRows(table: "meter_consumption" | "sharing_op_consumption", where: string, value: string | number): Promise<StoredRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const rows: (Omit<StoredRow, "timestamp"> & { timestamp: Date })[] = await AppDataSource.query(
    `SELECT id, "timestamp", gross, net, shared, inj_gross, inj_net, inj_shared, id_sharing_operation, id_community
     FROM ${table} WHERE ${where} = $1 AND "timestamp" >= '2025-03-01T00:00:00Z' ORDER BY "timestamp", id`,
    [value],
  );
  return rows.map((row) => ({ ...row, timestamp: row.timestamp.toISOString() }));
}

const readingsOf = (rows: StoredRow[]): Reading[] =>
  rows.map(({ timestamp, gross, net, shared, inj_gross, inj_net, inj_shared }) => ({
    timestamp,
    gross,
    net,
    shared,
    inj_gross,
    inj_net,
    inj_shared,
  }));

describe("(Functional) Sharing operation consumption upload context", () => {
  useFunctionalTestDb();

  it("stamps id_community from request context through multipart upload", async () => {
    const fileBuffer = buildMinimalConsumptionWorkbook(existingEAN);

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .post("/sharing_operations/consumptions")
      .field("id_sharing_operation", String(existingSharingOpId1))
      .attach("file", fileBuffer, {
        filename: "consumption.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
    });

    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    const { SharingOpConsumption } = await import("../../../src/modules/sharing_operations/domain/sharing_operation.models.js");

    const rows = await AppDataSource.manager.find(SharingOpConsumption, {
      where: {
        sharing_operation: { id: existingSharingOpId1 },
      },
      relations: { community: true },
      order: { timestamp: "DESC" },
    });

    const uploadedRow = rows.find(
      (row) => row.timestamp.toISOString().startsWith("2025-01-31") || row.timestamp.toISOString().startsWith("2025-02-01"),
    );
    expect(uploadedRow).toBeDefined();
    expect(uploadedRow!.community.id).toBe(1);
    expect(uploadedRow!.community.id).not.toBe(3);
  });

  it("rejects a workbook whose EAN row is stored as numbers instead of text", async () => {
    // An 18-digit EAN exceeds Number.MAX_SAFE_INTEGER, so a numeric cell has
    // already lost its low digits inside the file: 541448200000000001 reads
    // back as ...000. Before this guard the column silently failed the
    // authorized-EAN check and a whole meter's consumption vanished behind a
    // 200. There is no lossless recovery, so the upload must be refused.
    const fileBuffer = buildMinimalConsumptionWorkbook(Number(existingEAN));

    const appModule = await import("../../../src/app.js");
    const app = appModule.default;

    const response = await request(app)
      .post("/sharing_operations/consumptions")
      .field("id_sharing_operation", String(existingSharingOpId1))
      .attach("file", fileBuffer, {
        filename: "consumption.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.EAN_CELL_NOT_TEXT.errorCode);
    });
  });

  it("stores every reading column of the workbook in its own column", async () => {
    const file = readings(0, 4, 10);

    const response = await uploadWorkbook(buildProsumerWorkbook(existingEAN, file));
    await expectWithLog(response, () => expect(response.status).toBe(200));

    const meterRows = await storedRows("meter_consumption", "ean", existingEAN);
    expect(readingsOf(meterRows)).toEqual(file);
    expect(meterRows.every((row) => row.id_sharing_operation === existingSharingOpId1 && row.id_community === 1)).toBe(true);
    // One meter in the file, so the operation-wide totals are its readings.
    const operationRows = await storedRows("sharing_op_consumption", "id_sharing_operation", existingSharingOpId1);
    expect(readingsOf(operationRows)).toEqual(file);
    expect(operationRows.every((row) => row.id_community === 1)).toBe(true);
  });

  it("re-uploading an overlapping corrected workbook updates the readings it covers and adds the others", async () => {
    // Quarter-hours 0-7, then a corrected file for 4-11: 4-7 overlap, 8-11 are new.
    const first = readings(0, 8, 10);
    const corrected = readings(4, 8, 20);

    const firstResponse = await uploadWorkbook(buildProsumerWorkbook(existingEAN, first));
    await expectWithLog(firstResponse, () => expect(firstResponse.status).toBe(200));
    const meterRowsBefore = await storedRows("meter_consumption", "ean", existingEAN);
    const operationRowsBefore = await storedRows("sharing_op_consumption", "id_sharing_operation", existingSharingOpId1);

    const secondResponse = await uploadWorkbook(buildProsumerWorkbook(existingEAN, corrected));
    await expectWithLog(secondResponse, () => expect(secondResponse.status).toBe(200));

    const expected = [...first.slice(0, 4), ...corrected];
    const meterRows = await storedRows("meter_consumption", "ean", existingEAN);
    const operationRows = await storedRows("sharing_op_consumption", "id_sharing_operation", existingSharingOpId1);
    expect(readingsOf(meterRows)).toEqual(expected);
    expect(readingsOf(operationRows)).toEqual(expected);
    // Updated in place: the first upload's rows keep their ids.
    expect(meterRows.slice(0, 8).map((row) => row.id)).toEqual(meterRowsBefore.map((row) => row.id));
    expect(operationRows.slice(0, 8).map((row) => row.id)).toEqual(operationRowsBefore.map((row) => row.id));
  });

  it("two overlapping uploads of the same workbook store each reading once", async () => {
    // What a gateway timeout invites: the import is still running server-side
    // when the user sends the file again. Without serialisation both requests
    // look up "what exists", both see nothing, and both insert.
    const file = buildProsumerWorkbook(existingEAN, readings(0, 96, 10));
    // Load the app first: two first-time imports racing each other trip over
    // the module while it is still evaluating, and the test would fail on that.
    await import("../../../src/app.js");

    const responses = await Promise.all([uploadWorkbook(file), uploadWorkbook(file)]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await storedRows("meter_consumption", "ean", existingEAN)).toHaveLength(96);
    expect(await storedRows("sharing_op_consumption", "id_sharing_operation", existingSharingOpId1)).toHaveLength(96);
  });

  it("a reading already stored twice gets the corrected values on both rows", async () => {
    const first = readings(0, 2, 10);
    await uploadWorkbook(buildProsumerWorkbook(existingEAN, first));
    // An earlier double import left the first quarter-hour twice.
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    await AppDataSource.query(
      `INSERT INTO meter_consumption (ean, "timestamp", gross, net, shared, inj_gross, inj_net, inj_shared, id_sharing_operation, id_community)
       SELECT ean, "timestamp", gross, net, shared, inj_gross, inj_net, inj_shared, id_sharing_operation, id_community
       FROM meter_consumption WHERE ean = $1 AND "timestamp" = $2`,
      [existingEAN, first[0].timestamp],
    );

    const corrected = readings(0, 2, 20);
    const response = await uploadWorkbook(buildProsumerWorkbook(existingEAN, corrected));
    await expectWithLog(response, () => expect(response.status).toBe(200));

    expect(readingsOf(await storedRows("meter_consumption", "ean", existingEAN))).toEqual([corrected[0], corrected[0], corrected[1]]);
  });
});
