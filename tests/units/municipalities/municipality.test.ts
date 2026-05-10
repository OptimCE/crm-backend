import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog, mockMunicipalityRepositoryModule } from "../../utils/helper.js";
import { testCasesSearchMunicipalities } from "./municipality.const.js";

describe("(Unit) Municipality Module", () => {
  useUnitTestDb();

  // --- SEARCH MUNICIPALITIES ---
  describe("(Unit) Search Municipalities", () => {
    it.each(testCasesSearchMunicipalities)(
      "GET /municipalities/ : $description",
      async ({ query, user_id, status_code, expected_error_code, check_data, expected_data, expected_pagination, mocks, translation_field }) => {
        if (mocks?.municipalityRepo) await mockMunicipalityRepositoryModule(mocks.municipalityRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;

        const req = request(app).get("/municipalities/").query(query);
        if (user_id !== undefined) {
          req.set("x-user-id", user_id);
        }

        const response = await req;

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);

          if (status_code === 200) {
            if (check_data) {
              expect(check_data(response.body.data)).toBe(true);
            }
            if (expected_pagination) {
              expect(response.body.pagination).toEqual(expected_pagination);
            }
          } else if (typeof expected_data === "string") {
            const translated = translation_field ? i18next.t(expected_data, translation_field) : i18next.t(expected_data);
            expect(response.body.data).toEqual(translated);
          }
        });
      },
    );
  });
});
