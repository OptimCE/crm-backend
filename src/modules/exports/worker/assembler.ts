import { createHash, type Hash } from "node:crypto";
import { Readable, Transform, type TransformCallback } from "node:stream";
import archiver, { type Archiver } from "archiver";
import { checkAgainst } from "../../../shared/export/kit/schemas.js";
import type { PartDone } from "../../../shared/export/kit/contract.js";
import type { AssemblyJob } from "./worker.repository.js";
import { ObjectNotFoundError, type ExportObjectStore } from "./object-store.js";
import { archiveKey, archivePrefix, buildManifest, storeWithoutCompression, type ManifestFile, type ManifestPart } from "./manifest.js";
import { renderIndexHtml } from "./index-html.js";

/**
 * Streams the archive of one export into storage: every file of every part, every referenced
 * document, then manifest.json and (user exports) index.html. One source is open at a time, each
 * is hashed on the way and checked against what its part declared, and the ZIP goes to a
 * multipart upload as it is produced: nothing is held whole in memory or written to disk.
 */

/** Why an assembly stopped. `permanent`: trying again would give the same result. */
export class AssemblyError extends Error {
  constructor(
    readonly code: string,
    readonly permanent: boolean,
    detail: string,
  ) {
    super(detail);
    this.name = "AssemblyError";
  }
}

/** The worker is stopping: the assembly did not fail. */
export class AssemblyAbortedError extends Error {
  constructor() {
    super("assembly aborted");
    this.name = "AssemblyAbortedError";
  }
}

export interface AssemblyOptions {
  bucket: string;
  documentBuckets: readonly string[];
  platformVersion: string;
  signal: AbortSignal;
  /** Called between entries: the caller renews its lease there. */
  onProgress?: () => Promise<void>;
  now?: () => Date;
}

export interface AssembledArchive {
  key: string;
  size: number;
  sha256: string;
  entries: number;
}

/**
 * Counts and hashes what flows through it. The count is `bytes`, never `size`: lib-storage's
 * Upload reads `Body.size` as the length of the whole body, and a 0 there fails the upload.
 */
class HashTap extends Transform {
  private readonly hash: Hash = createHash("sha256");
  bytes = 0;

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.hash.update(chunk);
    this.bytes += chunk.length;
    callback(null, chunk);
  }

  digest(): string {
    return this.hash.digest("hex");
  }
}

export async function assembleArchive(store: ExportObjectStore, job: AssemblyJob, options: AssemblyOptions): Promise<AssembledArchive> {
  const now = options.now ?? ((): Date => new Date());
  const key = archiveKey(job.id, job.scope_type, job.created_at);
  const parts = job.parts.map((part) => {
    if (part.status !== "done" || !part.result) throw new AssemblyError("corrupt_part", true, `part ${part.service} is not done`);
    return { service: part.service, result: part.result };
  });

  // What a previous attempt left behind.
  await store.deletePrefix(archivePrefix(job.id));

  const archive: Archiver = archiver("zip", { zlib: { level: 6 } });
  const output = new HashTap();
  archive.on("error", (err) => output.destroy(err));
  archive.pipe(output);
  const upload = store.upload(key, output, "application/zip");
  // Settles as soon as the upload fails, so a wait on the archive is released.
  const uploadFailed = upload.then(
    () => new Promise<never>(() => undefined),
    (err: unknown) => Promise.reject(err),
  );
  uploadFailed.catch(() => undefined);

  let entries = 0;
  const checkpoint = (): void => {
    if (options.signal.aborted) throw new AssemblyAbortedError();
  };
  const add = async (source: Readable, name: string, stored: boolean): Promise<{ size: number; sha256: string }> => {
    checkpoint();
    const result = await addEntry(archive, source, name, stored, uploadFailed, options.signal);
    entries++;
    await options.onProgress?.();
    return result;
  };

  try {
    const manifestParts: ManifestPart[] = [];
    for (const { service, result } of parts) {
      manifestParts.push({
        service,
        status: "done",
        files: await addPart(store, options, service, result, add),
        summary: result.summary,
        omitted: result.omitted,
      });
    }

    const manifest = buildManifest({
      exportId: job.id,
      scope: { type: job.scope_type, id: job.scope_id, name: job.scope_name },
      requesterId: job.requester_user_id,
      locale: job.locale,
      platformVersion: options.platformVersion,
      generatedAt: now(),
      parts: manifestParts,
    });
    const check = checkAgainst("manifest", manifest);
    if (!check.valid) throw new AssemblyError("invalid_manifest", true, `manifest.json is not valid: ${check.errors.join("; ")}`);
    await add(Readable.from([Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8")]), "manifest.json", false);
    if (job.scope_type === "user") {
      await add(Readable.from([Buffer.from(renderIndexHtml(manifest), "utf8")]), "index.html", false);
    }

    checkpoint();
    await Promise.race([archive.finalize(), uploadFailed]);
    await Promise.race([upload, uploadFailed]);
  } catch (err) {
    archive.abort();
    output.destroy();
    await upload.catch(() => undefined);
    throw err;
  }
  return { key, size: output.bytes, sha256: output.digest(), entries };
}

type AddEntry = (source: Readable, name: string, stored: boolean) => Promise<{ size: number; sha256: string }>;

/** One part's files, then its references, each checked against what the part declared. */
async function addPart(
  store: ExportObjectStore,
  options: AssemblyOptions,
  service: string,
  result: PartDone,
  add: AddEntry,
): Promise<ManifestFile[]> {
  const files: ManifestFile[] = [];
  for (const file of result.files) {
    const source = await open(store, options.bucket, file.key, service);
    const actual = await add(source, file.path, storeWithoutCompression(file.path, file.contentType));
    if (actual.size !== file.size || actual.sha256 !== file.sha256) {
      throw new AssemblyError("corrupt_part", true, `${service}: ${file.path} is not what its part.done declared`);
    }
    files.push({ path: file.path, ...actual });
  }
  for (const reference of result.references) {
    if (!options.documentBuckets.includes(reference.bucket)) {
      throw new AssemblyError("invalid_part", true, `${service}: a reference names a bucket the worker does not read`);
    }
    const source = await open(store, reference.bucket, reference.key, service);
    const actual = await add(source, reference.targetPath, storeWithoutCompression(reference.targetPath, reference.contentType));
    if ((reference.size !== undefined && reference.size !== actual.size) || (reference.sha256 !== undefined && reference.sha256 !== actual.sha256)) {
      throw new AssemblyError("corrupt_part", true, `${service}: ${reference.targetPath} is not what its part.done declared`);
    }
    files.push({ path: reference.targetPath, ...actual });
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

async function open(store: ExportObjectStore, bucket: string, key: string, service: string): Promise<Readable> {
  try {
    return await store.open(bucket, key);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      throw new AssemblyError("corrupt_data", true, `${service}: an object its part lists is missing`);
    }
    throw err;
  }
}

/**
 * Appends one entry and waits until the archive has written it, so the next source is opened
 * only then. Resolves with the size and sha256 of the source.
 */
function addEntry(
  archive: Archiver,
  source: Readable,
  name: string,
  stored: boolean,
  uploadFailed: Promise<never>,
  signal: AbortSignal,
): Promise<{ size: number; sha256: string }> {
  const tap = new HashTap();
  source.on("error", (err) => tap.destroy(err));
  source.pipe(tap);
  const written = new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      archive.off("entry", onEntry);
      archive.off("error", onError);
      tap.off("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onEntry = (entry: { name: string }): void => {
      if (entry.name === name) {
        cleanup();
        resolve();
      }
    };
    const onError = (err: Error): void => {
      cleanup();
      reject(err);
    };
    const onAbort = (): void => {
      cleanup();
      source.destroy();
      reject(new AssemblyAbortedError());
    };
    archive.on("entry", onEntry);
    archive.once("error", onError);
    tap.once("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  archive.append(tap, { name, store: stored });
  return Promise.race([written, uploadFailed]).then(() => ({ size: tap.bytes, sha256: tap.digest() }));
}
