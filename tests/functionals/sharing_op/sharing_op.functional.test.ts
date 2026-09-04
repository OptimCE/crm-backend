import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import {
  testCasesAddKey,
  testCasesAddMeter,
  testCasesCreate,
  testCasesDelete,
  testCasesGetDetail,
  testCasesGetList,
  testCasesGetSharingOpMeters,
  testCasesPatchKey,
  testCasesPatchMeter,
  testCasesPatchVisibility,
  testCasesUpdate,
  testCasesUpdateMunicipalities,
  AUTH_COMMUNITY_1,
} from "./sharing_op.const.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

describe("(Functional) Sharing Operation Module", () => {
  useFunctionalTestDb();

  // --- GET LIST ---
  describe("(Functional) Get List", () => {
    it.each(testCasesGetList)("GET /sharing_operations/ : $description", async ({ query, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get("/sharing_operations/")
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

  // --- GET DETAIL ---
  describe("(Functional) Get Detail", () => {
    it.each(testCasesGetDetail)("GET /sharing_operations/:id : $description", async ({ id, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get(`/sharing_operations/${id}`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        if (status_code === 200) {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (check_data) expect(check_data(response.body.data)).toBe(true);
        } else {
          expect(response.status).not.toBe(200);
        }
      });
    });
  });

  // --- GET METERS ---
  describe("(Functional) Get Meters", () => {
    it.each(testCasesGetSharingOpMeters)(
      "GET /sharing_operations/:id/meters : $description",
      async ({ id, query, orgs, status_code, expected_error_code, check_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .get(`/sharing_operations/${id}/meters`)
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

  // --- GET METERS AT A GIVEN DATE (AT_DATE snapshot) ---
  // These seed their own closed participation window rather than extending the shared fixture set,
  // which other suites count (the community dashboard asserts exact meter totals).
  describe("(Functional) Get Meters at a given date", () => {
    /** The wind meter whose participation this block closes, and the day it stops being held. */
    const EAN = "541448200000000001";
    const LAST_DAY_HELD = "2025-06-30";

    async function closeParticipation(): Promise<void> {
      const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
      await AppDataSource.manager.query(`UPDATE meter_data SET start_date = '2025-01-01', end_date = $1 WHERE ean = $2`, [LAST_DAY_HELD, EAN]);
    }

    async function eansAt(at: string): Promise<string[]> {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get(`/sharing_operations/2/meters`)
        .query({ type: 4, at, limit: 100 })
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(response.status).toBe(200);
      return (response.body.data as Array<{ EAN: string }>).map((m) => m.EAN);
    }

    it("returns a meter whose participation window covers the date", async () => {
      await closeParticipation();
      expect(await eansAt("2025-03-15")).toContain(EAN);
    });

    it("still returns a meter on its end_date — the last day held (inclusive upper bound)", async () => {
      await closeParticipation();
      expect(await eansAt(LAST_DAY_HELD)).toContain(EAN);
    });

    it("drops the meter the day after its end_date", async () => {
      await closeParticipation();
      expect(await eansAt("2025-07-01")).not.toContain(EAN);
    });

    it("returns a meter on its start_date (inclusive lower bound) but not the day before", async () => {
      await closeParticipation();
      expect(await eansAt("2025-01-01")).toContain(EAN);
      expect(await eansAt("2024-12-31")).not.toContain(EAN);
    });
  });

  // --- CREATE ---
  describe("(Functional) Create", () => {
    it.each(testCasesCreate)("POST /sharing_operations/ : $description", async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .post("/sharing_operations/")
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

  // --- UPDATE MUNICIPALITIES ---
  describe("(Functional) Update Municipalities", () => {
    it.each(testCasesUpdateMunicipalities)(
      "PUT /sharing_operations/:id/municipalities : $description",
      async ({ id, body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .put(`/sharing_operations/${id}/municipalities`)
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- ADD KEY ---
  describe("(Functional) Add Key", () => {
    it.each(testCasesAddKey)(
      "POST /sharing_operations/key : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .post("/sharing_operations/key")
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- ADD METER ---
  describe("(Functional) Add Meter", () => {
    it.each(testCasesAddMeter)(
      "POST /sharing_operations/meter : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .post("/sharing_operations/meter")
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- PATCH KEY ---
  describe("(Functional) Patch Key", () => {
    it.each(testCasesPatchKey)(
      "PATCH /sharing_operations/key : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .patch("/sharing_operations/key")
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- PATCH METER ---
  describe("(Functional) Patch Meter", () => {
    it.each(testCasesPatchMeter)(
      "PATCH /sharing_operations/meter : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .patch("/sharing_operations/meter")
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- PATCH VISIBILITY ---
  describe("(Functional) Patch Visibility", () => {
    it.each(testCasesPatchVisibility)(
      "PATCH /sharing_operations/visibility : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .patch("/sharing_operations/visibility")
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- UPDATE (PUT /:id) — commit 71ebaea ---
  describe("(Functional) Update Sharing Operation", () => {
    it.each(testCasesUpdate)(
      "PUT /sharing_operations/:id : $description",
      async ({ id, body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .put(`/sharing_operations/${id}`)
          .send(body)
          .set("x-user-id", "auth0|admin")
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

  // --- DELETE ---
  describe("(Functional) Delete", () => {
    it.each(testCasesDelete)(
      "DELETE /sharing_operations/:id : $description",
      async ({ id, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .delete(`/sharing_operations/${id}`)
          .set("x-user-id", "auth0|admin")
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
