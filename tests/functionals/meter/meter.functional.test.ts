import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import {
  testCasesAddMeter,
  testCasesDeleteMeter,
  testCasesGetConsumptions,
  testCasesGetMeter,
  testCasesGetMetersList,
  testCasesPatchMeterData,
  AUTH_COMMUNITY_1,
} from "./meter.const.js";

describe("(Functional) Meter Module", () => {
  useFunctionalTestDb();

  // --- GET METERS LIST ---
  describe("(Functional) Get Meters List", () => {
    it.each(testCasesGetMetersList)("GET /meters/ : $description", async ({ query, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get("/meters/")
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

  // --- GET METER ---
  describe("(Functional) Get Meter", () => {
    it.each(testCasesGetMeter)("GET /meters/:id : $description", async ({ ean, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get(`/meters/${ean}`)
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

  // --- GET CONSUMPTIONS ---
  describe("(Functional) Get Meter Consumptions", () => {
    it.each(testCasesGetConsumptions)(
      "GET /meters/:id/consumptions : $description",
      async ({ ean, query, orgs, status_code, expected_error_code, check_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .get(`/meters/${ean}/consumptions`)
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
      },
    );
  });

  // --- ADD METER ---
  describe("(Functional) Add Meter", () => {
    it.each(testCasesAddMeter)("POST /meters/ : $description", async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .post("/meters/")
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

  // --- PATCH METER DATA ---
  describe("(Functional) Patch Meter Data", () => {
    it.each(testCasesPatchMeterData)("PATCH /meters/data : $description", async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .patch("/meters/data")
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

  // --- DELETE METER ---
  describe("(Functional) Delete Meter", () => {
    it.each(testCasesDeleteMeter)("DELETE /meters/:id : $description", async ({ ean, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .delete(`/meters/${ean}`)
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
