import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog, mockStorageServiceModule } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

const AUTH_USER = "auth0|admin";
const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";
const MEMBER_ID = "1";

/** Filter cache keys to only document-prefixed entries */
function documentKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("documents:"));
}

describe("(Cache Integration) Document Module", () => {
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
    it("should populate cache on first GET /documents/:member_id", async () => {
      const cache = await getCacheService();
      expect(documentKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = documentKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("documents:document-list"));
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
    it("should serve from cache on second identical GET /documents/:member_id", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { DocumentService } = await import("../../../src/modules/documents/infra/document.service.js");
      const spy = jest.spyOn(DocumentService.prototype, "getDocuments");

      const res1 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

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

      await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = documentKeys(cache.keys() as string[]).filter((k) => k.includes("documents:document-list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Different member IDs produce different cache entries
  //
  // Cache key suffix includes member_id: "documents:document-list:c:<cid>:<member_id>:<query>"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Member IDs", () => {
    it("should create separate cache entries for different member IDs", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const res1 = await request(app)
        .get("/documents/1")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .get("/documents/2")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);

      const keys = documentKeys(cache.keys() as string[]).filter((k) => k.includes("documents:document-list"));
      expect(keys).toHaveLength(2);

      // Verify each key contains its respective member ID in the suffix
      const key1 = keys.find((k) => k.includes(":1:"));
      const key2 = keys.find((k) => k.includes(":2:"));
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Different communities produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Communities", () => {
    it("should create separate cache entries for different communities", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Community 1
      const res1 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);

      // Community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const res2 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(res2.status).toBe(200);

      const keys = documentKeys(cache.keys() as string[]).filter((k) => k.includes("documents:document-list"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes(`c:${AUTH_COMMUNITY_1}`));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on upload
  //
  // uploadDocument uses: @InvalidateCache([cachePattern("documents:document-list", "community")])
  // → pattern "documents:document-list:c:<community_id>:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Upload", () => {
    it("should invalidate document-list cache on upload", async () => {
      await mockStorageServiceModule({
        uploadDocument: jest.fn<() => Promise<{ url: string; file_type: string }>>().mockResolvedValue({
          url: "http://storage/cache_test.pdf",
          file_type: "application/pdf",
        }),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      const getRes = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(getRes.status).toBe(200);

      const keysBefore = documentKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThan(0);

      // Upload document → fires invalidation
      const uploadRes = await request(app)
        .post("/documents/")
        .field("id_member", "1")
        .attach("file", Buffer.from("dummy content"), "cache_test.pdf")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(uploadRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      // Document list keys should be gone
      const keysAfter = documentKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on delete
  //
  // deleteDocument uses: @InvalidateCache([cachePattern("documents:document-list", "community")])
  // → pattern "documents:document-list:c:<community_id>:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Delete", () => {
    it("should invalidate document-list cache on delete", async () => {
      await mockStorageServiceModule({
        deleteDocument: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      const getRes = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(getRes.status).toBe(200);

      const keysBefore = documentKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThan(0);

      // Delete document 1 (seeded) → fires invalidation
      const deleteRes = await request(app)
        .delete("/documents/1")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(deleteRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      // Document list keys should be gone
      const keysAfter = documentKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — Selectivity of community-scoped invalidation
  //
  // Invalidation pattern "documents:document-list:c:<community_id>:*" should
  // only clear entries for the targeted community.
  //
  // Note: We use DELETE (not upload) for this test because multer's async
  // file processing breaks AsyncLocalStorage context, causing the invalidation
  // pattern to lose its community scope.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the target community's cache, not other communities'", async () => {
      await mockStorageServiceModule({
        deleteDocument: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache for community 1
      const r1 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(r1.status).toBe(200);

      // Populate cache for community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const r2 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(r2.status).toBe(200);

      expect(documentKeys(cache.keys() as string[]).length).toBe(2);

      // Delete document 1 in community 1 → pattern "documents:document-list:c:1:*"
      const deleteRes = await request(app)
        .delete("/documents/1")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's cache should be gone, community 2's should remain
      const keysAfter = documentKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain("c:2");
      expect(remainingKey).not.toContain(`c:${AUTH_COMMUNITY_1}:`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when delete fails (non-existent document)", async () => {
      await mockStorageServiceModule({
        deleteDocument: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = documentKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(1);

      // Attempt to delete non-existent document → should fail with non-2xx
      const failRes = await request(app)
        .delete("/documents/999")
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = documentKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { DocumentService } = await import("../../../src/modules/documents/infra/document.service.js");
      const spy = jest.spyOn(DocumentService.prototype, "getDocuments");

      // First request — populates cache
      const res1 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = documentKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(documentKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get(`/documents/${MEMBER_ID}`)
        .set("x-user-id", AUTH_USER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
