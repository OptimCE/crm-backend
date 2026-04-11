import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";

const AUTH_USER_ADMIN = "auth0|admin";
const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

/** Filter cache keys to only members-prefixed entries */
function memberKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("members:"));
}

/** Valid body for creating a member (Individual) */
const VALID_CREATE_MEMBER_BODY = {
  name: "Cache Test Member",
  member_type: 1,
  status: 1,
  iban: "BE0000000000",
  home_address: { street: "Rue Test", number: 1, city: "Brussels", postcode: "1000" },
  billing_address: { street: "Rue Test", number: 1, city: "Brussels", postcode: "1000" },
  first_name: "CacheTest",
  NRN: "00000000001",
  email: "cache@test.com",
  social_rate: false,
};

/** Valid body for updating an existing member (member id 1) */
const VALID_UPDATE_MEMBER_BODY = {
  id: 1,
  name: "Updated Cache Member",
};

describe("(Cache Integration) Member Module", () => {
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
    it("should populate cache on first GET /members/", async () => {
      const cache = await getCacheService();
      expect(memberKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = memberKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("members:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /members/:id_member", async () => {
      const cache = await getCacheService();
      expect(memberKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = memberKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("members:detail"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /members/:id_member/link", async () => {
      const cache = await getCacheService();
      expect(memberKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/members/1/link")
        .query({ email: "member@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = memberKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("members:link"));
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
    it("should serve from cache on second identical GET /members/", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MemberService } = await import("../../../src/modules/members/infra/member.service.js");
      const spy = jest.spyOn(MemberService.prototype, "getMembersList");

      const res1 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get("/members/")
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

    it("should serve from cache on second identical GET /members/:id_member", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MemberService } = await import("../../../src/modules/members/infra/member.service.js");
      const spy = jest.spyOn(MemberService.prototype, "getMember");

      const res1 = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/members/1")
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
        .get("/members/")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get("/members/")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = memberKeys(cache.keys() as string[]).filter((k) => k.includes("members:list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 4 — Different communities produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Communities", () => {
    it("should create separate cache entries for different communities", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Community 1
      const res1 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);

      // Community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const res2 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(res2.status).toBe(200);

      const keys = memberKeys(cache.keys() as string[]).filter((k) => k.includes("members:list"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes("c:1"));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — Cache invalidation on create (list only)
  //
  // POST /members/ uses @InvalidateCache([cachePattern("members:list", "community")])
  // This should clear list entries but leave detail entries intact.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Create (list only)", () => {
    it("should invalidate list cache but NOT detail cache on create", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const listRes = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(listRes.status).toBe(200);

      // Populate detail cache
      const detailRes = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Create member → fires cachePattern("members:list", "community")
      const createRes = await request(app)
        .post("/members/")
        .send(VALID_CREATE_MEMBER_BODY)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(createRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      // List cache should be gone, detail cache should remain
      const keysAfter = memberKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("members:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("members:detail"));
      expect(listKeys).toHaveLength(0);
      expect(detailKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on update (list + detail)
  //
  // PUT /members/ uses @InvalidateCache([
  //   cachePattern("members:list", "community"),
  //   cachePattern("members:detail", "community"),
  // ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Update (list + detail)", () => {
    it("should invalidate both list and detail caches on update", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const listRes = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(listRes.status).toBe(200);

      // Populate detail cache
      const detailRes = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Update member → fires both list and detail invalidation patterns
      const updateRes = await request(app)
        .put("/members/")
        .send(VALID_UPDATE_MEMBER_BODY)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(updateRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Both list and detail caches should be cleared
      const keysAfter = memberKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on patch status (list + detail)
  //
  // PATCH /members/status uses @InvalidateCache([
  //   cachePattern("members:list", "community"),
  //   cachePattern("members:detail", "community"),
  // ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchStatus (list + detail)", () => {
    it("should invalidate list and detail caches on patch status", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const listRes = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(listRes.status).toBe(200);

      // Populate detail cache
      const detailRes = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Patch status → fires list + detail invalidation
      const patchRes = await request(app)
        .patch("/members/status")
        .send({ id_member: 1, status: 2 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Both list and detail caches should be cleared
      const keysAfter = memberKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — Cache invalidation on invite (link + detail)
  //
  // PATCH /members/invite uses @InvalidateCache([
  //   cachePattern("members:link", "community"),
  //   cachePattern("members:detail", "community"),
  // ])
  // It does NOT invalidate list entries.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — PatchMemberLink (link + detail)", () => {
    it("should invalidate link and detail caches but NOT list cache on invite", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const listRes = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(listRes.status).toBe(200);

      // Populate detail cache
      const detailRes = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      // Populate link cache
      const linkRes = await request(app)
        .get("/members/1/link")
        .query({ email: "member@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(linkRes.status).toBe(200);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Invite user → fires link + detail invalidation
      const patchRes = await request(app)
        .patch("/members/invite")
        .send({ id_member: 1, user_email: "invite_cache@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(patchRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Link and detail should be gone, list should remain
      const keysAfter = memberKeys(cache.keys() as string[]);
      const listKeys = keysAfter.filter((k) => k.includes("members:list"));
      const detailKeys = keysAfter.filter((k) => k.includes("members:detail"));
      const linkKeys = keysAfter.filter((k) => k.includes("members:link"));
      expect(listKeys).toHaveLength(1);
      expect(detailKeys).toHaveLength(0);
      expect(linkKeys).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Cache invalidation on delete (list + detail + link)
  //
  // DELETE /members/:id_member uses @InvalidateCache([
  //   cachePattern("members:list", "community"),
  //   cachePattern("members:detail", "community"),
  //   cachePattern("members:link", "community"),
  // ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Delete (list + detail + link)", () => {
    it("should invalidate all three cache types on delete", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      const listRes = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(listRes.status).toBe(200);

      // Populate detail cache
      const detailRes = await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(detailRes.status).toBe(200);

      // Populate link cache
      const linkRes = await request(app)
        .get("/members/1/link")
        .query({ email: "member@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(linkRes.status).toBe(200);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Delete member 2 (to avoid breaking link cache for member 1)
      const deleteRes = await request(app)
        .delete("/members/2")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // All three cache types should be cleared
      const keysAfter = memberKeys(cache.keys() as string[]);
      expect(keysAfter.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — Selectivity of scoped invalidation (cross-community)
  //
  // Community-scoped invalidation should only affect the target community,
  // leaving other communities' cache entries untouched.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the target community's cache, not other communities'", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache for community 1
      const r1 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(r1.status).toBe(200);

      // Populate list cache for community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const r2 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(r2.status).toBe(200);

      expect(memberKeys(cache.keys() as string[]).length).toBe(2);

      // Create member in community 1 → pattern "members:list:c:1:*"
      const createRes = await request(app)
        .post("/members/")
        .send(VALID_CREATE_MEMBER_BODY)
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(createRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's list cache should be gone, community 2's should remain
      const keysAfter = memberKeys(cache.keys() as string[]);
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
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate list cache
      await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      // Populate detail cache
      await request(app)
        .get("/members/1")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = memberKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(2);

      // Attempt update with non-existent member → should fail with non-2xx
      const failRes = await request(app)
        .put("/members/")
        .send({ id: 999, name: "Ghost Member" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = memberKeys(cache.keys() as string[]);
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

      const { MemberService } = await import("../../../src/modules/members/infra/member.service.js");
      const spy = jest.spyOn(MemberService.prototype, "getMembersList");

      // First request — populates cache
      const res1 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = memberKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(memberKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/members/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
