import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog, mockIAMServiceModule } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_ADMIN, ORGS_MEMBER, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

const AUTH_USER_ADMIN = "auth0|admin";
const AUTH_USER_MEMBER = "auth0|member";
const AUTH_COMMUNITY_1 = "1";

/** Filter cache keys to only community-prefixed entries */
function communityKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("communities:"));
}

describe("(Cache Integration) Community Module", () => {
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
    it("should populate cache on first GET /communities/my-communities", async () => {
      const cache = await getCacheService();
      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = communityKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("communities:user-list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /communities/users", async () => {
      const cache = await getCacheService();
      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = communityKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("communities:users"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /communities/admins", async () => {
      const cache = await getCacheService();
      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = communityKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("communities:admins"));
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
    it("should serve from cache on second identical GET /communities/my-communities", async () => {
      const { default: app } = await import("../../../src/app.js");

      // Spy on the service prototype so all instances (including the one in the controller) are intercepted
      const { CommunityService } = await import("../../../src/modules/communities/infra/community.service.js");
      const spy = jest.spyOn(CommunityService.prototype, "getMyCommunities");

      const res1 = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get("/communities/my-communities")
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

    it("should serve from cache on second identical GET /communities/users", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { CommunityService } = await import("../../../src/modules/communities/infra/community.service.js");
      const spy = jest.spyOn(CommunityService.prototype, "getUsers");

      const res1 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

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
        .get("/communities/my-communities")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await request(app)
        .get("/communities/my-communities")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      const keys = communityKeys(cache.keys() as string[]).filter((k) => k.includes("communities:user-list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Different users produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Users", () => {
    it("should create separate cache entries for different users on user-scoped endpoint", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const resAdmin = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(resAdmin.status).toBe(200);

      const resMember = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(resMember.status).toBe(200);

      const keys = communityKeys(cache.keys() as string[]).filter((k) => k.includes("communities:user-list"));
      expect(keys).toHaveLength(2);

      // Verify each key contains its respective user ID
      const adminKey = keys.find((k) => k.includes(AUTH_USER_ADMIN));
      const memberKey = keys.find((k) => k.includes(AUTH_USER_MEMBER));
      expect(adminKey).toBeDefined();
      expect(memberKey).toBeDefined();

      // Each cached value should match its own request's response
      const cachedAdmin = await cache.get<{ status: number; body: unknown }>(adminKey!);
      const cachedMember = await cache.get<{ status: number; body: unknown }>(memberKey!);
      expect(cachedAdmin!.body).toEqual(resAdmin.body);
      expect(cachedMember!.body).toEqual(resMember.body);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Different communities produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Communities", () => {
    it("should create separate cache entries for different communities on community-scoped endpoint", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Community 1 — admin user with orgId:1
      const res1 = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res1.status).toBe(200);

      // Community 2 — same user but with orgId:2 (community 2 exists in seed)
      const ORGS_ADMIN_COMM2 = "[orgId:2 orgPath:/org2 roles:[ADMIN]]";
      const res2 = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_ADMIN_COMM2);
      expect(res2.status).toBe(200);

      const keys = communityKeys(cache.keys() as string[]).filter((k) => k.includes("communities:admins"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes("c:1"));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on create (user-scoped)
  //
  // cachePattern("communities:user-list", "user") → "communities:user-list:u:{user_id}:*"
  // This correctly matches cache keys "communities:user-list:u:{user_id}:{query}".
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Create (user-scoped)", () => {
    it("should invalidate user-scoped keys on create", async () => {
      await mockIAMServiceModule({
        createCommunity: jest.fn<() => Promise<string>>().mockResolvedValue("auth0|new_cache_comm"),
        addUserToCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate user-list cache
      const getRes = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(getRes.status).toBe(200);

      const keysBefore = communityKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThan(0);

      // Create community → fires cachePattern("communities:user-list", "user")
      // → pattern "communities:user-list:u:auth0|admin:*" matches the cached key
      const createRes = await request(app)
        .post("/communities/")
        .send({ name: "Cache Test Community" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(createRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      // User-list keys for the creating user should be gone
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on update (community + user scoped)
  //
  // Update invalidates 3 patterns:
  //   cachePattern("communities:users", "community")     → "communities:users:c:{community_id}:*"
  //   cachePattern("communities:admins", "community")    → "communities:admins:c:{community_id}:*"
  //   cachePattern("communities:user-list", "user")      → "communities:user-list:u:{user_id}:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Update (community + user scoped)", () => {
    it("should invalidate community-scoped and user-scoped keys on update", async () => {
      await mockIAMServiceModule({
        updateCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate all 3 cache types
      const userListRes = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(userListRes.status).toBe(200);

      const usersRes = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(usersRes.status).toBe(200);

      const adminsRes = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(adminsRes.status).toBe(200);

      const keysBefore = communityKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Update community → fires all 3 invalidation patterns
      const updateRes = await request(app)
        .put("/communities/")
        .send({ name: "Updated Name" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(updateRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // All 3 cache entries should be cleared
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — PatchRole invalidation (community-scoped only)
  //
  // patchRole uses:
  //   cachePattern("communities:users", "community")  → "communities:users:c:{community_id}:*"
  //   cachePattern("communities:admins", "community") → "communities:admins:c:{community_id}:*"
  //
  // It does NOT invalidate user-list entries.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchRole (community-scoped)", () => {
    it("should invalidate community-scoped users/admins but NOT user-scoped user-list", async () => {
      await mockIAMServiceModule({
        updateUserRole: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate all 3 cache types
      const r1 = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r1.status).toBe(200);

      const r2 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r2.status).toBe(200);

      const r3 = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r3.status).toBe(200);

      expect(communityKeys(cache.keys() as string[]).length).toBe(3);

      // patchRole → community-scoped invalidation (users + admins only)
      const patchRes = await request(app)
        .patch("/communities/")
        .send({ id_user: 3, new_role: "MANAGER" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // users + admins keys should be gone, but user-list should remain
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const userListKeys = keysAfter.filter((k) => k.includes("communities:user-list"));
      expect(userListKeys).toHaveLength(1);

      const usersKeys = keysAfter.filter((k) => k.startsWith("communities:users:"));
      expect(usersKeys).toHaveLength(0);

      const adminsKeys = keysAfter.filter((k) => k.includes("communities:admins"));
      expect(adminsKeys).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8b — Nuclear invalidation (kick/delete)
  //
  // kick and delete use cachePattern("communities", "none") → "communities:*"
  // This matches ALL community cache keys regardless of scope.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Nuclear (kick/delete)", () => {
    it("should invalidate ALL community cache keys on kick", async () => {
      await mockIAMServiceModule({
        deleteUserFromCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      const r1 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r1.status).toBe(200);
      expect(communityKeys(cache.keys() as string[]).length).toBe(1);

      // Kick user 3 → nuclear invalidation
      const kickRes = await request(app)
        .delete("/communities/kick/3")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(kickRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);
    });

    it("should invalidate ALL community cache keys on delete", async () => {
      await mockIAMServiceModule({
        deleteCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      const r1 = await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r1.status).toBe(200);
      expect(communityKeys(cache.keys() as string[]).length).toBe(1);

      // Delete community 1 → nuclear invalidation
      const deleteRes = await request(app)
        .delete("/communities/delete/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Leave invalidation (user + community scoped)
  //
  // leave uses:
  //   cachePattern("communities:user-list", "user")      → user-scoped
  //   cachePattern("communities:users", "community")     → community-scoped
  //   cachePattern("communities:admins", "community")    → community-scoped
  //
  // Without x-community-id, community_id is undefined → community patterns
  // degrade to broader wildcards (e.g., "communities:users:*").
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Leave", () => {
    it("should invalidate all keys when leaving without x-community-id (community patterns widen)", async () => {
      await mockIAMServiceModule({
        deleteUserFromCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate user-list as the LEAVING user (member) so user-scoped pattern matches
      await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      // Populate community-scoped caches
      await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      expect(communityKeys(cache.keys() as string[]).length).toBe(3);

      // Leave WITHOUT x-community-id → community patterns widen to:
      //   "communities:user-list:u:auth0|member:*" → matches member's user-list entry
      //   "communities:users:*"                    → matches all users entries (nuclear for users)
      //   "communities:admins:*"                   → matches all admins entries (nuclear for admins)
      const leaveRes = await request(app).delete("/communities/leave/1").set("x-user-id", AUTH_USER_MEMBER).set("x-user-orgs", ORGS_MEMBER);
      expect(leaveRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // All community keys should be gone
      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);
    });

    it("should invalidate scoped keys when leaving with x-community-id", async () => {
      await mockIAMServiceModule({
        deleteUserFromCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate user-list as the LEAVING user (member) so user-scoped pattern matches
      await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      // Populate community-scoped caches
      await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await request(app)
        .get("/communities/admins")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      const keysBefore = communityKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Leave WITH x-community-id → all 3 patterns are scoped and match:
      //   "communities:user-list:u:auth0|member:*" → matches member's user-list entry
      //   "communities:users:c:1:*"                → matches community 1's users entry
      //   "communities:admins:c:1:*"               → matches community 1's admins entry
      const leaveRes = await request(app)
        .delete("/communities/leave/1")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(leaveRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // All 3 scoped keys should be invalidated
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — Selectivity of scoped invalidation
  //
  // Scoped invalidation should only affect the targeted user or community,
  // leaving other users/communities' cache entries untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the creating user's cache, not other users'", async () => {
      await mockIAMServiceModule({
        createCommunity: jest.fn<() => Promise<string>>().mockResolvedValue("auth0|selectivity_comm"),
        addUserToCommunity: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate user-list cache for user A (admin)
      await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      // Populate user-list cache for user B (member)
      await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      expect(communityKeys(cache.keys() as string[]).length).toBe(2);

      // Create community as user A → pattern "communities:user-list:u:auth0|admin:*"
      const createRes = await request(app)
        .post("/communities/")
        .send({ name: "Selectivity Test Community" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(createRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // User A's cache should be gone, user B's should remain
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain(AUTH_USER_MEMBER);
      expect(remainingKey).not.toContain(AUTH_USER_ADMIN);
    });

    it("should only invalidate the target community's cache, not other communities'", async () => {
      await mockIAMServiceModule({
        updateUserRole: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate users cache for community 1
      const r1 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(r1.status).toBe(200);

      // Populate users cache for community 2
      const ORGS_ADMIN_COMM2 = "[orgId:2 orgPath:/org2 roles:[ADMIN]]";
      const r2 = await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_ADMIN_COMM2);
      expect(r2.status).toBe(200);

      expect(communityKeys(cache.keys() as string[]).length).toBe(2);

      // PatchRole in community 1 → pattern "communities:users:c:1:*"
      const patchRes = await request(app)
        .patch("/communities/")
        .send({ id_user: 3, new_role: "MANAGER" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's users cache should be gone, community 2's should remain
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain("c:2");
      expect(remainingKey).not.toContain("c:1:");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 11 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when write operation fails", async () => {
      await mockIAMServiceModule({
        updateUserRole: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await request(app)
        .get("/communities/users")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      const keysBefore = communityKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Attempt patchRole with non-existent user → should fail with non-2xx
      const failRes = await request(app)
        .patch("/communities/")
        .send({ id_user: 999, new_role: "MANAGER" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = communityKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 12 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { CommunityService } = await import("../../../src/modules/communities/infra/community.service.js");
      const spy = jest.spyOn(CommunityService.prototype, "getMyCommunities");

      // First request — populates cache
      const res1 = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = communityKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(communityKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/communities/my-communities")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
