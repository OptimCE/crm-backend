import { injectable } from "inversify";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import config from "config";
import type { IStorageService } from "../i-storage.service.js";
import { UploadedDocument } from "../storage.dtos.js";
import logger from "../../monitor/logger.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { GLOBAL_ERRORS } from "../../errors/errors.js";

@injectable()
export class S3StorageService implements IStorageService {
  private client: S3Client;
  private publicClient: S3Client;
  private bucket: string;

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
}
