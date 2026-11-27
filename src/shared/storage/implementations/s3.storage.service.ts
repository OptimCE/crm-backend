import { injectable } from "inversify";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import config from "config";
import type { IStorageService } from "../i-storage.service.js";
import { UploadedDocument } from "../storage.dtos.js";
import logger from "../../monitor/logger.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { GLOBAL_ERRORS } from "../../errors/errors.js";

/** A value that is a URL (scheme://…), not an object key. */
const EXTERNAL_URL = /^[a-z][a-z0-9+.-]*:\/\//iu;

@injectable()
export class S3StorageService implements IStorageService {
  private client: S3Client;
  private publicClient: S3Client;
  readonly bucket: string;

  constructor() {
    const endpoint: string = config.get("storage_service.settings.endpoint");
    const publicEndpoint: string = config.get("storage_service.settings.public_endpoint") || endpoint;
    const region: string = config.get("storage_service.settings.region");
    const accessKey: string = config.get("storage_service.settings.access_key");
    const secretKey: string = config.get("storage_service.settings.secret_key");
    this.bucket = config.get("storage_service.settings.bucket");

    const clientConfig = {
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    };

    this.client = new S3Client({ ...clientConfig, endpoint });
    this.publicClient = new S3Client({ ...clientConfig, endpoint: publicEndpoint });
  }

  async getDocumentUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.publicClient, command, { expiresIn: 900 });
    } catch (err) {
      logger.error({ operation: "getDocumentUrl", error: err }, "Failed to generate presigned URL");
      throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
    }
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadedDocument> {
    const key = `documents/${randomUUID()}-${file.originalname}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      return { url: key, file_type: file.mimetype };
    } catch (err) {
      logger.error({ operation: "uploadDocument", error: err }, "Failed to upload document to S3");
      throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
    }
  }

  async stat(key: string): Promise<{ size: number; contentType: string | null } | null> {
    // Some rows hold a URL instead of a key of ours (an external logo, old seed data): there is
    // no stored object to read, and MinIO answers such a "key" with a bodiless 400.
    if (!key || EXTERNAL_URL.test(key)) return null;
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? null };
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number }; name?: string }).$metadata?.httpStatusCode;
      // 404: no such object; 400: a key the store refuses as such. A 403 is a misconfigured
      // account and stays an error.
      if (status === 404 || status === 400 || (err as { name?: string }).name === "NotFound") return null;
      throw err;
    }
  }

  async deleteDocument(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      logger.error({ operation: "deleteDocument", error: err }, "Failed to delete document from S3");
      throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
    }
  }

  async ping(timeoutMs: number): Promise<void> {
    try {
      // HeadBucket proves what an upload needs - the endpoint answers, accepts the
      // credentials and holds the bucket - and touches no document.
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }), { abortSignal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      // A HEAD reply has no body, so the SDK reports a missing bucket (404) and a refused
      // credential (403) alike as message "UnknownError" (measured against MinIO): the
      // status is the useful part. An abort can only be the deadline above.
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      let reason: string;
      if (status !== undefined) {
        reason = `HTTP ${status}`;
      } else if (err instanceof Error && err.name === "AbortError") {
        reason = `no answer within ${timeoutMs} ms`;
      } else {
        reason = err instanceof Error ? err.message : "Unknown error";
      }
      throw new Error(`HeadBucket ${this.bucket}: ${reason}`, { cause: err });
    }
  }
}
