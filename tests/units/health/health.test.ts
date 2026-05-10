import { expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { IHealthService } from "../../../src/modules/health/domain/i-health.service.js";
import { testCasesGetDb, testCasesGetDocument, testCasesGetHealth, testCasesGetKeycloak } from "./health.const.js";

/** Bind a partial HealthService mock (filled in with default jest.fn() for missing methods) into the DI container. */
async function bindHealthServiceMock(overrides: Partial<IHealthService>): Promise<jest.Mocked<IHealthService>> {
  const { container } = await import("../../../src/container/di-container.js");
  const fullMock: jest.Mocked<IHealthService> = {
    checkDb: jest.fn(),
    checkDocuments: jest.fn(),
    checkKeycloak: jest.fn(),
    checkAll: jest.fn(),
    ...overrides,
  } as jest.Mocked<IHealthService>;

  if (container.isBound("HealthService")) {
    (await container.rebind<IHealthService>("HealthService")).toConstantValue(fullMock);
  } else {
    container.bind<IHealthService>("HealthService").toConstantValue(fullMock);
  }
  return fullMock;
}

describe("(Unit) Health Module", () => {
  useUnitTestDb();

  // --- GET /health (aggregated report) ---
  describe("(Unit) Get Health (checkAll)", () => {
    it.each(testCasesGetHealth)("GET /health/ : $description", async ({ status_code, expected_body, mockBuilder }) => {
      await bindHealthServiceMock(mockBuilder());
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/");

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body).toEqual(expected_body);
      });
    });
  });

  // --- GET /health/db ---
  describe("(Unit) Get DB Health", () => {
    it.each(testCasesGetDb)("GET /health/db : $description", async ({ status_code, expected_body, mockBuilder }) => {
      await bindHealthServiceMock(mockBuilder());
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/db");

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body).toEqual(expected_body);
      });
    });
  });

  // --- GET /health/document ---
  describe("(Unit) Get Documents Health", () => {
    it.each(testCasesGetDocument)("GET /health/document : $description", async ({ status_code, expected_body, mockBuilder }) => {
      await bindHealthServiceMock(mockBuilder());
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/document");

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body).toEqual(expected_body);
      });
    });
  });

  // --- GET /health/keycloak ---
  describe("(Unit) Get Keycloak Health", () => {
    it.each(testCasesGetKeycloak)("GET /health/keycloak : $description", async ({ status_code, expected_body, mockBuilder }) => {
      await bindHealthServiceMock(mockBuilder());
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/health/keycloak");

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body).toEqual(expected_body);
      });
    });
  });
});
