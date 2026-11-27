import { createHash } from "node:crypto";
import { once } from "node:events";
import { PassThrough } from "node:stream";
import {
  EXPORT_SCHEMA_VERSION,
  RESERVED_PART_DIR,
  type ExportRequest,
  type OmittedItem,
  type OmittedReason,
  type PartDone,
  type PartFile,
  type PartReference,
} from "./contract.js";
import { ExportAbortedError } from "./errors.js";
import type { PartStore } from "./part-store.js";

/** Same rule as `archivePath` in common.schema.json. */
// eslint-disable-next-line no-control-regex -- refusing control characters is the point
const RELATIVE_PATH = /^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[^\\\x00-\x1f]+$/u;
const ENTITY = /^[a-z][a-z0-9-]{0,62}$/u;
const NAME = /^[a-z0-9_.-]+$/u;
const MAX_PATH = 512;
const FLUSH_BYTES = 64 * 1024;

export type CsvValue = string | number | boolean | bigint | Date | null | undefined;

export interface ReferenceInput {
  bucket: string;
  key: string;
  /** Path inside the service's folder, e.g. `documents/files/12-statuts.pdf`. */
  path: string;
  size?: number;
  sha256?: string;
  contentType?: string;
}

/**
 * What a handler writes its part through. Every path is relative to the service's own folder of
 * the archive (`<service>/…`); the context adds the folder, refuses a path outside it or written
 * twice, and computes each file's size and sha256 while streaming it to the store.
 */
export class PartContext {
  private readonly files: PartFile[] = [];
  private readonly references: PartReference[] = [];
  private readonly counters = new Map<string, number>();
  private readonly omissions: OmittedItem[] = [];
  private readonly claimed = new Set<string>();

  constructor(
    readonly request: ExportRequest,
    private readonly store: PartStore,
    private readonly signal: AbortSignal = new AbortController().signal,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get service(): string {
    return this.request.service;
  }

  get scope(): ExportRequest["scope"] {
    return this.request.scope;
  }

  get requesterId(): string {
    return this.request.requester.userId;
  }

  /** Throws ExportAbortedError once the consumer is shutting down. Call it in long loops. */
  checkpoint(): void {
    if (this.signal.aborted) throw new ExportAbortedError();
  }

  /**
   * Streams one entity type as `<service>/<entity>.json` (or `options.path`), in the data-file
   * envelope. `items` may be an async iterable, so a cursor never has to be materialised.
   * Resolves with the number of items written.
   */
  async writeJson(entity: string, items: Iterable<unknown> | AsyncIterable<unknown>, options: { path?: string } = {}): Promise<number> {
    if (!ENTITY.test(entity)) throw new Error(`invalid entity name ${JSON.stringify(entity)}`);
    const header = JSON.stringify({
      schemaVersion: EXPORT_SCHEMA_VERSION,
      service: this.service,
      entity,
      scope: this.scope.type,
      generatedAt: this.now().toISOString(),
    });
    let count = 0;
    await this.writeObject(options.path ?? `${entity}.json`, "application/json", async (emit) => {
      await emit(`${header.slice(0, -1)},"items":[`);
      for await (const item of items) {
        await emit(`${count === 0 ? "\n" : ",\n"}${JSON.stringify(item)}`);
        count++;
      }
      await emit(count === 0 ? "]}\n" : "\n]}\n");
    });
    return count;
  }

  /** Streams a CSV file (UTF-8, comma, header line). Resolves with the number of data rows. */
  async writeCsv(path: string, header: readonly string[], rows: Iterable<readonly CsvValue[]> | AsyncIterable<readonly CsvValue[]>): Promise<number> {
    let count = 0;
    await this.writeObject(path, "text/csv; charset=utf-8", async (emit) => {
      await emit(`${header.map(csvField).join(",")}\r\n`);
      for await (const row of rows) {
        if (row.length !== header.length) throw new Error(`CSV row ${count + 1} of ${path} has ${row.length} fields, header has ${header.length}`);
        await emit(`${row.map(csvField).join(",")}\r\n`);
        count++;
      }
    });
    return count;
  }

  /** Lists an object already in MinIO; the worker copies it into the archive at `<service>/<path>`. */
  addReference(input: ReferenceInput): void {
    const targetPath = this.claim(input.path);
    const reference: PartReference = { bucket: input.bucket, key: input.key, targetPath };
    if (input.size !== undefined) reference.size = input.size;
    if (input.sha256 !== undefined) reference.sha256 = input.sha256;
    if (input.contentType !== undefined) reference.contentType = input.contentType;
    this.references.push(reference);
  }

  /** Adds to the counter shown in index.html as `export.<service>.<name>`. */
  count(name: string, n: number): void {
    if (!NAME.test(name)) throw new Error(`invalid counter name ${JSON.stringify(name)}`);
    if (!Number.isInteger(n) || n < 0) throw new Error(`invalid count ${n} for ${name}`);
    const labelKey = `export.${this.service}.${name}`;
    this.counters.set(labelKey, (this.counters.get(labelKey) ?? 0) + n);
  }

  /** Records something deliberately left out (`<service>.<what>`), so the archive says so. */
  omit(what: string, reason: OmittedReason): void {
    if (!NAME.test(what)) throw new Error(`invalid omission name ${JSON.stringify(what)}`);
    this.omissions.push({ what: `${this.service}.${what}`, reason });
  }

  toDone(): PartDone {
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportId: this.request.exportId,
      partId: this.request.partId,
      service: this.service,
      attempt: this.request.attempt,
      files: [...this.files],
      references: [...this.references],
      summary: [...this.counters].map(([labelKey, count]) => ({ labelKey, count })),
      omitted: [...this.omissions],
      producedAt: this.now().toISOString(),
    };
  }

  /** Validates a service-relative path, reserves it, and returns its archive path. */
  private claim(relative: string): string {
    if (!RELATIVE_PATH.test(relative)) throw new Error(`invalid archive path ${JSON.stringify(relative)}`);
    if (relative.startsWith(RESERVED_PART_DIR)) throw new Error(`${RESERVED_PART_DIR} is reserved for the kit`);
    const path = `${this.service}/${relative}`;
    if (path.length > MAX_PATH) throw new Error(`archive path longer than ${MAX_PATH} characters`);
    if (this.claimed.has(path)) throw new Error(`archive path written twice: ${path}`);
    this.claimed.add(path);
    return path;
  }

  private async writeObject(relative: string, contentType: string, produce: (emit: (text: string) => Promise<void>) => Promise<void>): Promise<void> {
    this.checkpoint();
    const path = this.claim(relative);
    const key = `${this.request.storage.prefix}${relative}`;
    const body = new PassThrough();
    const hash = createHash("sha256");
    let size = 0;
    let pending: string[] = [];
    let pendingBytes = 0;

    const upload = this.store.put(key, body, contentType);
    // Settles as soon as the upload fails, so a writer blocked on "drain" is released.
    const failed = upload.then(
      () => new Promise<never>(() => undefined),
      (err: unknown) => Promise.reject(err),
    );
    failed.catch(() => undefined);

    const flush = async (): Promise<void> => {
      if (pending.length === 0) return;
      const chunk = Buffer.from(pending.join(""), "utf8");
      pending = [];
      pendingBytes = 0;
      hash.update(chunk);
      size += chunk.length;
      if (!body.write(chunk)) await Promise.race([once(body, "drain"), failed]);
    };
    const emit = async (text: string): Promise<void> => {
      this.checkpoint();
      pending.push(text);
      pendingBytes += text.length;
      if (pendingBytes >= FLUSH_BYTES) await flush();
    };

    try {
      await produce(emit);
      await flush();
      body.end();
      await upload;
    } catch (err) {
      body.destroy();
      await upload.catch(() => undefined);
      throw err;
    }
    this.files.push({ path, key, size, sha256: hash.digest("hex"), contentType });
  }
}

/** RFC 4180 field. Values are written as they are stored: the archive is data, not a report. */
export function csvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/u.test(text) || text !== text.trim() ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Turns a stored file name into a safe path segment: no separator, no control character, at most
 * `max` characters with the extension kept. Accents and spaces are kept (the schema allows them).
 */
export function safeFileName(name: string, max = 120): string {
  let cleaned = name
    // eslint-disable-next-line no-control-regex -- control characters are what this removes
    .replace(/[\\/\x00-\x1f\x7f]+/gu, "_")
    .trim()
    .replace(/^\.+/u, "")
    .replace(/[. ]+$/u, "");
  if (cleaned === "") cleaned = "file";
  if (cleaned.length <= max) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  const extension = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : "";
  return `${cleaned.slice(0, max - extension.length)}${extension}`;
}
