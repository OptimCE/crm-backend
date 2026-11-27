import type { DataSource, EntityManager, QueryRunner } from "typeorm";
import type { PartDone } from "../../../shared/export/kit/contract.js";
import type { ExportLocale, ExportScopeType, ExportStatus } from "../domain/export.types.js";

/**
 * Every statement of the export worker, written out. Its state is export_job / export_part and
 * nothing else, so it can resume after a restart. Each transition is a conditional UPDATE on the
 * status it expects: two workers, or a worker and a late message, can never both move a row.
 * Durations are passed in milliseconds and compared with the database's own clock.
 */

export interface WorkerJob {
  id: string;
  scope_type: ExportScopeType;
  scope_id: string;
  id_community: number | null;
  requester_user_id: string;
  id_requester: number;
  status: ExportStatus;
  locale: ExportLocale;
  created_at: Date;
  assembly_attempts: number;
  object_key: string | null;
}

export interface WorkerPart {
  id: string;
  export_job_id: string;
  service: string;
  status: "pending" | "done" | "failed";
  attempts: number;
  requested_at: Date | null;
  result: PartDone | null;
}

/** A job as the assembler needs it: with its parts and the name the manifest shows. */
export interface AssemblyJob extends WorkerJob {
  scope_name: string;
  community_name: string | null;
  parts: WorkerPart[];
}

export type AssemblyClaim = { kind: "claimed"; attempts: number } | { kind: "gone" };

const JOB_COLUMNS = `j.id, j.scope_type, j.scope_id, j.id_community, j.requester_user_id, j.id_requester, j.status, j.locale,
  j.created_at, j.assembly_attempts, j.object_key`;
const PART_COLUMNS = `p.id, p.export_job_id, p.service, p.status, p.attempts, p.requested_at, p.result`;
const MS = `* interval '1 millisecond'`;

type Executor = DataSource | EntityManager | QueryRunner;

async function run<T>(executor: Executor, sql: string, params: unknown[]): Promise<T[]> {
  return (await executor.query(sql, params)) as T[];
}

/** node-postgres answers an UPDATE … RETURNING as [rows, count]. */
async function returning<T>(executor: Executor, sql: string, params: unknown[]): Promise<T[]> {
  const result = (await executor.query(sql, params)) as unknown;
  if (Array.isArray(result) && result.length === 2 && Array.isArray(result[0]) && typeof result[1] === "number") return result[0] as T[];
  return result as T[];
}

export class ExportWorkerRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** Runs `fn` in one transaction; the QueryRunner lets the audit and notifications enlist. */
  async transaction<T>(fn: (qr: QueryRunner) => Promise<T>): Promise<T> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const result = await fn(qr);
      await qr.commitTransaction();
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async job(id: string, executor: Executor = this.dataSource): Promise<WorkerJob | null> {
    const rows = await run<WorkerJob>(executor, `SELECT ${JOB_COLUMNS} FROM export_job j WHERE j.id = $1`, [id]);
    return rows[0] ?? null;
  }

  async parts(jobId: string, executor: Executor = this.dataSource): Promise<WorkerPart[]> {
    return run<WorkerPart>(executor, `SELECT ${PART_COLUMNS} FROM export_part p WHERE p.export_job_id = $1 ORDER BY p.service`, [jobId]);
  }

  async part(id: string): Promise<WorkerPart | null> {
    const rows = await run<WorkerPart>(this.dataSource, `SELECT ${PART_COLUMNS} FROM export_part p WHERE p.id = $1`, [id]);
    return rows[0] ?? null;
  }

  /** pending -> collecting. Null when the job is not pending (already started, or gone). */
  async claimPending(id: string): Promise<WorkerJob | null> {
    const rows = await returning<WorkerJob>(
      this.dataSource,
      `UPDATE export_job j SET status = 'collecting', started_at = NOW(), updated_at = NOW()
        WHERE j.id = $1 AND j.status = 'pending' RETURNING ${JOB_COLUMNS}`,
      [id],
    );
    return rows[0] ?? null;
  }

  /** Pending jobs older than `graceMs`: their export.job.requested never arrived. */
  async duePendingJobs(graceMs: number): Promise<string[]> {
    const rows = await run<{ id: string }>(
      this.dataSource,
      `SELECT id FROM export_job WHERE status = 'pending' AND created_at < NOW() - ($1::bigint ${MS}) ORDER BY created_at`,
      [graceMs],
    );
    return rows.map((r) => r.id);
  }

  /**
   * Reserves `attempt` for a pending part of a collecting job, before its publication:
   * requested_at NULL means "owed a publish". True when the part was reserved.
   */
  async reserveAttempt(partId: string, attempt: number): Promise<boolean> {
    const rows = await returning<{ id: string }>(
      this.dataSource,
      `UPDATE export_part p SET attempts = $2, requested_at = NULL, updated_at = NOW()
        WHERE p.id = $1 AND p.status = 'pending' AND p.attempts IN ($2 - 1, $2)
          AND EXISTS (SELECT 1 FROM export_job j WHERE j.id = p.export_job_id AND j.status = 'collecting')
        RETURNING p.id`,
      [partId, attempt],
    );
    return rows.length === 1;
  }

  /** The request of `attempt` is in the stream: its 30-minute clock starts now. */
  async markRequested(partId: string, attempt: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE export_part SET requested_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'pending' AND attempts = $2`,
      [partId, attempt],
    );
  }

  /** Pending parts of collecting jobs that are owed a publication (never requested, or unconfirmed). */
  async owedParts(): Promise<WorkerPart[]> {
    return run<WorkerPart>(
      this.dataSource,
      `SELECT ${PART_COLUMNS} FROM export_part p JOIN export_job j ON j.id = p.export_job_id
        WHERE j.status = 'collecting' AND p.status = 'pending' AND (p.attempts = 0 OR p.requested_at IS NULL)
        ORDER BY j.created_at, p.service`,
      [],
    );
  }

  /** Pending parts of collecting jobs requested more than `timeoutMs` ago. */
  async timedOutParts(timeoutMs: number): Promise<WorkerPart[]> {
    return run<WorkerPart>(
      this.dataSource,
      `SELECT ${PART_COLUMNS} FROM export_part p JOIN export_job j ON j.id = p.export_job_id
        WHERE j.status = 'collecting' AND p.status = 'pending' AND p.requested_at < NOW() - ($1::bigint ${MS})
        ORDER BY j.created_at, p.service`,
      [timeoutMs],
    );
  }

  /** Stores the answer of the current attempt. True when it was the one awaited. */
  async markPartDone(partId: string, attempt: number, result: PartDone): Promise<boolean> {
    const rows = await returning<{ id: string }>(
      this.dataSource,
      `UPDATE export_part SET status = 'done', result = $3::jsonb, last_error = NULL, updated_at = NOW()
        WHERE id = $1 AND status = 'pending' AND attempts = $2 RETURNING id`,
      [partId, attempt, JSON.stringify(result)],
    );
    return rows.length === 1;
  }

  /** The part failed for good. `attempt` null: whatever the current attempt (worker's own decision). */
  async markPartFailed(partId: string, attempt: number | null, error: string, executor: Executor = this.dataSource): Promise<boolean> {
    const rows = await returning<{ id: string }>(
      executor,
      `UPDATE export_part SET status = 'failed', last_error = $3, updated_at = NOW()
        WHERE id = $1 AND status = 'pending' AND ($2::int IS NULL OR attempts = $2) RETURNING id`,
      [partId, attempt, error],
    );
    return rows.length === 1;
  }

  async allPartsDone(jobId: string): Promise<boolean> {
    const rows = await run<{ open: number }>(
      this.dataSource,
      `SELECT count(*)::int AS open FROM export_part WHERE export_job_id = $1 AND status <> 'done'`,
      [jobId],
    );
    return rows[0].open === 0;
  }

  /** Any active status -> failed. Null when the job had already ended. */
  async failJob(id: string, code: string, detail: string, executor: Executor): Promise<WorkerJob | null> {
    const rows = await returning<WorkerJob>(
      executor,
      `UPDATE export_job j SET status = 'failed', error_code = $2, error_detail = $3, completed_at = NOW(), updated_at = NOW()
        WHERE j.id = $1 AND j.status IN ('pending', 'collecting', 'assembling') RETURNING ${JOB_COLUMNS}`,
      [id, code, detail],
    );
    return rows[0] ?? null;
  }

  /** Active jobs requested more than `maxAgeMs` ago. */
  async staleJobs(maxAgeMs: number): Promise<string[]> {
    const rows = await run<{ id: string }>(
      this.dataSource,
      `SELECT id FROM export_job WHERE status IN ('pending', 'collecting', 'assembling') AND created_at < NOW() - ($1::bigint ${MS})`,
      [maxAgeMs],
    );
    return rows.map((r) => r.id);
  }

  /**
   * The next job to assemble, oldest first: a collecting job whose parts are all done (after
   * `retryMs` × the assemblies already tried), or an assembly whose worker stopped renewing it.
   */
  async nextToAssemble(leaseMs: number, retryMs: number): Promise<string | null> {
    const rows = await run<{ id: string }>(
      this.dataSource,
      `SELECT j.id FROM export_job j
        WHERE (j.status = 'collecting'
               AND NOT EXISTS (SELECT 1 FROM export_part p WHERE p.export_job_id = j.id AND p.status <> 'done')
               AND j.updated_at <= NOW() - (($2::bigint * j.assembly_attempts) ${MS}))
           OR (j.status = 'assembling' AND j.updated_at < NOW() - ($1::bigint ${MS}))
        ORDER BY j.created_at LIMIT 1`,
      [leaseMs, retryMs],
    );
    return rows[0]?.id ?? null;
  }

  /** collecting (all parts done) or abandoned assembling -> assembling, counting the attempt. */
  async claimAssembly(id: string, leaseMs: number): Promise<AssemblyClaim> {
    const rows = await returning<{ assembly_attempts: number }>(
      this.dataSource,
      `UPDATE export_job j SET status = 'assembling', assembly_attempts = j.assembly_attempts + 1, updated_at = NOW()
        WHERE j.id = $1
          AND ((j.status = 'collecting'
                AND NOT EXISTS (SELECT 1 FROM export_part p WHERE p.export_job_id = j.id AND p.status <> 'done'))
               OR (j.status = 'assembling' AND j.updated_at < NOW() - ($2::bigint ${MS})))
        RETURNING j.assembly_attempts`,
      [id, leaseMs],
    );
    return rows.length === 1 ? { kind: "claimed", attempts: rows[0].assembly_attempts } : { kind: "gone" };
  }

  /** Renews the assembly lease. */
  async touchAssembly(id: string): Promise<void> {
    await this.dataSource.query(`UPDATE export_job SET updated_at = NOW() WHERE id = $1 AND status = 'assembling'`, [id]);
  }

  /**
   * assembling -> collecting, for another try later. `refund` gives the attempt back and makes
   * the job due at once: the worker is stopping, the assembly did not fail.
   */
  async releaseAssembly(id: string, refund: boolean): Promise<void> {
    await this.dataSource.query(
      refund
        ? `UPDATE export_job SET status = 'collecting', assembly_attempts = GREATEST(assembly_attempts - 1, 0),
                  updated_at = NOW() - interval '1 day' WHERE id = $1 AND status = 'assembling'`
        : `UPDATE export_job SET status = 'collecting', updated_at = NOW() WHERE id = $1 AND status = 'assembling'`,
      [id],
    );
  }

  async assemblyJob(id: string): Promise<AssemblyJob | null> {
    const rows = await run<WorkerJob & { scope_name: string | null; community_name: string | null; email: string | null }>(
      this.dataSource,
      `SELECT ${JOB_COLUMNS}, c.name AS community_name, u.email,
              NULLIF(btrim(concat_ws(' ', u.first_name, u.last_name)), '') AS scope_name
         FROM export_job j
         LEFT JOIN community c ON c.id = j.id_community
         LEFT JOIN app_user u ON u.id = j.id_requester
        WHERE j.id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const scope_name = row.scope_type === "community" ? (row.community_name ?? "") : (row.scope_name ?? row.email ?? "");
    const { email: _email, ...job } = row;
    return { ...job, scope_name, parts: await this.parts(id) };
  }

  /** assembling -> ready. Null when the job left `assembling` meanwhile (the 24-hour guard). */
  async markReady(
    id: string,
    key: string,
    size: number,
    sha256: string,
    retentionMs: number,
    executor: Executor,
  ): Promise<{ expires_at: Date } | null> {
    const rows = await returning<{ expires_at: Date }>(
      executor,
      `UPDATE export_job SET status = 'ready', object_key = $2, size_bytes = $3, sha256 = $4, completed_at = NOW(),
              expires_at = NOW() + ($5::bigint ${MS}), error_code = NULL, error_detail = NULL, updated_at = NOW()
        WHERE id = $1 AND status = 'assembling' RETURNING expires_at`,
      [id, key, size, sha256, retentionMs],
    );
    return rows[0] ?? null;
  }

  async communityName(id: number, executor: Executor = this.dataSource): Promise<string | null> {
    const rows = await run<{ name: string }>(executor, `SELECT name FROM community WHERE id = $1`, [id]);
    return rows[0]?.name ?? null;
  }

  async dueExpiries(): Promise<WorkerJob[]> {
    return run<WorkerJob>(this.dataSource, `SELECT ${JOB_COLUMNS} FROM export_job j WHERE j.status = 'ready' AND j.expires_at <= NOW()`, []);
  }

  /** ready -> expired. The row stays as history; its archive is already deleted. */
  async markExpired(id: string, executor: Executor): Promise<boolean> {
    const rows = await returning<{ id: string }>(
      executor,
      `UPDATE export_job SET status = 'expired', updated_at = NOW() WHERE id = $1 AND status = 'ready' RETURNING id`,
      [id],
    );
    return rows.length === 1;
  }
}
