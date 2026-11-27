import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";
import config from "config";
import { AckPolicy, connect, nanos, RetentionPolicy, StorageType, type JetStreamManager, type NatsConnection } from "nats";
import { ensureExportsStream } from "../../../src/shared/export/stream.js";
import {
  EXPORTS_STREAM,
  MemoryPartStore,
  ensureServiceConsumer,
  partPrefix,
  requestSubject,
  runExportConsumer,
  serviceDurable,
  type ExportConsumerOptions,
  type ExportHandler,
  type ExportRequest,
  type PartDone,
  type PartOutcome,
} from "../../../src/shared/export/kit/index.js";

/**
 * The kit against a real JetStream (tests/utils/docker-compose.test.yml, port 4223): the stream's
 * shape, the consumer's settings and what a redelivery, a duplicate and a shutdown really do.
 * No database: these tests never touch Postgres.
 */

const NATS_URL = config.get<{ nats_url: string }>("outbox_relay").nats_url;
const SERVICE = "kit-test";
const encoder = new TextEncoder();
const silent = { info: (): void => undefined, warn: (): void => undefined, error: (): void => undefined };

function request(overrides: Partial<ExportRequest> = {}): ExportRequest {
  const exportId = randomUUID();
  return {
    schemaVersion: "1.0",
    exportId,
    partId: randomUUID(),
    service: SERVICE,
    attempt: 1,
    scope: { type: "community", id: "2" },
    requester: { userId: "auth0|admin" },
    requestedAt: new Date().toISOString(),
    storage: { bucket: "exports", prefix: partPrefix(exportId, SERVICE) },
    ...overrides,
  };
}

async function waitFor<T>(probe: () => T | undefined | Promise<T | undefined>, timeoutMs = 10_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error("condition not met in time");
    await new Promise((r) => setTimeout(r, 50));
  }
}

describe("(Functional) export kit on JetStream", () => {
  let nc: NatsConnection;
  let jsm: JetStreamManager;
  const running: { controller: AbortController; done: Promise<void> }[] = [];

  async function dropStream(): Promise<void> {
    try {
      await jsm.streams.delete(EXPORTS_STREAM);
    } catch {
      // not there
    }
  }

  function start(handler: ExportHandler, extra: Partial<ExportConsumerOptions> = {}): { outcomes: PartOutcome[]; controller: AbortController } {
    const outcomes: PartOutcome[] = [];
    const controller = new AbortController();
    const done = runExportConsumer({
      nc,
      service: SERVICE,
      handler,
      store: extra.store ?? new MemoryPartStore(),
      logger: silent,
      signal: controller.signal,
      pullExpiresMs: 1_000,
      retryMs: 200,
      nakDelaysMs: [100, 100, 100, 100],
      onOutcome: (o) => outcomes.push(o),
      ...extra,
    });
    running.push({ controller, done });
    return { outcomes, controller };
  }

  async function publishRequest(req: ExportRequest, msgID = `${req.partId}:${req.attempt}`): Promise<void> {
    await nc.jetstream().publish(requestSubject(SERVICE), encoder.encode(JSON.stringify(req)), { msgID });
  }

  /** Reads the answers from the stream itself, through a consumer of the worker's subjects. */
  async function answers(count: number): Promise<{ subject: string; body: PartDone & { errorCode?: string } }[]> {
    const name = `answers-${randomUUID().slice(0, 8)}`;
    await jsm.consumers.add(EXPORTS_STREAM, {
      durable_name: name,
      ack_policy: AckPolicy.Explicit,
      filter_subjects: ["export.part.done", "export.part.failed"],
    });
    const consumer = await nc.jetstream().consumers.get(EXPORTS_STREAM, name);
    const out: { subject: string; body: PartDone & { errorCode?: string } }[] = [];
    while (out.length < count) {
      const msg = await consumer.next({ expires: 5_000 });
      if (!msg) throw new Error(`only ${out.length} answer(s) of ${count}`);
      out.push({ subject: msg.subject, body: msg.json() });
      msg.ack();
    }
    await jsm.consumers.delete(EXPORTS_STREAM, name);
    return out;
  }

  beforeEach(async () => {
    nc = await connect({ servers: NATS_URL });
    jsm = await nc.jetstreamManager();
    await dropStream();
  });

  afterEach(async () => {
    for (const r of running.splice(0)) {
      r.controller.abort();
      await r.done;
    }
    await dropStream();
    await nc.drain();
  });

  describe("ensureExportsStream", () => {
    it("creates a work-queue stream on export.> with the contract's age and duplicate window", async () => {
      await ensureExportsStream(jsm);
      await ensureExportsStream(jsm);
      const { config: cfg } = await jsm.streams.info(EXPORTS_STREAM);
      expect(cfg).toMatchObject({
        subjects: ["export.>"],
        retention: RetentionPolicy.Workqueue,
        storage: StorageType.File,
        max_age: nanos(24 * 3600 * 1000),
        duplicate_window: nanos(120_000),
      });
    });

    it("refuses to adopt a stream created with another retention, and says how to clear it", async () => {
      await jsm.streams.add({ name: EXPORTS_STREAM, subjects: ["export.>"], retention: RetentionPolicy.Limits, storage: StorageType.File });
      await expect(ensureExportsStream(jsm)).rejects.toThrow(/nats stream rm EXPORTS/u);
    });
  });

  describe("consumer", () => {
    beforeEach(async () => {
      await ensureExportsStream(jsm);
    });

    it("answers a request with done, then acks it", async () => {
      const store = new MemoryPartStore();
      const { outcomes } = start(async (ctx) => void (await ctx.writeJson("items", [{ a: 1 }])), { store });
      const req = request();
      await publishRequest(req);

      const [answer] = await answers(1);
      expect(answer.subject).toBe("export.part.done");
      expect(answer.body).toMatchObject({ partId: req.partId, attempt: 1, files: [{ path: `${SERVICE}/items.json` }] });
      expect(store.objects.has(`${req.storage.prefix}items.json`)).toBe(true);
      await waitFor(() => (outcomes.length === 1 ? true : undefined));
      const info = await jsm.consumers.info(EXPORTS_STREAM, serviceDurable(SERVICE));
      expect(info.num_ack_pending).toBe(0);
      expect(info.num_pending).toBe(0);
    });

    it("redelivers after a transient error, and succeeds on the next delivery", async () => {
      let calls = 0;
      start(async (ctx) => {
        calls++;
        if (calls === 1) throw new Error("database restarting");
        await ctx.writeJson("items", []);
      });
      await publishRequest(request());
      const [answer] = await answers(1);
      expect(answer.subject).toBe("export.part.done");
      expect(calls).toBe(2);
    });

    it("answers failed after the last allowed delivery", async () => {
      let calls = 0;
      start(
        async () => {
          calls++;
          throw new Error("always broken");
        },
        { maxDeliver: 3 },
      );
      await publishRequest(request());
      const [answer] = await answers(1);
      expect(answer.subject).toBe("export.part.failed");
      expect(answer.body.errorCode).toBe("internal");
      expect(calls).toBe(3);
    });

    it("drops an identical republication within the duplicate window", async () => {
      let calls = 0;
      start(async () => {
        calls++;
      });
      const req = request();
      await publishRequest(req);
      await publishRequest(req);
      await answers(1);
      await new Promise((r) => setTimeout(r, 1_000));
      expect(calls).toBe(1);
    });

    it("delivered twice, writes once and gives the same answer twice", async () => {
      const store = new MemoryPartStore();
      let run = 0;
      const outcomes = start(
        async (ctx) => {
          run++;
          await ctx.writeJson("items", [{ run }]);
        },
        { store },
      ).outcomes;
      const req = request();
      // Two message ids: JetStream delivers both, as after a lost ack past the duplicate window.
      await publishRequest(req, "first");
      await publishRequest(req, "second");
      await waitFor(() => (outcomes.length === 2 ? true : undefined));
      expect(outcomes.map((o) => (o.kind === "done" ? Boolean(o.replayed) : o.kind))).toEqual([false, true]);
      expect(run).toBe(1);
      // Both answers carry the same message id, so the stream keeps one.
      const [answer] = await answers(1);
      expect(answer.body.files).toEqual((outcomes[0] as { message: PartDone }).message.files);
      expect(JSON.parse(store.text(`${req.storage.prefix}items.json`)).items).toEqual([{ run: 1 }]);
    });

    it("has one part in flight at a time", async () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      let inFlight = 0;
      let maxInFlight = 0;
      start(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await gate;
        inFlight--;
      });
      await publishRequest(request());
      await publishRequest(request());
      await waitFor(() => (inFlight === 1 ? true : undefined));
      const info = await jsm.consumers.info(EXPORTS_STREAM, serviceDurable(SERVICE));
      expect(info.num_ack_pending).toBe(1);
      expect(info.num_pending).toBe(1);
      release();
      await answers(2);
      expect(maxInFlight).toBe(1);
    });

    it("naks the part in progress on shutdown, and the next instance finishes it", async () => {
      let started = false;
      const first = start(async (ctx) => {
        started = true;
        for (;;) {
          ctx.checkpoint();
          await new Promise((r) => setTimeout(r, 20));
        }
      });
      await publishRequest(request());
      await waitFor(() => (started ? true : undefined));
      first.controller.abort();
      await waitFor(() => (first.outcomes.length === 1 ? true : undefined));
      expect(first.outcomes[0]).toEqual({ kind: "aborted" });

      const deliveries: number[] = [];
      start(async (ctx) => {
        deliveries.push(ctx.request.attempt);
      });
      const [answer] = await answers(1);
      expect(answer.subject).toBe("export.part.done");
      expect(deliveries).toEqual([1]);
    });

    it("brings an existing durable back to the declared settings", async () => {
      await jsm.consumers.add(EXPORTS_STREAM, {
        durable_name: serviceDurable(SERVICE),
        ack_policy: AckPolicy.Explicit,
        filter_subject: requestSubject(SERVICE),
        ack_wait: nanos(5_000),
        max_deliver: 20,
        max_ack_pending: 10,
      });
      await ensureServiceConsumer(jsm, SERVICE, { ackWaitMs: 60_000, maxDeliver: 5 });
      const { config: cfg } = await jsm.consumers.info(EXPORTS_STREAM, serviceDurable(SERVICE));
      expect(cfg).toMatchObject({ ack_wait: nanos(60_000), max_deliver: 5, max_ack_pending: 1 });
    });
  });

  it("waits for the stream when the service starts first", async () => {
    const warnings: string[] = [];
    const { outcomes } = start(async () => undefined, {
      logger: { ...silent, warn: (o: object) => warnings.push((o as { operation: string }).operation) },
    });
    await waitFor(() => (warnings.includes("export:stream_missing") ? true : undefined));
    await ensureExportsStream(jsm);
    await publishRequest(request());
    await answers(1);
    // onOutcome runs after the ack, so it can land just after the answer is in the stream.
    await waitFor(() => (outcomes.length === 1 ? true : undefined));
    expect(outcomes[0].kind).toBe("done");
  });
});
