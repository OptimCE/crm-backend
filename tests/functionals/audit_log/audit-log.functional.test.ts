import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import type { NextFunction, Request, Response } from "express";
import type { QueryRunner } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUDIT_LOG_ERRORS } from "../../../src/modules/audit_log/shared/audit-log.errors.js";
import { contextMiddleware } from "../../../src/shared/middlewares/context.js";
import {
  ADMIN_USER_EMAIL,
  ADMIN_USER_ID,
  AUTH_COMMUNITY_1,
  AUTH_COMMUNITY_2,
  INTERNAL_COMMUNITY_1,
  INTERNAL_COMMUNITY_2,
  ORGS_ADMIN,
  ORGS_ADMIN_COMMUNITY_2,
  ORGS_GESTIONNAIRE,
  ORGS_MEMBER,
} from "./audit-log.const.js";

interface AuditLogRow {
  id: string;
  id_community: number | null;
  timestamp: string;
  action: string;
  source: string;
  entity_type: string;
  entity_id: string | null;
  user_id: number | null;
  user_email: string | null;
  payload: Record<string, unknown>;
}

interface SeedEntry {
  id_community: number | null;
  action: string;
  source?: string;
  entity_type: string;
  entity_id?: string | null;
  user_id?: number | null;
  user_email?: string | null;
  payload?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Insert audit rows directly via TypeORM, bypassing the service. Useful for
 * setting up list/export scenarios without needing a real request context.
 */
async function seedAuditLog(entries: SeedEntry[]): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { AuditLog } = await import("../../../src/modules/audit_log/domain/audit-log.models.js");
  for (const entry of entries) {
    const row = AppDataSource.manager.create(AuditLog, {
      id_community: entry.id_community,
      action: entry.action,
      source: entry.source ?? "crm-backend",
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      user_id: entry.user_id ?? null,
      user_email: entry.user_email ?? null,
      payload: entry.payload ?? {},
      ...(entry.timestamp ? { timestamp: entry.timestamp } : {}),
    });
    await AppDataSource.manager.save(row);
  }
}

/**
 * Run `fn` inside a fully-populated request context (AsyncLocalStorage).
 * Mirrors what contextMiddleware() does on a real HTTP call so we can exercise
 * the service's auto-resolution code paths without going through Express.
 */
async function runInContext(
  headers: { "x-user-id"?: string; "x-community-id"?: string; "x-user-orgs"?: string },
  fn: () => Promise<void>,
): Promise<void> {
  const mw = contextMiddleware();
  const req = { headers } as unknown as Request;
  await new Promise<void>((resolve, reject) => {
    mw(req, {} as Response, ((): NextFunction => {
      return ((): void => {
        fn().then(resolve, reject);
      }) as unknown as NextFunction;
    })());
  });
}

async function getAuditService(): Promise<{
  log: (entry: { action: string; entity_type: string; entity_id?: string; payload?: Record<string, unknown>; source?: string }, qr?: QueryRunner) => Promise<void>;
}> {
  // Ensure DI bindings are loaded.
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  return container.get("AuditLogService");
}

async function countAuditRows(): Promise<number> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { AuditLog } = await import("../../../src/modules/audit_log/domain/audit-log.models.js");
  return AppDataSource.manager.count(AuditLog);
}

async function findOneAuditRow(): Promise<AuditLogRow | null> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { AuditLog } = await import("../../../src/modules/audit_log/domain/audit-log.models.js");
  const row = await AppDataSource.manager.findOne(AuditLog, { where: {}, order: { id: "DESC" } });
  if (!row) return null;
  return {
    id: String(row.id),
    id_community: row.id_community,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString(),
    action: row.action,
    source: row.source,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    user_id: row.user_id,
    user_email: row.user_email,
    payload: row.payload,
  };
}

describe("(Functional) Audit Log Module", () => {
  useFunctionalTestDb();

  describe("AuditLogService.log()", () => {
    it("auto-resolves community, user_id and user_email from request context", async () => {
      const service = await getAuditService();
      await runInContext(
        { "x-user-id": "auth0|admin", "x-community-id": AUTH_COMMUNITY_1, "x-user-orgs": ORGS_ADMIN },
        () =>
          service.log({
            action: "crm.member.invited",
            entity_type: "member",
            entity_id: "42",
            payload: { ean: "BE-1234" },
          }),
      );

      expect(await countAuditRows()).toBe(1);
      const row = await findOneAuditRow();
      expect(row).not.toBeNull();
      expect(row!.id_community ?? null).toBeDefined();
      expect(row!.action).toBe("crm.member.invited");
      expect(row!.source).toBe("crm-backend");
      expect(row!.entity_type).toBe("member");
      expect(row!.entity_id).toBe("42");
      expect(row!.user_id).toBe(ADMIN_USER_ID);
      expect(row!.user_email).toBe(ADMIN_USER_EMAIL);
      expect(row!.payload).toEqual({ ean: "BE-1234" });
    });

    it("falls back to null owners when called outside a request context", async () => {
      const service = await getAuditService();
      await service.log({ action: "system.tick", entity_type: "system" });

      expect(await countAuditRows()).toBe(1);
      const row = await findOneAuditRow();
      expect(row!.id_community).toBeNull();
      expect(row!.user_id).toBeNull();
      expect(row!.user_email).toBeNull();
      expect(row!.action).toBe("system.tick");
      expect(row!.source).toBe("crm-backend");
    });

    it("allows overriding the source for background jobs", async () => {
      const service = await getAuditService();
      await service.log({ action: "scheduler.heartbeat", entity_type: "system", source: "scheduler" });

      const row = await findOneAuditRow();
      expect(row!.source).toBe("scheduler");
    });

    it("does not propagate insert failures to the caller", async () => {
      // Spy on the prototype so every Inversify-built repository instance
      // (which Inversify creates fresh per `get()` under the default transient
      // scope) shares the same mocked method.
      const { AuditLogRepository } = await import("../../../src/modules/audit_log/infra/audit-log.repository.js");
      const insertSpy = jest.spyOn(AuditLogRepository.prototype, "insert").mockRejectedValue(new Error("simulated DB failure"));

      const service = await getAuditService();
      await expect(
        runInContext({ "x-user-id": "auth0|admin", "x-community-id": AUTH_COMMUNITY_1, "x-user-orgs": ORGS_ADMIN }, () =>
          service.log({ action: "crm.member.invited", entity_type: "member" }),
        ),
      ).resolves.toBeUndefined();

      expect(insertSpy).toHaveBeenCalledTimes(1);
      insertSpy.mockRestore();
    });

    it("enlists in the caller's transaction (rollback discards the audit row)", async () => {
      const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
      const service = await getAuditService();

      const qr = AppDataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        await runInContext(
          { "x-user-id": "auth0|admin", "x-community-id": AUTH_COMMUNITY_1, "x-user-orgs": ORGS_ADMIN },
          () =>
            service.log(
              { action: "crm.member.created", entity_type: "member", entity_id: "99", payload: { foo: "bar" } },
              qr,
            ),
        );
      } finally {
        await qr.rollbackTransaction();
        await qr.release();
      }

      expect(await countAuditRows()).toBe(0);
    });
  });

  describe("GET /audit-logs/", () => {
    it("returns paginated rows scoped to the current community", async () => {
      await seedAuditLog([
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.member.invited", entity_type: "member", entity_id: "1" },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.meter.created", entity_type: "meter", entity_id: "2" },
        { id_community: INTERNAL_COMMUNITY_2, action: "crm.member.invited", entity_type: "member", entity_id: "3" },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        expect(response.body.pagination.total).toBe(2);
        const rows = response.body.data as AuditLogRow[];
        expect(rows.every((r) => r.entity_id !== "3")).toBe(true);
      });
    });

    it("rejects MEMBER role and accepts GESTIONNAIRE / ADMIN", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const memberRes = await request(app)
        .get("/audit-logs/")
        .set("x-user-id", "auth0|member")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(memberRes.status).toBe(403);

      const managerRes = await request(app)
        .get("/audit-logs/")
        .set("x-user-id", "auth0|manager")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);
      expect(managerRes.status).toBe(200);

      const adminRes = await request(app)
        .get("/audit-logs/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(adminRes.status).toBe(200);
    });

    it("filters by action, entity_type, entity_id, and user_id", async () => {
      await seedAuditLog([
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.member.invited", entity_type: "member", entity_id: "1", user_id: ADMIN_USER_ID },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.member.invited", entity_type: "member", entity_id: "2", user_id: ADMIN_USER_ID },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.meter.created", entity_type: "meter", entity_id: "9", user_id: 3 },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const headers = {
        "x-user-id": "auth0|admin",
        "x-community-id": AUTH_COMMUNITY_1,
        "x-user-orgs": ORGS_ADMIN,
      };

      const byAction = await request(app).get("/audit-logs/?action=crm.meter.created").set(headers);
      expect(byAction.status).toBe(200);
      expect(byAction.body.pagination.total).toBe(1);

      const byEntityType = await request(app).get("/audit-logs/?entity_type=member").set(headers);
      expect(byEntityType.body.pagination.total).toBe(2);

      const byEntityId = await request(app).get("/audit-logs/?entity_type=member&entity_id=2").set(headers);
      expect(byEntityId.body.pagination.total).toBe(1);

      const byUserId = await request(app).get(`/audit-logs/?user_id=${ADMIN_USER_ID}`).set(headers);
      expect(byUserId.body.pagination.total).toBe(2);
    });

    it("filters by from/to time window", async () => {
      const old = new Date(Date.UTC(2026, 0, 1));
      const recent = new Date(Date.UTC(2026, 4, 1));
      await seedAuditLog([
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", timestamp: old },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", timestamp: recent },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const headers = {
        "x-user-id": "auth0|admin",
        "x-community-id": AUTH_COMMUNITY_1,
        "x-user-orgs": ORGS_ADMIN,
      };

      const after = await request(app).get(`/audit-logs/?from=${encodeURIComponent("2026-03-01T00:00:00Z")}`).set(headers);
      expect(after.body.pagination.total).toBe(1);

      const before = await request(app).get(`/audit-logs/?to=${encodeURIComponent("2026-03-01T00:00:00Z")}`).set(headers);
      expect(before.body.pagination.total).toBe(1);
    });

    it("defaults to timestamp DESC sort and exposes pagination meta", async () => {
      const t1 = new Date(Date.UTC(2026, 0, 1));
      const t2 = new Date(Date.UTC(2026, 1, 1));
      const t3 = new Date(Date.UTC(2026, 2, 1));
      await seedAuditLog([
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", entity_id: "a", timestamp: t1 },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", entity_id: "b", timestamp: t2 },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", entity_id: "c", timestamp: t3 },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/?limit=2&page=1")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({ page: 1, limit: 2, total: 3, total_pages: 2 });
      const rows = response.body.data as AuditLogRow[];
      expect(rows[0].entity_id).toBe("c");
      expect(rows[1].entity_id).toBe("b");
    });

    it("returns 422 when `from` is not a parseable date", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/?from=not-a-date")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(response.status).toBe(422);
    });
  });

  describe("GET /audit-logs/export", () => {
    it("returns a CSV with header + one row per matching audit entry", async () => {
      await seedAuditLog([
        {
          id_community: INTERNAL_COMMUNITY_1,
          action: "crm.member.invited",
          entity_type: "member",
          entity_id: "1",
          user_id: ADMIN_USER_ID,
          user_email: ADMIN_USER_EMAIL,
          payload: { with: "quotes \"and\" newlines\nhere", nested: { ok: true } },
        },
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.meter.created", entity_type: "meter", entity_id: "9" },
        { id_community: INTERNAL_COMMUNITY_2, action: "crm.member.invited", entity_type: "member", entity_id: "x" },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/export")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/text\/csv/);
      expect(response.headers["content-disposition"]).toMatch(/^attachment; filename="audit-log-1-\d{8}-\d{6}\.csv"$/);

      const lines = response.text.split("\r\n").filter((l) => l.length > 0);
      // 1 header + 2 community-1 rows (community-2 row must be excluded)
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe("id,timestamp,action,source,entity_type,entity_id,user_id,user_email,payload");
    });

    it("payload column round-trips through CSV unescape + JSON.parse", async () => {
      const payload = { ean: "BE-1234", note: 'has "quotes", commas, and\nnewlines' };
      await seedAuditLog([{ id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", payload }]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/export")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(response.status).toBe(200);
      // Parse the data row's payload column: the row is wrapped quotes were
      // doubled by RFC-4180 escape, so unescape by stripping the wrapping
      // quotes and replacing "" with ".
      const dataLine = response.text.split("\r\n").filter((l) => l.length > 0)[1];
      const match = dataLine.match(/"((?:[^"]|"")*)"$/);
      expect(match).not.toBeNull();
      const jsonText = match![1].replace(/""/g, '"');
      expect(JSON.parse(jsonText)).toEqual(payload);
    });

    it("returns 400 EXPORT_TOO_LARGE when the filtered count exceeds the cap", async () => {
      const { AuditLogRepository } = await import("../../../src/modules/audit_log/infra/audit-log.repository.js");
      const countSpy = jest.spyOn(AuditLogRepository.prototype, "count").mockResolvedValue(200_000);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/export")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(AUDIT_LOG_ERRORS.EXPORT.TOO_LARGE.errorCode);
      countSpy.mockRestore();
    });

    it("MEMBER role cannot export", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/export")
        .set("x-user-id", "auth0|member")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_MEMBER);
      expect(response.status).toBe(403);
    });
  });

  describe("Tenant isolation", () => {
    it("community 2 cannot see community 1 rows", async () => {
      await seedAuditLog([
        { id_community: INTERNAL_COMMUNITY_1, action: "crm.x.y", entity_type: "thing", entity_id: "for-c1" },
        { id_community: INTERNAL_COMMUNITY_2, action: "crm.x.y", entity_type: "thing", entity_id: "for-c2" },
      ]);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const response = await request(app)
        .get("/audit-logs/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_2)
        .set("x-user-orgs", ORGS_ADMIN_COMMUNITY_2);

      expect(response.status).toBe(200);
      expect(response.body.pagination.total).toBe(1);
      expect((response.body.data as AuditLogRow[])[0].entity_id).toBe("for-c2");
    });
  });
});
