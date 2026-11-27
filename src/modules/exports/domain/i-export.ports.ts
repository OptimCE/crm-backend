/**
 * Announces a committed export to the worker (`export.job.requested`).
 *
 * Best effort by design: resolves false (never rejects) when the message could not be published,
 * and the job then stays `pending` until the worker's sweep finds it.
 */
export interface IExportJobPublisher {
  requested(exportId: string): Promise<boolean>;
}

/** Signs a short-lived GET URL for an archive, which the browser downloads straight from MinIO. */
export interface IExportDownloadSigner {
  /**
   * @param key - The archive's object key in the exports bucket.
   * @param filename - The name the browser saves it under (Content-Disposition).
   * @param ttlSeconds - How long the URL works.
   */
  sign(key: string, filename: string, ttlSeconds: number): Promise<string>;
}
