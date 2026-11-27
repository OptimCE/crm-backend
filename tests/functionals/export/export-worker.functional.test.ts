import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createHash, randomUUID } from "node:crypto";
import config from "config";
import JSZip from "jszip";
import { AckPolicy, connect, type JetStreamManager, type NatsConnection } from "nats";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { ensureExportsStream } from "../../../src/shared/export/stream.js";
import {
  EXPORT_PART_DONE_SUBJECT,
  EXPORTS_STREAM,
  ExportPartError,
  natsPartPublisher,
  partPrefix,
  requestSubject,
  runExportConsumer,
  type ExportHandler,
  type PartDone,
} from "../../../src/shared/export/kit/index.js";
import { checkAgainst } from "../../../src/shared/export/kit/schemas.js";
import { ExportOrchestrator } from "../../../src/modules/exports/worker/orchestrator.js";
import { ExportWorkerRepository } from "../../../src/modules/exports/worker/worker.repository.js";
import { ExportWorkerNotifier } from "../../../src/modules/exports/worker/notifier.js";
import { MemoryExportStorage } from "../../../src/modules/exports/worker/object-store.js";
import { RecordingExportMetrics } from "../../../src/modules/exports/worker/metrics.js";
import { runExportWorker } from "../../../src/modules/exports/worker/run-worker.js";
import type { ExportWorkerSettings } from "../../../src/modules/exports/worker/worker.settings.js";
import type { IAuditLogService } from "../../../src/modules/audit_log/domain/i-audit-log.service.js";
import type { INotificationService } from "../../../src/modules/notifications/domain/i-notification.service.js";

/**
 * The export worker against a real JetStream (4223) and the test database, with the services
 * played by the kit's own consumer and fake handlers, all on one in-memory storage. Seed of
 * tests/sql/init.sql: user 1 `demo` (f298d22b-…) is an ADMIN of community 1 (Test Community).
 */
const NATS_URL = config.get<{ nats_url: string }>("outbox_relay").nats_url;
const DEMO = "f298d22b-4e19-4150-a4d4-f852c60163b3";
const COMMUNITY = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";
const silent = { info: (): void => undefined, warn: (): void => undefined, error: (): void => undefined };
const encoder = new TextEncoder();
const sha = (data: string | Buffer): string => createHash("sha256").update(data).digest("hex");

const baseSettings: ExportWorkerSettings = {
  natsUrl: NATS_URL,
  bucket: "exports",
  tickMs: 200,
  pendingGraceMs: 60_000,
  partTimeoutMs: 60_000,
  maxPartAttempts: 3,
  jobMaxAgeMs: 24 * 3_600_000,
  maxAssemblyAttempts: 3,
  assemblyLeaseMs: 120_000,
  assemblyRetryMs: 100,
  retentionMs: 7 * 86_400_000,
  documentBuckets: ["crm-files", "optimce-documents"],
  heartbeatFile: "",
  platformVersion: "test",
};

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

async function waitFor<T>(probe: () => Promise<T | undefined> | T | undefined, timeoutMs = 15_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error("condition not met in time");
    await new Promise((r) => setTimeout(r, 50));
  }
}

interface JobRow {
  status: string;
  error_code: string | null;
  object_key: string | null;
  size_bytes: string | null;
  sha256: string | null;
  expires_at: Date | null;
  assembly_attempts: number;
}

async function jobRow(id: string): Promise<JobRow> {
  const rows: JobRow[] = await (
    await db()
  ).query(`SELECT status, error_code, object_key, size_bytes, sha256, expires_at, assembly_attempts FROM export_job WHERE id = $1`, [id]);
  return rows[0];
}

async function jobIn(id: string, ...statuses: string[]): Promise<JobRow> {
  return waitFor(async () => {
    const row = await jobRow(id);
    return statuses.includes(row.status) ? row : undefined;
  });
}

/** Inserts a job and its parts as POST /exports does. Returns the ids. */
async function insertJob(
  scope: "user" | "community",
  services: string[],
  extra: { status?: string; created?: string } = {},
): Promise<{ id: string; parts: Record<string, string> }> {
  const id = randomUUID();
  await (
    await db()
  ).query(
    `INSERT INTO export_job (id, scope_type, scope_id, id_community, requester_user_id, id_requester, status, schema_version, locale, created_at)
     VALUES ($1, $2, $3, $4, $5, 1, $6, '1.0', 'fr', NOW() - $7::interval)`,
    [id, scope, scope === "user" ? DEMO : COMMUNITY, scope === "user" ? null : 1, DEMO, extra.status ?? "pending", extra.created ?? "0 seconds"],
  );
  const parts: Record<string, string> = {};
  for (const service of services) {
    parts[service] = randomUUID();
    await (await db()).query(`INSERT INTO export_part (id, export_job_id, service) VALUES ($1, $2, $3)`, [parts[service], id, service]);
  }
  return { id, parts };
}

async function notifications(type: string): Promise<{ id_user: number; data: Record<string, unknown> }[]> {
  return (await db()).query(`SELECT id_user, data FROM notification WHERE type = $1`, [type]);
}

describe("(Functional) export worker", () => {
  useFunctionalTestDb();

  let nc: NatsConnection;
  let jsm: JetStreamManager;
  let storage: MemoryExportStorage;
  const running: { controller: AbortController; done: Promise<void> }[] = [];

  async function dropStream(): Promise<void> {
    try {
      await jsm.streams.delete(EXPORTS_STREAM);
    } catch {
      // not there
    }
  }

  async function worker(overrides: Partial<ExportWorkerSettings> = {}): Promise<{ metrics: RecordingExportMetrics; stop: () => Promise<void> }> {
    // The worker's own bindings, exactly what its entry point loads.
    (await import("../../../src/container/export-worker.binding.js")).bindExportWorker();
    const { container } = await import("../../../src/container/di-container.js");
    const repository = new ExportWorkerRepository(await db());
    const metrics = new RecordingExportMetrics();
    const settings = { ...baseSettings, ...overrides };
    const orchestrator = new ExportOrchestrator({
      repository,
      bus: natsPartPublisher(nc),
      store: storage,
      notifier: new ExportWorkerNotifier(container.get<INotificationService>("NotificationService"), (id, qr) => repository.communityName(id, qr)),
      audit: container.get<IAuditLogService>("AuditLogService"),
      metrics,
      logger: silent,
      settings,
    });
    const controller = new AbortController();
    const done = runExportWorker({
      nc,
      orchestrator,
      logger: silent,
      signal: controller.signal,
      tickMs: settings.tickMs,
      pullExpiresMs: 1_000,
      retryMs: 200,
    });
    const entry = { controller, done };
    running.push(entry);
    return {
      metrics,
      stop: async (): Promise<void> => {
        controller.abort();
        await done;
        running.splice(running.indexOf(entry), 1);
      },
    };
  }

  function service(name: string, handler: ExportHandler): { stop: () => Promise<void> } {
    const controller = new AbortController();
    const done = runExportConsumer({
      nc,
      service: name,
      handler,
      store: storage,
      logger: silent,
      signal: controller.signal,
      pullExpiresMs: 1_000,
      retryMs: 200,
      nakDelaysMs: [100, 100, 100, 100],
    });
    const entry = { controller, done };
    running.push(entry);
    return {
      stop: async (): Promise<void> => {
        controller.abort();
        await done;
        running.splice(running.indexOf(entry), 1);
      },
    };
  }

  /** The part a real `crm` handler would write: a JSON file, a CSV, a document by reference, a counter. */
  const crmHandler: ExportHandler = async (ctx) => {
    await ctx.writeJson("members", [{ id: 1, name: "Member One" }]);
    await ctx.writeCsv("consumptions/123456789012345678/2026.csv", ["timestamp_utc", "offtake_kwh"], [["2026-01-01T00:15:00Z", 0.25]]);
    ctx.addReference({ bucket: "crm-files", key: "documents/abc-statuts.pdf", path: "documents/files/12-statuts.pdf" });
    ctx.count("members", 1);
  };
  const emptyHandler: ExportHandler = async () => undefined;

  async function announce(id: string, msgID = `${id}:requested`): Promise<void> {
    await nc.jetstream().publish("export.job.requested", encoder.encode(JSON.stringify({ schemaVersion: "1.0", exportId: id })), { msgID });
  }

  beforeEach(async () => {
    nc = await connect({ servers: NATS_URL });
    jsm = await nc.jetstreamManager();
    await dropStream();
    await ensureExportsStream(jsm);
    storage = new MemoryExportStorage();
    storage.putObject("crm-files", "documents/abc-statuts.pdf", Buffer.from("%PDF-1.7 statuts"));
  });

  afterEach(async () => {
    for (const r of running.splice(0)) {
      r.controller.abort();
      await r.done;
    }
    await dropStream();
    await nc.drain();
  });

  it("collects every part and assembles the archive: files, document, manifest, index.html", async () => {
    const { metrics } = await worker();
    service("crm", crmHandler);
    service("signature", emptyHandler);
    const job = await insertJob("user", ["crm", "signature"]);
    await announce(job.id);

    const row = await jobIn(job.id, "ready", "failed");

    expect(row.status).toBe("ready");
    const bytes = storage.object("exports", row.object_key!)!;
    expect(row.object_key).toMatch(new RegExp(`^archives/${job.id}/optimce-export-user-\\d{8}\\.zip$`, "u"));
    expect([Number(row.size_bytes), row.sha256]).toEqual([bytes.length, sha(bytes)]);
    const days = (row.expires_at!.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThan(7.01);

    const zip = await JSZip.loadAsync(bytes);
    expect(
      Object.keys(zip.files)
        .filter((n) => !n.endsWith("/"))
        .sort(),
    ).toEqual([
      "crm/consumptions/123456789012345678/2026.csv",
      "crm/documents/files/12-statuts.pdf",
      "crm/members.json",
      "index.html",
      "manifest.json",
    ]);
    expect(JSON.parse(await zip.file("crm/members.json")!.async("string")).items).toEqual([{ id: 1, name: "Member One" }]);
    const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
    expect(checkAgainst("manifest", manifest)).toEqual({ valid: true, errors: [] });
    expect(manifest).toMatchObject({
      exportId: job.id,
      scope: { type: "user", id: DEMO, name: "Demo User" },
      requester: { userId: DEMO },
      locale: "fr",
    });
    expect(manifest.parts.map((p: { service: string; files: unknown[] }) => [p.service, p.files.length])).toEqual([
      ["crm", 3],
      ["signature", 0],
    ]);
    for (const file of manifest.parts[0].files as { path: string; sha256: string }[]) {
      expect(sha(await zip.file(file.path)!.async("nodebuffer"))).toBe(file.sha256);
    }
    expect(await zip.file("index.html")!.async("string")).toContain('<a href="crm/members.json">crm/members.json</a>');

    // The parts are gone; the requester is told in-app and by email.
    expect(storage.keys("exports", `parts/${job.id}/`)).toEqual([]);
    expect(await notifications("data_export.ready")).toEqual([
      { id_user: 1, data: expect.objectContaining({ export_id: job.id, scope: "user", community_name: null, expires_at: expect.any(String), expires_display: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/u) }) },
    ]);
    const mails: unknown[] = await (await db()).query(`SELECT 1 FROM outbound_message WHERE type = 'data_export.ready' AND channel = 2`);
    expect(mails).toHaveLength(1);
    expect(metrics.readyCount).toBe(1);
  });

  it("writes no index.html for a community export, and names the community", async () => {
    await worker();
    service("crm", crmHandler);
    const job = await insertJob("community", ["crm"]);
    await announce(job.id);

    const row = await jobIn(job.id, "ready", "failed");

    const zip = await JSZip.loadAsync(storage.object("exports", row.object_key!)!);
    expect(zip.file("index.html")).toBeNull();
    expect(JSON.parse(await zip.file("manifest.json")!.async("string")).scope).toEqual({ type: "community", id: COMMUNITY, name: "Test Community" });
    expect((await notifications("data_export.ready"))[0].data).toMatchObject({ scope: "community", community_name: "Test Community" });
  });

  it("fails the whole export when one service fails for good: no archive, parts deleted, requester told, audited", async () => {
    const { metrics } = await worker();
    service("crm", async () => {
      throw new ExportPartError("forbidden", "the requester is no longer an ADMIN");
    });
    service("signature", async (ctx) => void (await ctx.writeJson("requests", [])));
    const job = await insertJob("community", ["crm", "signature"]);
    await announce(job.id);

    const row = await jobIn(job.id, "failed", "ready");

    expect(row).toMatchObject({ status: "failed", error_code: "forbidden", object_key: null });
    // signature may answer after the failure: its late part is deleted then.
    await waitFor(() => (storage.keys("exports", `parts/${job.id}/`).length === 0 ? true : undefined));
    expect(storage.keys("exports", "archives/")).toEqual([]);
    expect(await notifications("data_export.failed")).toEqual([
      { id_user: 1, data: expect.objectContaining({ export_id: job.id, community_name: "Test Community" }) },
    ]);
    const audit: { id_community: number; source: string; payload: Record<string, unknown> }[] = await (
      await db()
    ).query(`SELECT id_community, source, payload FROM audit_log WHERE action = 'crm.export_job.failed' AND entity_id = $1`, [job.id]);
    expect(audit).toEqual([{ id_community: 1, source: "crm-export-worker", payload: { error_code: "forbidden", service: "crm" } }]);
    expect(metrics.failures).toEqual([{ reason: "forbidden", service: "crm" }]);
  });

  it("starts a job announced twice once, and assembles a part answered twice once", async () => {
    await worker();
    let runs = 0;
    service("crm", async (ctx) => {
      runs++;
      await crmHandler(ctx);
    });
    const job = await insertJob("user", ["crm"]);
    await announce(job.id, "first");
    await announce(job.id, "second");

    const row = await jobIn(job.id, "ready", "failed");
    expect(row.status).toBe("ready");
    expect(runs).toBe(1);

    // The same answer again, as after a lost ack: ignored, nothing rewritten.
    const parts: { result: PartDone }[] = await (await db()).query(`SELECT result FROM export_part WHERE export_job_id = $1`, [job.id]);
    await nc.jetstream().publish(EXPORT_PART_DONE_SUBJECT, encoder.encode(JSON.stringify(parts[0].result)), { msgID: "again" });
    await new Promise((r) => setTimeout(r, 1_000));
    expect(await jobRow(job.id)).toMatchObject({ status: "ready", assembly_attempts: 1 });
    expect(await notifications("data_export.ready")).toHaveLength(1);
    const zip = await JSZip.loadAsync(storage.object("exports", row.object_key!)!);
    const names = Object.keys(zip.files);
    expect(new Set(names).size).toBe(names.length);
  });

  it("finishes an export after the worker restarted in the middle of the collection", async () => {
    const first = await worker();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    service("crm", async (ctx) => {
      await gate;
      await crmHandler(ctx);
    });
    const job = await insertJob("user", ["crm"]);
    await announce(job.id);
    await jobIn(job.id, "collecting");

    await first.stop();
    release();
    // The answer waits in the stream while no worker runs.
    await new Promise((r) => setTimeout(r, 500));
    expect((await jobRow(job.id)).status).toBe("collecting");
    await worker();

    expect((await jobIn(job.id, "ready", "failed")).status).toBe("ready");
  });

  it("takes over an assembly a dead worker left behind", async () => {
    const job = await insertJob("user", ["crm"], { status: "collecting" });
    const key = `${partPrefix(job.id, "crm")}members.json`;
    storage.putObject("exports", key, "[]");
    const result: PartDone = {
      schemaVersion: "1.0",
      exportId: job.id,
      partId: job.parts.crm,
      service: "crm",
      attempt: 1,
      files: [{ path: "crm/members.json", key, size: 2, sha256: sha("[]"), contentType: "application/json" }],
      references: [],
      summary: [],
      omitted: [],
      producedAt: new Date().toISOString(),
    };
    await (
      await db()
    ).query(`UPDATE export_part SET status = 'done', attempts = 1, requested_at = NOW(), result = $2 WHERE id = $1`, [
      job.parts.crm,
      JSON.stringify(result),
    ]);
    await (
      await db()
    ).query(`UPDATE export_job SET status = 'assembling', assembly_attempts = 1, updated_at = NOW() - interval '10 minutes' WHERE id = $1`, [job.id]);

    await worker();

    expect(await jobIn(job.id, "ready", "failed")).toMatchObject({ status: "ready", assembly_attempts: 2 });
  });

  it("asks again a service that does not answer, then fails the part after the last attempt", async () => {
    await worker({ partTimeoutMs: 300 });
    const job = await insertJob("user", ["billing"]);
    await announce(job.id);

    const row = await jobIn(job.id, "failed");

    expect(row.error_code).toBe("part_timeout");
    const part: { attempts: number; status: string; last_error: string }[] = await (
      await db()
    ).query(`SELECT attempts, status, last_error FROM export_part WHERE export_job_id = $1`, [job.id]);
    expect(part).toEqual([{ attempts: 3, status: "failed", last_error: "timeout" }]);
    // Three requests reached the stream, one per attempt.
    await jsm.consumers.add(EXPORTS_STREAM, { durable_name: "probe", ack_policy: AckPolicy.Explicit, filter_subject: requestSubject("billing") });
    const consumer = await nc.jetstream().consumers.get(EXPORTS_STREAM, "probe");
    const attempts: number[] = [];
    for (let i = 0; i < 3; i++) {
      const msg = await consumer.next({ expires: 2_000 });
      if (msg) {
        attempts.push((msg.json() as { attempt: number }).attempt);
        msg.ack();
      }
    }
    expect(attempts).toEqual([1, 2, 3]);
  });

  it("ignores the answer of an earlier attempt", async () => {
    await worker();
    const job = await insertJob("user", ["crm"], { status: "collecting" });
    await (await db()).query(`UPDATE export_part SET attempts = 2, requested_at = NOW() WHERE id = $1`, [job.parts.crm]);
    const answer = (attempt: number): PartDone => ({
      schemaVersion: "1.0",
      exportId: job.id,
      partId: job.parts.crm,
      service: "crm",
      attempt,
      files: [],
      references: [],
      summary: [],
      omitted: [],
      producedAt: new Date().toISOString(),
    });

    await nc.jetstream().publish(EXPORT_PART_DONE_SUBJECT, encoder.encode(JSON.stringify(answer(1))), { msgID: "old" });
    await new Promise((r) => setTimeout(r, 1_000));
    expect((await jobRow(job.id)).status).toBe("collecting");

    await nc.jetstream().publish(EXPORT_PART_DONE_SUBJECT, encoder.encode(JSON.stringify(answer(2))), { msgID: "current" });
    expect((await jobIn(job.id, "ready", "failed")).status).toBe("ready");
  });

  it("starts a job whose announcement got lost", async () => {
    await worker({ pendingGraceMs: 200 });
    service("crm", emptyHandler);
    const job = await insertJob("user", ["crm"]);

    expect((await jobIn(job.id, "ready", "failed")).status).toBe("ready");
  });

  it("fails an export still active 24 hours after its request", async () => {
    await worker();
    const job = await insertJob("user", ["crm"], { status: "collecting", created: "25 hours" });

    expect(await jobIn(job.id, "failed")).toMatchObject({ error_code: "job_timeout" });
  });

  it("expires a ready export: archive deleted, row kept, audited", async () => {
    const job = await insertJob("user", ["crm"], { status: "collecting" });
    const key = `archives/${job.id}/optimce-export-user-20261115.zip`;
    storage.putObject("exports", key, "zip");
    await (await db()).query(`UPDATE export_part SET status = 'done' WHERE export_job_id = $1`, [job.id]);
    await (
      await db()
    ).query(`UPDATE export_job SET status = 'ready', object_key = $2, expires_at = NOW() - interval '1 minute' WHERE id = $1`, [job.id, key]);

    await worker();

    expect((await jobIn(job.id, "expired")).object_key).toBe(key);
    expect(storage.keys("exports", "archives/")).toEqual([]);
    const audit: unknown[] = await (await db()).query(`SELECT 1 FROM audit_log WHERE action = 'crm.export_job.expired' AND entity_id = $1`, [job.id]);
    expect(audit).toHaveLength(1);
  });

  it("fails the export on a part that writes outside its own folder", async () => {
    await worker();
    const job = await insertJob("user", ["crm"]);
    await announce(job.id);
    await jobIn(job.id, "collecting");
    await waitFor(async () => {
      const rows: { attempts: number }[] = await (await db()).query(`SELECT attempts FROM export_part WHERE id = $1`, [job.parts.crm]);
      return rows[0].attempts === 1 ? true : undefined;
    });
    const crafted: PartDone = {
      schemaVersion: "1.0",
      exportId: job.id,
      partId: job.parts.crm,
      service: "crm",
      attempt: 1,
      files: [
        {
          path: "billing/invoices.json",
          key: `${partPrefix(job.id, "crm")}invoices.json`,
          size: 2,
          sha256: sha("[]"),
          contentType: "application/json",
        },
      ],
      references: [],
      summary: [],
      omitted: [],
      producedAt: new Date().toISOString(),
    };
    await nc.jetstream().publish(EXPORT_PART_DONE_SUBJECT, encoder.encode(JSON.stringify(crafted)), { msgID: "crafted" });

    expect(await jobIn(job.id, "failed")).toMatchObject({ error_code: "invalid_part" });
  });

  it("fails the export when a referenced document is missing", async () => {
    await worker();
    storage.buckets.get("crm-files")!.clear();
    service("crm", crmHandler);
    const job = await insertJob("user", ["crm"]);
    await announce(job.id);

    expect(await jobIn(job.id, "failed", "ready")).toMatchObject({ status: "failed", error_code: "corrupt_data" });
    expect(storage.keys("exports", "archives/")).toEqual([]);
  });

  it("deletes the files of an answer whose export no longer exists", async () => {
    await worker();
    const exportId = randomUUID();
    const key = `${partPrefix(exportId, "crm")}members.json`;
    storage.putObject("exports", key, "[]");
    const orphan: PartDone = {
      schemaVersion: "1.0",
      exportId,
      partId: randomUUID(),
      service: "crm",
      attempt: 1,
      files: [{ path: "crm/members.json", key, size: 2, sha256: sha("[]"), contentType: "application/json" }],
      references: [],
      summary: [],
      omitted: [],
      producedAt: new Date().toISOString(),
    };

    await nc.jetstream().publish(EXPORT_PART_DONE_SUBJECT, encoder.encode(JSON.stringify(orphan)), { msgID: "orphan" });

    await waitFor(() => (storage.keys("exports", `parts/${exportId}/`).length === 0 ? true : undefined));
  });

  it("tries a failed upload again, and gives up after the last attempt", async () => {
    await worker();
    service("crm", crmHandler);
    storage.failUploads = 1;
    const recovered = await insertJob("user", ["crm"]);
    await announce(recovered.id);
    expect(await jobIn(recovered.id, "ready", "failed")).toMatchObject({ status: "ready", assembly_attempts: 2 });

    storage.failUploads = 10;
    const lost = await insertJob("community", ["crm"]);
    await announce(lost.id);
    expect(await jobIn(lost.id, "failed", "ready")).toMatchObject({ status: "failed", error_code: "assembly_failed", assembly_attempts: 3 });
    expect(storage.keys("exports", `archives/${lost.id}/`)).toEqual([]);
  });
});
