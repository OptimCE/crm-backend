import { utimes, writeFile } from "node:fs/promises";
import type { DataSource } from "typeorm";
import { connect, nanos, RetentionPolicy, StorageType, type JetStreamManager, type NatsConnection } from "nats";
import { CORE_EVENT_SCHEMA_VERSION, CORE_EVENT_SUBJECT_PREFIX, CORE_EVENTS_STREAM, subjectFor, type CoreEventEnvelope } from "./core-events.js";

/**
 * The outbox relay: publishes the rows OutboxWriter wrote, in id order, at least once.
 *
 * "At least once" plus JetStream deduplication gives "exactly once in the stream" for the case
 * that matters — a relay that dies after publishing a batch but before stamping it. The restarted
 * relay publishes the same rows again with the same `Nats-Msg-Id` (the event id), and JetStream
 * acknowledges them as duplicates within `duplicate_window`. A restart slower than the window can
 * still let a copy through; consumers are idempotent on the event id for that reason.
 */

export interface RelaySettings {
  nats_url: string;
  poll_interval_ms: number;
  batch_size: number;
  stream_max_age_days: number;
  duplicate_window_ms: number;
  retention_days: number;
  heartbeat_file: string;
}

/** The broker side, narrowed to what the relay needs so tests can observe it. */
export interface EventPublisher {
  publish(subject: string, data: Uint8Array, msg_id: string): Promise<{ duplicate: boolean }>;
}

export interface RelayBatchResult {
  published: number;
  duplicates: number;
  failed: boolean;
}

interface OutboxRow {
  id: string;
  event_id: string;
  id_community: number;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
}

const encoder = new TextEncoder();

export function toEnvelope(row: OutboxRow): CoreEventEnvelope {
  return {
    event_id: row.event_id,
    event_type: row.event_type,
    schema_version: CORE_EVENT_SCHEMA_VERSION,
    occurred_at: new Date(row.occurred_at).toISOString(),
    id_community: row.id_community,
    aggregate: { type: row.aggregate_type, id: row.aggregate_id },
    payload: row.payload,
  };
}

/**
 * Publishes one batch of unpublished rows and stamps them, in one transaction.
 *
 * The rows are locked (`FOR UPDATE SKIP LOCKED`) so a second relay would take the next batch
 * rather than the same one. Publication stops at the first failure: publishing the rows after it
 * would break the per-subject order a consumer relies on. The failure is recorded on its row and
 * retried on the next tick.
 *
 * `hooks.beforeMark` exists for the crash test only: throwing there is a relay that published
 * and died before its stamp was committed.
 */
export async function relayBatch(
  dataSource: DataSource,
  publisher: EventPublisher,
  batch_size: number,
  hooks: { beforeMark?: () => Promise<void> } = {},
): Promise<RelayBatchResult> {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    const rows = (await qr.query(
      `SELECT id, event_id, id_community, aggregate_type, aggregate_id, event_type, payload, occurred_at
         FROM outbox_event
        WHERE published_at IS NULL
        ORDER BY id
        LIMIT $1
        FOR UPDATE SKIP LOCKED`,
      [batch_size],
    )) as OutboxRow[];

    const published: string[] = [];
    let duplicates = 0;
    let failure: { id: string; error: string } | null = null;
    for (const row of rows) {
      try {
        const ack = await publisher.publish(subjectFor(row.event_type), encoder.encode(JSON.stringify(toEnvelope(row))), row.event_id);
        published.push(row.id);
        if (ack.duplicate) duplicates += 1;
      } catch (err) {
        failure = { id: row.id, error: String(err).slice(0, 2000) };
        break;
      }
    }

    await hooks.beforeMark?.();
    if (published.length > 0) {
      await qr.query("UPDATE outbox_event SET published_at = NOW(), attempts = attempts + 1, last_error = NULL WHERE id = ANY($1::bigint[])", [
        published,
      ]);
    }
    if (failure) {
      await qr.query("UPDATE outbox_event SET attempts = attempts + 1, last_error = $2 WHERE id = $1", [failure.id, failure.error]);
    }
    await qr.commitTransaction();
    return { published: published.length, duplicates, failed: failure !== null };
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
  }
}

/** Deletes published rows past the retention: the stream, not the outbox, is the history. */
export async function pruneOutbox(dataSource: DataSource, retention_days: number): Promise<number> {
  const result = (await dataSource.query(
    "DELETE FROM outbox_event WHERE published_at IS NOT NULL AND published_at < NOW() - make_interval(days => $1)",
    [retention_days],
  )) as [unknown, number];
  return result[1] ?? 0;
}

/**
 * Creates the core's stream, or brings an existing one to the configured subjects, age and
 * duplicate window. The core owns this stream: consumers bind to it and never declare it.
 */
export async function ensureCoreEventsStream(
  jsm: JetStreamManager,
  settings: Pick<RelaySettings, "stream_max_age_days" | "duplicate_window_ms">,
): Promise<void> {
  const config = {
    subjects: [`${CORE_EVENT_SUBJECT_PREFIX}>`],
    max_age: nanos(settings.stream_max_age_days * 24 * 3600 * 1000),
    duplicate_window: nanos(settings.duplicate_window_ms),
  };
  try {
    await jsm.streams.info(CORE_EVENTS_STREAM);
  } catch {
    await jsm.streams.add({ name: CORE_EVENTS_STREAM, retention: RetentionPolicy.Limits, storage: StorageType.File, ...config });
    return;
  }
  await jsm.streams.update(CORE_EVENTS_STREAM, config);
}

export function natsPublisher(nc: NatsConnection): EventPublisher {
  const js = nc.jetstream();
  return {
    async publish(subject: string, data: Uint8Array, msg_id: string): Promise<{ duplicate: boolean }> {
      const ack = await js.publish(subject, data, { msgID: msg_id });
      return { duplicate: ack.duplicate };
    },
  };
}

async function touch(file: string): Promise<void> {
  const now = new Date();
  try {
    await utimes(file, now, now);
  } catch {
    await writeFile(file, "");
  }
}

interface RelayLogger {
  info(obj: object, msg: string): void;
  error(obj: object, msg: string): void;
}

/**
 * The relay loop. Drains the backlog batch after batch, sleeps `poll_interval_ms` when it is
 * empty, backs off (up to 30 s) on a database or broker error, and touches the heartbeat file on
 * every turn so the container healthcheck sees a stuck loop. Returns once `signal` is aborted.
 */
export async function runRelay(dataSource: DataSource, settings: RelaySettings, logger: RelayLogger, signal: AbortSignal): Promise<void> {
  const nc = await connect({ servers: settings.nats_url, name: "crm-outbox-relay", maxReconnectAttempts: -1 });
  try {
    await ensureCoreEventsStream(await nc.jetstreamManager(), settings);
    logger.info({ operation: "outbox_relay:ready", stream: CORE_EVENTS_STREAM, nats_url: settings.nats_url }, "Outbox relay ready");
    const publisher = natsPublisher(nc);
    let backoff_ms = 0;
    let last_prune = 0;
    while (!signal.aborted) {
      await touch(settings.heartbeat_file);
      let idle = false;
      try {
        const result = await relayBatch(dataSource, publisher, settings.batch_size);
        if (result.published > 0 || result.failed) {
          logger.info({ operation: "outbox_relay:batch", ...result }, "Outbox batch relayed");
        }
        idle = result.published < settings.batch_size || result.failed;
        backoff_ms = result.failed ? Math.min(Math.max(backoff_ms * 2, 1000), 30000) : 0;
        if (Date.now() - last_prune > 3600 * 1000) {
          last_prune = Date.now();
          await pruneOutbox(dataSource, settings.retention_days);
        }
      } catch (err) {
        backoff_ms = Math.min(Math.max(backoff_ms * 2, 1000), 30000);
        logger.error({ operation: "outbox_relay:error", error: err, backoff_ms }, "Outbox relay turn failed");
        idle = true;
      }
      if (idle) {
        await sleep(backoff_ms || settings.poll_interval_ms, signal);
      }
    }
  } finally {
    await nc.drain();
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
