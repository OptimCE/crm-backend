import { inject, injectable } from "inversify";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { IDocumentService } from "../domain/i-document.service.js";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated, Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { DocumentExposedDTO, DocumentQueryDTO, DownloadDocument, UploadDocumentDTO } from "./document.dtos.js";
const documentControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

/**
 * Controller responsible for document management.
 * Handles uploading, downloading, listing, and deleting documents.
 */
@injectable()
export class DocumentController {
  constructor(@inject("DocumentService") private readonly documentService: IDocumentService) {}

  /**
   * Retrieves a paginated list of documents for a specific member.
   * @param req - Express request object. Params: member_id. Query: DocumentQueryDTO.
   * @param res - Express response object. Returns a paginated list of DocumentExposedDTO.
   * @param _next - Express next middleware function.
   */
  @documentControllerTraceDecorator.traceSpan("getDocuments", { url: "/documents/:member_id", method: "get" })
  async getDocuments(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(DocumentQueryDTO, req.query);
    const [result, pagination]: [DocumentExposedDTO[], Pagination] = await this.documentService.getDocuments(+req.params.member_id, queryObject);
    logger.info("Document list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<DocumentExposedDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Downloads a specific document.
   * @param req - Express request object. Params: document_id.
   * @param res - Express response object. Returns the file binary with appropriate headers.
   * @param _next - Express next middleware function.
   */
  @documentControllerTraceDecorator.traceSpan("downloadDocument", { url: "/documents/:member_id/:document_id", method: "get" })
  async downloadDocument(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: DownloadDocument = await this.documentService.downloadDocument(+req.params.document_id);
    logger.info("Document successfully retrieved");
    res.set({
      "Content-Type": result.fileType,
      "Content-Disposition": "attachment; filename=" + result.fileName,
      "Content-Length": result.document.length,
    });
    res.send(result.document);
  }

  /**
   * Uploads a new document.
   * @param req - Express request object. Body + File (multipart/form-data). Validated against UploadDocumentDTO.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @documentControllerTraceDecorator.traceSpan("uploadDocument", { url: "/documents", method: "post" })
  async uploadDocument(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const payload = {
      ...req.body,
      file: req.file,
    };
    const upload_data = await validateDto(UploadDocumentDTO, payload);
    await this.documentService.uploadDocument(upload_data);
    logger.info("Document successfully uploaded");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
  /**
   * Deletes a document.
   * @param req - Express request object. Params: document_id.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @documentControllerTraceDecorator.traceSpan("deleteDocument", { url: "/documents/:document_id", method: "delete" })
  async deleteDocument(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.documentService.deleteDocument(+req.params.document_id);
    logger.info("Document successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
