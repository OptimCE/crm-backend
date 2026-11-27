import {
  EXPORT_PART_DONE_SUBJECT,
  EXPORT_SCHEMA_VERSION,
  msgIdForRequest,
  partPrefix,
  requestSubject,
  RESERVED_PART_DIR,
  schemaMajor,
  type ExportRequest,
  type PartDone,
  type PartFailed,
} from "../../../shared/export/kit/contract.js";
import { checkAgainst } from "../../../shared/export/kit/schemas.js";
import type { PartLogger } from "../../../shared/export/kit/part-runner.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import { AssemblyAbortedError, AssemblyError, assembleArchive } from "./assembler.js";
import { archivePrefix, partsPrefix } from "./manifest.js";
import type { ExportObjectStore } from "./object-store.js";
import type { ExportWorkerNotifier } from "./notifier.js";
import type { ExportWorkerMetrics } from "./metrics.js";
import type { ExportWorkerRepository, WorkerJob, WorkerPart } from "./worker.repository.js";
import type { ExportWorkerSettings } from "./worker.settings.js";

/** What to do with the message just handled. */
export type Ack = "ack" | "retry" | "term";

/** The audit `source` of the worker's entries. */
export const EXPORT_WORKER_SOURCE = "crm-export-worker";

/** Publishes one message on EXPORTS (the kit's natsPartPublisher fits). */
export interface ExportBus {
  publish(subject: string, payload: object, msgId: string): Promise<void>;
}

export interface OrchestratorDeps {
  repository: ExportWorkerRepository;
  bus: ExportBus;
  store: ExportObjectStore;
  notifier: ExportWorkerNotifier;
  audit: IAuditLogService;
  metrics: ExportWorkerMetrics;
  logger: PartLogger;
  settings: ExportWorkerSettings;
}

const decoder = new TextDecoder();

/**
 * The export worker's decisions (contracts/export/README.md §3). It starts jobs, asks each
 * service for its part, records the answers, republishes what timed out, fails what cannot
 * finish, assembles one archive at a time and expires archives. It reads no service's data: only
 * export_job / export_part and the contract's messages.
 *
 * Late messages: an answer is ignored unless its job is collecting, its attempt is the last one
 * published and its part still waits; a late `done` for a failed or expired job has its files
 * deleted.
 */
export class ExportOrchestrator {
  private wakeAssembler: () => void = () => undefined;

  constructor(private readonly deps: OrchestratorDeps) {}

  /** Lets the assembly loop sleep until a job has all its parts. */
  onAssemblyDue(wake: () => void): void {
    this.wakeAssembler = wake;
  }

  // ---- export.job.requested --------------------------------------------------------------

  async onJobRequested(data: Uint8Array): Promise<Ack> {
    const message = parse(data);
    const check = checkAgainst("export-job-requested", message);
    if (!check.valid) {
      this.deps.logger.error({ operation: "export:job_requested_invalid", errors: check.errors }, "Invalid export.job.requested terminated");
      return "term";
    }
    await this.startJob((message as { exportId: string }).exportId);
    return "ack";
  }

  /** pending -> collecting, then the first request of every part. A job already started is left alone. */
  async startJob(id: string): Promise<void> {
    const job = await this.deps.repository.claimPending(id);
    if (!job) return;
    this.deps.logger.info({ operation: "export:job_started", export_id: id }, "Export collecting");
    for (const part of await this.deps.repository.parts(id)) {
      await this.requestPart(job, part, 1);
    }
  }

  /**
   * Publishes `export.request.<service>` for `attempt`. Reserved first, confirmed after: a crash
   * or a broker failure in between leaves the part owed, and the next tick publishes it again
   * (JetStream drops the copy if the first one got through).
   */
  private async requestPart(job: WorkerJob, part: WorkerPart, attempt: number): Promise<void> {
    if (!(await this.deps.repository.reserveAttempt(part.id, attempt))) return;
    const request: ExportRequest = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportId: job.id,
      partId: part.id,
      service: part.service,
      attempt,
      scope: { type: job.scope_type, id: job.scope_id },
      requester: { userId: job.requester_user_id },
      requestedAt: new Date().toISOString(),
      storage: { bucket: this.deps.settings.bucket, prefix: partPrefix(job.id, part.service) },
    };
    const check = checkAgainst("export-request", request);
    if (!check.valid) {
      // A job the contract cannot express (a bad service name, an empty id): it will never finish.
      await this.failJob(job.id, "internal", `export.request.${part.service} would be invalid: ${check.errors.join("; ")}`, part.service);
      return;
    }
    try {
      await this.deps.bus.publish(requestSubject(part.service), request, msgIdForRequest(part.id, attempt));
    } catch (err) {
      this.deps.logger.warn(
        { operation: "export:request_not_published", export_id: job.id, service: part.service, attempt, error: (err as Error).message },
        "Export request not published; the next tick publishes it again",
      );
      return;
    }
    await this.deps.repository.markRequested(part.id, attempt);
    this.deps.logger.info({ operation: "export:part_requested", export_id: job.id, service: part.service, attempt }, "Export part requested");
  }

  // ---- export.part.done / export.part.failed -----------------------------------------------

  async onPartAnswer(subject: string, data: Uint8Array): Promise<Ack> {
    const done = subject === EXPORT_PART_DONE_SUBJECT;
    const message = parse(data);
    const check = checkAgainst(done ? "export-part-done" : "export-part-failed", message);
    if (!check.valid || schemaMajor((message as { schemaVersion?: unknown }).schemaVersion) !== 1) {
      this.deps.logger.error({ operation: "export:answer_invalid", subject, errors: check.errors }, "Invalid export answer terminated");
      return "term";
    }
    const answer = message as PartDone | PartFailed;
    const ids = { export_id: answer.exportId, service: answer.service, attempt: answer.attempt };

    const part = await this.deps.repository.part(answer.partId);
    if (!part || part.export_job_id !== answer.exportId || part.service !== answer.service) {
      if (done && !part && !(await this.deps.repository.job(answer.exportId))) {
        // The job is gone (its user or community was deleted): nothing will ever read these files.
        await this.deleteQuietly(partPrefix(answer.exportId, answer.service), ids);
      }
      this.deps.logger.warn({ operation: "export:answer_unknown", ...ids }, "Answer for no known part ignored");
      return "ack";
    }
    const job = await this.deps.repository.job(part.export_job_id);
    if (!job || job.status !== "collecting") {
      if (done && job && (job.status === "failed" || job.status === "expired")) {
        // The service wrote after the job ended: nothing will ever read these files.
        await this.deleteQuietly(partPrefix(job.id, part.service), ids);
      }
      this.deps.logger.info({ operation: "export:answer_late", ...ids, job_status: job?.status ?? null }, "Late export answer ignored");
      return "ack";
    }
    if (answer.attempt !== part.attempts || part.status !== "pending") {
      this.deps.logger.info(
        { operation: "export:answer_stale", ...ids, current_attempt: part.attempts, part_status: part.status },
        "Stale export answer ignored",
      );
      return "ack";
    }

    if (!done) {
      const failed = answer as PartFailed;
      if (await this.deps.repository.markPartFailed(part.id, answer.attempt, `${failed.errorCode}: ${failed.errorDetail}`.slice(0, 2000))) {
        await this.failJob(job.id, failed.errorCode, `${part.service}: ${failed.errorDetail}`, part.service);
      }
      return "ack";
    }

    const problem = invalidPart(answer as PartDone, this.deps.settings.documentBuckets);
    if (problem) {
      if (await this.deps.repository.markPartFailed(part.id, answer.attempt, `invalid_part: ${problem}`)) {
        await this.failJob(job.id, "invalid_part", `${part.service}: ${problem}`, part.service);
      }
      return "ack";
    }
    if (await this.deps.repository.markPartDone(part.id, answer.attempt, answer as PartDone)) {
      this.deps.logger.info({ operation: "export:part_done", ...ids }, "Export part done");
      if (await this.deps.repository.allPartsDone(job.id)) this.wakeAssembler();
    }
    return "ack";
  }

  // ---- the tick ----------------------------------------------------------------------------

  /** Everything time-driven, in one pass. Each sweep is independent: one failing does not stop the others. */
  async tick(): Promise<void> {
    const { repository, settings } = this.deps;
    await this.sweep("pending", async () => {
      for (const id of await repository.duePendingJobs(settings.pendingGraceMs)) await this.startJob(id);
    });
    await this.sweep("owed", async () => {
      for (const part of await repository.owedParts()) {
        const job = await repository.job(part.export_job_id);
        if (job) await this.requestPart(job, part, Math.max(part.attempts, 1));
      }
    });
    await this.sweep("timeouts", async () => {
      for (const part of await repository.timedOutParts(settings.partTimeoutMs)) {
        const job = await repository.job(part.export_job_id);
        if (!job) continue;
        if (part.attempts < settings.maxPartAttempts) {
          this.deps.logger.warn(
            { operation: "export:part_timeout", export_id: job.id, service: part.service, attempt: part.attempts },
            "No answer: asking again",
          );
          await this.requestPart(job, part, part.attempts + 1);
        } else if (await repository.markPartFailed(part.id, part.attempts, "timeout")) {
          await this.failJob(job.id, "part_timeout", `${part.service}: no answer after ${part.attempts} attempts`, part.service);
        }
      }
    });
    await this.sweep("stale", async () => {
      const hours = Math.round(settings.jobMaxAgeMs / 3_600_000);
      for (const id of await repository.staleJobs(settings.jobMaxAgeMs))
        await this.failJob(id, "job_timeout", `still active ${hours} h after the request`);
    });
    await this.sweep("expiry", async () => {
      for (const job of await repository.dueExpiries()) await this.expire(job);
    });
  }

  private async sweep(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.deps.logger.error({ operation: `export:sweep_${name}_failed`, error: (err as Error).message }, "Export sweep failed; next tick retries");
    }
  }

  /** Deletes the archive, then marks the job expired (history kept). A failed delete waits for the next tick. */
  private async expire(job: WorkerJob): Promise<void> {
    try {
      await this.deps.store.deletePrefix(archivePrefix(job.id));
    } catch (err) {
      this.deps.logger.warn(
        { operation: "export:expire_delete_failed", export_id: job.id, error: (err as Error).message },
        "Archive not deleted; retrying next tick",
      );
      return;
    }
    if (!(await this.deps.repository.transaction((qr) => this.deps.repository.markExpired(job.id, qr)))) return;
    await this.deps.audit.log({
      action: AUDIT_ACTIONS.EXPORT_JOB_EXPIRED,
      entity_type: "export_job",
      entity_id: job.id,
      payload: { scope: job.scope_type },
      source: EXPORT_WORKER_SOURCE,
      id_community: job.id_community,
    });
    this.deps.logger.info({ operation: "export:job_expired", export_id: job.id }, "Export expired: archive deleted");
  }

  // ---- assembly ----------------------------------------------------------------------------

  /** Assembles the next due job, if any. Resolves true when there was one (look again at once). */
  async assembleNext(signal: AbortSignal): Promise<boolean> {
    const { repository, settings, store } = this.deps;
    const id = await repository.nextToAssemble(settings.assemblyLeaseMs, settings.assemblyRetryMs);
    if (!id) return false;
    const claim = await repository.claimAssembly(id, settings.assemblyLeaseMs);
    if (claim.kind === "gone") return true;
    if (claim.attempts > settings.maxAssemblyAttempts) {
      await this.failJob(id, "assembly_failed", `archive not written after ${settings.maxAssemblyAttempts} attempts`);
      return true;
    }
    const job = await repository.assemblyJob(id);
    if (!job) return true;
    const ids = { export_id: id, attempt: claim.attempts };
    this.deps.logger.info({ operation: "export:assembly_started", ...ids }, "Export assembling");

    let lastRenewal = Date.now();
    try {
      const archive = await assembleArchive(store, job, {
        bucket: settings.bucket,
        documentBuckets: settings.documentBuckets,
        platformVersion: settings.platformVersion,
        signal,
        onProgress: async () => {
          if (Date.now() - lastRenewal > settings.assemblyLeaseMs / 3) {
            await repository.touchAssembly(id);
            lastRenewal = Date.now();
          }
        },
      });
      const ready = await repository.transaction(async (qr) => {
        const marked = await repository.markReady(id, archive.key, archive.size, archive.sha256, settings.retentionMs, qr);
        if (marked) await this.deps.notifier.ready(job, marked.expires_at, qr);
        return marked;
      });
      if (!ready) {
        // The job ended while its archive was written (the 24-hour guard).
        await this.deleteQuietly(archivePrefix(id), ids);
        return true;
      }
      this.deps.metrics.ready();
      this.deps.logger.info({ operation: "export:job_ready", ...ids, size_bytes: archive.size, entries: archive.entries }, "Export ready");
      await this.deleteQuietly(partsPrefix(id), ids);
    } catch (err) {
      if (err instanceof AssemblyAbortedError || signal.aborted) {
        await repository.releaseAssembly(id, true);
        this.deps.logger.info({ operation: "export:assembly_interrupted", ...ids }, "Assembly interrupted by shutdown; resumes on restart");
      } else if (err instanceof AssemblyError && err.permanent) {
        await this.failJob(id, err.code, err.message);
      } else if (claim.attempts >= settings.maxAssemblyAttempts) {
        await this.failJob(id, "assembly_failed", `archive not written after ${claim.attempts} attempts: ${describe(err)}`);
      } else {
        this.deps.logger.warn({ operation: "export:assembly_failed", ...ids, error: describe(err) }, "Assembly failed; trying again later");
        await repository.releaseAssembly(id, false);
      }
    }
    return true;
  }

  // ---- failure -----------------------------------------------------------------------------

  /**
   * Any active status -> failed, with the requester told in the same transaction; then the audit
   * entry, the log and the metric, and the job's files deleted. No partial archive is ever left.
   */
  async failJob(id: string, code: string, detail: string, service?: string): Promise<void> {
    const job = await this.deps.repository.transaction(async (qr) => {
      const failed = await this.deps.repository.failJob(id, code, detail.slice(0, 2000), qr);
      if (failed) await this.deps.notifier.failed(failed, qr);
      return failed;
    });
    if (!job) return;
    // After the commit: an audit insert that fails inside a transaction would abort it silently.
    await this.deps.audit.log({
      action: AUDIT_ACTIONS.EXPORT_JOB_FAILED,
      entity_type: "export_job",
      entity_id: id,
      payload: { error_code: code, service: service ?? null },
      source: EXPORT_WORKER_SOURCE,
      id_community: job.id_community,
    });
    this.deps.metrics.failed(code, service);
    this.deps.logger.error({ operation: "export.job.failed", export_id: id, error_code: code, service: service ?? null }, "Export failed");
    await this.deleteQuietly(partsPrefix(id), { export_id: id });
    await this.deleteQuietly(archivePrefix(id), { export_id: id });
  }

  private async deleteQuietly(prefix: string, ids: Record<string, unknown>): Promise<void> {
    try {
      await this.deps.store.deletePrefix(prefix);
    } catch (err) {
      // The bucket's lifecycle rule removes it anyway (parts/ after 2 days, archives/ after 8).
      this.deps.logger.warn({ operation: "export:delete_failed", ...ids, prefix, error: (err as Error).message }, "Export objects not deleted");
    }
  }
}

function parse(data: Uint8Array): unknown {
  try {
    return JSON.parse(decoder.decode(data));
  } catch {
    return undefined;
  }
}

function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? `${err.name} (${code})` : err.name;
}

/**
 * Why a `done` cannot be assembled, or null. The schema already holds the shapes; this checks
 * what only the worker knows: the part writes in its own prefix and folder, references a bucket
 * the worker reads, and names every archive path once.
 */
export function invalidPart(done: PartDone, documentBuckets: readonly string[]): string | null {
  const prefix = partPrefix(done.exportId, done.service);
  const folder = `${done.service}/`;
  const paths = new Set<string>();
  for (const file of done.files) {
    if (!file.key.startsWith(prefix) || file.key.slice(prefix.length).startsWith(RESERVED_PART_DIR)) return "a file lies outside the part's prefix";
    if (!file.path.startsWith(folder)) return "a file lies outside the service's folder";
    if (paths.has(file.path)) return "an archive path is listed twice";
    paths.add(file.path);
  }
  for (const reference of done.references) {
    if (!documentBuckets.includes(reference.bucket)) return "a reference names a bucket the worker does not read";
    if (!reference.targetPath.startsWith(folder)) return "a reference lies outside the service's folder";
    if (paths.has(reference.targetPath)) return "an archive path is listed twice";
    paths.add(reference.targetPath);
  }
  return null;
}
