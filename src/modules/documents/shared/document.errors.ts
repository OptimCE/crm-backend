import {GLOBAL_ERRORS, LocalError} from "../../../shared/errors/errors.js";
// Erros range: 20000 - 29999
export const DOCUMENT_ERRORS = {
    ...GLOBAL_ERRORS,
    DELETE_DOCUMENT:{
        STORAGE_SERVICE_DELETE: new LocalError(20000, "document:delete_document.storage_service_delete"),
        DATABASE_DELETE: new LocalError(20001, "document:delete_document.database_delete"),
    },
    DOWNLOAD_DOCUMENT:{
      DOCUMENT_NOT_FOUND: new LocalError(20002, "document:download_document.document_not_found"),
    },
    UPLOAD_DOCUMENT: {
        STORAGE_SERVICE_UPLOAD: new LocalError(20003, "document:upload_document.storage_service_upload"),
        DATABASE_UPLOAD: new LocalError(20004, "document:upload_document.database_upload"),
    },
    VALIDATION:{
        UPLOAD_DOCUMENT:{
            FILE_TOO_BIG: new LocalError(25000, "document:validation.upload_document.file_too_big"),
        }
    }
}