import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS, GLOBAL_ERRORS } from "../../../src/shared/errors/errors.js";

const AUTH_USER = "auth0|tester";

describe("(Functional) Municipality Module", () => {
  useFunctionalTestDb();

  // --- SEARCH MUNICIPALITIES ---
  describe("(Functional) Search Municipalities", () => {
    it("GET /municipalities/ : returns paginated list against seeded data", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.length).toBeLessThanOrEqual(10);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
        expect(response.body.pagination.total).toBeGreaterThan(0);
        // Each item must have the partial DTO shape
        const first = response.body.data[0];
        expect(first).toHaveProperty("nis_code");
        expect(first).toHaveProperty("fr_name");
        expect(first).toHaveProperty("postal_codes");
        expect(Array.isArray(first.postal_codes)).toBe(true);
      });
    });

    it("GET /municipalities/ : filters by FR name fragment (Bruxelles → 21004)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ name: "Bruxelles", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        const found = (response.body.data as Array<{ nis_code: number }>).find((m) => m.nis_code === 21004);
        expect(found).toBeDefined();
      });
    });

    it("GET /municipalities/ : filters by NL name fragment (Brussel matches both Bruxelles + Brussel)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ name: "Brussel", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        // 21004 (Bruxelles/Brussel) is matched
        const found = (response.body.data as Array<{ nis_code: number }>).find((m) => m.nis_code === 21004);
        expect(found).toBeDefined();
      });
    });

    it("GET /municipalities/ : filters by postal_code (1050 → Bruxelles + Ixelles)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ postal_code: "1050", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        const codes = (response.body.data as Array<{ nis_code: number }>).map((m) => m.nis_code);
        expect(codes).toContain(21004);
        expect(codes).toContain(21009);
      });
    });

    it("GET /municipalities/ : returns full postal_codes set even when filtering by single postal code", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ postal_code: "1000", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        const bruxelles = (response.body.data as Array<{ nis_code: number; postal_codes: string[] }>).find((m) => m.nis_code === 21004);
        expect(bruxelles).toBeDefined();
        // Bruxelles has multiple postal codes; query was 1000 but full set must be returned
        expect(bruxelles!.postal_codes.length).toBeGreaterThan(1);
        expect(bruxelles!.postal_codes).toContain("1000");
      });
    });

    it("GET /municipalities/ : combined name + postal_code filter", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/municipalities/")
        .query({ name: "Ixelles", postal_code: "1050", page: "1", limit: "10" })
        .set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect((response.body.data as Array<{ nis_code: number }>).every((m) => m.nis_code === 21009)).toBe(true);
      });
    });

    it("GET /municipalities/ : empty result returns total_pages 0", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/municipalities/")
        .query({ name: "ZZZZ_does_not_exist", page: "1", limit: "10" })
        .set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.total).toBe(0);
        expect(response.body.pagination.total_pages).toBe(0);
      });
    });

    it("GET /municipalities/ : invalid postal_code (non-numeric) → 422", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ postal_code: "abcd", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING.errorCode);
      });
    });

    it("GET /municipalities/ : missing x-user-id → 400 unauthenticated", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ page: "1", limit: "10" });

      await expectWithLog(response, () => {
        expect(response.status).toBe(400);
        expect(response.body.error_code).toBe(GLOBAL_ERRORS.UNAUTHENTICATED.errorCode);
      });
    });
  });
});
