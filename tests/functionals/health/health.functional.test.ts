import { afterAll, beforeEach, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog, mockStorageServiceModule } from "../../utils/helper.js";
import { createMockStorageService } from "../../external_mocking/storage_service.mock.js";
import { startFakeKeycloak } from "../../external_mocking/keycloak.fake.js";

// config/test.cjs reads IAM_BASE_URL when `config` is first imported (by the DB connector, in
// the first beforeEach), so the fake must be listening, and the variable set, before then.
const keycloak = await startFakeKeycloak(["optimce-realm"]);
process.env.IAM_BASE_URL = keycloak.baseUrl;

describe("(Functional) Health Module", () => {
  useFunctionalTestDb();

  beforeEach(() => {
    keycloak.realms.add("optimce-realm");
  });

  afterAll(async () => {
    await keycloak.close();
  });

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

      const service = new HealthService(createMockStorageService());
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
    it("GET /health : answers 200 ok when the database, the document store and Keycloak all answer", async () => {
      // Until 2026-10-06 this answered 503 on every stack, the dev one included, with all
      // three dependencies up (see tests/units/health/health.service.test.ts).
      await mockStorageServiceModule({ ping: jest.fn(() => Promise.resolve()) });
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/");

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: "ok",
          checks: { db: { status: "ok" }, document: { status: "ok" }, keycloak: { status: "ok" } },
        });
        expect(typeof response.body.timestamp).toBe("string");
      });
    });

    it("GET /health : answers 503 and names the failing check when one dependency is down", async () => {
      await mockStorageServiceModule({ ping: jest.fn(() => Promise.reject(new Error("HeadBucket crm-files: HTTP 404"))) });
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/");

      await expectWithLog(response, () => {
        expect(response.status).toBe(503);
        expect(response.body).toMatchObject({
          status: "unhealthy",
          checks: {
            db: { status: "ok" },
            document: { status: "unhealthy", error: "HeadBucket crm-files: HTTP 404" },
            keycloak: { status: "ok" },
          },
        });
      });
    });
  });

  // --- GET /health/document ---
  describe("(Functional) Documents Health", () => {
    it("GET /health/document : answers 200 when the storage adapter reaches its bucket", async () => {
      await mockStorageServiceModule({ ping: jest.fn(() => Promise.resolve()) });
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/document");

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });

    it("GET /health/document : answers 503 with the adapter's reason when it cannot", async () => {
      await mockStorageServiceModule({ ping: jest.fn(() => Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:9000"))) });
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/document");

      await expectWithLog(response, () => {
        expect(response.status).toBe(503);
        expect(response.body).toMatchObject({ status: "unhealthy", error: "connect ECONNREFUSED 10.0.0.5:9000" });
      });
    });
  });

  // --- GET /health/keycloak ---
  describe("(Functional) Keycloak Health", () => {
    it("GET /health/keycloak : answers 200 when Keycloak serves the configured realm", async () => {
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/keycloak");

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });

    it("GET /health/keycloak : answers 503 when the realm does not exist", async () => {
      keycloak.realms.delete("optimce-realm");
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/keycloak");

      await expectWithLog(response, () => {
        expect(response.status).toBe(503);
        expect(response.body).toMatchObject({ status: "unhealthy", error: "HTTP 404" });
      });
    });
  });
});
