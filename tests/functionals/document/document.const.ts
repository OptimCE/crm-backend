import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { DOCUMENT_ERRORS } from "../../../src/modules/documents/shared/document.errors.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";

// --- Mock Data Constants (Seeded in init.sql) ---
export const existingDocumentId = 1;
export const notExistingDocumentId = 99;
export const existingMemberId = 1;

// --- Test Cases ---

// 1. Get Documents
export const testCasesGetDocuments = [
  {
    description: "Success - List Documents for Member",
    member_id: existingMemberId,
    query: {},
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => {
      return data.length === 1 && (data[0] as { id: number }).id === existingDocumentId;
    },
  },
  {
    description: "Success - Filter by Filename",
    member_id: existingMemberId,
    query: { file_name: "doc" }, // 'doc.pdf' in seed
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 1,
  },
  {
    description: "Success - Filter by Filename (No match)",
    member_id: existingMemberId,
    query: { file_name: "nonexistent" },
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown[]): boolean => data.length === 0,
  },
];

// 2. Download Document
export const testCasesDownload = [
  {
    description: "Success Download",
    document_id: existingDocumentId,
    document_member_id: existingMemberId, // Param for route is :member_id/:document_id usually, wait checking controller...
    // Controller: /documents/:member_id/:document_id  -> Wait, trace says /documents/:member_id/:document_id
    // But logic uses document_id? Let's check controller code again.
    // Controller line 27: this.documentService.downloadDocument(+req.params.document_id)
    // Controller route definition: @traceSpan("downloadDocument", { url: "/documents/:member_id/:document_id", method: "get" })
    // It seems member_id is in URL but maybe unused in service Logic?
    // Service typically validates if doc belongs to member? Not visible in controller snippet, but likely.

    orgs: ORGS_ADMIN,
    status_code: 200,
    is_binary: true,
    mocks: {
      storageService: {
        getDocument: jest.fn(() => Promise.resolve(Buffer.from("mock-file-content"))),
      },
    },
  },
  {
    description: "Fail - Document Not Found",
    document_id: 999,
    document_member_id: existingMemberId,
    orgs: ORGS_ADMIN,
    status_code: 400, // Service typically throws AppError
    expected_error_code: DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND.errorCode,
    mocks: {
      storageService: {
        getDocument: jest.fn(() => Promise.resolve(Buffer.from(""))),
      },
    },
  },
];

// 3. Upload Document
export const testCasesUpload = [
  {
    description: "Success Upload",
    field_member: existingMemberId.toString(),
    file_name: "new_func_test.pdf",
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      storageService: {
        uploadDocument: jest.fn(() =>
          Promise.resolve({
            url: "http://storage/new_func_test.pdf",
            file_type: "application/pdf",
          }),
        ),
      },
    },
  },
];

// 4. Delete Document
export const testCasesDelete = [
  {
    description: "Success Delete",
    document_id: existingDocumentId, // We delete the seeded one
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      storageService: {
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
  {
    description: "Fail - Already Deleted / Not Found",
    document_id: notExistingDocumentId, // Tried to delete again
    orgs: ORGS_ADMIN,
    status_code: 400, // Controller/Repo returns null/error if not found
    expected_error_code: DOCUMENT_ERRORS.DELETE_DOCUMENT.DATABASE_DELETE.errorCode, // Expected fail
    mocks: {
      storageService: {
        deleteDocument: jest.fn(() => Promise.resolve()),
      },
    },
  },
];
