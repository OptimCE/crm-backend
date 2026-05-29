import type { QueryRunner } from "typeorm";
import type { AuditLog } from "./audit-log.models.js";
import type { AuditLogQueryDTO } from "../api/audit-log.dtos.js";

/**
 * Filters applied by both list and export reads. Community scope is resolved
 * from request context inside the repository — never passed by callers.
 */
export type AuditLogFilters = Pick<AuditLogQueryDTO, "action" | "entity_type" | "entity_id" | "user_id" | "from" | "to" | "sort_timestamp">;

export interface IAuditLogRepository {
  insert(entry: Partial<AuditLog>, query_runner?: QueryRunner): Promise<AuditLog>;
  list(query: AuditLogQueryDTO, query_runner?: QueryRunner): Promise<[AuditLog[], number]>;
  count(filters: AuditLogFilters, query_runner?: QueryRunner): Promise<number>;
  /**
   * Load all rows matching `filters`, ordered by timestamp DESC. Callers must
   * pre-check {@link count} against the export cap before calling this — the
   * repository does not enforce a hard limit itself.
   */
  findForExport(filters: AuditLogFilters, query_runner?: QueryRunner): Promise<AuditLog[]>;
}
