import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { Document } from "../../../src/modules/documents/domain/document.models.js";
import { toDocumentExposed } from "../../../src/modules/documents/shared/to_dto.js";
import { DOCUMENT_ERRORS } from "../../../src/modules/documents/shared/document.errors.js";
import { ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

// --- Mock Data ---

export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockDocumentEntity: Document = {
  id: 100,
  member: { id: 1 } as any, // Simplified member
  community: { id: 1 } as any, // Simplified community
  file_name: "test_report.pdf",
  file_url: "http://storage.com/bucket/test_report.pdf",
  file_size: 1024,
  file_type: "application/pdf",
  upload_date: mockDate,
  created_at: mockDate,
  updated_at: mockDate,
};

export const mockDocumentExposed = toDocumentExposed(mockDocumentEntity);

// Create a JSON-compatible version where Date objects are strings
export const mockDocumentExposedJSON = JSON.parse(JSON.stringify(mockDocumentExposed));

export const mockDocumentBuffer = Buffer.from("fake-pdf-content");

export const mockUploadDTO = {
  id_member: 1,
  // File is handled specially in supertest
};

// --- Test Cases Data ---

export const testCasesGetDocuments = [
  {
    description: "Success (Gestionnaire)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    member_id: 1,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [mockDocumentExposedJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      documentRepo: {
        getDocuments: jest.fn(() => Promise.resolve([[mockDocumentEntity], 1])),
      },
    },
  },
  {
    description: "Success (Empty List)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    member_id: 1,
    query: {},
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: [],
    expected_pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    mocks: {
      documentRepo: {
        getDocuments: jest.fn(() => Promise.resolve([[], 0])),
      },
    },
  },
  {
    description: "Fail (Role Insufficient - Member)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_MEMBER,
    member_id: 1,
    query: {},
    status_code: 403,
    expected_error_code: DOCUMENT_ERRORS.UNAUTHORIZED.errorCode,
    expected_data: DOCUMENT_ERRORS.UNAUTHORIZED.message,
    mocks: {},
  },
  {
    description: "Fail (Auth Missing)",
    id_user: "",
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    member_id: 1,
    query: {},
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.UNAUTHENTICATED.errorCode,
    expected_data: DOCUMENT_ERRORS.UNAUTHENTICATED.message,
    mocks: {},
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    member_id: 1,
    query: {},
    status_code: 500,
    expected_error_code: DOCUMENT_ERRORS.EXCEPTION.errorCode,
    expected_data: DOCUMENT_ERRORS.EXCEPTION.message,
    mocks: {
      documentRepo: {
        getDocuments: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

export const testCasesDownload = [
  {
    description: "Success Download",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 100,
    status_code: 200,
    is_binary: true,
    mocks: {
      documentRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        getDocument: jest.fn(() => Promise.resolve(mockDocumentBuffer)),
      },
    },
  },
  {
    description: "Fail (Document Not Found in DB)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 999,
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND.errorCode,
    expected_data: DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND.message,
    mocks: {
      documentRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (Storage Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 100,
    status_code: 500, // Or 500 depending on how app handles it, but service throws AppError(DOCUMENT_ERRORS.EXCEPTION, 400) usually
    expected_error_code: DOCUMENT_ERRORS.EXCEPTION.errorCode,
    expected_data: DOCUMENT_ERRORS.EXCEPTION.message,
    mocks: {
      documentRepo: {
        getDocumentById: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        getDocument: jest.fn(() => Promise.reject(new Error("Storage Error"))),
      },
    },
  },
];

export const testCasesUpload = [
  {
    description: "Success Upload",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    field_member: "1",
    file_name: "test.pdf",
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      storageService: {
        uploadDocument: jest.fn(() =>
          Promise.resolve({
            url: "http://storage/test.pdf",
            file_type: "application/pdf",
          }),
        ),
      },
      documentRepo: {
        saveDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail (Storage Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    field_member: "1",
    file_name: "test.pdf",
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.UPLOAD_DOCUMENT.STORAGE_SERVICE_UPLOAD.errorCode,
    expected_data: DOCUMENT_ERRORS.UPLOAD_DOCUMENT.STORAGE_SERVICE_UPLOAD.message,
    mocks: {
      storageService: {
        uploadDocument: jest.fn(() => Promise.reject(new Error("S3 Error"))),
      },
    },
  },
  {
    description: "Fail (DB Error after Upload)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    field_member: "1",
    file_name: "test.pdf",
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.UPLOAD_DOCUMENT.DATABASE_UPLOAD.errorCode,
    expected_data: DOCUMENT_ERRORS.UPLOAD_DOCUMENT.DATABASE_UPLOAD.message,
    mocks: {
      storageService: {
        uploadDocument: jest.fn(() =>
          Promise.resolve({
            url: "http://storage/test.pdf",
            file_type: "application/pdf",
          }),
        ),
      },
      documentRepo: {
        saveDocument: jest.fn(() => Promise.reject(new Error("DB Error"))),
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
];

export const testCasesDelete = [
  {
    description: "Success Delete",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 100,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      documentRepo: {
        deleteDocument: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail (Not Found in DB)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 999,
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.DELETE_DOCUMENT.DATABASE_DELETE.errorCode,
    expected_data: DOCUMENT_ERRORS.DELETE_DOCUMENT.DATABASE_DELETE.message,
    mocks: {
      documentRepo: {
        deleteDocument: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 100,
    status_code: 500,
    expected_error_code: DOCUMENT_ERRORS.EXCEPTION.errorCode,
    expected_data: DOCUMENT_ERRORS.EXCEPTION.message,
    mocks: {
      documentRepo: {
        deleteDocument: jest.fn(() => Promise.reject(new Error("DB Exception"))),
      },
    },
  },
  {
    description: "Fail (Storage Delete Error)",
    id_user: 1,
    id_community: 1,
    orgs: ORGS_GESTIONNAIRE,
    document_id: 100,
    status_code: 400,
    expected_error_code: DOCUMENT_ERRORS.DELETE_DOCUMENT.STORAGE_SERVICE_DELETE.errorCode,
    expected_data: DOCUMENT_ERRORS.DELETE_DOCUMENT.STORAGE_SERVICE_DELETE.message,
    mocks: {
      documentRepo: {
        deleteDocument: jest.fn(() => Promise.resolve(mockDocumentEntity)),
      },
      storageService: {
        deleteDocument: jest.fn(() => Promise.reject(new Error("Storage Fail"))),
      },
    },
  },
];
