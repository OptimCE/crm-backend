import { Readable } from "node:stream";
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { ExportStorageSettings } from "../../../shared/export/kit/s3-part-store.js";
import type { PartStore } from "../../../shared/export/kit/part-store.js";

/** The object a part points at does not exist. */
export class ObjectNotFoundError extends Error {
  constructor(
    readonly bucket: string,
    readonly key: string,
  ) {
    super(`no object ${bucket}/${key}`);
    this.name = "ObjectNotFoundError";
  }
}

/**
 * What the worker reads and writes in storage, through the export-worker account: it reads any
 * object of the exports bucket and of the document buckets, writes only archives/, and deletes
 * in the exports bucket.
 */
export interface ExportObjectStore {
  /** A stream of the object. Rejects with ObjectNotFoundError when there is none. */
  open(bucket: string, key: string): Promise<Readable>;
  /** Streams `body` to `key` in the exports bucket (multipart). */
  upload(key: string, body: Readable, contentType: string): Promise<void>;
  /** Deletes every object under `prefix` in the exports bucket. */
  deletePrefix(prefix: string): Promise<number>;
}

const PART_SIZE = 5 * 1024 * 1024;

export class S3ExportObjectStore implements ExportObjectStore {
  private readonly client: S3Client;

  /** `client` replaces the one built from `settings`: a test passes an S3Client answered in process. */
  constructor(
    private readonly settings: ExportStorageSettings,
    client?: S3Client,
  ) {
    this.client =
      client ??
      new S3Client({
        endpoint: settings.endpoint,
        region: settings.region,
        forcePathStyle: true,
        credentials: { accessKeyId: settings.accessKey, secretAccessKey: settings.secretKey },
      });
  }

  async open(bucket: string, key: string): Promise<Readable> {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.Body) return Readable.from([]);
      return object.Body as Readable;
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === "NoSuchKey") throw new ObjectNotFoundError(bucket, key);
      throw err;
    }
  }

  async upload(key: string, body: Readable, contentType: string): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.settings.bucket, Key: key, Body: body, ContentType: contentType },
      partSize: PART_SIZE,
      queueSize: 2,
      leavePartsOnError: false,
    });
    await upload.done();
  }

  async deletePrefix(prefix: string): Promise<number> {
    let deleted = 0;
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.settings.bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }),
      );
      const keys = (page.Contents ?? []).map((o) => o.Key).filter((k): k is string => typeof k === "string");
      if (keys.length > 0) {
        const result = await this.client.send(
          new DeleteObjectsCommand({ Bucket: this.settings.bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }),
        );
        if (result.Errors && result.Errors.length > 0) {
          throw new Error(`delete of ${result.Errors.length} object(s) under ${prefix} failed: ${result.Errors[0]?.Code ?? "unknown"}`);
        }
        deleted += keys.length;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return deleted;
  }

  destroy(): void {
    this.client.destroy();
  }
}

/**
 * One in-memory storage for the services' parts AND the worker, as in a test: the services write
 * through `PartStore` (exports bucket), the worker reads parts and documents and writes archives.
 */
export class MemoryExportStorage implements ExportObjectStore, PartStore {
  readonly buckets = new Map<string, Map<string, Buffer>>();
  /** Makes the next n uploads fail, then succeed: an assembly that has to be retried. */
  failUploads = 0;

  constructor(private readonly exportsBucket = "exports") {}

  private bucket(name: string): Map<string, Buffer> {
    let bucket = this.buckets.get(name);
    if (!bucket) {
      bucket = new Map();
      this.buckets.set(name, bucket);
    }
    return bucket;
  }

  putObject(bucket: string, key: string, body: Buffer | string): void {
    this.bucket(bucket).set(key, Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8"));
  }

  object(bucket: string, key: string): Buffer | undefined {
    return this.buckets.get(bucket)?.get(key);
  }

  keys(bucket = this.exportsBucket, prefix = ""): string[] {
    return [...(this.buckets.get(bucket)?.keys() ?? [])].filter((k) => k.startsWith(prefix)).sort();
  }

  // PartStore (the services).
  async put(key: string, body: Readable): Promise<void> {
    this.putObject(this.exportsBucket, key, await collect(body));
  }

  async get(key: string): Promise<Buffer | undefined> {
    return this.object(this.exportsBucket, key);
  }

  // ExportObjectStore (the worker).
  async open(bucket: string, key: string): Promise<Readable> {
    const body = this.object(bucket, key);
    if (!body) throw new ObjectNotFoundError(bucket, key);
    // Small chunks, as a real download would arrive.
    const chunks: Buffer[] = [];
    for (let i = 0; i < body.length; i += 16 * 1024) chunks.push(body.subarray(i, i + 16 * 1024));
    return Readable.from(chunks.length > 0 ? chunks : [Buffer.alloc(0)]);
  }

  async upload(key: string, body: Readable): Promise<void> {
    if (this.failUploads > 0) {
      this.failUploads--;
      body.resume();
      throw new Error("storage unavailable");
    }
    // As strict as lib-storage's Upload, which takes a numeric `Body.size` for the body's length.
    const declared = (body as unknown as { size?: unknown }).size;
    const bytes = await collect(body);
    if (typeof declared === "number" && declared !== bytes.length) {
      throw new Error(`Expected a body of ${declared} bytes (Body.size) but read ${bytes.length}`);
    }
    this.putObject(this.exportsBucket, key, bytes);
  }

  async deletePrefix(prefix: string): Promise<number> {
    const bucket = this.bucket(this.exportsBucket);
    let count = 0;
    for (const key of [...bucket.keys()]) {
      if (key.startsWith(prefix)) {
        bucket.delete(key);
        count++;
      }
    }
    return count;
  }
}

async function collect(body: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  return Buffer.concat(chunks);
}
