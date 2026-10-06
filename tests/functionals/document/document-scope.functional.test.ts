import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog, mockStorageServiceModule } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { DOCUMENT_ERRORS } from "../../../src/modules/documents/shared/document.errors.js";

const FOREIGN_MEMBER = 3; // "Member Three", seeded in community 2

describe("(Functional) POST /documents only attaches documents to the caller's own members", () => {
  useFunctionalTestDb();

  it("rejects a member of another community before anything is stored", async () => {
    const uploadDocument = jest.fn(() => Promise.resolve({ url: "http://storage/foreign.pdf", file_type: "application/pdf" }));
    await mockStorageServiceModule({ uploadDocument });

    const appModule = await import("../../../src/app.js");
    const response = await request(appModule.default)
      .post("/documents/")
      .field("id_member", String(FOREIGN_MEMBER))
      .attach("file", Buffer.from("dummy content"), "foreign.pdf")
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(DOCUMENT_ERRORS.UPLOAD_DOCUMENT.MEMBER_NOT_FOUND.errorCode);
    });
    expect(uploadDocument).not.toHaveBeenCalled();
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    expect(await AppDataSource.manager.query(`SELECT id FROM document WHERE id_member = $1`, [FOREIGN_MEMBER])).toEqual([]);
  });
});
