import { inject, injectable } from "inversify";
import type { IDocumentService } from "../domain/i-document.service.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IDocumentRepository } from "../domain/i-document.repository.js";
import {
    DocumentDTO,
    DocumentExposedDTO,
    DocumentQueryDTO,
    DownloadDocument,
    UploadDocumentDTO
} from "../api/document.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { IStorageService } from "../../../shared/storage/i-storage.service.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { QueryRunner } from "typeorm";
import { Document } from "../domain/document.models.js";
import { toDocumentExposed } from "../shared/to_dto.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { UploadedDocument } from "../../../shared/storage/storage.dtos.js";
import { DOCUMENT_ERRORS } from "../shared/document.errors.js";
/**
 * Implementation of Document Service.
 * Orchestrates database operations and storage service interactions for documents.
 */
@injectable()
export class DocumentService implements IDocumentService {
    constructor(@inject("DocumentRepository") private documentRepository: IDocumentRepository,
        @inject("StorageService") private storageService: IStorageService,
        @inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {
    }

    /**
     * Deletes a document.
     * Deletes from DB first (transactional), then from storage.
     * @param document_id - ID of the document.
     * @param query_runner - Internal query runner.
     * @throws AppError if DB deletion or Storage deletion fails.
     */
    @Transactional()
    async deleteDocument(document_id: number, query_runner?: QueryRunner): Promise<void> {
        // Delete document from database
        const deleted_document: Document | null = await this.documentRepository.deleteDocument(document_id, query_runner);
        if (!deleted_document) {
            logger.error({ operation: 'deleteDocument' }, `Document ${document_id} not deleted from database`);
            throw new AppError(DOCUMENT_ERRORS.DELETE_DOCUMENT.DATABASE_DELETE, 400);
        }
        // Delete document from storage service
        try {
            await this.storageService.deleteDocument(deleted_document.file_url);
        }
        catch (err) {
            logger.error({ operation: 'deleteDocument', error: err }, `Document ${document_id} not deleted from storage service`);
            throw new AppError(DOCUMENT_ERRORS.DELETE_DOCUMENT.STORAGE_SERVICE_DELETE, 400);
        }
    }

    /**
     * Downloads a document.
     * Retrieves metadata from DB, then fetches stream/buffer from storage.
     * @param document_id - ID of the document.
     * @returns DownloadDocument object.
     * @throws AppError if document not found in DB.
     */
    async downloadDocument(document_id: number): Promise<DownloadDocument> {
        // Retrieve entry from database
        const document: Document | null = await this.documentRepository.getDocumentById(document_id);
        if (!document) {
            logger.error({ operation: 'downloadDocument' }, `Document ${document_id} not found`);
            throw new AppError(DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND, 400);
        }
        // Download documents from storage service
        const result = await this.storageService.getDocument(document.file_url);
        return {
            document: result,
            fileName: document.file_name,
            fileType: document.file_type,
        }
    }

    /**
     * Lists documents for a member.
     * @param member_id - ID of the member.
     * @param query - Query parameters.
     * @returns Tuple of [DocumentExposedDTO[], Pagination].
     */
    async getDocuments(member_id: number, query: DocumentQueryDTO): Promise<[DocumentExposedDTO[], Pagination]> {
        const [values, total]: [Document[], number] = await this.documentRepository.getDocuments(member_id, query);
        const return_values = values.map((value) => toDocumentExposed(value))
        const total_pages = Math.ceil(total / query.limit);
        return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }]
    }

    /**
     * Uploads a document.
     * Uploads to storage first, then saves metadata to DB.
     * Handles rollback (deletes from storage) if DB save fails.
     * @param upload_data - Upload data including file.
     * @param query_runner - Internal query runner.
     * @throws AppError if upload or DB save fails.
     */
    @Transactional()
    async uploadDocument(upload_data: UploadDocumentDTO, query_runner?: QueryRunner): Promise<void> {
        // Upload to storage service
        let result: UploadedDocument
        try {
            result = await this.storageService.uploadDocument(upload_data.file);
        }
        catch (err) {
            logger.error({ operation: "uploadDocument", error: err }, "An error occurred while uploading file to storage service");
            throw new AppError(DOCUMENT_ERRORS.UPLOAD_DOCUMENT.STORAGE_SERVICE_UPLOAD, 400);
        }
        // Add row to database
        const new_document: DocumentDTO = {
            upload_date: new Date(),
            file_type: result.file_type,
            member_id: upload_data.id_member,
            file_size: upload_data.file.size,
            file_name: upload_data.file.originalname,
            file_url: result.url,
            id: -1
        }
        try {
            await this.documentRepository.saveDocument(new_document, query_runner);
        }
        catch (err) {
            logger.error({ operation: "uploadDocument", error: err }, "An error occurred while adding a new row in the datbaase");
            try {
                await this.storageService.deleteDocument(result.url);
            }
            catch (err) {
                logger.error({ operation: 'uploadDocument', error: err }, `Document not deleted from storage service`);
            }
            throw new AppError(DOCUMENT_ERRORS.UPLOAD_DOCUMENT.DATABASE_UPLOAD, 400);
        }
    }


}