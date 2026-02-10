import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog, mockKeyRepositoryModule } from "../../utils/helper.js";
import { testCasesAddKey, testCasesDeleteKey, testCasesDownloadKey, testCasesGetKey, testCasesGetKeysList, testCasesUpdateKey } from "./key.const.js";

describe("(Unit) Key Module", () => {
  // --- GET KEYS LIST ---
  describe("(Unit) Get Keys List", () => {
    useUnitTestDb();

    it.each(testCasesGetKeysList)(
      "GET /keys/ : $description",
      async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
        if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get("/keys/").query(query).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- GET KEY ---
  describe("(Unit) Get Key", () => {
    useUnitTestDb();

    it.each(testCasesGetKey)("GET /keys/:id : $description", async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).get(`/keys/${id}`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });

  // --- DOWNLOAD KEY ---
  describe("(Unit) Download Key", () => {
    useUnitTestDb();

    it.each(testCasesDownloadKey)(
      "GET /keys/:id/download : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get(`/keys/${id}/download`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- ADD KEY ---
  describe("(Unit) Add Key", () => {
    useUnitTestDb();

    it.each(testCasesAddKey)("POST /keys/ : $description", async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).post("/keys/").send(body).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });

  // --- UPDATE KEY ---
  describe("(Unit) Update Key", () => {
    useUnitTestDb();

    it.each(testCasesUpdateKey)("PUT /keys/ : $description", async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).put("/keys/").send(body).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });

  // --- DELETE KEY ---
  describe("(Unit) Delete Key", () => {
    useUnitTestDb();

    it.each(testCasesDeleteKey)("DELETE /keys/:id : $description", async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).delete(`/keys/${id}`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });
});
