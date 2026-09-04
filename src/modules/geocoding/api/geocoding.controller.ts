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
import {
  AddressPreviewDTO,
  AddressPreviewQueryDTO,
  AddressSuggestQueryDTO,
  AddressSuggestionDTO,
  GeocodeBackfillDTO,
  GeocodeBackfillResultDTO,
} from "./geocoding.dtos.js";

const traceDecorator = new TraceDecorator(config.get("microservice_name"));

const DEFAULT_BATCH_LIMIT = 100;
const DEFAULT_SUGGEST_LIMIT = 8;

/**
 * Which of the register's names to show.
 *
 * The register carries `fr` / `nl` / `de` and nothing else, so `en` — a real
 * UI language here — has to fall back rather than render an empty label.
 */
const REGISTER_LANGUAGES = new Set(["fr", "nl", "de"]);

function registerLanguage(header: string | undefined): string {
  const first = (header ?? "").split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return first && REGISTER_LANGUAGES.has(first) ? first : "fr";
}

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

  /**
   * Address suggestions for the picker.
   *
   * Not audited and not cache-decorated: it is a read of national reference
   * data, identical for every tenant, and it fires on every keystroke. The
   * service memoises it in-process instead.
   */
  @traceDecorator.traceSpan("suggestAddresses", { url: "/geocoding/suggest", method: "get" })
  async suggestAddresses(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query = await validateDto(AddressSuggestQueryDTO, req.query);
    const suggestions = await this.geocodingService.suggest(
      query.q,
      query.limit ?? DEFAULT_SUGGEST_LIMIT,
      registerLanguage(req.headers["accept-language"]),
    );
    res.status(200).json(new ApiResponse<AddressSuggestionDTO[]>(suggestions as AddressSuggestionDTO[], SUCCESS));
  }

  /** Can this address be placed on the map? Reads only — nothing is written. */
  @traceDecorator.traceSpan("previewAddress", { url: "/geocoding/preview", method: "get" })
  async previewAddress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query = await validateDto(AddressPreviewQueryDTO, req.query);
    const preview = await this.geocodingService.preview(
      {
        street: query.street,
        number: query.number,
        postcode: query.postcode,
        city: query.city,
        supplement: query.supplement ?? null,
      },
      registerLanguage(req.headers["accept-language"]),
    );
    res.status(200).json(new ApiResponse<AddressPreviewDTO>(preview, SUCCESS));
  }
}
