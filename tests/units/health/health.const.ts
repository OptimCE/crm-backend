import { jest } from "@jest/globals";
import type { HealthCheckResult, HealthReport, IHealthService } from "../../../src/modules/health/domain/i-health.service.js";

export const okResult: HealthCheckResult = { status: "ok", latencyMs: 5 };
export const dbUnhealthy: HealthCheckResult = { status: "unhealthy", error: "Database not initialized", latencyMs: 0 };
export const docUnhealthy: HealthCheckResult = { status: "unhealthy", error: "ECONNREFUSED" };
export const kcUnhealthy: HealthCheckResult = { status: "unhealthy", error: "HTTP 500", latencyMs: 5 };

export const okReport: HealthReport = {
  status: "ok",
  timestamp: new Date("2024-01-01T00:00:00.000Z").toISOString(),
  checks: { db: okResult, document: okResult, keycloak: okResult },
};

export const partiallyUnhealthyReport: HealthReport = {
  status: "unhealthy",
  timestamp: new Date("2024-01-01T00:00:00.000Z").toISOString(),
  checks: { db: okResult, document: docUnhealthy, keycloak: okResult },
};

// --- /health (checkAll) test cases ---
export const testCasesGetHealth = [
  {
    description: "Success - All systems healthy → 200 ok report",
    status_code: 200,
    expected_body: okReport,
    mockBuilder: (): Partial<IHealthService> => ({
      checkAll: jest.fn(() => Promise.resolve(okReport)),
    }),
  },
  {
    description: "Fail - Documents unhealthy → 503 unhealthy report",
    status_code: 503,
    expected_body: partiallyUnhealthyReport,
    mockBuilder: (): Partial<IHealthService> => ({
      checkAll: jest.fn(() => Promise.resolve(partiallyUnhealthyReport)),
    }),
  },
];

// --- /health/db test cases ---
export const testCasesGetDb = [
  {
    description: "Success - DB ok → 200",
    status_code: 200,
    expected_body: okResult,
    mockBuilder: (): Partial<IHealthService> => ({
      checkDb: jest.fn(() => Promise.resolve(okResult)),
    }),
  },
  {
    description: "Fail - DB not initialized → 503",
    status_code: 503,
    expected_body: dbUnhealthy,
    mockBuilder: (): Partial<IHealthService> => ({
      checkDb: jest.fn(() => Promise.resolve(dbUnhealthy)),
    }),
  },
];

// --- /health/document test cases ---
export const testCasesGetDocument = [
  {
    description: "Success - Documents service ok → 200",
    status_code: 200,
    expected_body: okResult,
    mockBuilder: (): Partial<IHealthService> => ({
      checkDocuments: jest.fn(() => Promise.resolve(okResult)),
    }),
  },
  {
    description: "Fail - Documents service unreachable → 503",
    status_code: 503,
    expected_body: docUnhealthy,
    mockBuilder: (): Partial<IHealthService> => ({
      checkDocuments: jest.fn(() => Promise.resolve(docUnhealthy)),
    }),
  },
];

// --- /health/keycloak test cases ---
export const testCasesGetKeycloak = [
  {
    description: "Success - Keycloak ok → 200",
    status_code: 200,
    expected_body: okResult,
    mockBuilder: (): Partial<IHealthService> => ({
      checkKeycloak: jest.fn(() => Promise.resolve(okResult)),
    }),
  },
  {
    description: "Fail - Keycloak HTTP 500 → 503",
    status_code: 503,
    expected_body: kcUnhealthy,
    mockBuilder: (): Partial<IHealthService> => ({
      checkKeycloak: jest.fn(() => Promise.resolve(kcUnhealthy)),
    }),
  },
];
