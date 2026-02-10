import { UploadedDocument } from "./storage.dtos.js";

/**
 * Interface for File Storage Service.
 * Handles uploading, retrieving, and deleting documents.
 */
export interface IStorageService {
  /**
   * Retrieves a document's content as a buffer.
   * @param url - The URL/path of the document.
   * @returns Buffer containing the file data.
   */
  getDocument(url: string): Promise<Buffer>;

  /**
   * Uploads a file to the storage provider.
   * @param file - The file object (from Multer).
   * @returns Metadata of the uploaded document.
   */
  uploadDocument(file: Express.Multer.File): Promise<UploadedDocument>;

  /**
   * Deletes a document from storage.
   * @param url - The URL/path of the document to delete.
   */
  deleteDocument(url: string): Promise<void>;
}
