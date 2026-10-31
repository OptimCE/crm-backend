import { inject, injectable } from "inversify";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import logger from "../../../shared/monitor/logger.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import type { IRegulatoryService } from "../domain/i-regulatory.service.js";
import { type RegulatoryStatusDTO, RegulatoryStatusQueryDTO } from "./regulatory.dtos.js";

const regulatoryTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class RegulatoryController {
  constructor(@inject("RegulatoryService") private readonly regulatory_service: IRegulatoryService) {}

  @regulatoryTraceDecorator.traceSpan("getRegulatoryStatus", { url: "/regulatory/status", method: "get" })
  async getStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: RegulatoryStatusQueryDTO = await validateDto(RegulatoryStatusQueryDTO, req.query);
    const data: RegulatoryStatusDTO[] = await this.regulatory_service.status(query);
    logger.info({ operation: "regulatory:status", count: data.length }, "Regulatory status successfully retrieved");
    res.status(200).json(new ApiResponse<RegulatoryStatusDTO[]>(data, SUCCESS));
  }
}
