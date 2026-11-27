import { inject, injectable } from "inversify";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import type { IExportService } from "../domain/i-export.service.js";
import {
  CreateExportDTO,
  type ExportCreatedDTO,
  type ExportDownloadUrlDTO,
  ExportIdParamDTO,
  type ExportJobDTO,
  ExportListQueryDTO,
} from "./export.dtos.js";

const exportTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class ExportController {
  constructor(@inject("ExportService") private readonly export_service: IExportService) {}

  @exportTraceDecorator.traceSpan("requestExport", { url: "/exports", method: "post" })
  async request(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const body = await validateDto(CreateExportDTO, req.body ?? {});
    // The header itself, not req.language: i18next falls back to English when there is none,
    // and the archive's fallback is French. The front sends its UI language.
    const locale_hint = req.headers["accept-language"]?.split(",")[0];
    const data: ExportCreatedDTO = await this.export_service.request(body, locale_hint);
    res.status(202).json(new ApiResponse<ExportCreatedDTO>(data, SUCCESS));
  }

  @exportTraceDecorator.traceSpan("listExports", { url: "/exports", method: "get" })
  async list(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query = await validateDto(ExportListQueryDTO, req.query);
    const [data, pagination] = await this.export_service.list(query);
    res.status(200).json(new ApiResponsePaginated<ExportJobDTO[]>(data, pagination, SUCCESS));
  }

  @exportTraceDecorator.traceSpan("getExport", { url: "/exports/:id", method: "get" })
  async get(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = await validateDto(ExportIdParamDTO, req.params);
    const data: ExportJobDTO = await this.export_service.get(id);
    res.status(200).json(new ApiResponse<ExportJobDTO>(data, SUCCESS));
  }

  @exportTraceDecorator.traceSpan("exportDownloadUrl", { url: "/exports/:id/download-url", method: "post" })
  async downloadUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = await validateDto(ExportIdParamDTO, req.params);
    const data: ExportDownloadUrlDTO = await this.export_service.downloadUrl(id);
    // The URL is a bearer credential for five minutes: no cache may keep it.
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(new ApiResponse<ExportDownloadUrlDTO>(data, SUCCESS));
  }
}
