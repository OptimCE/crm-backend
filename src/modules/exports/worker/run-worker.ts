import { utimes, writeFile } from "node:fs/promises";
import { nanos, type Consumer, type JsMsg, type NatsConnection } from "nats";
import { ensureDurableConsumer, jetstreamErrorCode } from "../../../shared/export/kit/consumer.js";
import {
  EXPORT_JOB_REQUESTED_SUBJECT,
  EXPORT_PART_DONE_SUBJECT,
  EXPORT_PART_FAILED_SUBJECT,
  EXPORTS_STREAM,
} from "../../../shared/export/kit/contract.js";
import type { PartLogger } from "../../../shared/export/kit/part-runner.js";
import { ensureExportsStream } from "../../../shared/export/stream.js";
import type { Ack, ExportOrchestrator } from "./orchestrator.js";

/** The worker's two durables (contracts/export/README.md §3). Non-overlapping filters, as a work queue wants. */
export const WORKER_JOBS_DURABLE = "export-worker-jobs";
export const WORKER_PARTS_DURABLE = "export-worker-parts";

const STREAM_NOT_FOUND = 10059;
const ACK_WAIT_MS = 60_000;
/** A message whose handling hit a database or broker error comes back after this. */
const RETRY_DELAY_MS = 15_000;

export interface ExportWorkerRun {
  nc: NatsConnection;
  orchestrator: ExportOrchestrator;
  logger: PartLogger;
  signal: AbortSignal;
  tickMs: number;
  heartbeatFile?: string;
  /** Longest wait of one pull; nats.js refuses less than 1 s. */
  pullExpiresMs?: number;
  /** Pause before retrying the setup while the broker or the stream is not there. */
  retryMs?: number;
}

/**
 * Runs the worker until `signal` aborts: the job and answer consumers, the tick (sweeps,
 * timeouts, expiry, heartbeat) and the assembly loop, side by side. An assembly in progress at
 * shutdown is handed back (the orchestrator releases it) and resumes on the next start.
 */
export async function runExportWorker(run: ExportWorkerRun): Promise<void> {
  const retryMs = run.retryMs ?? 5_000;
  const jsm = await run.nc.jetstreamManager();
  while (!run.signal.aborted) {
    try {
      await ensureExportsStream(jsm);
      await ensureDurableConsumer(jsm, WORKER_JOBS_DURABLE, {
        filter_subject: EXPORT_JOB_REQUESTED_SUBJECT,
        ack_wait: nanos(ACK_WAIT_MS),
        max_deliver: -1,
      });
      await ensureDurableConsumer(jsm, WORKER_PARTS_DURABLE, {
        filter_subjects: [EXPORT_PART_DONE_SUBJECT, EXPORT_PART_FAILED_SUBJECT],
        ack_wait: nanos(ACK_WAIT_MS),
        max_deliver: -1,
      });
      break;
    } catch (err) {
      run.logger.warn(
        { operation: "export:worker_setup_failed", stream_missing: jetstreamErrorCode(err) === STREAM_NOT_FOUND, error: (err as Error).message },
        "Export worker setup failed; retrying",
      );
      await sleep(retryMs, run.signal);
    }
  }
  if (run.signal.aborted) return;

  const js = run.nc.jetstream();
  const jobs = await js.consumers.get(EXPORTS_STREAM, WORKER_JOBS_DURABLE);
  const answers = await js.consumers.get(EXPORTS_STREAM, WORKER_PARTS_DURABLE);
  const assemblyDue = new Waker();
  run.orchestrator.onAssemblyDue(() => assemblyDue.wake());
  run.logger.info({ operation: "export:worker_ready" }, "Export worker ready");

  await Promise.all([
    pullLoop(jobs, "jobs", (msg) => run.orchestrator.onJobRequested(msg.data), run),
    pullLoop(answers, "answers", (msg) => run.orchestrator.onPartAnswer(msg.subject, msg.data), run),
    tickLoop(run),
    assemblyLoop(run, assemblyDue),
  ]);
}

async function pullLoop(consumer: Consumer, name: string, handle: (msg: JsMsg) => Promise<Ack>, run: ExportWorkerRun): Promise<void> {
  while (!run.signal.aborted) {
    let msg: JsMsg | null;
    try {
      msg = await consumer.next({ expires: Math.max(1_000, run.pullExpiresMs ?? 5_000) });
    } catch (err) {
      run.logger.warn(
        { operation: "export:worker_pull_failed", consumer: name, error: (err as Error).message },
        "Export worker pull failed; retrying",
      );
      await sleep(2_000, run.signal);
      continue;
    }
    if (!msg) continue;
    if (run.signal.aborted) {
      msg.nak();
      break;
    }
    let ack: Ack;
    try {
      ack = await handle(msg);
    } catch (err) {
      run.logger.warn(
        { operation: "export:worker_message_failed", consumer: name, stream_seq: msg.info.streamSequence, error: (err as Error).message },
        "Export message not handled; redelivered later",
      );
      ack = "retry";
    }
    if (ack === "ack") await msg.ackAck();
    else if (ack === "retry") msg.nak(RETRY_DELAY_MS);
    else msg.term();
  }
}

async function tickLoop(run: ExportWorkerRun): Promise<void> {
  while (!run.signal.aborted) {
    if (run.heartbeatFile) await touch(run.heartbeatFile);
    try {
      await run.orchestrator.tick();
    } catch (err) {
      run.logger.error({ operation: "export:tick_failed", error: (err as Error).message }, "Export tick failed");
    }
    await sleep(run.tickMs, run.signal);
  }
}

async function assemblyLoop(run: ExportWorkerRun, due: Waker): Promise<void> {
  while (!run.signal.aborted) {
    let busy = false;
    try {
      busy = await run.orchestrator.assembleNext(run.signal);
    } catch (err) {
      run.logger.error({ operation: "export:assembly_loop_failed", error: (err as Error).message }, "Export assembly loop failed");
    }
    // Woken at once when a job has all its parts; otherwise looks again at each tick's pace.
    if (!busy) await due.wait(Math.min(run.tickMs, 10_000), run.signal);
  }
}

/** A wait that `wake()` cuts short. A wake with nobody waiting is kept for the next wait. */
class Waker {
  private pending = false;
  private release: (() => void) | undefined;

  wake(): void {
    if (this.release) this.release();
    else this.pending = true;
  }

  async wait(ms: number, signal: AbortSignal): Promise<void> {
    if (this.pending) {
      this.pending = false;
      return;
    }
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    this.release = (): void => controller.abort();
    try {
      await sleep(ms, controller.signal);
    } finally {
      this.release = undefined;
      signal.removeEventListener("abort", onAbort);
    }
  }
}

async function touch(file: string): Promise<void> {
  const now = new Date();
  try {
    await utimes(file, now, now);
  } catch {
    await writeFile(file, "").catch(() => undefined);
  }
}

/** Resolves after `ms`, or at once when `signal` aborts. Removes its listener either way. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
