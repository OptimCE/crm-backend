import { afterAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { IStorageService } from "../../../src/shared/storage/i-storage.service.js";
import { createMockStorageService } from "../../external_mocking/storage_service.mock.js";
import { startFakeKeycloak } from "../../external_mocking/keycloak.fake.js";

/**
 * HealthService itself; health.test.ts covers the controller with the service mocked.
 *
 * GET /health answered 503 on every stack whatever the state of the service. Observed on
 * the dev container on 2026-10-06, with the database, MinIO and Keycloak all up:
 *   document: "Configuration property \"services.documents.url\" is not defined"
 *   keycloak: "HTTP undefined"
 */

// config/test.cjs reads IAM_BASE_URL when `config` is first imported, so the fake must be
// listening, and the variable set, before the service module (and `config`) is loaded.
const keycloak = await startFakeKeycloak(["optimce-realm"]);
process.env.IAM_BASE_URL = keycloak.baseUrl;
const { HealthService } = await import("../../../src/modules/health/infra/health.service.js");

function storageAnswering(ping: () => Promise<void> = (): Promise<void> => Promise.resolve()): jest.Mocked<IStorageService> {
  return { ...createMockStorageService(), ping: jest.fn(ping) };
}

describe("(Unit) HealthService", () => {
  afterAll(async () => {
    await keycloak.close();
  });

  describe("checkDocuments", () => {
    it("is ok when the storage adapter reaches its bucket", async () => {
      // The check used to GET config `services.documents.url` + "/health". No config file
      // defines that key, and none ever did: it was written for the OpenFiles document store,
      // which S3/MinIO replaced on 2026-04-12, and config.get() throws for an undefined key.
      const storage = storageAnswering();

      const result = await new HealthService(storage).checkDocuments();

      expect(result).toEqual({ status: "ok", latencyMs: expect.any(Number) });
      expect(storage.ping).toHaveBeenCalledTimes(1);
    });

    it("is unhealthy with the adapter's reason when the bucket cannot be reached", async () => {
      const storage = storageAnswering(() => Promise.reject(new Error("HeadBucket crm-files: HTTP 404")));

      const result = await new HealthService(storage).checkDocuments();

      expect(result).toMatchObject({ status: "unhealthy", error: "HeadBucket crm-files: HTTP 404" });
    });
  });

  describe("checkKeycloak", () => {
    beforeEach(() => {
      keycloak.realms.add("optimce-realm");
      keycloak.requests.length = 0;
    });

    it("is ok when Keycloak serves the configured realm", async () => {
      // Keycloak 26 serves /health on the management port only, and only with
      // KC_HEALTH_ENABLED, which the dev stack does not set: `<baseUrl>/health` is a 404.
      const result = await new HealthService(storageAnswering()).checkKeycloak();

      expect(result).toEqual({ status: "ok", latencyMs: expect.any(Number) });
      expect(keycloak.requests).toEqual(["/keycloak/realms/optimce-realm/.well-known/openid-configuration"]);
    });

    it("reports the HTTP status, not a field of the response body", async () => {
      // `call()` resolves to the response BODY, so `response.status` was the body's `status`
      // field: undefined for Keycloak's 404 ("HTTP undefined"), and for a healthy Keycloak
      // too, whose /health/ready says {"status":"UP"} and whose discovery document has no
      // `status` at all. The check could not report ok against any real Keycloak.
      keycloak.realms.delete("optimce-realm");

      const result = await new HealthService(storageAnswering()).checkKeycloak();

      expect(result).toMatchObject({ status: "unhealthy", error: "HTTP 404" });
    });

    // Last: it stops the fake for the rest of the file.
    it("is unhealthy rather than throwing when Keycloak is unreachable", async () => {
      await keycloak.close();

      const result = await new HealthService(storageAnswering()).checkKeycloak();

      // ECONNREFUSED, or ECONNRESET when axios reuses the previous test's keep-alive socket.
      expect(result).toEqual({ status: "unhealthy", error: expect.any(String) });
    });
  });
});
