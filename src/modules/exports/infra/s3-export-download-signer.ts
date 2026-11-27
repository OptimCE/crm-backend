import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { IExportDownloadSigner } from "../domain/i-export.ports.js";

export interface ExportDownloadSettings {
  /** MinIO as the browser reaches it. Signing makes no network call, so the API need not reach it. */
  public_endpoint: string;
  region: string;
  access_key: string;
  secret_key: string;
  bucket: string;
}

/**
 * Signs with the export-download account, which can only read `exports/archives/*`
 * (minio/export/policies/download.json.tmpl): a leaked URL, or this account's key, gives nothing
 * else.
 */
export class S3ExportDownloadSigner implements IExportDownloadSigner {
  private readonly client: S3Client | undefined;
  /** What is missing, if anything: then every sign() fails (503) and the API still boots. */
  private readonly missing: string[];

  constructor(private readonly settings: ExportDownloadSettings) {
    this.missing = Object.entries(settings)
      .filter(([, value]) => !value)
      .map(([name]) => name);
    this.client =
      this.missing.length > 0
        ? undefined
        : new S3Client({
            endpoint: settings.public_endpoint,
            region: settings.region,
            forcePathStyle: true,
            credentials: { accessKeyId: settings.access_key, secretAccessKey: settings.secret_key },
          });
  }

  async sign(key: string, filename: string, ttlSeconds: number): Promise<string> {
    if (!this.client) throw new Error(`export.download is not configured: ${this.missing.join(", ")} not set`);
    const command = new GetObjectCommand({
      Bucket: this.settings.bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(filename),
      ResponseContentType: "application/zip",
    });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }
}

/** RFC 6266: a plain ASCII name, plus the UTF-8 one for a name that is not. */
export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/gu, "_").replace(/["\\]/gu, "_");
  if (ascii === filename) return `attachment; filename="${filename}"`;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
