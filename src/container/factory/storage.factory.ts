import config from "config";
import { container } from "../di-container.js";
import type { IStorageService } from "../../shared/storage/i-storage.service.js";
import { OpenfileStorageService } from "../../shared/storage/implementations/openfile.storage.service.js";

/**
 * Initializes the Storage Service.
 * Reads configuration to determine which storage provider to use (e.g., OPENFILES)
 * and binds the appropriate implementation to the DI container.
 * @throws Error if configuration or settings are missing/invalid.
 */
export function initializeStorageService(): void {
  const storage_service: string|null = config.get<string>("storage_service.name");
  if (storage_service === null) {
    throw new Error("Missing storage_service.name");
  }
  switch (storage_service.toUpperCase()) {
    case "OPENFILES": {
      const settings: {
        token: string;
        db_name: string;
        target: string;
      } = config.get("storage_service.settings");
      if (!settings) {
        throw new Error("Missing settings.");
      }
      if (!settings.token || !settings.db_name || !settings.target) {
        throw new Error("Incorrect iam_service.settings");
      }
      container.bind<IStorageService>("StorageService").to(OpenfileStorageService);
      break;
    }
    default: {
      throw new Error("Unknown storage service name");
    }
  }
}
