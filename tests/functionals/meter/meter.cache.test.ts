import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { existingEAN, existingEAN2, newEAN, AUTH_COMMUNITY_1, testCasesAddMeter, testCasesPatchMeterData } from "./meter.const.js";
import { TarifGroup, ReadingFrequency } from "../../../src/modules/meters/shared/meter.types.js";

const AUTH_USER_ADMIN = "auth0|admin";

/** Filter cache keys to only meter-prefixed entries */
function meterKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("meters:"));
}

describe("(Cache Integration) Meter Module", () => {
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
    it("should populate cache on first GET /meters/ (list)", async () => {
      const cache = await getCacheService();
      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meterKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("meters:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /meters/:id (detail)", async () => {
      const cache = await getCacheService();
      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meterKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("meters:detail"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /meters/:id/consumptions", async () => {
      const cache = await getCacheService();
      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meterKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("meters:consumptions"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 2 — Cache hit on second identical GET
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Hit (Warm Cache)", () => {
    it("should serve from cache on second identical GET /meters/ (list)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeterService } = await import("../../../src/modules/meters/infra/meter.service.js");
      const spy = jest.spyOn(MeterService.prototype, "getMetersList");

      const res1 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1); // Still 1 — second request served from cache
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });

    it("should serve from cache on second identical GET /meters/:id (detail)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeterService } = await import("../../../src/modules/meters/infra/meter.service.js");
      const spy = jest.spyOn(MeterService.prototype, "getMeter");

      const res1 = await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });

    it("should serve from cache on second identical GET /meters/:id/consumptions", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeterService } = await import("../../../src/modules/meters/infra/meter.service.js");
      const spy = jest.spyOn(MeterService.prototype, "getMeterConsumptions");

      const res1 = await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 3 — Different query params produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Query Params", () => {
    it("should create separate cache entries for different query params on list", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      await request(app)
        .get("/meters/")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get("/meters/")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = meterKeys(cache.keys() as string[]).filter((k) => k.includes("meters:list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });

    it("should create separate cache entries for different meter IDs on detail", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = meterKeys(cache.keys() as string[]).filter((k) => k.includes("meters:detail"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Different communities produce different cache entries
  //
  // All meter cache keys are community-scoped:
  //   cacheKey("meters:list", "community", ...) → "meters:list:c:{community_id}:..."
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Communities", () => {
    it("should create separate cache entries for different communities", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Community 1
      const res1 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);

      // Community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const res2 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(res2.status).toBe(200);

      const keys = meterKeys(cache.keys() as string[]).filter((k) => k.includes("meters:list"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes(`c:${AUTH_COMMUNITY_1}`));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Cache invalidation on addMeter (POST /)
  //
  // addMeter invalidates:
  //   cachePattern("meters:list", "community") → "meters:list:c:{community_id}:*"
  //
  // Detail and consumptions cache should remain untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — addMeter (list only)", () => {
    it("should invalidate list cache but NOT detail/consumptions on addMeter", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate all 3 cache types
      await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = meterKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Add a new meter → fires cachePattern("meters:list", "community")
      const addBody = testCasesAddMeter[0].body;
      const addRes = await request(app)
        .post("/meters/")
        .send(addBody)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(addRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = meterKeys(cache.keys() as string[]);

      // List cache should be gone
      const listKeys = keysAfter.filter((k) => k.includes("meters:list"));
      expect(listKeys).toHaveLength(0);

      // Detail and consumptions should remain
      const detailKeys = keysAfter.filter((k) => k.includes("meters:detail"));
      expect(detailKeys).toHaveLength(1);

      const consumptionKeys = keysAfter.filter((k) => k.includes("meters:consumptions"));
      expect(consumptionKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on updateMeter (PUT /)
  //
  // updateMeter invalidates:
  //   cachePattern("meters:list", "community")   → "meters:list:c:{community_id}:*"
  //   cachePattern("meters:detail", "community")  → "meters:detail:c:{community_id}:*"
  //
  // Consumptions cache should remain untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — updateMeter (list + detail)", () => {
    it("should invalidate list and detail cache but NOT consumptions on updateMeter", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate all 3 cache types
      await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(meterKeys(cache.keys() as string[]).length).toBe(3);

      // Update meter → fires list + detail invalidation
      const updateRes = await request(app)
        .put("/meters/")
        .send({
          EAN: existingEAN,
          meter_number: "M1-updated",
          address: { street: "Updated St", number: 1, postcode: "1000", city: "Bruxelles" },
          tarif_group: TarifGroup.LOW_TENSION,
          phases_number: 1,
          reading_frequency: ReadingFrequency.MONTHLY,
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(updateRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = meterKeys(cache.keys() as string[]);

      // List + detail should be gone
      expect(keysAfter.filter((k) => k.includes("meters:list"))).toHaveLength(0);
      expect(keysAfter.filter((k) => k.includes("meters:detail"))).toHaveLength(0);

      // Consumptions should remain
      expect(keysAfter.filter((k) => k.includes("meters:consumptions"))).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on patchMeterData (PATCH /data)
  //
  // patchMeterData invalidates all 3:
  //   cachePattern("meters:list", "community")
  //   cachePattern("meters:detail", "community")
  //   cachePattern("meters:consumptions", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — patchMeterData (nuclear)", () => {
    it("should invalidate all meter cache keys on patchMeterData", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate all 3 cache types
      await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}/consumptions`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(meterKeys(cache.keys() as string[]).length).toBe(3);

      // Patch meter data → fires all 3 invalidation patterns
      const patchBody = testCasesPatchMeterData[0].body;
      const patchRes = await request(app)
        .patch("/meters/data")
        .send(patchBody)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — Cache invalidation on deleteMeter (DELETE /:id)
  //
  // deleteMeter invalidates all 3:
  //   cachePattern("meters:list", "community")
  //   cachePattern("meters:detail", "community")
  //   cachePattern("meters:consumptions", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — deleteMeter (nuclear)", () => {
    it("should invalidate all meter cache keys on deleteMeter", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(meterKeys(cache.keys() as string[]).length).toBe(2);

      // Delete meter → nuclear invalidation
      const deleteRes = await request(app)
        .delete(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Selectivity: invalidation only affects the target community
  //
  // Scoped invalidation should only affect the targeted community,
  // leaving other communities' cache entries untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity (community-scoped)", () => {
    it("should only invalidate the target community's cache, not other communities'", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache for community 1
      const r1 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(r1.status).toBe(200);

      // Populate list cache for community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const r2 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(r2.status).toBe(200);

      expect(meterKeys(cache.keys() as string[]).length).toBe(2);

      // Add meter in community 1 → pattern "meters:list:c:1:*"
      const addBody = testCasesAddMeter[0].body;
      const addRes = await request(app)
        .post("/meters/")
        .send(addBody)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(addRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's list cache should be gone, community 2's should remain
      const keysAfter = meterKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain("c:2");
      expect(remainingKey).not.toContain(`c:${AUTH_COMMUNITY_1}:`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when write operation fails", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/meters/${existingEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = meterKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Attempt to delete a non-existent meter → should fail with non-2xx
      const failRes = await request(app)
        .delete(`/meters/${newEAN}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = meterKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 11 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { MeterService } = await import("../../../src/modules/meters/infra/meter.service.js");
      const spy = jest.spyOn(MeterService.prototype, "getMetersList");

      // First request — populates cache
      const res1 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = meterKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(meterKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/meters/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
