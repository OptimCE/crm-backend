import { describe, expect, it } from "@jest/globals";
import { Readable } from "node:stream";
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";
import { S3Client } from "@aws-sdk/client-s3";
import { assembleArchive } from "../../../src/modules/exports/worker/assembler.js";
import { S3ExportObjectStore, type ExportObjectStore } from "../../../src/modules/exports/worker/object-store.js";
import type { AssemblyJob } from "../../../src/modules/exports/worker/worker.repository.js";
import type { PartDone } from "../../../src/shared/export/kit/contract.js";

/**
 * The worker's memory stays flat while it assembles a large export (acceptance criterion 16,
 * contracts/export/README.md §11).
 *
 * The real assembler streams a synthetic export into the real multipart upload of
 * S3ExportObjectStore (lib-storage, 5 MiB parts, two in flight), whose S3Client is answered in
 * process: nothing is sent, every part is counted and dropped. The sources are generated on the
 * fly, in fresh buffers as a download delivers them, so the only memory that can grow is what the
 * assembler and the upload keep. Most of the export is PDFs (stored, as the worker stores them)
 * and one CSV goes through deflate.
 *
 * The memory kept is measured after a forced garbage collection at every uploaded part: what is
 * still reachable, not the garbage of the moment. An export 8 times larger may not keep more, and
 * neither keeps more than a fraction of one document: an assembler or an upload that held a
 * source or the archive whole would keep hundreds of MiB.
 */

const MiB = 1024 * 1024;
const EXPORT_ID = "6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23";
const PART_ID = "0d8e4f7b-1a23-4c1e-9a52-6f1c2a7e3b9d";
const CHUNK = 64 * 1024;
const LINE = "541448200000000001;2026-01-01T00:15:00Z;0.25;0.10\n";

/** A forced full collection, when the runtime lets us have one (Node does, through a V8 flag). */
function exposeGc(): (() => void) | undefined {
  const existing = (globalThis as { gc?: () => void }).gc;
  if (existing) return existing;
  try {
    setFlagsFromString("--expose-gc");
    return runInNewContext("gc") as () => void;
  } catch {
    return undefined;
  }
}

const gc = exposeGc();

/** Bytes still reachable: the JS heap plus the buffers outside it. */
function kept(): number {
  gc?.();
  const usage = process.memoryUsage();
  return usage.heapUsed + usage.arrayBuffers;
}

/** `size` bytes of `pattern`, in fresh 64 KiB chunks. */
function generated(size: number, pattern: string): Readable {
  let left = size;
  return new Readable({
    read(): void {
      if (left <= 0) {
        this.push(null);
        return;
      }
      const chunk = Buffer.allocUnsafe(Math.min(CHUNK, left)).fill(pattern);
      left -= chunk.length;
      this.push(chunk);
    },
  });
}

/** An S3Client that answers the multipart upload itself and keeps nothing it is given. */
function inProcessS3(onPart: (bytes: number) => void): S3Client {
  const client = new S3Client({
    region: "us-east-1",
    endpoint: "http://s3.invalid",
    forcePathStyle: true,
    credentials: { accessKeyId: "a", secretAccessKey: "s" },
  });
  client.middlewareStack.add(
    // The SDK types the answer from the command; any command this test does not expect throws.
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    (_next, context) => async (args) => {
      const input = args.input as { Body?: Uint8Array | string; PartNumber?: number };
      switch (context.commandName) {
        case "CreateMultipartUploadCommand":
          return { output: { UploadId: "upload-1", $metadata: {} }, response: {} };
        case "UploadPartCommand":
          onPart(typeof input.Body === "string" ? Buffer.byteLength(input.Body) : (input.Body?.byteLength ?? 0));
          return { output: { ETag: `"etag-${input.PartNumber}"`, $metadata: {} }, response: {} };
        case "CompleteMultipartUploadCommand":
        case "AbortMultipartUploadCommand":
          return { output: { $metadata: {} }, response: {} };
        default:
          throw new Error(`unexpected ${context.commandName}`);
      }
    },
    { step: "initialize", name: "inProcessS3", priority: "high" },
  );
  return client;
}

interface Run {
  /** Archive bytes the upload received. */
  uploaded: number;
  /** The most memory kept at any uploaded part, above what was kept before the assembly. */
  peakGrowth: number;
  entries: number;
}

/** Assembles one export of `total` bytes of documents: four PDFs (three quarters) and one CSV. */
async function assemble(total: number): Promise<Run> {
  const pdf = Math.floor((total * 0.75) / 4);
  const csv = total - 4 * pdf;
  const sources = new Map<string, () => Readable>([
    ...[1, 2, 3, 4].map((i): [string, () => Readable] => [`documents/${i}-statuts.pdf`, (): Readable => generated(pdf, "%PDF-1.7 synthetic page ")]),
    ["consumptions/541448200000000001/2026.csv", (): Readable => generated(csv, LINE)],
  ]);
  const result: PartDone = {
    schemaVersion: "1.0",
    exportId: EXPORT_ID,
    partId: PART_ID,
    service: "crm",
    attempt: 1,
    files: [],
    references: [...sources.keys()].map((key) => ({
      bucket: "crm-files",
      key,
      targetPath: `crm/${key.replace("documents/", "documents/files/")}`,
      size: key.endsWith(".pdf") ? pdf : csv,
    })),
    summary: [],
    omitted: [],
    producedAt: "2026-11-18T10:00:00Z",
  };
  const job: AssemblyJob = {
    id: EXPORT_ID,
    scope_type: "community",
    scope_id: "org-1",
    id_community: 1,
    requester_user_id: "sub-1",
    id_requester: 1,
    status: "assembling",
    locale: "fr",
    created_at: new Date("2026-11-18T09:00:00Z"),
    assembly_attempts: 1,
    object_key: null,
    scope_name: "Test Community",
    community_name: "Test Community",
    parts: [{ id: PART_ID, export_job_id: EXPORT_ID, service: "crm", status: "done", attempts: 1, requested_at: null, result }],
  };

  let uploaded = 0;
  let peak = 0;
  const baseline = kept();
  const upload = new S3ExportObjectStore(
    { endpoint: "http://s3.invalid", region: "us-east-1", accessKey: "a", secretKey: "s", bucket: "exports" },
    inProcessS3((bytes) => {
      uploaded += bytes;
      peak = Math.max(peak, kept() - baseline);
    }),
  );
  const store: ExportObjectStore = {
    open: async (_bucket, key) => {
      const source = sources.get(key);
      if (!source) throw new Error(`no synthetic object ${key}`);
      return source();
    },
    upload: (key, body, contentType) => upload.upload(key, body, contentType),
    deletePrefix: async () => 0,
  };

  const archive = await assembleArchive(store, job, {
    bucket: "exports",
    documentBuckets: ["crm-files"],
    platformVersion: "test",
    signal: new AbortController().signal,
  });
  upload.destroy();
  expect(archive.size).toBe(uploaded);
  return { uploaded, peakGrowth: peak, entries: archive.entries };
}

describe("(Unit) export worker memory", () => {
  it("keeps the same, small amount of memory however large the export", async () => {
    await assemble(8 * MiB); // warm-up: modules, zlib, the SDK's first commands

    const small = await assemble(64 * MiB);
    const large = await assemble(512 * MiB);

    // Every document went through: the archive is at least the stored PDFs.
    expect(large.entries).toBe(6);
    expect(large.uploaded).toBeGreaterThan(384 * MiB);
    // Without a forced collection the figures include garbage of the moment: looser bounds.
    const ceiling = gc ? 64 * MiB : 160 * MiB;
    const drift = gc ? 24 * MiB : 64 * MiB;
    const report = `small +${(small.peakGrowth / MiB).toFixed(1)} MiB, large +${(large.peakGrowth / MiB).toFixed(1)} MiB (gc ${gc ? "forced" : "not available"})`;
    if (process.env.EXPORT_MEMORY_REPORT) process.stdout.write(`${report}\n`);
    expect({ report, ok: large.peakGrowth < ceiling }).toEqual({ report, ok: true });
    expect({ report, ok: large.peakGrowth - small.peakGrowth < drift }).toEqual({ report, ok: true });
  }, 180_000);
});
