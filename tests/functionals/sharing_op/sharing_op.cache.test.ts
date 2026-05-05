import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { SharingOperationType, SharingKeyStatus } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { existingSharingOpId1, existingSharingOpId2, existingKeyId1, existingEAN, AUTH_COMMUNITY_1 } from "./sharing_op.const.js";

const AUTH_USER_ADMIN = "auth0|admin";

/** Filter cache keys to only sharing-op prefixed entries */
function sharingOpKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("sharing-op:"));
}

/** Filter cache keys to only public-sharing-operations entries (none-scoped, populated by GET /communities/:id/sharing_operations/public). */
function publicSharingOpKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("communities:public-sharing-operations:"));
}

describe("(Cache Integration) Sharing Operation Module", () => {
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
    it("should populate cache on first GET /sharing_operations/", async () => {
      const cache = await getCacheService();
      expect(sharingOpKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = sharingOpKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("sharing-op:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /sharing_operations/:id", async () => {
      const cache = await getCacheService();
      expect(sharingOpKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = sharingOpKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("sharing-op:detail"));
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
    it("should serve from cache on second identical GET /sharing_operations/", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { SharingOperationService } = await import("../../../src/modules/sharing_operations/infra/sharing_operation.service.js");
      const spy = jest.spyOn(SharingOperationService.prototype, "getSharingOperationList");

      const res1 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/sharing_operations/")
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

    it("should serve from cache on second identical GET /sharing_operations/:id", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { SharingOperationService } = await import("../../../src/modules/sharing_operations/infra/sharing_operation.service.js");
      const spy = jest.spyOn(SharingOperationService.prototype, "getSharingOperation");

      const res1 = await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
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
    it("should create separate cache entries for different query params", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      await request(app)
        .get("/sharing_operations/")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get("/sharing_operations/")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = sharingOpKeys(cache.keys() as string[]).filter((k) => k.includes("sharing-op:list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Different communities produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Communities", () => {
    it("should create separate cache entries for different communities on community-scoped endpoint", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const res1 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res1.status).toBe(200);

      const ORGS_ADMIN_COMM2 = "[orgId:2 orgPath:/org2 roles:[ADMIN]]";
      const res2 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_ADMIN_COMM2);
      expect(res2.status).toBe(200);

      const keys = sharingOpKeys(cache.keys() as string[]).filter((k) => k.includes("sharing-op:list"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes(`c:${AUTH_COMMUNITY_1}`));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Cache invalidation on create (list only)
  //
  // createSharingOperation uses:
  //   cachePattern("sharing-op:list", "community") → "sharing-op:list:c:{community_id}:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Create (list only)", () => {
    it("should invalidate list keys on create", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const getRes = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(getRes.status).toBe(200);

      // Also populate detail cache (should NOT be invalidated by create)
      const detailRes = await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      const keysBefore = sharingOpKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Create sharing operation → fires cachePattern("sharing-op:list", "community")
      const createRes = await request(app)
        .post("/sharing_operations/")
        .send({ name: "Cache Test Op", type: SharingOperationType.LOCAL, municipality_nis_codes: [21001] })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(createRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // List keys should be gone, detail key should remain
      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));
      expect(listKeys).toHaveLength(0);
      expect(detailKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on addKey (keys + detail)
  //
  // addKeyToSharing uses:
  //   cachePattern("sharing-op:keys", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — AddKey (keys + detail)", () => {
    it("should invalidate keys and detail cache on addKey, leaving list untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list, detail, and keys caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId2}/keys`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = sharingOpKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Add key to Op 2
      const addKeyRes = await request(app)
        .post("/sharing_operations/key")
        .send({ id_sharing: existingSharingOpId2, id_key: existingKeyId1 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(addKeyRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));
      const keyKeys = keysAfter.filter((k) => k.includes("sharing-op:keys"));

      expect(listKeys).toHaveLength(1); // list untouched
      expect(detailKeys).toHaveLength(0); // detail cleared
      expect(keyKeys).toHaveLength(0); // keys cleared
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on patchKey (keys + detail)
  //
  // patchKeyStatus uses:
  //   cachePattern("sharing-op:keys", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchKey (keys + detail)", () => {
    it("should invalidate keys and detail cache on patchKey, leaving list untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list, detail, and keys caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}/keys`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(3);

      // Patch key status (approve key 1 on Op 1)
      const patchRes = await request(app)
        .patch("/sharing_operations/key")
        .send({
          id_sharing: existingSharingOpId1,
          id_key: existingKeyId1,
          status: SharingKeyStatus.APPROVED,
          date: "2024-02-01",
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));
      const keyKeys = keysAfter.filter((k) => k.includes("sharing-op:keys"));

      expect(listKeys).toHaveLength(1); // list untouched
      expect(detailKeys).toHaveLength(0); // detail cleared
      expect(keyKeys).toHaveLength(0); // keys cleared
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — Cache invalidation on addMeter (meters + detail)
  //
  // addMeterToSharing uses:
  //   cachePattern("sharing-op:meters", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — AddMeter (meters + detail)", () => {
    it("should invalidate detail cache on addMeter, leaving list untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list and detail caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(2);

      // Add meter to Op 2
      const addMeterRes = await request(app)
        .post("/sharing_operations/meter")
        .send({
          id_sharing: existingSharingOpId2,
          ean_list: [existingEAN],
          date: "2024-06-01",
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(addMeterRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));

      expect(listKeys).toHaveLength(1); // list untouched
      expect(detailKeys).toHaveLength(0); // detail cleared
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Cache invalidation on patchMeter (meters + detail)
  //
  // patchMeterStatus uses:
  //   cachePattern("sharing-op:meters", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchMeter (meters + detail)", () => {
    it("should invalidate detail cache on patchMeter, leaving list untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list and detail caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(2);

      // Patch meter status
      const patchRes = await request(app)
        .patch("/sharing_operations/meter")
        .send({
          id_sharing: existingSharingOpId1,
          id_meter: existingEAN,
          status: MeterDataStatus.WAITING_GRD,
          date: "2024-03-01",
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));

      expect(listKeys).toHaveLength(1); // list untouched
      expect(detailKeys).toHaveLength(0); // detail cleared
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — Nuclear invalidation on delete
  //
  // deleteSharingOperation uses ALL 5 patterns:
  //   cachePattern("sharing-op:list", "community")
  //   cachePattern("sharing-op:detail", "community")
  //   cachePattern("sharing-op:meters", "community")
  //   cachePattern("sharing-op:keys", "community")
  //   cachePattern("sharing-op:consumptions", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Delete (nuclear)", () => {
    it("should invalidate ALL sharing-op cache keys on delete", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate multiple cache types (list, detail, keys)
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId2}/keys`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = sharingOpKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThanOrEqual(3);

      // Delete Op 2 (requires ADMIN role)
      const deleteRes = await request(app)
        .delete(`/sharing_operations/${existingSharingOpId2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      expect(sharingOpKeys(cache.keys() as string[])).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 11 — Cache invalidation on removeMeter (meters + detail)
  //
  // deleteMeterFromSharingOperation uses:
  //   cachePattern("sharing-op:meters", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — RemoveMeter (meters + detail)", () => {
    it("should invalidate detail cache on removeMeter, leaving list untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list and detail caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(2);

      // Remove meter from Op 1
      const removeRes = await request(app)
        .delete(`/sharing_operations/${existingSharingOpId1}/meter`)
        .send({
          id_sharing: existingSharingOpId1,
          id_meter: existingEAN,
          date: "2024-06-01",
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(removeRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));

      expect(listKeys).toHaveLength(1); // list untouched
      expect(detailKeys).toHaveLength(0); // detail cleared
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 12 — Selectivity of scoped invalidation across communities
  //
  // Community-scoped invalidation should only affect the targeted community,
  // leaving other communities' cache entries untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the target community's cache, not other communities'", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache for community 1
      const r1 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r1.status).toBe(200);

      // Populate list cache for community 2
      const ORGS_ADMIN_COMM2 = "[orgId:2 orgPath:/org2 roles:[ADMIN]]";
      const r2 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_ADMIN_COMM2);
      expect(r2.status).toBe(200);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(2);

      // Create sharing op in community 1 → pattern "sharing-op:list:c:1:*"
      const createRes = await request(app)
        .post("/sharing_operations/")
        .send({ name: "Selectivity Test Op", type: SharingOperationType.LOCAL, municipality_nis_codes: [21001] })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(createRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's list cache should be gone, community 2's should remain
      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain("c:2");
      expect(remainingKey).not.toContain(`c:${AUTH_COMMUNITY_1}:`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 13 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when write operation fails", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = sharingOpKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(1);

      // Attempt to get a non-existent sharing op detail (triggers error, not 2xx)
      // Using delete on non-existent op to trigger a failed write
      const failRes = await request(app)
        .delete("/sharing_operations/999")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 14 — Cache invalidation on patchVisibility (list + detail)
  //
  // patchVisibility uses:
  //   cachePattern("sharing-op:list", "community")
  //   cachePattern("sharing-op:detail", "community")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchVisibility (list + detail)", () => {
    it("should invalidate list and detail cache on patchVisibility, leaving keys untouched", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list, detail, and keys caches
      await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/sharing_operations/${existingSharingOpId1}/keys`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(sharingOpKeys(cache.keys() as string[]).length).toBe(3);

      // Patch visibility (set to private)
      const patchRes = await request(app)
        .patch("/sharing_operations/visibility")
        .send({
          id_sharing: existingSharingOpId1,
          is_public: false,
        })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = sharingOpKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("sharing-op:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("sharing-op:detail"));
      const keyKeys = keysAfter.filter((k) => k.includes("sharing-op:keys"));

      expect(listKeys).toHaveLength(0); // list cleared
      expect(detailKeys).toHaveLength(0); // detail cleared
      expect(keyKeys).toHaveLength(1); // keys untouched
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 15 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { SharingOperationService } = await import("../../../src/modules/sharing_operations/infra/sharing_operation.service.js");
      const spy = jest.spyOn(SharingOperationService.prototype, "getSharingOperationList");

      // First request — populates cache
      const res1 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = sharingOpKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(sharingOpKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/sharing_operations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 16 — communities:public-sharing-operations invalidation
  //
  // GET /communities/:id/sharing_operations/public uses
  //   cacheKey("communities:public-sharing-operations", "none", ...)
  // Mutating sharing-op endpoints (create, patchVisibility, delete, updateMunicipalities)
  // invalidate the same prefix (none-scoped → wipes ALL community entries).
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Communities Public Sharing Operations", () => {
    it("should invalidate communities:public-sharing-operations on create/patchVisibility/delete", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate the public-sharing-operations cache for community 1
      const populateRes = await request(app)
        .get("/communities/1/sharing_operations/public")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(populateRes.status).toBe(200);
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(1);

      // Create a sharing op → invalidates the public-sharing-operations prefix
      const createRes = await request(app)
        .post("/sharing_operations/")
        .send({ name: "Public Cache Op", type: SharingOperationType.LOCAL, municipality_nis_codes: [21001] })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(createRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(0);

      // Re-populate, then patchVisibility → invalidates again
      await request(app)
        .get("/communities/1/sharing_operations/public")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(1);

      const patchRes = await request(app)
        .patch("/sharing_operations/visibility")
        .send({ id_sharing: existingSharingOpId1, is_public: false })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(0);

      // Re-populate, then delete (Op 2 is deletable) → invalidates again
      await request(app)
        .get("/communities/1/sharing_operations/public")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(1);

      const deleteRes = await request(app)
        .delete(`/sharing_operations/${existingSharingOpId2}`)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));
      expect(publicSharingOpKeys(cache.keys() as string[])).toHaveLength(0);
    });
  });
});
