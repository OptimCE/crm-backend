import config from "config";
import { inject, injectable } from "inversify";
import type { NextFunction, Request, Response } from "express";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import type { IGeocodingService } from "../domain/i-geocoding.service.js";
import { GeocodeBackfillDTO, GeocodeBackfillResultDTO } from "./geocoding.dtos.js";

const traceDecorator = new TraceDecorator(config.get("microservice_name"));

const DEFAULT_BATCH_LIMIT = 100;

@injectable()
export class GeocodingController {
  constructor(
    @inject("GeocodingService") private readonly geocodingService: IGeocodingService,
    @inject("AuditLogService") private readonly auditLogService: IAuditLogService,
  ) {}

  /**
   * Resolve a batch of never-geocoded addresses.
   *
   * Deliberately NOT decorated with @InvalidateCache: the map caches are
   * per-community and this runs as one admin with one community in context, so
   * the decorator could only ever reach that tenant's keys. The service sweeps
   * by pattern instead.
   */
  @traceDecorator.traceSpan("runBackfill", { url: "/geocoding/backfill", method: "post" })
  async runBackfill(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const body = await validateDto(GeocodeBackfillDTO, req.body);
    const limit = body.limit ?? DEFAULT_BATCH_LIMIT;

    const result = await this.geocodingService.runBackfill(limit);

    await this.auditLogService.log({
      action: AUDIT_ACTIONS.ADDRESS_GEOCODE_BACKFILL,
      entity_type: "address",
      entity_id: "batch",
      payload: {
        attempted: result.attempted,
        succeeded: result.succeeded,
        not_found: result.not_found,
        errored: result.errored,
        remaining: result.remaining,
      },
    });

    logger.info({ operation: "runBackfill", ...result }, "Geocoding backfill batch complete");
    res.status(200).json(new ApiResponse<GeocodeBackfillResultDTO>(result, SUCCESS));
  }
}
