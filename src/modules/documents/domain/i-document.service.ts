import type { DocumentExposedDTO, DocumentQueryDTO, DownloadDocument, UploadDocumentDTO } from "../api/document.dtos.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";

/**
 * Interface for Document Service.
 * Defines the contract for document management operations.
 */
export interface IDocumentService {
  /**
   * Retrieves a paginated list of documents.
   * @param member_id - ID of the member.
   * @param queryObject - Query filters and sorting options.
   * @returns A tuple of DocumentExposedDTO[] and Pagination.
   */
  getDocuments(member_id: number, queryObject: DocumentQueryDTO): Promise<[DocumentExposedDTO[], Pagination]>;
  /**
   * Downloads a document by ID.
   * @param document_id - ID of the document.
   * @returns The document content, filename, and type.
   */
  downloadDocument(document_id: number): Promise<DownloadDocument>;
  /**
   * Uploads a new document.
   * @param upload_data - DTO containing file and metadata.
   */
  uploadDocument(upload_data: UploadDocumentDTO): Promise<void>;
  /**
   * Deletes a document by ID.
   * @param document_id - ID of the document to delete.
   */
  deleteDocument(document_id: number): Promise<void>;
}
