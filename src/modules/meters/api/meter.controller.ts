import { inject, injectable } from "inversify";
import type { IMeterService } from "../domain/i-meter.service.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated, Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import {
  CreateMeterDTO,
  DeleteFutureMeterDataDTO,
  MeterConsumptionDTO,
  MeterConsumptionQuery,
  MeterPartialQuery,
  MetersDTO,
  PartialMeterDTO,
  PatchMeterDataDTO,
  UpdateMeterDTO,
} from "./meter.dtos.js";
const meterControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class MeterController {
  constructor(@inject("MeterService") private readonly meterService: IMeterService) {}

  /**
   * Retrieves a paginated list of meters.
   * @param req - Express request object. Query: MeterPartialQuery.
   * @param res - Express response object. Returns list of PartialMeterDTO.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("getMetersList", { url: "/meters/", method: "get" })
  async getMetersList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(MeterPartialQuery, req.query);
    const [result, pagination]: [PartialMeterDTO[], Pagination] = await this.meterService.getMetersList(queryObject);
    logger.info("Meters list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<PartialMeterDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves details of a specific meter by EAN or ID (implementation dependent, usually EAN or internal ID).
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns MetersDTO.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("getMeter", { url: "/meters/:id", method: "get" })
  async getMeter(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: MetersDTO = await this.meterService.getMeter(req.params.id);
    logger.info("Meter successfully retrieved");
    res.status(200).json(new ApiResponse<MetersDTO>(result, SUCCESS));
  }

  /**
   * Retrieves consumption data for a specific meter.
   * @param req - Express request object. Params: id. Query: MeterConsumptionQuery.
   * @param res - Express response object. Returns MeterConsumptionDTO.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("getMeterConsumptions", { url: "/meters/:id/consumptions", method: "get" })
  async getMeterConsumptions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query_consumptions = await validateDto(MeterConsumptionQuery, req.query);
    const result: MeterConsumptionDTO = await this.meterService.getMeterConsumptions(req.params.id, query_consumptions);
    logger.info("Meter consumptions successfully retrieved");
    res.status(200).json(new ApiResponse<MeterConsumptionDTO>(result, SUCCESS));
  }

  /**
   * Downloads consumption data for a specific meter as an Excel file.
   * @param req - Express request object. Params: id. Query: MeterConsumptionQuery.
   * @param res - Express response object. Returns Buffer (Excel file).
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("downloadMeterConsumptions", { url: "/meters/:id/consumptions/download", method: "get" })
  async downloadMeterConsumptions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query_consumptions = await validateDto(MeterConsumptionQuery, req.query);
    const buffer: Buffer = await this.meterService.downloadMeterConsumptions(req.params.id, query_consumptions);
    logger.info("Sharing operation consumptions successfully download");
    const filenameBase = req.t("download_meter_consumptions.download_name", { ns: "meter" }) + ".xlsx";
    res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  }

  /**
   * Creates a new meter.
   * @param req - Express request object. Body: CreateMeterDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("addMeter", { url: "/meters/", method: "post" })
  async addMeter(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_meter = await validateDto(CreateMeterDTO, req.body);
    await this.meterService.addMeter(new_meter);
    logger.info("Meter added");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Update a meter.
   * @param req - Express request object. Body: CreateMeterDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("updateMeter", { url: "/meters/", method: "put" })
  async updateMeter(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const updated_meter = await validateDto(UpdateMeterDTO, req.body);
    await this.meterService.updateMeter(updated_meter);
    logger.info("Meter updated");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates/Patches meter data configuration for a specific period.
   * @param req - Express request object. Body: PatchMeterDataDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("patchMeterData", { url: "/meters/data", method: "patch" })
  async patchMeterData(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_meter_data = await validateDto(PatchMeterDataDTO, req.body);
    await this.meterService.patchMeterData(patched_meter_data);
    logger.info("Meter data patched");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Delete latest meter data configuration
   * @param req - Express request object. Body: PatchMeterDataDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("deleteLatestMeterData", { url: "/meters/data/delete", method: "patch" })
  async deleteLatestMeterData(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const deleted_meter_data = await validateDto(DeleteFutureMeterDataDTO, req.body);
    await this.meterService.deleteLatestMeterData(deleted_meter_data);
    logger.info("Meter data deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Deletes a meter.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @meterControllerTraceDecorator.traceSpan("patchMeterData", { url: "/meters/:id", method: "delete" })
  async deleteMeter(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.meterService.deleteMeter(req.params.id);
    logger.info("Meter deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
