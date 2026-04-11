import { expect, it, describe, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog, mockStorageServiceModule } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { ORGS_MEMBER, ORGS_ADMIN } from "../../utils/shared.consts.js";

const AUTH_USER_MEMBER = "auth0|member";
const AUTH_USER_ADMIN = "auth0|admin";
const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

/** Filter cache keys to only me-prefixed entries */
function meKeys(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith("me-"));
}

describe("(Cache Integration) Me Module", () => {
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
    it("should populate cache on first GET /me/members", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-members:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/members/:id", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/members/1")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-members:id"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/meters", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/meters")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-meters:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/meters/:id", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/meters/123456789012345678")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-meters:id"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/documents", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/documents")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-documents:list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/invitations (own member pending invitations)", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/invitations")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-invitations:member-list"));
      expect(matchingKeys).toHaveLength(1);

      const cached = await cache.get<{ status: number; body: unknown }>(matchingKeys[0]);
      expect(cached).not.toBeNull();
      expect(cached!.status).toBe(200);
      expect(cached!.body).toEqual(response.body);
    });

    it("should populate cache on first GET /me/invitations/managers (own manager pending invitations)", async () => {
      const cache = await getCacheService();
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/invitations/managers")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      const keys = meKeys(cache.keys() as string[]);
      const matchingKeys = keys.filter((k) => k.includes("me-invitations:manager-list"));
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
    it("should serve from cache on second identical GET /me/members", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeService } = await import("../../../src/modules/me/infra/me.service.js");
      const spy = jest.spyOn(MeService.prototype, "getMembers");

      const res1 = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second identical request — should be served from cache
      const res2 = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1); // Still 1 — second request served from cache
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });

    it("should serve from cache on second identical GET /me/meters", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeService } = await import("../../../src/modules/me/infra/me.service.js");
      const spy = jest.spyOn(MeService.prototype, "getMeters");

      const res1 = await request(app)
        .get("/me/meters")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/me/meters")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(res2, () => {
        expect(res2.status).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(res2.body).toEqual(res1.body);
      });

      spy.mockRestore();
    });

    it("should serve from cache on second identical GET /me/invitations (user-scoped)", async () => {
      const { default: app } = await import("../../../src/app.js");

      const { MeService } = await import("../../../src/modules/me/infra/me.service.js");
      const spy = jest.spyOn(MeService.prototype, "getOwnMemberPendingInvitation");

      const res1 = await request(app)
        .get("/me/invitations")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-user-orgs", ORGS_MEMBER);

      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      const res2 = await request(app)
        .get("/me/invitations")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-user-orgs", ORGS_MEMBER);

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
        .get("/me/members")
        .query({ page: 1, limit: 10 })
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await request(app)
        .get("/me/members")
        .query({ page: 2, limit: 10 })
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      const keys = meKeys(cache.keys() as string[]).filter((k) => k.includes("me-members:list"));
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

      const resMember = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(resMember.status).toBe(200);

      const resAdmin = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(resAdmin.status).toBe(200);

      const keys = meKeys(cache.keys() as string[]).filter((k) => k.includes("me-members:list"));
      expect(keys).toHaveLength(2);

      // Verify each key contains its respective user ID
      const memberKey = keys.find((k) => k.includes(AUTH_USER_MEMBER));
      const adminKey = keys.find((k) => k.includes(AUTH_USER_ADMIN));
      expect(memberKey).toBeDefined();
      expect(adminKey).toBeDefined();

      // Each cached value should match its own request's response
      const cachedMember = await cache.get<{ status: number; body: unknown }>(memberKey!);
      const cachedAdmin = await cache.get<{ status: number; body: unknown }>(adminKey!);
      expect(cachedMember!.body).toEqual(resMember.body);
      expect(cachedAdmin!.body).toEqual(resAdmin.body);
    });

    it("should create separate cache entries for different users on /me/invitations", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const resMember = await request(app)
        .get("/me/invitations")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(resMember.status).toBe(200);

      const resAdmin = await request(app)
        .get("/me/invitations")
        .set("x-user-id", AUTH_USER_ADMIN)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(resAdmin.status).toBe(200);

      const keys = meKeys(cache.keys() as string[]).filter((k) => k.includes("me-invitations:member-list"));
      expect(keys).toHaveLength(2);

      const memberKey = keys.find((k) => k.includes(AUTH_USER_MEMBER));
      const adminKey = keys.find((k) => k.includes(AUTH_USER_ADMIN));
      expect(memberKey).toBeDefined();
      expect(adminKey).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 5 — TTL expiration
  // InMemoryCacheService checks expiresAt < Date.now() on get().
  // We manually set expiresAt to a past timestamp to simulate expiry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("TTL Expiration", () => {
    it("should expire cache entries after TTL and miss on next GET", async () => {
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const { MeService } = await import("../../../src/modules/me/infra/me.service.js");
      const spy = jest.spyOn(MeService.prototype, "getMembers");

      // First request — populates cache
      const res1 = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(res1.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Verify cache is populated
      const keys = meKeys(cache.keys() as string[]);
      expect(keys.length).toBe(1);

      // Manually expire the cache entry by setting expiresAt to the past
      const store = (cache as unknown as Record<string, unknown>)["store"] as Map<string, { value: string; expiresAt: number }>;
      for (const [, entry] of store.entries()) {
        entry.expiresAt = Date.now() - 1000;
      }

      // Verify cache now reports no valid keys
      expect(meKeys(cache.keys() as string[])).toHaveLength(0);

      // Second request — should miss cache and call service again
      const res2 = await request(app)
        .get("/me/members")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(res2.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(2); // Called again after expiry

      spy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Scenario 6 — Uncached endpoint (downloadDocument)
  // GET /me/documents/:id should NOT produce any cache entry.
  // ────────────────────────────────────────────────────────────────────────────
  describe("Uncached Endpoint", () => {
    it("should NOT cache GET /me/documents/:id (download)", async () => {
      await mockStorageServiceModule({
        getDocument: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from("fake-pdf-content")),
      });
      const cache = await getCacheService();
      const { default: app } = await import("../../../src/app.js");

      const response = await request(app)
        .get("/me/documents/1")
        .set("x-user-id", AUTH_USER_MEMBER)
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
      });

      // No cache entries should exist — download endpoint is not cached
      const keys = meKeys(cache.keys() as string[]);
      expect(keys).toHaveLength(0);
    });
  });
});
