import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_ADMIN, ORGS_MEMBER } from "../../utils/shared.consts.js";

const AUTH_USER_ADMIN = "auth0|admin";
const AUTH_USER_MEMBER = "auth0|member";
const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

/** Filter cache keys to only users-prefixed entries */
function userKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("users:"));
}

describe("(Cache Integration) User Module", () => {
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
    it("should populate cache on first GET /users/", async () => {
      const cache = await getCacheService();
      expect(userKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = userKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("users:profile"));
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
    it("should serve from cache on second identical GET /users/", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { UserService } = await import("../../../src/modules/users/infra/user.service.js");
      const spy = jest.spyOn(UserService.prototype, "getProfile");

      const res1 = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1); // Still 1 — second request served from cache
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 3 — Different users produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Users", () => {
    it("should create separate cache entries for different users", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const resAdmin = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(resAdmin.status).toBe(200);

      const resMember = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(resMember.status).toBe(200);

      const keys = userKeys(cache.keys() as string[]).filter((k) => k.includes("users:profile"));
      expect(keys).toHaveLength(2);

      const adminKey = keys.find((k) => k.includes(AUTH_USER_ADMIN));
      const memberKey = keys.find((k) => k.includes(AUTH_USER_MEMBER));
      expect(adminKey).toBeDefined();
      expect(memberKey).toBeDefined();

      const cachedAdmin = await cache.get<{ status: number; body: unknown }>(adminKey!);
      const cachedMember = await cache.get<{ status: number; body: unknown }>(memberKey!);
      expect(cachedAdmin!.body).toEqual(resAdmin.body);
      expect(cachedMember!.body).toEqual(resMember.body);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Cache invalidation on update profile (user-scoped)
  //
  // cachePattern("users:profile", "user") → "users:profile:u:{user_id}:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Update Profile", () => {
    it("should invalidate user profile cache on successful update", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate profile cache
      const getRes = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(getRes.status).toBe(200);

      const keysBefore = userKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThan(0);

      // Update profile → fires cachePattern("users:profile", "user")
      const updateRes = await request(app)
        .put("/users/")
        .send({ first_name: "UpdatedAdmin" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(updateRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      // User profile cache should be gone
      const keysAfter = userKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Selectivity of user-scoped invalidation
  //
  // Updating user A's profile should only invalidate A's cache, not B's.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the updating user's cache, not other users'", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate profile cache for user A (admin)
      await request(app).get("/users/").set("x-user-id", AUTH_USER_ADMIN).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);

      // Populate profile cache for user B (member)
      await request(app).get("/users/").set("x-user-id", AUTH_USER_MEMBER).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_MEMBER);

      expect(userKeys(cache.keys() as string[]).length).toBe(2);

      // Update profile as user A → pattern "users:profile:u:auth0|admin:*"
      const updateRes = await request(app)
        .put("/users/")
        .send({ first_name: "SelectivityTest" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(updateRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // User A's cache should be gone, user B's should remain
      const keysAfter = userKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain(AUTH_USER_MEMBER);
      expect(remainingKey).not.toContain(AUTH_USER_ADMIN);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when write operation fails", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate profile cache
      await request(app).get("/users/").set("x-user-id", AUTH_USER_ADMIN).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);

      const keysBefore = userKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(1);

      // Attempt update with non-existent user → triggers USER_NOT_FOUND (400)
      const failRes = await request(app)
        .put("/users/")
        .send({ first_name: "Ghost" })
        .set("x-user-id", "auth0|nonexistent")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = userKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { UserService } = await import("../../../src/modules/users/infra/user.service.js");
      const spy = jest.spyOn(UserService.prototype, "getProfile");

      // First request — populates cache
      const res1 = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = userKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(userKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/users/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
