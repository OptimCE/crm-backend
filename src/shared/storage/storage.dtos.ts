/**
 * DTO representing an uploaded document's metadata.
 */
export class UploadedDocument {
  /** Public URL or internal path to the file */
  url!: string;
  /** MIME type of the file */
  file_type!: string;
}
