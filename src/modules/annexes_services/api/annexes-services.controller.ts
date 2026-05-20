import { inject, injectable } from "inversify";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import logger from "../../../shared/monitor/logger.js";
import { Cache, InvalidateCache } from "../../../shared/cache/decorator/cache.decorators.js";
import { cacheKey, cachePattern } from "../../../shared/cache/decorator/cache-key.builder.js";
import type { IAnnexesServicesService } from "../domain/i-annexes-services.service.js";
import { CommunityAnnexDTO } from "./annexes-services.dtos.js";

const annexesServicesTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class AnnexesServicesController {
  constructor(@inject("AnnexesServicesService") private readonly annexesService: IAnnexesServicesService) {}

  @annexesServicesTraceDecorator.traceSpan("getCommunityServices", { url: "/annexes-services", method: "get" })
  @Cache(cacheKey("annexes-services:list", "both"), 60)
  async getCommunityServices(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: CommunityAnnexDTO[] = await this.annexesService.getCommunityServices();
    logger.info("Community annex services list successfully retrieved");
    res.status(200).json(new ApiResponse<CommunityAnnexDTO[]>(result, SUCCESS));
  }

  @annexesServicesTraceDecorator.traceSpan("subscribe", { url: "/annexes-services/:feature/subscribe", method: "post" })
  @InvalidateCache([cachePattern("annexes-services:list", "community")])
  async subscribe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.annexesService.subscribe(req.params.feature);
    logger.info({ feature: req.params.feature }, "Community successfully subscribed to feature");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @annexesServicesTraceDecorator.traceSpan("unsubscribe", { url: "/annexes-services/:feature/unsubscribe", method: "post" })
  @InvalidateCache([cachePattern("annexes-services:list", "community")])
  async unsubscribe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.annexesService.unsubscribe(req.params.feature);
    logger.info({ feature: req.params.feature }, "Community successfully unsubscribed from feature");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
