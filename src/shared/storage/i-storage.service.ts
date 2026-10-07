import type { UploadedDocument } from "./storage.dtos.js";

/**
 * Interface for File Storage Service.
 * Handles uploading, retrieving, and deleting documents.
 */
export interface IStorageService {
  /**
   * Generates a presigned URL to download a document.
   * @param key - The storage key/path of the document.
   * @returns A presigned URL string for direct client download.
   */
  getDocumentUrl(key: string): Promise<string>;

  /**
   * Uploads a file to the storage provider.
   * @param file - The file object (from Multer).
   * @returns Metadata of the uploaded document.
   */
  uploadDocument(file: Express.Multer.File): Promise<UploadedDocument>;

  /**
   * Deletes a document from storage.
   * @param key - The storage key/path of the document to delete.
   */
  deleteDocument(key: string): Promise<void>;

  /**
   * Checks that the provider answers and holds the configured bucket, without reading or
   * writing a document. Used by GET /health.
   * @param timeoutMs - How long to wait for an answer.
   * @throws Error naming the reason when it does not.
   */
  ping(timeoutMs: number): Promise<void>;
}
