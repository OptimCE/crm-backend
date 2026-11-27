import { AckPolicy, DeliverPolicy, nanos, type ConsumerConfig, type JetStreamManager, type JsMsg, type NatsConnection } from "nats";
import { EXPORT_ACK_WAIT_MS, EXPORT_MAX_DELIVER, EXPORTS_STREAM, requestSubject, serviceDurable } from "./contract.js";
import { handlePart, type ExportHandler, type PartLogger, type PartOutcome, type PartPublisher } from "./part-runner.js";
import type { PartStore } from "./part-store.js";

/** JetStream API error codes the consumer has to tell apart. */
const STREAM_NOT_FOUND = 10059;
const CONSUMER_NOT_FOUND = 10014;

export interface ExportConsumerOptions {
  nc: NatsConnection;
  service: string;
  handler: ExportHandler;
  store: PartStore;
  logger: PartLogger;
  /** Aborting it stops the loop; a part in progress is nak'ed for immediate redelivery. */
  signal: AbortSignal;
  expectedBucket?: string;
  ackWaitMs?: number;
  /** How often `working()` is sent while a part is being written. */
  heartbeatMs?: number;
  maxDeliver?: number;
  nakDelaysMs?: readonly number[];
  /** Longest wait of one pull, which is also how fast the loop notices `signal`; nats.js refuses less than 1 s. */
  pullExpiresMs?: number;
  /** Pause before retrying when the EXPORTS stream does not exist yet or the broker failed. */
  retryMs?: number;
  /** Called after each message, with its outcome. Tests and metrics hook here. */
  onOutcome?: (outcome: PartOutcome) => void;
}

export function jetstreamErrorCode(err: unknown): number | undefined {
  const code = (err as { api_error?: { err_code?: unknown } } | null)?.api_error?.err_code;
  return typeof code === "number" ? code : undefined;
}

/**
 * Creates the service's durable pull consumer, or brings an existing one back to the declared
 * settings (nats.js, like nats-py, never reconciles an existing durable by itself).
 * Throws the broker error when the EXPORTS stream does not exist yet.
 */
export async function ensureServiceConsumer(
  jsm: JetStreamManager,
  service: string,
  settings: { ackWaitMs: number; maxDeliver: number },
): Promise<void> {
  await ensureDurableConsumer(jsm, serviceDurable(service), {
    filter_subject: requestSubject(service),
    ack_wait: nanos(settings.ackWaitMs),
    max_deliver: settings.maxDeliver,
    max_ack_pending: 1,
  });
}

/** The consumer settings a durable on EXPORTS declares and keeps in line. */
export type DeclaredConsumer = Pick<Partial<ConsumerConfig>, "filter_subject" | "filter_subjects" | "ack_wait" | "max_deliver" | "max_ack_pending">;

/**
 * Creates the durable pull consumer `durable` on EXPORTS (explicit ack, from the start), or
 * updates an existing one whose declared fields drifted. Throws the broker error when the stream
 * does not exist yet.
 */
export async function ensureDurableConsumer(jsm: JetStreamManager, durable: string, declared: DeclaredConsumer): Promise<void> {
  let current: ConsumerConfig;
  try {
    current = (await jsm.consumers.info(EXPORTS_STREAM, durable)).config;
  } catch (err) {
    if (jetstreamErrorCode(err) !== CONSUMER_NOT_FOUND) throw err;
    await jsm.consumers.add(EXPORTS_STREAM, {
      durable_name: durable,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      ...declared,
    });
    return;
  }
  const drift = Object.entries(declared).filter(
    ([field, value]) => JSON.stringify((current as unknown as Record<string, unknown>)[field]) !== JSON.stringify(value),
  );
  if (drift.length > 0) {
    await jsm.consumers.update(EXPORTS_STREAM, durable, declared);
  }
}

export function natsPartPublisher(nc: NatsConnection): PartPublisher {
  const js = nc.jetstream();
  const encoder = new TextEncoder();
  return {
    async publish(subject, payload, msgId): Promise<void> {
      await js.publish(subject, encoder.encode(JSON.stringify(payload)), { msgID: msgId, expect: { streamName: EXPORTS_STREAM } });
    },
  };
}

/**
 * The service's export listener: pulls `export.request.<service>` one message at a time and
 * answers each through handlePart. Runs until `signal` is aborted; survives the stream not
 * existing yet (crm-backend declares it) and broker hiccups.
 */
export async function runExportConsumer(options: ExportConsumerOptions): Promise<void> {
  const ackWaitMs = options.ackWaitMs ?? EXPORT_ACK_WAIT_MS;
  const maxDeliver = options.maxDeliver ?? EXPORT_MAX_DELIVER;
  const heartbeatMs = options.heartbeatMs ?? Math.floor(ackWaitMs / 3);
  const retryMs = options.retryMs ?? 15_000;
  const ids = { service: options.service, durable: serviceDurable(options.service) };
  const jsm = await options.nc.jetstreamManager();

  while (!options.signal.aborted) {
    try {
      await ensureServiceConsumer(jsm, options.service, { ackWaitMs, maxDeliver });
      break;
    } catch (err) {
      const missing = jetstreamErrorCode(err) === STREAM_NOT_FOUND;
      options.logger.warn(
        { operation: missing ? "export:stream_missing" : "export:consumer_setup_failed", ...ids, retry_ms: retryMs },
        missing ? "EXPORTS stream not declared yet; retrying" : "Export consumer setup failed; retrying",
      );
      await sleep(retryMs, options.signal);
    }
  }
  if (options.signal.aborted) return;

  const consumer = await options.nc.jetstream().consumers.get(EXPORTS_STREAM, ids.durable);
  const publisher = natsPartPublisher(options.nc);
  options.logger.info({ operation: "export:consumer_ready", ...ids }, "Export consumer ready");

  while (!options.signal.aborted) {
    let msg: JsMsg | null;
    try {
      msg = await consumer.next({ expires: Math.max(1_000, options.pullExpiresMs ?? 5_000) });
    } catch (err) {
      // A client or broker error (timeout, reconnect): its message names no exported data.
      options.logger.warn(
        { operation: "export:pull_failed", ...ids, error: err instanceof Error ? err.message : String(err) },
        "Export pull failed; retrying",
      );
      await sleep(Math.min(retryMs, 5_000), options.signal);
      continue;
    }
    if (!msg) continue;
    if (options.signal.aborted) {
      msg.nak();
      break;
    }
    await processMessage(msg, options, publisher, maxDeliver, heartbeatMs);
  }
}

async function processMessage(
  msg: JsMsg,
  options: ExportConsumerOptions,
  publisher: PartPublisher,
  maxDeliver: number,
  heartbeatMs: number,
): Promise<void> {
  const heartbeat = setInterval(() => msg.working(), heartbeatMs);
  let outcome: PartOutcome;
  try {
    outcome = await handlePart(msg.data, {
      service: options.service,
      handler: options.handler,
      store: options.store,
      publisher,
      deliveryCount: msg.info.deliveryCount,
      maxDeliver,
      nakDelaysMs: options.nakDelaysMs,
      expectedBucket: options.expectedBucket,
      signal: options.signal,
      logger: options.logger,
    });
  } finally {
    clearInterval(heartbeat);
  }
  switch (outcome.kind) {
    case "done":
    case "failed":
      await msg.ackAck();
      break;
    case "retry":
      msg.nak(outcome.delayMs);
      break;
    case "aborted":
      msg.nak();
      break;
    case "invalid":
      options.logger.error(
        { operation: "export:request_invalid", service: options.service, stream_seq: msg.info.streamSequence, reason: outcome.reason },
        "Unanswerable export request terminated",
      );
      msg.term(outcome.reason);
      break;
  }
  options.onOutcome?.(outcome);
}

/** Resolves after `ms`, or at once when `signal` aborts. Removes its listener either way. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
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
