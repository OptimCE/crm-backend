import config from "config";
import { inject, injectable } from "inversify";
import type { NextFunction, Request, Response } from "express";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import type { IDsoService } from "../domain/i-dso.service.js";
import { DsoOperatorDTO, DsoResolutionDTO, DsoResolveQueryDTO } from "./dso.dtos.js";

const traceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class DsoController {
  constructor(@inject("DsoService") private readonly dsoService: IDsoService) {}

  /**
   * The operator catalogue for the meter form's GRD select.
   *
   * Not audited and not cache-decorated: national reference data, identical for
   * every tenant. `[]` when dso-lookup is off — the form keeps its static list.
   */
  @traceDecorator.traceSpan("getDsoOperators", { url: "/dso/operators", method: "get" })
  async getOperators(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const operators = await this.dsoService.getOperators();
    res.status(200).json(new ApiResponse<DsoOperatorDTO[]>(operators as DsoOperatorDTO[], SUCCESS));
  }

  /**
   * Which DSO runs the network at an address. Always a 200 once the query is
   * valid: an unreachable dso-lookup is `status: "unavailable"`, not an error,
   * because the prefill is advisory and must never block the form it sits in.
   */
  @traceDecorator.traceSpan("resolveDso", { url: "/dso/resolve", method: "get" })
  async resolve(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query = await validateDto(DsoResolveQueryDTO, req.query);
    const resolution = await this.dsoService.resolve({
      nis_code: query.nis_code,
      postcode: query.postcode,
      city: query.city,
      post_name: query.post_name,
      ins: query.ins,
      section: query.section,
      ean: query.ean,
    });
    res.status(200).json(new ApiResponse<DsoResolutionDTO>(resolution as DsoResolutionDTO, SUCCESS));
  }
}
