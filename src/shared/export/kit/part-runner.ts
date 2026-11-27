import { Readable } from "node:stream";
import {
  EXPORT_MAX_DELIVER,
  EXPORT_NAK_DELAYS_MS,
  EXPORT_PART_DONE_SUBJECT,
  EXPORT_PART_FAILED_SUBJECT,
  EXPORT_SCHEMA_MAJOR,
  EXPORT_SCHEMA_VERSION,
  msgIdForResponse,
  PART_DONE_MARKER,
  partPrefix,
  schemaMajor,
  type ExportRequest,
  type PartDone,
  type PartErrorCode,
  type PartFailed,
} from "./contract.js";
import { describeUnexpected, ExportAbortedError, ExportPartError } from "./errors.js";
import { PartContext } from "./part-context.js";
import type { PartStore } from "./part-store.js";
import { checkAgainst } from "./schemas.js";

/** A service's export logic: select its data for `ctx.scope` / `ctx.requesterId`, write it through `ctx`. */
export type ExportHandler = (ctx: PartContext) => Promise<void>;

/** A service with nothing to export answers `done` with an empty part. */
export const emptyHandler: ExportHandler = async () => undefined;

export interface PartPublisher {
  publish(subject: string, payload: PartDone | PartFailed, msgId: string): Promise<void>;
}

export interface PartLogger {
  info(obj: object, msg: string): void;
  warn(obj: object, msg: string): void;
  error(obj: object, msg: string): void;
}

export type PartOutcome =
  /** `replayed`: the part was already complete for this attempt; its answer was published again. */
  | { kind: "done"; message: PartDone; replayed?: boolean }
  | { kind: "failed"; message: PartFailed }
  /** Transient failure: nak and let JetStream redeliver after `delayMs`. */
  | { kind: "retry"; delayMs: number; reason: string }
  /** Shutdown while working: nak at once, another instance (or the restart) takes it. */
  | { kind: "aborted" }
  /** Not answerable (no usable ids): terminate the message. */
  | { kind: "invalid"; reason: string };

export interface HandlePartOptions {
  service: string;
  handler: ExportHandler;
  store: PartStore;
  publisher: PartPublisher;
  /** JetStream's delivery count of this message, starting at 1. */
  deliveryCount: number;
  maxDeliver?: number;
  /** Redelivery delay after the n-th failed delivery; the contract's 10 s / 1 min / 5 min by default. */
  nakDelaysMs?: readonly number[];
  /** When set, a request naming another bucket is refused. */
  expectedBucket?: string;
  signal?: AbortSignal;
  now?: () => Date;
  logger?: PartLogger;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
const SERVICE = /^[a-z][a-z0-9-]{1,62}$/u;

interface Ids {
  exportId: string;
  partId: string;
  service: string;
  attempt: number;
}

/** The ids needed to answer at all, read without trusting the rest of the message. */
function readIds(value: unknown): Ids | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const v = value as Record<string, unknown>;
  const { exportId, partId, service, attempt } = v;
  if (typeof exportId !== "string" || !UUID.test(exportId)) return undefined;
  if (typeof partId !== "string" || !UUID.test(partId)) return undefined;
  if (typeof service !== "string" || !SERVICE.test(service)) return undefined;
  if (typeof attempt !== "number" || !Number.isInteger(attempt) || attempt < 1 || attempt > 10) return undefined;
  return { exportId, partId, service, attempt };
}

/**
 * Handles one `export.request.<service>` message, NATS-free: parse, check, empty the prefix, run
 * the handler, answer done or failed. The consumer turns the outcome into ack / nak / term; the
 * contract check runs exactly this function.
 */
export async function handlePart(data: Uint8Array | string, options: HandlePartOptions): Promise<PartOutcome> {
  const now = options.now ?? ((): Date => new Date());
  const maxDeliver = options.maxDeliver ?? EXPORT_MAX_DELIVER;
  const signal = options.signal ?? new AbortController().signal;
  const delayFor = (deliveryCount: number): number => nakDelay(options.nakDelaysMs ?? EXPORT_NAK_DELAYS_MS, deliveryCount);

  let parsed: unknown;
  try {
    parsed = JSON.parse(typeof data === "string" ? data : new TextDecoder().decode(data));
  } catch {
    return { kind: "invalid", reason: "not JSON" };
  }
  const ids = readIds(parsed);
  if (!ids) return { kind: "invalid", reason: "no usable exportId/partId/service/attempt" };

  const fail = async (code: PartErrorCode, detail: string): Promise<PartOutcome> => {
    const message: PartFailed = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportId: ids.exportId,
      partId: ids.partId,
      service: ids.service,
      attempt: ids.attempt,
      errorCode: code,
      errorDetail: detail.slice(0, 2000),
      failedAt: now().toISOString(),
    };
    try {
      await options.publisher.publish(EXPORT_PART_FAILED_SUBJECT, message, msgIdForResponse(ids.partId, ids.attempt, "failed"));
    } catch (err) {
      return { kind: "retry", delayMs: delayFor(options.deliveryCount), reason: `publish failed: ${describeUnexpected(err)}` };
    }
    options.logger?.warn({ operation: "export:part_failed", ...ids, error_code: code }, "Export part failed");
    return { kind: "failed", message };
  };

  const major = schemaMajor((parsed as Record<string, unknown>).schemaVersion);
  if (major !== EXPORT_SCHEMA_MAJOR) return fail("unsupported_schema", `schemaVersion major ${Number.isNaN(major) ? "unreadable" : major}`);
  const check = checkAgainst("export-request", parsed);
  if (!check.valid) return fail("internal", `request does not match export-request: ${check.errors.join("; ")}`);
  const request = parsed as ExportRequest;
  if (request.service !== options.service) return fail("internal", `request for ${request.service} delivered to ${options.service}`);
  const prefix = partPrefix(request.exportId, request.service);
  if (request.storage.prefix !== prefix) return fail("internal", `storage.prefix is not ${prefix}`);
  if (options.expectedBucket && request.storage.bucket !== options.expectedBucket) {
    return fail("internal", `storage.bucket is not ${options.expectedBucket}`);
  }

  const publishDone = async (done: PartDone, replayed: boolean): Promise<PartOutcome> => {
    try {
      await options.publisher.publish(EXPORT_PART_DONE_SUBJECT, done, msgIdForResponse(request.partId, request.attempt, "done"));
    } catch (err) {
      return { kind: "retry", delayMs: delayFor(options.deliveryCount), reason: `publish failed: ${describeUnexpected(err)}` };
    }
    options.logger?.info(
      { operation: "export:part_done", ...ids, files: done.files.length, references: done.references.length, replayed },
      replayed ? "Export part already complete; answer replayed" : "Export part done",
    );
    return replayed ? { kind: "done", message: done, replayed } : { kind: "done", message: done };
  };

  const markerKey = `${prefix}${PART_DONE_MARKER}`;
  try {
    // Idempotence. The same attempt delivered again (its ack was lost) replays the answer it
    // already gave: rewriting would change files the worker may be reading, and the new answer
    // would be dropped as a duplicate. Anything else starts from an empty prefix.
    const previous = await readMarker(options, markerKey, request);
    if (previous) return await publishDone(previous, true);
    await options.store.deletePrefix(prefix);
    const ctx = new PartContext(request, options.store, signal, now);
    await options.handler(ctx);
    ctx.checkpoint();
    const done = ctx.toDone();
    const doneCheck = checkAgainst("export-part-done", done);
    if (!doneCheck.valid) throw new ExportPartError("internal", `part.done does not match its schema: ${doneCheck.errors.join("; ")}`);
    await options.store.put(markerKey, Readable.from([Buffer.from(JSON.stringify(done), "utf8")]), "application/json");
    return await publishDone(done, false);
  } catch (err) {
    if (err instanceof ExportAbortedError || signal.aborted) return { kind: "aborted" };
    if (err instanceof ExportPartError) {
      await cleanup(options, prefix, ids);
      return fail(err.code, err.detail);
    }
    options.logger?.error(
      { operation: "export:part_error", ...ids, delivery: options.deliveryCount, error: describeUnexpected(err), err },
      "Export part handler error",
    );
    if (options.deliveryCount >= maxDeliver) {
      await cleanup(options, prefix, ids);
      return fail("internal", `${describeUnexpected(err)} on delivery ${options.deliveryCount}`);
    }
    return { kind: "retry", delayMs: delayFor(options.deliveryCount), reason: describeUnexpected(err) };
  }
}

export function nakDelay(delays: readonly number[], deliveryCount: number): number {
  const index = Math.min(Math.max(deliveryCount, 1), delays.length) - 1;
  return delays[index] ?? 0;
}

/** The answer already given to this very attempt, if the part was completed before. */
async function readMarker(options: HandlePartOptions, key: string, request: ExportRequest): Promise<PartDone | undefined> {
  const raw = await options.store.get(key);
  if (!raw) return undefined;
  let marker: unknown;
  try {
    marker = JSON.parse(raw.toString("utf8"));
  } catch {
    return undefined;
  }
  if (!checkAgainst("export-part-done", marker).valid) return undefined;
  const done = marker as PartDone;
  return done.partId === request.partId && done.attempt === request.attempt ? done : undefined;
}

/** Best effort: a failed part leaves nothing behind (the worker also deletes the job's parts). */
async function cleanup(options: HandlePartOptions, prefix: string, ids: Ids): Promise<void> {
  try {
    await options.store.deletePrefix(prefix);
  } catch (err) {
    options.logger?.warn({ operation: "export:part_cleanup_failed", ...ids, error: describeUnexpected(err) }, "Export part cleanup failed");
  }
}
