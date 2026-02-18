import { Expose, Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsFile, MaxFileSize } from "../../../shared/dtos/file.validators.js";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import type { Sort } from "../../../shared/dtos/query.dtos.js";
import { DOCUMENT_ERRORS } from "../shared/document.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";

/**
 * DTO for querying and filtering documents.
 */
export class DocumentQueryDTO extends PaginationQuery {
  /**
   * Filter documents by file name.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  file_name?: string;
  /**
   * Filter documents by file type (MIME type).
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  file_type?: string;
  /**
   * Sort order by upload date.
   * Accepted values: 'ASC', 'DESC'.
   */
  @Expose()
  @Type(() => String)
  @IsIn(["ASC", "DESC"], withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_upload_date?: Sort;
  /**
   * Sort order by file size.
   * Accepted values: 'ASC', 'DESC'.
   */
  @Expose()
  @Type(() => String)
  @IsIn(["ASC", "DESC"], withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_file_size?: Sort;
}

/**
 * DTO for uploading a new document.
 */
export class UploadDocumentDTO {
  /**
   * ID of the member who owns the document.
   */
  @Expose()
  @Type(() => Number)
  @IsInt(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_member!: number;

  /**
   * The file object to upload.
   * Max size: 5MB.
   */
  @Expose()
  @IsFile(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.FILE))
  @MaxFileSize(5 * 1024 * 1024, withError(DOCUMENT_ERRORS.VALIDATION.UPLOAD_DOCUMENT.FILE_TOO_BIG)) // 5MB limit
  @IsNotEmpty(withError(DOCUMENT_ERRORS.GENERIC_VALIDATION.EMPTY))
  file!: Express.Multer.File;
}

/**
 * DTO representing a downloaded document.
 */
export class DownloadDocument {
  /**
   * The file content buffer.
   */
  document!: Buffer;
  /**
   * The name of the file.
   */
  fileName!: string;
  /**
   * The MIME type of the file.
   */
  fileType!: string;
}

/**
 * DTO exposed to the API clients representing a document.
 */
export class DocumentExposedDTO {
  /**
   * Unique identifier of the document.
   */
  @Expose()
  id!: number;
  /**
   * Name of the file.
   */
  @Expose()
  file_name!: string;
  /**
   * Size of the file in bytes.
   */
  @Expose()
  file_size!: number;
  /**
   * Date when the document was uploaded.
   */
  @Expose()
  upload_date!: Date;
  /**
   * MIME type of the file.
   */
  @Expose()
  file_type!: string;
}

/**
 * Internal DTO representing a document, including sensitive or internal fields.
 * Extends DocumentExposedDTO.
 */
export class DocumentDTO extends DocumentExposedDTO {
  /**
   * ID of the member who owns the document.
   */
  @Expose()
  member_id!: number;
  /**
   * URL of the file in the storage service.
   */
  @Expose()
  file_url!: string;
}
