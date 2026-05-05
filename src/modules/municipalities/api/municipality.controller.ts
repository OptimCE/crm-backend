import config from "config";
import { inject, injectable } from "inversify";
import type { NextFunction, Request, Response } from "express";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import { Cache } from "../../../shared/cache/decorator/cache.decorators.js";
import { cacheKey } from "../../../shared/cache/decorator/cache-key.builder.js";
import type { IMunicipalityService } from "../domain/i-municipality.service.js";
import { MunicipalityPartialDTO, MunicipalitySearchQuery } from "./municipality.dtos.js";

const traceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class MunicipalityController {
  constructor(@inject("MunicipalityService") private readonly municipalityService: IMunicipalityService) {}

  @traceDecorator.traceSpan("searchMunicipalities", { url: "/municipalities/", method: "get" })
  @Cache(cacheKey("municipalities:search", "none", (req) => JSON.stringify(req.query)), 300)
  async searchMunicipalities(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(MunicipalitySearchQuery, req.query);
    const [result, pagination] = await this.municipalityService.searchMunicipalities(queryObject);
    logger.info("Municipality search successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MunicipalityPartialDTO[]>(result, pagination, SUCCESS));
  }
}
