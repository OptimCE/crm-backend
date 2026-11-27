import { describe, expect, it } from "@jest/globals";
import { createHash, randomUUID } from "node:crypto";
import {
  EXPORT_PART_DONE_SUBJECT,
  EXPORT_PART_FAILED_SUBJECT,
  ExportPartError,
  MemoryPartStore,
  PART_DONE_MARKER,
  PartContext,
  checkAgainst,
  csvField,
  emptyHandler,
  handlePart,
  nakDelay,
  partPrefix,
  runContractCheck,
  safeFileName,
  type ExportHandler,
  type ExportRequest,
  type PartDone,
  type PartFailed,
  type PartOutcome,
  type PartPublisher,
} from "../../../../src/shared/export/kit/index.js";

const SERVICE = "crm";

function request(overrides: Partial<ExportRequest> = {}): ExportRequest {
  const exportId = randomUUID();
  return {
    schemaVersion: "1.0",
    exportId,
    partId: randomUUID(),
    service: SERVICE,
    attempt: 1,
    scope: { type: "user", id: "auth0|member" },
    requester: { userId: "auth0|member" },
    requestedAt: "2026-11-15T10:00:00Z",
    storage: { bucket: "exports", prefix: partPrefix(exportId, SERVICE) },
    ...overrides,
  };
}

class RecordingPublisher implements PartPublisher {
  readonly sent: { subject: string; payload: PartDone | PartFailed; msgId: string }[] = [];
  failing = false;
  async publish(subject: string, payload: PartDone | PartFailed, msgId: string): Promise<void> {
    if (this.failing) throw new Error("broker down");
    this.sent.push({ subject, payload, msgId });
  }
}

async function run(
  handler: ExportHandler,
  req: ExportRequest | string,
  extra: { deliveryCount?: number; store?: MemoryPartStore; publisher?: RecordingPublisher; signal?: AbortSignal; expectedBucket?: string } = {},
): Promise<{ outcome: PartOutcome; store: MemoryPartStore; publisher: RecordingPublisher }> {
  const store = extra.store ?? new MemoryPartStore();
  const publisher = extra.publisher ?? new RecordingPublisher();
  const outcome = await handlePart(typeof req === "string" ? req : JSON.stringify(req), {
    service: SERVICE,
    handler,
    store,
    publisher,
    deliveryCount: extra.deliveryCount ?? 1,
    signal: extra.signal,
    expectedBucket: extra.expectedBucket,
    now: () => new Date("2026-11-15T10:01:00Z"),
  });
  return { outcome, store, publisher };
}

describe("(Unit) export kit — schemas", () => {
  it("accepts a valid request and rejects one with an unknown field", () => {
    expect(checkAgainst("export-request", request()).valid).toBe(true);
    expect(checkAgainst("export-request", { ...request(), email: "alice@example.com" }).valid).toBe(false);
  });

  it("describes errors by pointer and keyword, never by value", () => {
    const check = checkAgainst("export-request", { ...request(), requester: { userId: "alice example.com" } });
    expect(check.valid).toBe(false);
    expect(check.errors.join(" ")).not.toContain("alice");
    expect(check.errors.join(" ")).toContain("/requester/userId");
  });
});

describe("(Unit) export kit — PartContext", () => {
  it("streams a JSON entity in the data-file envelope, with the size and sha256 of what was stored", async () => {
    const store = new MemoryPartStore();
    const req = request();
    const ctx = new PartContext(req, store, undefined, () => new Date("2026-11-15T10:01:00Z"));
    async function* members(): AsyncGenerator<object> {
      yield { id: 1, name: 'Élise, "la" première' };
      yield { id: 2, name: "Bob" };
    }
    expect(await ctx.writeJson("members", members())).toBe(2);

    const [file] = ctx.toDone().files;
    expect(file).toMatchObject({ path: "crm/members.json", key: `${req.storage.prefix}members.json`, contentType: "application/json" });
    const stored = store.objects.get(file.key)!.body;
    expect(file.size).toBe(stored.length);
    expect(file.sha256).toBe(createHash("sha256").update(stored).digest("hex"));
    const parsed = JSON.parse(stored.toString("utf8")) as { items: unknown[] };
    expect(checkAgainst("data-file", parsed).valid).toBe(true);
    expect(parsed).toMatchObject({ service: "crm", entity: "members", scope: "user", generatedAt: "2026-11-15T10:01:00.000Z" });
    expect(parsed.items).toEqual([
      { id: 1, name: 'Élise, "la" première' },
      { id: 2, name: "Bob" },
    ]);
  });

  it("writes an empty entity as an empty items array", async () => {
    const store = new MemoryPartStore();
    const ctx = new PartContext(request(), store);
    expect(await ctx.writeJson("notifications", [])).toBe(0);
    const key = ctx.toDone().files[0].key;
    expect((JSON.parse(store.text(key)) as { items: unknown[] }).items).toEqual([]);
  });

  it("keeps a large stream intact across flushes", async () => {
    const store = new MemoryPartStore();
    const ctx = new PartContext(request(), store);
    function* rows(): Generator<object> {
      for (let i = 0; i < 20_000; i++) yield { i, text: "x".repeat(20) };
    }
    expect(await ctx.writeJson("big", rows())).toBe(20_000);
    const file = ctx.toDone().files[0];
    expect((JSON.parse(store.text(file.key)) as { items: { i: number }[] }).items.at(-1)).toEqual({ i: 19_999, text: "x".repeat(20) });
    expect(file.size).toBe(store.objects.get(file.key)!.body.length);
  });

  it("writes RFC 4180 CSV and refuses a row of the wrong width", async () => {
    const store = new MemoryPartStore();
    const ctx = new PartContext(request(), store);
    await ctx.writeCsv(
      "consumptions/541448800000000001/2026.csv",
      ["timestamp_utc", "offtake_kwh", "note"],
      [
        [new Date("2026-01-01T00:15:00Z"), 0.25, 'a "quoted", value'],
        ["2026-01-01T00:30:00Z", null, " padded"],
      ],
    );
    const file = ctx.toDone().files[0];
    expect(file).toMatchObject({ path: "crm/consumptions/541448800000000001/2026.csv", contentType: "text/csv; charset=utf-8" });
    expect(store.text(file.key)).toBe(
      'timestamp_utc,offtake_kwh,note\r\n2026-01-01T00:15:00.000Z,0.25,"a ""quoted"", value"\r\n2026-01-01T00:30:00Z,," padded"\r\n',
    );
    await expect(ctx.writeCsv("bad.csv", ["a", "b"], [["only one"]])).rejects.toThrow(/2/u);
  });

  it.each(["../crm/x.json", "/etc/passwd", "a\\b.json", "a/./b.json", "a/../b.json", "a\nb.json", ""])("refuses the path %j", async (path) => {
    const ctx = new PartContext(request(), new MemoryPartStore());
    await expect(ctx.writeCsv(path, ["a"], [])).rejects.toThrow(/invalid archive path/u);
  });

  it("keeps .export/ for the kit", async () => {
    const ctx = new PartContext(request(), new MemoryPartStore());
    await expect(ctx.writeJson("x", [], { path: ".export/done.json" })).rejects.toThrow(/reserved/u);
  });

  it("refuses a path written twice, references included", async () => {
    const ctx = new PartContext(request(), new MemoryPartStore());
    await ctx.writeJson("documents", []);
    await expect(ctx.writeJson("documents", [])).rejects.toThrow(/twice/u);
    ctx.addReference({ bucket: "crm-files", key: "documents/a.pdf", path: "documents/files/1-a.pdf" });
    expect(() => ctx.addReference({ bucket: "crm-files", key: "documents/b.pdf", path: "documents/files/1-a.pdf" })).toThrow(/twice/u);
  });

  it("namespaces counters and omissions by service, and sums a counter", () => {
    const ctx = new PartContext(request(), new MemoryPartStore());
    ctx.count("members", 2);
    ctx.count("members", 3);
    ctx.omit("aggregate", "below_threshold");
    const done = ctx.toDone();
    expect(done.summary).toEqual([{ labelKey: "export.crm.members", count: 5 }]);
    expect(done.omitted).toEqual([{ what: "crm.aggregate", reason: "below_threshold" }]);
    expect(() => ctx.count("Members", 1)).toThrow();
    expect(() => ctx.count("members", -1)).toThrow();
  });

  it("stops writing once the consumer shuts down", async () => {
    const controller = new AbortController();
    const ctx = new PartContext(request(), new MemoryPartStore(), controller.signal);
    function* rows(): Generator<object> {
      yield { i: 0 };
      controller.abort();
      yield { i: 1 };
    }
    await expect(ctx.writeJson("x", rows())).rejects.toThrow(/aborted/u);
  });
});

describe("(Unit) export kit — helpers", () => {
  it.each([
    ["statuts.pdf", "statuts.pdf"],
    ["../../etc/passwd", "_.._etc_passwd"],
    ["a\\b/c", "a_b_c"],
    ["tab\there", "tab_here"],
    ["   ", "file"],
    [".hidden", "hidden"],
    ["Convention – Liège.pdf", "Convention – Liège.pdf"],
  ])("safeFileName(%j) = %j", async (input, expected) => {
    const name = safeFileName(input);
    expect(name).toBe(expected);
    // Always one segment the archive accepts: no separator, no dot segment.
    const ctx = new PartContext(request(), new MemoryPartStore());
    await expect(ctx.writeCsv(`documents/files/${name}`, ["a"], [])).resolves.toBe(0);
  });

  it("keeps the extension when it shortens a name", () => {
    const name = safeFileName(`${"a".repeat(300)}.pdf`, 50);
    expect(name).toHaveLength(50);
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("quotes only what RFC 4180 needs", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(12.5)).toBe("12.5");
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("line\nbreak")).toBe('"line\nbreak"');
  });

  it("follows the contract's 10 s / 1 min / 5 min ladder, then stays at 5 min", () => {
    const ladder = [10_000, 60_000, 300_000, 300_000];
    expect([1, 2, 3, 4, 5, 9].map((n) => nakDelay(ladder, n))).toEqual([10_000, 60_000, 300_000, 300_000, 300_000, 300_000]);
  });
});

describe("(Unit) export kit — handlePart", () => {
  const writesMembers: ExportHandler = async (ctx) => {
    await ctx.writeJson("members", [{ id: 1 }]);
    ctx.addReference({ bucket: "crm-files", key: "documents/u-statuts.pdf", path: "documents/files/7-statuts.pdf", contentType: "application/pdf" });
    ctx.count("members", 1);
  };

  it("answers done, after emptying the prefix, with a schema-valid message", async () => {
    const req = request();
    const store = new MemoryPartStore();
    const stale = `${req.storage.prefix}stale.json`;
    store.objects.set(stale, { body: Buffer.from("{}"), contentType: "application/json" });

    const { outcome, publisher } = await run(writesMembers, req, { store });

    expect(outcome.kind).toBe("done");
    expect(store.deleted).toEqual([stale]);
    expect(store.objects.has(`${req.storage.prefix}members.json`)).toBe(true);
    // The marker holds exactly the answer given, and is not an archive file.
    expect(JSON.parse(store.text(`${req.storage.prefix}${PART_DONE_MARKER}`))).toEqual(publisher.sent[0].payload);
    expect((publisher.sent[0].payload as PartDone).files.map((f) => f.path)).toEqual(["crm/members.json"]);
    expect(publisher.sent).toHaveLength(1);
    const [sent] = publisher.sent;
    expect(sent.subject).toBe(EXPORT_PART_DONE_SUBJECT);
    expect(sent.msgId).toBe(`${req.partId}:1:done`);
    expect(checkAgainst("export-part-done", sent.payload).valid).toBe(true);
    expect(sent.payload).toMatchObject({
      exportId: req.exportId,
      partId: req.partId,
      attempt: 1,
      references: [{ bucket: "crm-files", key: "documents/u-statuts.pdf", targetPath: "crm/documents/files/7-statuts.pdf" }],
      summary: [{ labelKey: "export.crm.members", count: 1 }],
    });
  });

  it("replays a completed attempt instead of rewriting it", async () => {
    const req = request();
    const store = new MemoryPartStore();
    const first = await run(writesMembers, req, { store });
    const before = new Map([...store.objects].map(([k, v]) => [k, v.body.toString("utf8")]));
    const deletedBefore = store.deleted.length;

    const neverAgain: ExportHandler = async () => {
      throw new Error("the handler must not run twice for one attempt");
    };
    const second = await run(neverAgain, req, { store, deliveryCount: 2 });

    expect(second.outcome).toMatchObject({ kind: "done", replayed: true });
    expect(second.publisher.sent).toEqual(first.publisher.sent);
    expect(new Map([...store.objects].map(([k, v]) => [k, v.body.toString("utf8")]))).toEqual(before);
    expect(store.deleted).toHaveLength(deletedBefore);
  });

  it("redoes the part from an empty prefix for a newer attempt", async () => {
    const req = request();
    const store = new MemoryPartStore();
    await run(async (ctx) => void (await ctx.writeJson("old-only", [])), req, { store });
    const { outcome } = await run(writesMembers, { ...req, attempt: 2 }, { store });
    expect(outcome).toMatchObject({ kind: "done", message: { attempt: 2 } });
    expect(store.objects.has(`${req.storage.prefix}old-only.json`)).toBe(false);
    expect(JSON.parse(store.text(`${req.storage.prefix}${PART_DONE_MARKER}`))).toMatchObject({ attempt: 2 });
  });

  it("ignores an unreadable marker and does the work", async () => {
    const req = request();
    const store = new MemoryPartStore();
    store.objects.set(`${req.storage.prefix}${PART_DONE_MARKER}`, { body: Buffer.from("{not json"), contentType: "application/json" });
    const { outcome } = await run(writesMembers, req, { store });
    expect(outcome.kind).toBe("done");
    expect(outcome).not.toHaveProperty("replayed");
  });

  it("answers an empty part for a service with nothing to export", async () => {
    const { outcome } = await run(emptyHandler, request());
    expect(outcome.kind).toBe("done");
    expect((outcome as { message: PartDone }).message).toMatchObject({ files: [], references: [], summary: [], omitted: [] });
  });

  it("echoes the attempt it answers", async () => {
    const req = request({ attempt: 3 });
    const { publisher } = await run(emptyHandler, req);
    expect(publisher.sent[0]).toMatchObject({ msgId: `${req.partId}:3:done`, payload: { attempt: 3 } });
  });

  it("turns an ExportPartError into failed, and leaves nothing under the prefix", async () => {
    const req = request();
    const handler: ExportHandler = async (ctx) => {
      await ctx.writeJson("members", [{ id: 1 }]);
      throw new ExportPartError("forbidden", "requester is no longer ADMIN of community 2");
    };
    const { outcome, store, publisher } = await run(handler, req);
    expect(outcome.kind).toBe("failed");
    expect([...store.objects.keys()].filter((k) => k.startsWith(req.storage.prefix))).toEqual([]);
    expect(publisher.sent[0]).toMatchObject({ subject: EXPORT_PART_FAILED_SUBJECT, msgId: `${req.partId}:1:failed` });
    expect(publisher.sent[0].payload).toMatchObject({ errorCode: "forbidden", errorDetail: "requester is no longer ADMIN of community 2" });
    expect(checkAgainst("export-part-failed", publisher.sent[0].payload).valid).toBe(true);
  });

  it("retries an unexpected error with the contract's delays, without answering", async () => {
    const boom: ExportHandler = async () => {
      throw new Error("connection reset");
    };
    const first = await run(boom, request(), { deliveryCount: 1 });
    expect(first.outcome).toMatchObject({ kind: "retry", delayMs: 10_000 });
    expect(first.publisher.sent).toEqual([]);
    expect((await run(boom, request(), { deliveryCount: 3 })).outcome).toMatchObject({ kind: "retry", delayMs: 300_000 });
  });

  it("fails on the last delivery, naming the error class but never its message", async () => {
    const leaky: ExportHandler = async () => {
      throw Object.assign(new Error("duplicate key (email)=(alice@example.com)"), { code: "23505" });
    };
    const { outcome, publisher } = await run(leaky, request(), { deliveryCount: 5 });
    expect(outcome.kind).toBe("failed");
    const detail = (publisher.sent[0].payload as PartFailed).errorDetail;
    expect(detail).toBe("Error (23505) on delivery 5");
    expect(detail).not.toContain("alice");
  });

  it("terminates what it cannot answer", async () => {
    expect((await run(emptyHandler, "not json")).outcome).toMatchObject({ kind: "invalid" });
    expect((await run(emptyHandler, JSON.stringify({ exportId: "x" }))).outcome).toMatchObject({ kind: "invalid" });
  });

  it("answers unsupported_schema to another major version", async () => {
    const { outcome } = await run(emptyHandler, request({ schemaVersion: "2.0" }));
    expect(outcome).toMatchObject({ kind: "failed", message: { errorCode: "unsupported_schema" } });
  });

  it.each([
    ["an unknown field", (r: ExportRequest): object => ({ ...r, email: "alice@example.com" })],
    [
      "another service",
      (r: ExportRequest): object => ({ ...r, service: "billing", storage: { ...r.storage, prefix: partPrefix(r.exportId, "billing") } }),
    ],
    ["a prefix of another export", (r: ExportRequest): object => ({ ...r, storage: { ...r.storage, prefix: partPrefix(randomUUID(), SERVICE) } })],
  ])("refuses a request with %s", async (_label, mutate) => {
    const { outcome, publisher } = await run(emptyHandler, JSON.stringify(mutate(request())));
    expect(outcome).toMatchObject({ kind: "failed", message: { errorCode: "internal" } });
    expect(JSON.stringify(publisher.sent)).not.toContain("alice");
  });

  it("refuses a request for another bucket when the store is bound to one", async () => {
    const req = request();
    const { outcome } = await run(emptyHandler, { ...req, storage: { ...req.storage, bucket: "crm-files" } }, { expectedBucket: "exports" });
    expect(outcome).toMatchObject({ kind: "failed", message: { errorCode: "internal" } });
  });

  it("reports a shutdown as aborted, for an immediate nak", async () => {
    const controller = new AbortController();
    const handler: ExportHandler = async (ctx) => {
      controller.abort();
      ctx.checkpoint();
    };
    expect((await run(handler, request(), { signal: controller.signal })).outcome).toEqual({ kind: "aborted" });
  });

  it("retries when the answer cannot be published", async () => {
    const publisher = new RecordingPublisher();
    publisher.failing = true;
    expect((await run(emptyHandler, request(), { publisher })).outcome).toMatchObject({ kind: "retry" });
  });
});

describe("(Unit) export kit — contract check", () => {
  it("passes an empty handler", async () => {
    const result = await runContractCheck(emptyHandler, { service: "news-board", scope: { type: "community", id: "2" }, requesterId: "auth0|admin" });
    expect(result.outcome).toBe("done");
  });

  it("fails a handler that never answers", async () => {
    const stuck: ExportHandler = () => new Promise(() => undefined);
    await expect(runContractCheck(stuck, { service: "crm", scope: { type: "user", id: "u" }, requesterId: "u", timeoutMs: 50 })).rejects.toThrow(
      /no answer within 50 ms/u,
    );
  });
});
