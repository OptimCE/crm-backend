import config from "config";
import { container } from "../di-container.js";
import type { IStorageService } from "../../shared/storage/i-storage.service.js";
import { S3StorageService } from "../../shared/storage/implementations/s3.storage.service.js";

/**
 * Initializes the Storage Service.
 * Reads configuration to determine which storage provider to use (e.g., S3/MinIO)
 * and binds the appropriate implementation to the DI container.
 * @throws Error if configuration or settings are missing/invalid.
 */
export function initializeStorageService(): void {
  const storage_service: string | null = config.get<string>("storage_service.name");
  if (storage_service === null) {
    throw new Error("Missing storage_service.name");
  }
  switch (storage_service.toUpperCase()) {
    case "S3":
    case "MINIO": {
      const settings: {
        endpoint: string;
        region: string;
        bucket: string;
        access_key: string;
        secret_key: string;
      } = config.get("storage_service.settings");
      if (!settings) {
        throw new Error("Missing settings.");
      }
      if (!settings.endpoint || !settings.region || !settings.bucket || !settings.access_key || !settings.secret_key) {
        throw new Error("Incorrect storage_service.settings");
      }
      container.bind<IStorageService>("StorageService").to(S3StorageService);
      break;
    }
    default: {
      throw new Error("Unknown storage service name");
    }
  }
}
