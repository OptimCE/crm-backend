import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import xlsx from "xlsx";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, existingEAN, existingSharingOpId1 } from "./sharing_op.const.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";

const UPLOAD_TIMESTAMP = "2025-02-01 00:00:00";

function buildMinimalConsumptionWorkbook(ean: string): Buffer {
  const sheetData = [
    ["", "Prélèvement MWh"],
    ["", ean],
    [],
    [],
    [UPLOAD_TIMESTAMP, 1.5],
  ];

  const workbook = xlsx.utils.book_new();
  for (const sheetName of ["Brut Rep", "Partagé Rep", "Net Rep"]) {
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(sheetData), sheetName);
  }

  return Buffer.from(xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

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

    const uploadedRow = rows.find((row) => row.timestamp.toISOString().startsWith("2025-01-31") || row.timestamp.toISOString().startsWith("2025-02-01"));
    expect(uploadedRow).toBeDefined();
    expect(uploadedRow!.community.id).toBe(1);
    expect(uploadedRow!.community.id).not.toBe(3);
  });
});
