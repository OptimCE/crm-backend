import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { testCasesAddKey, testCasesDeleteKey, testCasesGetKey, testCasesGetKeysList, testCasesUpdateKey, AUTH_COMMUNITY_1 } from "./key.const.js";

describe("(Functional) Key Module", () => {
  useFunctionalTestDb();

  // --- GET KEYS LIST ---
  describe("(Functional) Get Keys List", () => {
    it.each(testCasesGetKeysList)("GET /keys/ : $description", async ({ query, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get("/keys/")
        .query(query)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (check_data) {
          expect(check_data(response.body.data)).toBe(true);
        }
      });
    });
  });

  // --- GET KEY / DOWNLOAD ---
  describe("(Functional) Get Key / Download", () => {
    it.each(testCasesGetKey)("GET /keys/:id : $description", async ({ key_id, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get(`/keys/${key_id}`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (check_data) {
          expect(check_data(response.body.data)).toBe(true);
        }
      });
    });
  });

  // --- ADD KEY ---
  describe("(Functional) Add Key", () => {
    it.each(testCasesAddKey)("POST /keys/ : $description", async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .post("/keys/")
        .send(body)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (expected_data) expect(response.body.data).toBe(expected_data);
      });
    });
  });

  // --- UPDATE KEY ---
  describe("(Functional) Update Key", () => {
    it.each(testCasesUpdateKey)("PUT /keys/ : $description", async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .put("/keys/")
        .send(body)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (expected_data) expect(response.body.data).toBe(expected_data);
      });
    });
  });

  // --- DELETE KEY ---
  describe("(Functional) Delete Key", () => {
    it.each(testCasesDeleteKey)("DELETE /keys/:id : $description", async ({ key_id, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .delete(`/keys/${key_id}`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (expected_data) expect(response.body.data).toBe(expected_data);
      });
    });
  });
});
