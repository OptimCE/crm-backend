import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";

const AUTH_USER = "auth0|tester";
const AUTH_USER_OTHER = "auth0|other";

/** Filter cache keys to only municipalities-prefixed entries */
function municipalityKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("municipalities:search"));
}

describe("(Cache Integration) Municipality Module", () => {
  useFunctionalCacheTestDb();

  /** Get the cache service from the current DI container */
  async function getCacheService(): Promise<ICacheService> {
    const { container } = await import("../../../src/container/di-container.js");
    return container.get<ICacheService>("CacheService");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 1 — Cache population on first GET (cold cache)
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Population (Cold Cache)", () => {
    it("should populate cache on first GET /municipalities/", async () => {
      const cache = await getCacheService();
      expect(municipalityKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = municipalityKeys(cache.keys() as string[]);
      expect(keys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(keys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 2 — Cache hit on second identical GET
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Hit (Warm Cache)", () => {
    it("should serve from cache on second identical GET /municipalities/", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MunicipalityService } = await import("../../../src/modules/municipalities/infra/municipality.service.js");
      const spy = jest.spyOn(MunicipalityService.prototype, "searchMunicipalities");

      const res1 = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1); // Still 1 — second request served from cache
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 3 — Different query params produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Query Params", () => {
    it("should create separate cache entries for different query params", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);
      await request(app).get("/municipalities/").query({ page: "2", limit: "10" }).set("x-user-id", AUTH_USER);
      await request(app).get("/municipalities/").query({ name: "Brux", page: "1", limit: "10" }).set("x-user-id", AUTH_USER);

      const keys = municipalityKeys(cache.keys() as string[]);
      expect(keys).toHaveLength(3);
      expect(new Set(keys).size).toBe(3); // all distinct
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Cache scope is "none" — same query across users hits same key
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Scope (none)", () => {
    it("should share a single cache entry across users for identical queries", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { MunicipalityService } = await import("../../../src/modules/municipalities/infra/municipality.service.js");
      const spy = jest.spyOn(MunicipalityService.prototype, "searchMunicipalities");

      await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);
      await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER_OTHER);

      const keys = municipalityKeys(cache.keys() as string[]);
      expect(keys).toHaveLength(1); // single key shared across users
      expect(spy).toHaveBeenCalledTimes(1); // service only invoked once

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — TTL expiration
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { MunicipalityService } = await import("../../../src/modules/municipalities/infra/municipality.service.js");
      const spy = jest.spyOn(MunicipalityService.prototype, "searchMunicipalities");

      const res1 = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const keys = municipalityKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      expect(municipalityKeys(cache.keys() as string[])).toHaveLength(0);

      const res2 = await request(app).get("/municipalities/").query({ page: "1", limit: "10" }).set("x-user-id", AUTH_USER);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // service called again after expiry

      spy.mockRestore();
    });
  });
});
