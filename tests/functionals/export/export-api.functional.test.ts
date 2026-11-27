import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Response } from "supertest";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { IExportDownloadSigner, IExportJobPublisher } from "../../../src/modules/exports/domain/i-export.ports.js";
import type { ExportSettings } from "../../../src/modules/exports/shared/export.settings.js";

/**
 * The four routes of the data export, on the seed of tests/sql/init.sql:
 *
 *   user 1 demo     f298d22b-…  ADMIN of community 1
 *   user 2 admin    auth0|admin ADMIN of communities 1, 2, 3
 *   user 3 manager  auth0|manager MANAGER of communities 1, 2
 *   user 4 member   auth0|member MEMBER of communities 1, 2
 *
 * NATS and the URL signer are replaced by fakes; everything else (database, audit,
 * notifications) is real.
 */
const DEMO = "f298d22b-4e19-4150-a4d4-f852c60163b3";
const ADMIN = "auth0|admin";
const MANAGER = "auth0|manager";
const MEMBER = "auth0|member";
const SERVICES = ["crm", "signature", "billing"];
const IP = "203.0.113.7";

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

async function bind<T>(token: string, value: T): Promise<void> {
  const { container } = await import("../../../src/container/di-container.js");
  if (container.isBound(token)) (await container.rebind<T>(token)).toConstantValue(value);
  else container.bind<T>(token).toConstantValue(value);
}

async function waitFor(probe: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!probe()) {
    if (Date.now() > deadline) throw new Error("condition not met in time");
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** Records each announcement, and whether the job was already committed when it was made. */
class FakePublisher implements IExportJobPublisher {
  calls: { id: string; committed: boolean }[] = [];
  answer = true;
  async requested(id: string): Promise<boolean> {
    // Another pooled connection: it only sees the job once its transaction committed. A test
    // may end (and close the pool) before this runs: that is not what it is about.
    try {
      const rows: unknown[] = await (await db()).query(`SELECT 1 FROM export_job WHERE id = $1`, [id]);
      this.calls.push({ id, committed: rows.length === 1 });
    } catch {
      this.calls.push({ id, committed: false });
    }
    return this.answer;
  }
}

let publisher: FakePublisher;
let sign: jest.Mock<IExportDownloadSigner["sign"]>;
let settings: ExportSettings;

interface Caller {
  user: string;
  orgs?: string;
  community?: string;
  /** Seconds since the last login; null sends no x-auth-time. */
  loginAge?: number | null;
}

const demoAdmin: Caller = { user: DEMO, orgs: ORGS_ADMIN, community: AUTH_COMMUNITY_1 };
const otherAdmin: Caller = { user: ADMIN, orgs: ORGS_ADMIN, community: AUTH_COMMUNITY_1 };

async function call(method: "get" | "post", path: string, caller: Caller, body?: object): Promise<Response> {
  const app = (await import("../../../src/app.js")).default;
  let req = request(app)[method](path).set("x-user-id", caller.user).set("x-source-ip", IP);
  if (caller.orgs) req = req.set("x-user-orgs", caller.orgs);
  if (caller.community) req = req.set("x-community-id", caller.community);
  const age = caller.loginAge === undefined ? 10 : caller.loginAge;
  if (age !== null) req = req.set("x-auth-time", String(Math.floor(Date.now() / 1000) - age));
  return body ? req.send(body) : req;
}

const requestExport = (caller: Caller, body: object = { scope: "user" }): Promise<Response> => call("post", "/exports", caller, body);

/** Inserts a job as the worker would have left it. Returns its id. */
async function seedJob(job: {
  requester?: string;
  id_requester?: number;
  scope?: "user" | "community";
  status?: string;
  created?: string;
  expires?: string;
}): Promise<string> {
  const id = randomUUID();
  const requester = job.requester ?? DEMO;
  const scope = job.scope ?? "user";
  const status = job.status ?? "failed";
  const object_key = ["ready", "expired"].includes(status) ? `archives/${id}/optimce-export-${scope}-20261115.zip` : null;
  await (
    await db()
  ).query(
    `INSERT INTO export_job (id, scope_type, scope_id, id_community, requester_user_id, id_requester, status,
                             schema_version, locale, created_at, expires_at, object_key, error_detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '1.0', 'fr', NOW() - $8::interval, NOW() + $9::interval, $10, 'TypeError (internal)')`,
    [
      id,
      scope,
      scope === "community" ? AUTH_COMMUNITY_1 : requester,
      scope === "community" ? 1 : null,
      requester,
      job.id_requester ?? 1,
      status,
      job.created ?? "1 hour",
      job.expires ?? "1 day",
      object_key,
    ],
  );
  return id;
}

async function jobs(): Promise<{ id: string; scope_type: string; scope_id: string; id_community: number | null; status: string; locale: string }[]> {
  return (await db()).query(`SELECT id, scope_type, scope_id, id_community, status, locale FROM export_job ORDER BY created_at`);
}

async function audits(): Promise<
  { action: string; id_community: number | null; entity_id: string; user_id: number; payload: Record<string, unknown> }[]
> {
  return (await db()).query(
    `SELECT action, id_community, entity_id, user_id, payload FROM audit_log WHERE action LIKE 'crm.export_job.%' ORDER BY id`,
  );
}

describe("(Functional) data export API", () => {
  useFunctionalTestDb();

  beforeEach(async () => {
    publisher = new FakePublisher();
    sign = jest.fn<IExportDownloadSigner["sign"]>(async (key) => `https://files.test/exports/${key}?X-Amz-Signature=x`);
    const { loadExportSettings } = await import("../../../src/modules/exports/shared/export.settings.js");
    settings = { ...loadExportSettings(), services: SERVICES, max_requests_per_day: 3 };
    await bind<IExportJobPublisher>("ExportJobPublisher", publisher);
    await bind<IExportDownloadSigner>("ExportDownloadSigner", { sign });
    await bind<ExportSettings>("ExportSettings", settings);
  });

  describe("POST /exports", () => {
    it("creates a pending job with one part per service, then announces it once committed", async () => {
      const response = await requestExport(demoAdmin);

      await expectWithLog(response, async () => {
        expect(response.status).toBe(202);
        expect(response.body.data.status).toBe("pending");
      });
      const id = response.body.data.export_id;
      expect(await jobs()).toEqual([{ id, scope_type: "user", scope_id: DEMO, id_community: null, status: "pending", locale: "fr" }]);
      const parts: { service: string; status: string; attempts: number }[] = await (
        await db()
      ).query(`SELECT service, status, attempts FROM export_part WHERE export_job_id = $1 ORDER BY service`, [id]);
      expect(parts).toEqual(SERVICES.toSorted().map((service) => ({ service, status: "pending", attempts: 0 })));
      await waitFor(() => publisher.calls.length === 1);
      expect(publisher.calls).toEqual([{ id, committed: true }]);
    });

    it("keeps a personal export out of the active community's audit log, with the caller's IP", async () => {
      const response = await requestExport(demoAdmin);

      const id = response.body.data.export_id;
      expect(await audits()).toEqual([
        { action: "crm.export_job.requested", id_community: null, entity_id: id, user_id: 1, payload: { scope: "user", services: 3, ip: IP } },
      ]);
    });

    it("takes the account's saved language for the archive", async () => {
      await (await db()).query(`UPDATE app_user SET locale = 'nl' WHERE id = 1`);
      await requestExport(demoAdmin);
      expect((await jobs())[0].locale).toBe("nl");
    });

    it("answers 401 reauth_required without a recent login, and creates nothing", async () => {
      for (const loginAge of [null, 301, 3600]) {
        const response = await requestExport({ ...demoAdmin, loginAge });
        await expectWithLog(response, () => {
          expect(response.status).toBe(401);
          expect(response.body.error_code).toBe(35000);
          expect(response.body.data).not.toContain("export:");
        });
      }
      expect(await jobs()).toEqual([]);
      expect(publisher.calls).toEqual([]);
    });

    it("answers 409 while an export of the same scope is in progress", async () => {
      expect((await requestExport(demoAdmin)).status).toBe(202);

      const second = await requestExport(demoAdmin);

      expect(second.status).toBe(409);
      expect(second.body.error_code).toBe(35002);
      expect(await jobs()).toHaveLength(1);
    });

    it("lets the same requester export another scope meanwhile", async () => {
      expect((await requestExport(demoAdmin)).status).toBe(202);
      expect((await requestExport(demoAdmin, { scope: "community", community_id: AUTH_COMMUNITY_1 })).status).toBe(202);
    });

    it("answers 429 after the daily number of requests for the scope, older ones not counted", async () => {
      for (let i = 0; i < 3; i++) await seedJob({ created: "26 hours" });
      expect((await requestExport(demoAdmin)).status).toBe(202);
      await (await db()).query(`UPDATE export_job SET status = 'failed'`);
      await seedJob({ created: "2 hours" });
      await seedJob({ created: "23 hours" });

      const response = await requestExport(demoAdmin);

      expect(response.status).toBe(429);
      expect(response.body.error_code).toBe(35003);
    });

    it("serialises two requests at once: one export, one 409", async () => {
      const statuses = (await Promise.all([requestExport(demoAdmin), requestExport(demoAdmin)])).map((r) => r.status).sort();

      expect(statuses).toEqual([202, 409]);
      expect(await jobs()).toHaveLength(1);
    });

    it("counts two admins' simultaneous community requests against one limit", async () => {
      settings.max_requests_per_day = 1;
      const community = { scope: "community", community_id: AUTH_COMMUNITY_1 };

      const statuses = (await Promise.all([requestExport(demoAdmin, community), requestExport(otherAdmin, community)])).map((r) => r.status).sort();

      expect(statuses).toEqual([202, 429]);
    });

    it("still answers 202 when the announcement fails: the job waits for the worker's sweep", async () => {
      publisher.answer = false;
      const response = await requestExport(demoAdmin);
      expect(response.status).toBe(202);
      expect((await jobs())[0].status).toBe("pending");
    });

    it("rejects a body without a valid scope", async () => {
      for (const body of [{}, { scope: "everything" }, { scope: "community" }, { scope: "community", community_id: "" }]) {
        const response = await requestExport(demoAdmin, body);
        expect(response.status).toBe(422);
        expect([35100, 35101]).toContain(response.body.error_code);
      }
    });
  });

  describe("POST /exports, community scope", () => {
    const body = { scope: "community", community_id: AUTH_COMMUNITY_1 };

    it("creates the export for an ADMIN, logs it in the community and tells the other ADMINs", async () => {
      const response = await requestExport(demoAdmin, body);

      await expectWithLog(response, () => expect(response.status).toBe(202));
      const id = response.body.data.export_id;
      expect(await jobs()).toEqual([{ id, scope_type: "community", scope_id: AUTH_COMMUNITY_1, id_community: 1, status: "pending", locale: "fr" }]);
      expect((await audits()).map((a) => [a.action, a.id_community])).toEqual([["crm.export_job.requested", 1]]);
      const notified: { id_user: number; id_community: number; data: Record<string, unknown> }[] = await (
        await db()
      ).query(`SELECT id_user, id_community, data FROM notification WHERE type = 'data_export.requested'`);
      expect(notified).toEqual([
        {
          id_user: 2,
          id_community: 1,
          data: expect.objectContaining({ export_id: id, community_name: "Test Community", requester_name: "Demo User" }),
        },
      ]);
    });

    it("answers 403 to a MANAGER or a MEMBER", async () => {
      for (const caller of [
        { user: MANAGER, orgs: ORGS_GESTIONNAIRE, community: AUTH_COMMUNITY_1 },
        { user: MEMBER, orgs: ORGS_MEMBER, community: AUTH_COMMUNITY_1 },
      ]) {
        const response = await requestExport(caller, body);
        expect(response.status).toBe(403);
        expect(response.body.error_code).toBe(35001);
      }
      expect(await jobs()).toEqual([]);
    });

    it("answers 403 for a community other than the active one, even to one of its ADMINs", async () => {
      const response = await requestExport({ ...otherAdmin, community: AUTH_COMMUNITY_1 }, { scope: "community", community_id: "2" });
      expect(response.status).toBe(403);
      expect(response.body.error_code).toBe(35001);
    });
  });

  describe("GET /exports", () => {
    it("lists the caller's own exports, of either scope, newest first, and nobody else's", async () => {
      const older = await seedJob({ created: "3 hours" });
      const newer = await seedJob({ scope: "community", created: "1 hour" });
      await seedJob({ requester: ADMIN, id_requester: 2 });

      const response = await call("get", "/exports", demoAdmin);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data.map((j: { id: string }) => j.id)).toEqual([newer, older]);
        expect(response.body.pagination).toMatchObject({ page: 1, total: 2 });
        expect(response.body.data[0]).toMatchObject({
          scope: "community",
          community: { auth_community_id: AUTH_COMMUNITY_1, name: "Test Community" },
          requester: { first_name: "Demo", last_name: "User", email: "demo@example.com" },
          is_mine: true,
          can_download: false,
          error_code: null,
        });
        expect(JSON.stringify(response.body)).not.toContain("TypeError");
      });
    });

    it("lists the community's exports to an ADMIN, without the download for someone else's", async () => {
      const demos = await seedJob({ scope: "community", status: "ready" });
      await seedJob({ status: "ready" });

      const response = await call("get", "/exports?view=community", otherAdmin);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([expect.objectContaining({ id: demos, is_mine: false, can_download: false, status: "ready" })]);
      });
    });

    it("answers 403 to the community view for a non-ADMIN", async () => {
      const response = await call("get", "/exports?view=community", { user: MANAGER, orgs: ORGS_GESTIONNAIRE, community: AUTH_COMMUNITY_1 });
      expect(response.status).toBe(403);
      expect(response.body.error_code).toBe(35001);
    });

    it("rejects an unknown view", async () => {
      const response = await call("get", "/exports?view=all", demoAdmin);
      expect(response.status).toBe(422);
      expect(response.body.error_code).toBe(35102);
    });
  });

  describe("GET /exports/:id", () => {
    it("shows the requester the export with its parts", async () => {
      const created = await requestExport(demoAdmin);
      const response = await call("get", `/exports/${created.body.data.export_id}`, demoAdmin);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data.parts.map((p: { service: string; status: string }) => [p.service, p.status])).toEqual(
          SERVICES.toSorted().map((s) => [s, "pending"]),
        );
      });
    });

    it("shows another ADMIN a community export, in that community only", async () => {
      const id = await seedJob({ scope: "community" });

      expect((await call("get", `/exports/${id}`, otherAdmin)).body.data).toMatchObject({ id, is_mine: false, can_download: false });
      expect((await call("get", `/exports/${id}`, { ...otherAdmin, community: "2" })).status).toBe(404);
    });

    it("answers 404 for an export the caller may not see", async () => {
      const personal = await seedJob({});
      const community = await seedJob({ scope: "community" });

      expect((await call("get", `/exports/${personal}`, otherAdmin)).status).toBe(404);
      const manager = { user: MANAGER, orgs: ORGS_GESTIONNAIRE, community: AUTH_COMMUNITY_1 };
      const response = await call("get", `/exports/${community}`, manager);
      expect(response.status).toBe(404);
      expect(response.body.error_code).toBe(35004);
      expect((await call("get", `/exports/6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23`, demoAdmin)).status).toBe(404);
    });

    it("rejects an id that is not a UUID", async () => {
      const response = await call("get", "/exports/12", demoAdmin);
      expect(response.status).toBe(422);
      expect(response.body.error_code).toBe(35103);
    });
  });

  describe("POST /exports/:id/download-url", () => {
    it("gives the requester a five-minute URL and logs it with the IP", async () => {
      const id = await seedJob({ scope: "community", status: "ready" });

      const response = await call("post", `/exports/${id}/download-url`, demoAdmin);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({ url: expect.stringContaining(`archives/${id}/`), expires_in: 300 });
        expect(response.headers["cache-control"]).toBe("no-store");
      });
      expect(sign).toHaveBeenCalledWith(`archives/${id}/optimce-export-community-20261115.zip`, "optimce-export-community-20261115.zip", 300);
      expect(await audits()).toEqual([
        { action: "crm.export_job.download_url_issued", id_community: 1, entity_id: id, user_id: 1, payload: { ip: IP, expires_in: 300 } },
      ]);
    });

    it("needs no recent login: the requester downloads days later", async () => {
      const id = await seedJob({ status: "ready" });
      expect((await call("post", `/exports/${id}/download-url`, { ...demoAdmin, loginAge: null })).status).toBe(200);
    });

    it("refuses another ADMIN of the community (403) and anyone else (404)", async () => {
      const id = await seedJob({ scope: "community", status: "ready" });

      const admin = await call("post", `/exports/${id}/download-url`, otherAdmin);
      expect(admin.status).toBe(403);
      expect(admin.body.error_code).toBe(35005);
      const member = await call("post", `/exports/${id}/download-url`, { user: MEMBER, orgs: ORGS_MEMBER, community: AUTH_COMMUNITY_1 });
      expect(member.status).toBe(404);
      expect(sign).not.toHaveBeenCalled();
      expect(await audits()).toEqual([]);
    });

    it("answers 409 while the export is not ready", async () => {
      for (const status of ["pending", "collecting", "assembling", "failed"]) {
        const id = await seedJob({ status, requester: DEMO, scope: "user", created: "30 hours" });
        const response = await call("post", `/exports/${id}/download-url`, demoAdmin);
        expect([status, response.status, response.body.error_code]).toEqual([status, 409, 35006]);
        await (await db()).query(`DELETE FROM export_job WHERE id = $1`, [id]);
      }
    });

    it("answers 410 once the archive expired", async () => {
      const lapsed = await seedJob({ status: "ready", expires: "-1 minute" });
      const expired = await seedJob({ status: "expired", expires: "-1 day" });

      for (const id of [lapsed, expired]) {
        const response = await call("post", `/exports/${id}/download-url`, demoAdmin);
        expect(response.status).toBe(410);
        expect(response.body.error_code).toBe(35007);
      }
      expect(sign).not.toHaveBeenCalled();
    });

    it("answers 503 when the URL cannot be signed, and logs no URL", async () => {
      sign.mockRejectedValueOnce(new Error("export.download is not configured"));
      const id = await seedJob({ status: "ready" });

      const response = await call("post", `/exports/${id}/download-url`, demoAdmin);

      expect(response.status).toBe(503);
      expect(response.body.error_code).toBe(35008);
      expect(await audits()).toEqual([]);
    });
  });
});
