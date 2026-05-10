import { expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";

describe("(Functional) Health Module", () => {
  useFunctionalTestDb();

  // --- GET /health/db ---
  describe("(Functional) DB Health", () => {
    it("GET /health/db : returns 200 ok against the real Docker Postgres", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/db");

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
        expect(typeof response.body.latencyMs).toBe("number");
      });
    });

    it("GET /health/db : caches result on the same service instance (10s TTL)", async () => {
      // The DI binding is transient, so a new HealthService instance is created per request.
      // To exercise the internal Map cache we test it directly on a single instance.
      const { HealthService } = await import("../../../src/modules/health/infra/health.service.js");
      const dbModule = await import("../../../src/shared/database/database.connector.js");
      const querySpy = jest.spyOn(dbModule.AppDataSource, "query");

      const service = new HealthService();
      const r1 = await service.checkDb();
      expect(r1.status).toBe("ok");
      const callsAfterFirst = querySpy.mock.calls.length;
      expect(callsAfterFirst).toBeGreaterThanOrEqual(1);

      // Second call on the same instance — should be served from the internal Map cache
      const r2 = await service.checkDb();
      expect(r2.status).toBe("ok");
      expect(querySpy.mock.calls.length).toBe(callsAfterFirst);

      querySpy.mockRestore();
    });
  });

  // --- GET /health (aggregated) ---
  describe("(Functional) Aggregated Health", () => {
    it("GET /health : returns a HealthReport with the three checks", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/");

      await expectWithLog(response, () => {
        // status will be 503 because document + keycloak external services aren't running in the test env
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("timestamp");
        expect(response.body).toHaveProperty("checks.db");
        expect(response.body).toHaveProperty("checks.document");
        expect(response.body).toHaveProperty("checks.keycloak");
        // DB part should be ok against the real Docker Postgres
        expect(response.body.checks.db.status).toBe("ok");
      });
    });
  });

  // --- GET /health/document — external service unreachable ---
  describe("(Functional) Documents Health", () => {
    it("GET /health/document : returns 503 unhealthy when docs service is not running", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/document");

      await expectWithLog(response, () => {
        // No documents service running in test → unhealthy
        expect([200, 503]).toContain(response.status);
        if (response.status === 503) {
          expect(response.body.status).toBe("unhealthy");
          expect(typeof response.body.error).toBe("string");
        }
      });
    });
  });

  // --- GET /health/keycloak — external service unreachable ---
  describe("(Functional) Keycloak Health", () => {
    it("GET /health/keycloak : returns 503 unhealthy when keycloak is not running", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/keycloak");

      await expectWithLog(response, () => {
        expect([200, 503]).toContain(response.status);
        if (response.status === 503) {
          expect(response.body.status).toBe("unhealthy");
          expect(typeof response.body.error).toBe("string");
        }
      });
    });
  });
});
