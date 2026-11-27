import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { CreateExportDTO, ExportCreatedDTO, ExportDownloadUrlDTO, ExportJobDTO, ExportListQueryDTO } from "../api/export.dtos.js";

export interface IExportService {
  /**
   * Creates an export of the caller's data, or of the active community's (ADMIN only), with one
   * pending part per configured service, then announces it to the worker after the commit.
   * The caller's recent login is checked by the route (freshAuthChecker).
   *
   * @param input - The body.
   * @param locale_hint - The request's language, used when the account has no saved language.
   * @throws AppError 403 FORBIDDEN, 409 ALREADY_ACTIVE, 429 RATE_LIMITED, 404 USER_NOT_FOUND.
   */
  request(input: CreateExportDTO, locale_hint: string | undefined): Promise<ExportCreatedDTO>;

  /** The caller's exports, or (view=community, ADMIN only) every export of the active community. */
  list(query: ExportListQueryDTO): Promise<[ExportJobDTO[], Pagination]>;

  /** One export with its parts: the requester's, or one of the active community's for its ADMINs. */
  get(id: string): Promise<ExportJobDTO>;

  /**
   * A short-lived URL to the archive, for the requester only, while it is ready. Audited with the
   * caller's IP.
   * @throws AppError 404 NOT_FOUND, 403 DOWNLOAD_FORBIDDEN, 409 NOT_READY, 410 EXPIRED, 503 DOWNLOAD_UNAVAILABLE.
   */
  downloadUrl(id: string): Promise<ExportDownloadUrlDTO>;
}
