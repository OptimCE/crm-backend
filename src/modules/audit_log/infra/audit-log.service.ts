import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import type { Response } from "express";
import type { QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { User } from "../../users/domain/user.models.js";
import { AUDIT_LOG_ERRORS } from "../shared/audit-log.errors.js";
import type { IAuditLogService } from "../domain/i-audit-log.service.js";
import type { AuditLogFilters, IAuditLogRepository } from "../domain/i-audit-log.repository.js";
import { AuditLogDTO, type AuditLogInputDTO, type AuditLogQueryDTO } from "../api/audit-log.dtos.js";
import { auditLogCsvFilename, auditLogCsvHeader, auditLogCsvRow } from "./audit-log.csv.js";

/** Hard cap on CSV export size. Keep in sync with the EXPORT_TOO_LARGE error. */
export const AUDIT_LOG_EXPORT_MAX_ROWS = 100_000;
/** Source value stamped on every entry emitted by this service. */
export const AUDIT_LOG_DEFAULT_SOURCE = "crm-backend";

@injectable()
export class AuditLogService implements IAuditLogService {
  constructor(
    @inject("AuditLogRepository") private readonly audit_log_repository: IAuditLogRepository,
    @inject("AuthContext") private readonly auth_context_repository: IAuthContextRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  async log(entry: AuditLogInputDTO, query_runner?: QueryRunner): Promise<void> {
    try {
      const ctx = getContext();
      let id_community: number | null = null;
      let user_id: number | null = null;
      let user_email: string | null = null;

      if (ctx.community_id) {
        try {
          id_community = await this.auth_context_repository.getInternalCommunityId(query_runner);
        } catch {
          // Context references a community we can't resolve — log with null
          // community rather than failing the caller. Still emits the row.
          id_community = null;
        }
      }

      if (ctx.user_id) {
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;
        const user = await manager.findOne(User, {
          where: { auth_user_id: ctx.user_id },
          select: ["id", "email"],
        });
        if (user) {
          user_id = user.id;
          user_email = user.email;
        }
      }

      await this.audit_log_repository.insert(
        {
          id_community,
          action: entry.action,
          source: entry.source ?? AUDIT_LOG_DEFAULT_SOURCE,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id ?? null,
          user_id,
          user_email,
          payload: entry.payload ?? {},
        },
        query_runner,
      );
    } catch (err) {
      // Audit must never break the caller's business write. We log loudly
      // here so dropped audits are visible in the application log even though
      // the caller proceeds normally.
      logger.error({ operation: "audit_log:log", error: err, entry }, "audit.log failed");
    }
  }

  async list(query: AuditLogQueryDTO): Promise<[AuditLogDTO[], Pagination]> {
    const [rows, total] = await this.audit_log_repository.list(query);
    const data = rows.map((row) => plainToInstance(AuditLogDTO, row, { excludeExtraneousValues: true }));
    const total_pages = query.limit > 0 ? Math.ceil(total / query.limit) : 0;
    return [data, new Pagination(query.page, query.limit, total, total_pages)];
  }

  async exportCsv(query: AuditLogQueryDTO, res: Response): Promise<void> {
    const filters: AuditLogFilters = {
      action: query.action,
      entity_type: query.entity_type,
      entity_id: query.entity_id,
      user_id: query.user_id,
      from: query.from,
      to: query.to,
      sort_timestamp: query.sort_timestamp,
    };

    const total = await this.audit_log_repository.count(filters);
    if (total > AUDIT_LOG_EXPORT_MAX_ROWS) {
      throw new AppError(AUDIT_LOG_ERRORS.EXPORT.TOO_LARGE, 400);
    }

    const internal_community_id = await this.resolveCommunityIdForFilename();
    const filename = auditLogCsvFilename(internal_community_id);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.write(auditLogCsvHeader() + "\r\n");

    // Bounded by the pre-flight cap above, so loading the result set is safe.
    const rows = await this.audit_log_repository.findForExport(filters);
    for (const row of rows) {
      res.write(auditLogCsvRow(row) + "\r\n");
    }
    res.end();
  }

  private async resolveCommunityIdForFilename(): Promise<number | null> {
    try {
      return await this.auth_context_repository.getInternalCommunityId();
    } catch {
      return null;
    }
  }
}
