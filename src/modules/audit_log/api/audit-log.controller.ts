import { inject, injectable } from "inversify";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { ApiResponsePaginated, type Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import logger from "../../../shared/monitor/logger.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import type { IAuditLogService } from "../domain/i-audit-log.service.js";
import { AuditLogDTO, AuditLogQueryDTO } from "./audit-log.dtos.js";

const auditLogTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class AuditLogController {
  constructor(@inject("AuditLogService") private readonly audit_log_service: IAuditLogService) {}

  @auditLogTraceDecorator.traceSpan("listAuditLog", { url: "/audit-logs/", method: "get" })
  async list(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: AuditLogQueryDTO = await validateDto(AuditLogQueryDTO, req.query);
    const [data, pagination]: [AuditLogDTO[], Pagination] = await this.audit_log_service.list(query);
    logger.info({ operation: "audit_log:list", count: data.length }, "Audit log list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<AuditLogDTO[]>(data, pagination, SUCCESS));
  }

  @auditLogTraceDecorator.traceSpan("exportAuditLog", { url: "/audit-logs/export", method: "get" })
  async exportCsv(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: AuditLogQueryDTO = await validateDto(AuditLogQueryDTO, req.query);
    await this.audit_log_service.exportCsv(query, res);
    logger.info({ operation: "audit_log:export" }, "Audit log CSV export successfully streamed");
  }
}
