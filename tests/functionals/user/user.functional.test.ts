import { expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog, mockIAMServiceModule } from "../../utils/helper.js";
import { testCasesGetProfile, testCasesUpdateProfile, AUTH_COMMUNITY_1, newUserAuthId, newUserEmail } from "./user.const.js";

describe("(Functional) User Module", () => {
  useFunctionalTestDb();

  // --- GET PROFILE ---
  describe("(Functional) Get Profile", () => {
    it.each(testCasesGetProfile)("GET /users/ : $description", async ({ auth_user_id, orgs, status_code, expected_error_code, check_data }) => {
      await mockIAMServiceModule({
        getUserEmail: jest.fn(async (authId: string) => {
          if (authId === newUserAuthId) return newUserEmail;
          return "default@test.com";
        }),
      });
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get("/users/")
        .set("x-user-id", auth_user_id)
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

  // --- UPDATE PROFILE ---
  describe("(Functional) Update Profile", () => {
    it.each(testCasesUpdateProfile)(
      "PUT /users/ : $description",
      async ({ auth_user_id, body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .put("/users/")
          .send(body)
          .set("x-user-id", auth_user_id)
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data) expect(response.body.data).toBe(expected_data);
        });
      },
    );
  });
});
