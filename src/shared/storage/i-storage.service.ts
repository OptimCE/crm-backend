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
   * The size and type of a stored document, without reading it, or null when there is no such
   * object. The data export lists a document only by reference, and a reference to a missing
   * object would fail every export of its community.
   * @param key - The storage key/path of the document.
   */
  stat(key: string): Promise<{ size: number; contentType: string | null } | null>;

  /** The bucket documents are stored in (what an export reference names). */
  readonly bucket: string;

  /**
   * Checks that the provider answers and holds the configured bucket, without reading or
   * writing a document. Used by GET /health.
   * @param timeoutMs - How long to wait for an answer.
   * @throws Error naming the reason when it does not.
   */
  ping(timeoutMs: number): Promise<void>;
}
