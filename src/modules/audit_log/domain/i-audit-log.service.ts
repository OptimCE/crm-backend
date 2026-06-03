import type { Response } from "express";
import type { QueryRunner } from "typeorm";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { AuditLogDTO, AuditLogInputDTO, AuditLogQueryDTO } from "../api/audit-log.dtos.js";

export interface IAuditLogService {
  /**
   * Record an audit entry. Owner / community / source / timestamp are resolved
   * automatically from the current request context — callers never pass them.
   *
   * If invoked outside a request context (background job, system task) the
   * owner / community columns are left null and `source` falls back to
   * `"crm-backend"` unless explicitly overridden in `entry.source`.
   *
   * If `query_runner` is provided, the insert participates in that
   * transaction, so a business rollback discards the audit row alongside the
   * change it described.
   *
   * Insert errors are swallowed and logged — a failed audit must never abort
   * the caller's business write.
   */
  log(entry: AuditLogInputDTO, query_runner?: QueryRunner): Promise<void>;

  /** Paginated, filtered list for the current community. */
  list(query: AuditLogQueryDTO): Promise<[AuditLogDTO[], Pagination]>;

  /**
   * Stream a CSV of audit entries matching `query` (filters only — pagination
   * is ignored). Performs a pre-flight COUNT and throws EXPORT_TOO_LARGE if
   * the result set exceeds the hard cap. Writes directly to `res`.
   */
  exportCsv(query: AuditLogQueryDTO, res: Response): Promise<void>;
}
