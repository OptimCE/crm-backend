import type { Readable } from "node:stream";
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { PartStore } from "./part-store.js";

/**
 * The export credentials of one service. They are NOT the service's usual storage account: the
 * `export-<service>` MinIO user may only write, read and delete under `parts/*\/<service>/`.
 */
export interface ExportStorageSettings {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

const PART_SIZE = 5 * 1024 * 1024;

/**
 * S3/MinIO implementation. `put` is a multipart upload fed by the stream, so memory stays at about
 * `queueSize × partSize` (2 × 5 MiB) whatever the size of the file.
 */
export class S3PartStore implements PartStore {
  private readonly client: S3Client;

  constructor(private readonly settings: ExportStorageSettings) {
    this.client = new S3Client({
      endpoint: settings.endpoint,
      region: settings.region,
      forcePathStyle: true,
      credentials: { accessKeyId: settings.accessKey, secretAccessKey: settings.secretKey },
    });
  }

  async put(key: string, body: Readable, contentType: string): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.settings.bucket, Key: key, Body: body, ContentType: contentType },
      partSize: PART_SIZE,
      queueSize: 2,
      leavePartsOnError: false,
    });
    await upload.done();
  }

  async get(key: string): Promise<Buffer | undefined> {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.settings.bucket, Key: key }));
      return object.Body ? Buffer.from(await object.Body.transformToByteArray()) : Buffer.alloc(0);
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === "NoSuchKey") return undefined;
      throw err;
    }
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

/** Reads the export storage settings of a service from its environment (EXPORT_STORAGE_*). */
export function exportStorageSettingsFromEnv(env: NodeJS.ProcessEnv = process.env): ExportStorageSettings {
  const endpoint = env.EXPORT_STORAGE_ENDPOINT ?? env.STORAGE_ENDPOINT ?? "";
  const accessKey = env.EXPORT_STORAGE_ACCESS_KEY ?? "";
  const secretKey = env.EXPORT_STORAGE_SECRET_KEY ?? "";
  const missing = [
    ["EXPORT_STORAGE_ENDPOINT", endpoint],
    ["EXPORT_STORAGE_ACCESS_KEY", accessKey],
    ["EXPORT_STORAGE_SECRET_KEY", secretKey],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new Error(`export storage is not configured: ${missing.join(", ")} missing`);
  return {
    endpoint,
    accessKey,
    secretKey,
    region: env.EXPORT_STORAGE_REGION ?? env.STORAGE_REGION ?? "us-east-1",
    bucket: env.EXPORT_BUCKET ?? "exports",
  };
}
