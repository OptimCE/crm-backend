import type { QueryRunner } from "typeorm";
import type { DocumentDTO, DocumentQueryDTO } from "../api/document.dtos.js";
import type { Document } from "./document.models.js";
export interface IDocumentRepository {
  deleteDocument(document_id: number, query_runner?: QueryRunner): Promise<Document | null>;
  getDocumentByIdNIdMember(document_id: number, member_id: string, query_runner?: QueryRunner): Promise<Document | null>;
  getDocumentById(document_id: number, query_runner?: QueryRunner): Promise<Document | null>;
  getDocuments(member_id: number, query: DocumentQueryDTO, query_runner?: QueryRunner): Promise<[Document[], number]>;
  saveDocument(new_document: DocumentDTO, query_runner?: QueryRunner): Promise<Document>;
}
