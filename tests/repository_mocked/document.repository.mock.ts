import { jest } from "@jest/globals";
import type { IDocumentRepository } from "../../src/modules/documents/domain/i-document.repository.js";

export function createMockDocumentRepository(): jest.Mocked<IDocumentRepository> {
  return {
    deleteDocument: jest.fn(),
    getDocumentById: jest.fn(),
    getDocumentByIdNIdMember: jest.fn(),
    getDocuments: jest.fn(),
    saveDocument: jest.fn(),
  };
}
