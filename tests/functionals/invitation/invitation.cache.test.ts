import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

const AUTH_USER_ADMIN = "auth0|admin";
const AUTH_USER_MEMBER = "auth0|member";
const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

/** Filter cache keys to only invitation-prefixed entries */
function invitationKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("invitations:") || k.startsWith("me-invitations:"));
}

describe("(Cache Integration) Invitation Module", () => {
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
    it("should populate cache on first GET /invitations/ (community-scoped member list)", async () => {
      const cache = await getCacheService();
      expect(invitationKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = invitationKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("invitations:member-list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /invitations/managers (community-scoped manager list)", async () => {
      const cache = await getCacheService();
      expect(invitationKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/invitations/managers")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = invitationKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("invitations:manager-list"));
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
    it("should serve from cache on second identical GET /invitations/", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { InvitationService } = await import("../../../src/modules/invitations/infra/invitation.service.js");
      const spy = jest.spyOn(InvitationService.prototype, "getMembersPendingInvitation");

      const res1 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get("/invitations/")
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
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 3 — Different query params produce different cache entries
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Key Differentiation — Query Params", () => {
    it("should create separate cache entries for different query params", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      await request(app)
        .get("/invitations/")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await request(app)
        .get("/invitations/")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keys = invitationKeys(cache.keys() as string[]).filter((k) => k.includes("invitations:member-list"));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
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
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);

      // Community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const res2 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(res2.status).toBe(200);

      const keys = invitationKeys(cache.keys() as string[]).filter((k) => k.includes("invitations:member-list"));
      expect(keys).toHaveLength(2);

      const keyComm1 = keys.find((k) => k.includes(`c:${AUTH_COMMUNITY_1}`));
      const keyComm2 = keys.find((k) => k.includes("c:2"));
      expect(keyComm1).toBeDefined();
      expect(keyComm2).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Cache invalidation on invite member
  //
  // inviteUserToBecomeMember uses:
  //   @InvalidateCache([
  //     cachePattern("invitations:member-list", "community"),   → "invitations:member-list:c:<cid>:*"
  //     cachePattern("me-invitations:member", "none"),           → "me-invitations:member:*"
  //   ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Invite Member", () => {
    it("should invalidate community member-list cache on invite, preserve own member-list", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate community-scoped member list cache
      const getRes = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(getRes.status).toBe(200);

      // Populate user-scoped own member list cache (should NOT be invalidated)
      const ownRes = await request(app).get("/me/invitations").set("x-user-id", AUTH_USER_MEMBER).set("x-user-orgs", ORGS_MEMBER);
      expect(ownRes.status).toBe(200);

      const keysBefore = invitationKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThanOrEqual(2);

      // Invite member → fires invalidation
      const inviteRes = await request(app)
        .post("/invitations/member")
        .send({ user_email: "new_cache_invite@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(inviteRes.status).toBe(200);

      // Allow fire-and-forget invalidation to settle
      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = invitationKeys(cache.keys() as string[]);

      // Community member-list keys should be gone
      const memberListKeys = keysAfter.filter((k) => k.startsWith("invitations:member-list"));
      expect(memberListKeys).toHaveLength(0);

      // Own member-list keys should remain (pattern "me-invitations:member:*" does NOT match "me-invitations:member-list:*")
      const ownMemberListKeys = keysAfter.filter((k) => k.startsWith("me-invitations:member-list"));
      expect(ownMemberListKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 7 — Cache invalidation on invite manager
  //
  // inviteUserToBecomeManager uses:
  //   @InvalidateCache([
  //     cachePattern("invitations:manager-list", "community"),   → "invitations:manager-list:c:<cid>:*"
  //     cachePattern("me-invitations:manager", "none"),           → "me-invitations:manager:*"
  //   ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Invite Manager", () => {
    it("should invalidate community manager-list cache on invite, preserve own manager-list", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate community-scoped manager list cache
      const getRes = await request(app)
        .get("/invitations/managers")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(getRes.status).toBe(200);

      // Populate user-scoped own manager list cache (should NOT be invalidated)
      const ownRes = await request(app).get("/me/invitations/managers").set("x-user-id", AUTH_USER_MEMBER).set("x-user-orgs", ORGS_MEMBER);
      expect(ownRes.status).toBe(200);

      const keysBefore = invitationKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBeGreaterThanOrEqual(2);

      // Invite manager → fires invalidation (requires ADMIN role)
      const inviteRes = await request(app)
        .post("/invitations/manager")
        .send({ user_email: "new_cache_mgr@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(inviteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = invitationKeys(cache.keys() as string[]);

      // Community manager-list keys should be gone
      const managerListKeys = keysAfter.filter((k) => k.startsWith("invitations:manager-list"));
      expect(managerListKeys).toHaveLength(0);

      // Own manager-list keys should remain
      const ownManagerListKeys = keysAfter.filter((k) => k.startsWith("me-invitations:manager-list"));
      expect(ownManagerListKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 8 — Cache invalidation on cancel member (nuclear)
  //
  // cancelMemberInvitation uses all "none" scope patterns:
  //   @InvalidateCache([
  //     cachePattern("me-invitations:member-list", "none"),  → "me-invitations:member-list:*"
  //     cachePattern("me-invitations:member", "none"),       → "me-invitations:member:*"
  //     cachePattern("invitations:member-list", "none"),     → "invitations:member-list:*"
  //   ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Cancel Member (Nuclear)", () => {
    it("should invalidate ALL member-related cache keys, preserve manager keys", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate community member-list for community 1
      await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      // Populate community member-list for community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);

      // Populate own member-list (via me module)
      await request(app).get("/me/invitations").set("x-user-id", AUTH_USER_MEMBER).set("x-user-orgs", ORGS_MEMBER);

      // Populate manager-list (should NOT be invalidated)
      await request(app)
        .get("/invitations/managers")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = invitationKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(4);

      // Cancel member invitation → nuclear invalidation of member keys
      const deleteRes = await request(app)
        .delete("/invitations/1/member")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = invitationKeys(cache.keys() as string[]);

      // All member-related keys should be gone (including community 2 — nuclear)
      const memberKeys = keysAfter.filter((k) => k.includes("member-list") && !k.includes("manager"));
      expect(memberKeys).toHaveLength(0);

      // Manager-list keys should remain
      const managerKeys = keysAfter.filter((k) => k.includes("invitations:manager-list"));
      expect(managerKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 9 — Cache invalidation on cancel manager (nuclear)
  //
  // cancelManagerInvitation uses all "none" scope patterns:
  //   @InvalidateCache([
  //     cachePattern("me-invitations:manager-list", "none"),  → "me-invitations:manager-list:*"
  //     cachePattern("me-invitations:manager", "none"),       → "me-invitations:manager:*"
  //     cachePattern("invitations:manager-list", "none"),     → "invitations:manager-list:*"
  //   ])
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Cancel Manager (Nuclear)", () => {
    it("should invalidate ALL manager-related cache keys, preserve member keys", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate manager-list for community 1
      await request(app)
        .get("/invitations/managers")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      // Populate own manager-list (via me module)
      await request(app).get("/me/invitations/managers").set("x-user-id", AUTH_USER_MEMBER).set("x-user-orgs", ORGS_MEMBER);

      // Populate member-list (should NOT be invalidated)
      await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = invitationKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(3);

      // Cancel manager invitation → nuclear invalidation of manager keys (requires ADMIN)
      const deleteRes = await request(app)
        .delete("/invitations/1/manager")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(deleteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      const keysAfter = invitationKeys(cache.keys() as string[]);

      // All manager-related keys should be gone
      const managerKeys = keysAfter.filter((k) => k.includes("manager"));
      expect(managerKeys).toHaveLength(0);

      // Member-list keys should remain
      const memberKeys = keysAfter.filter((k) => k.includes("invitations:member-list"));
      expect(memberKeys).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 10 — Selectivity of community-scoped invalidation
  //
  // Inviting a member in community 1 should NOT invalidate community 2's cache.
  // POST /invitations/member invalidation pattern: "invitations:member-list:c:<cid>:*"
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Selectivity", () => {
    it("should only invalidate the target community's cache, not other communities'", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache for community 1
      const r1 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(r1.status).toBe(200);

      // Populate cache for community 2
      const ORGS_GESTIONNAIRE_COMM2 = "[orgId:2 orgPath:/org2 roles:[MANAGER]]";
      const r2 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", "2")
        .set("x-user-orgs", ORGS_GESTIONNAIRE_COMM2);
      expect(r2.status).toBe(200);

      expect(invitationKeys(cache.keys() as string[]).filter((k) => k.includes("invitations:member-list"))).toHaveLength(2);

      // Invite member in community 1 → pattern "invitations:member-list:c:1:*"
      const inviteRes = await request(app)
        .post("/invitations/member")
        .send({ user_email: "selectivity_test@test.com" })
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(inviteRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));

      // Community 1's cache should be gone, community 2's should remain
      const keysAfter = invitationKeys(cache.keys() as string[]).filter((k) => k.includes("invitations:member-list"));
      expect(keysAfter).toHaveLength(1);

      const remainingKey = keysAfter[0];
      expect(remainingKey).toContain("c:2");
      expect(remainingKey).not.toContain(`c:${AUTH_COMMUNITY_1}:`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 11 — Failed write does NOT invalidate cache
  // @InvalidateCache only fires on 2xx status codes.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Cache Invalidation — Failed Write", () => {
    it("should NOT invalidate cache when cancel fails (non-existent invitation)", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      // Populate cache
      await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      const keysBefore = invitationKeys(cache.keys() as string[]);
      expect(keysBefore.length).toBe(1);

      // Attempt to cancel non-existent invitation → should fail with non-2xx
      const failRes = await request(app)
        .delete("/invitations/999/member")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(failRes.status).toBeGreaterThanOrEqual(400);

      await new Promise((r) => setTimeout(r, 50));

      // Cache keys should still be present — invalidation only fires on 2xx
      const keysAfter = invitationKeys(cache.keys() as string[]);
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

      const { InvitationService } = await import("../../../src/modules/invitations/infra/invitation.service.js");
      const spy = jest.spyOn(InvitationService.prototype, "getMembersPendingInvitation");

      // First request — populates cache
      const res1 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = invitationKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(invitationKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/invitations/")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });
});
