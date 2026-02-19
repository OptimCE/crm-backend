import { inject, injectable } from "inversify";
import type { ISharingOperationService } from "../domain/i-sharing_operation.service.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated, Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import {
  AddConsumptionDataDTO,
  AddKeyToSharingOperationDTO,
  AddMeterToSharingOperationDTO,
  CreateSharingOperationDTO,
  PatchKeyToSharingOperationDTO,
  PatchMeterToSharingOperationDTO,
  RemoveMeterFromSharingOperationDTO,
  SharingOpConsumptionDTO,
  SharingOperationConsumptionQuery,
  SharingOperationDTO,
  SharingOperationKeyDTO,
  SharingOperationMetersQuery,
  SharingOperationPartialDTO,
  SharingOperationPartialQuery,
} from "./sharing_operation.dtos.js";
import { PartialMeterDTO } from "../../meters/api/meter.dtos.js";
import { KeyPartialQuery } from "../../keys/api/key.dtos.js";

const sharing_operationControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));
@injectable()
export class SharingOperationController {
  constructor(@inject("SharingOperationService") private readonly sharing_operationService: ISharingOperationService) {}

  /**
   * Retrieves a paginated list of sharing operations.
   * @param req - Express request object. Query: SharingOperationPartialQuery.
   * @param res - Express response object. Returns list of SharingOperationPartialDTO.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("getSharingOperationList", { url: "/sharing_operations/", method: "get" })
  async getSharingOperationList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(SharingOperationPartialQuery, req.query);
    const [result, pagination]: [SharingOperationPartialDTO[], Pagination] = await this.sharing_operationService.getSharingOperationList(queryObject);
    logger.info("Sharing operation list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<SharingOperationPartialDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves details of a specific sharing operation by ID.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns SharingOperationDTO.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("getSharingOperation", { url: "/sharing_operations/:id", method: "get" })
  async getSharingOperation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: SharingOperationDTO = await this.sharing_operationService.getSharingOperation(+req.params.id);
    logger.info("Sharing operation successfully retrieved");
    res.status(200).json(new ApiResponse<SharingOperationDTO>(result, SUCCESS));
  }

  /**
   * Retrieves list of meters linked to a sharing operation by ID.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns SharingOperationDTO.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("getSharingOperationMetersList", { url: "/sharing_operations/:id/meters", method: "get" })
  async getSharingOperationMetersList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(SharingOperationMetersQuery, req.query);
    const [result, pagination]: [PartialMeterDTO[], Pagination] = await this.sharing_operationService.getSharingOperationMetersList(
      +req.params.id,
      queryObject,
    );
    logger.info("Meters list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<PartialMeterDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves list of keys linked to a sharing operation by ID.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns SharingOperationDTO.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("getSharingOperationKeysList", { url: "/sharing_operations/:id/keys", method: "get" })
  async getSharingOperationKeysList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(KeyPartialQuery, req.query);
    const [result, pagination]: [SharingOperationKeyDTO[], Pagination] = await this.sharing_operationService.getSharingOperationKeysList(
      +req.params.id,
      queryObject,
    );
    logger.info("Keys list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<SharingOperationKeyDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves consumption data for a sharing operation.
   * @param req - Express request object. Params: id. Query: SharingOperationConsumptionQuery.
   * @param res - Express response object. Returns SharingOpConsumptionDTO.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("getSharingOperationConsumptions", {
    url: "/sharing_operations/:id/consumptions",
    method: "get",
  })
  async getSharingOperationConsumptions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query_consumptions = await validateDto(SharingOperationConsumptionQuery, req.query);
    const result: SharingOpConsumptionDTO = await this.sharing_operationService.getSharingOperationConsumption(+req.params.id, query_consumptions);
    logger.info("Sharing operation consumptions successfully retrieved");
    res.status(200).json(new ApiResponse<SharingOpConsumptionDTO>(result, SUCCESS));
  }

  /**
   * Downloads consumption data for a sharing operation as an Excel file.
   * @param req - Express request object. Params: id. Query: SharingOperationConsumptionQuery.
   * @param res - Express response object. Returns Buffer (Excel file).
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("downloadSharingOperationConsumptions", {
    url: "/sharing_operations/:id/consumptions/download",
    method: "get",
  })
  async downloadSharingOperationConsumptions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query_consumptions = await validateDto(SharingOperationConsumptionQuery, req.query);
    const buffer: Buffer = await this.sharing_operationService.downloadSharingOperationConsumptions(+req.params.id, query_consumptions);
    logger.info("Sharing operation consumptions successfully download");
    res.setHeader("Content-Disposition", `attachment; filename=consommations-${req.query.id}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  }

  /**
   * Creates a new sharing operation.
   * @param req - Express request object. Body: CreateSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("createSharingOperation", { url: "/sharing_operations/", method: "post" })
  async createSharingOperation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_sharing_operations = await validateDto(CreateSharingOperationDTO, req.body);
    await this.sharing_operationService.createSharingOperation(new_sharing_operations);
    logger.info("Sharing operation consumptions successfully created");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Adds an allocation key to a sharing operation (requests approval).
   * @param req - Express request object. Body: AddKeyToSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("addKeyToSharing", { url: "/sharing_operations/key", method: "post" })
  async addKeyToSharing(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_key_to_operation = await validateDto(AddKeyToSharingOperationDTO, req.body);
    await this.sharing_operationService.addKeyToSharing(new_key_to_operation);
    logger.info("Key added to waiting in a sharing operation");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Adds meters to a sharing operation.
   * @param req - Express request object. Body: AddMeterToSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("addMeterToSharing", { url: "/sharing_operations/meter", method: "post" })
  async addMeterToSharing(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_meters_to_operation = await validateDto(AddMeterToSharingOperationDTO, req.body);
    await this.sharing_operationService.addMeterToSharing(new_meters_to_operation);
    logger.info("Meter added to waiting in a sharing operation");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Uploads consumption data file to a sharing operation.
   * @param req - Express request object. Body: AddConsumptionDataDTO (multipart/form-data).
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("addConsumptionDataToSharing", { url: "/sharing_operations/consumptions", method: "post" })
  async addConsumptionDataToSharing(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const payload = {
      ...req.body,
      file: req.file,
    };
    const upload_consumption_data = await validateDto(AddConsumptionDataDTO, payload);
    await this.sharing_operationService.addConsumptionDataToSharing(upload_consumption_data);
    logger.info("Consumptions added to a sharing operation");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates the status of a key in a sharing operation (e.g. approve/reject).
   * @param req - Express request object. Body: PatchKeyToSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("patchKeyStatus", { url: "/sharing_operations/key", method: "patch" })
  async patchKeyStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_key_status = await validateDto(PatchKeyToSharingOperationDTO, req.body);
    await this.sharing_operationService.patchKeyStatus(patched_key_status);
    logger.info("Key linked to sharing operation patched");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates the status of a meter in a sharing operation.
   * @param req - Express request object. Body: PatchMeterToSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("patchMeterStatus", { url: "/sharing_operations/meter", method: "patch" })
  async patchMeterStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_meter_status = await validateDto(PatchMeterToSharingOperationDTO, req.body);
    await this.sharing_operationService.patchMeterStatus(patched_meter_status);
    logger.info("Meter linked to sharing operation patched");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Deletes a sharing operation.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("deleteSharingOperation", { url: "/sharing_operations/:id", method: "delete" })
  async deleteSharingOperation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.sharing_operationService.deleteSharingOperation(+req.params.id);
    logger.info("Sharing operation deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Removes a meter from a sharing operation.
   * @param req - Express request object. Body: RemoveMeterFromSharingOperationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @sharing_operationControllerTraceDecorator.traceSpan("deleteMeterFromSharingOperation", { url: "/sharing_operations/:id/meter", method: "delete" })
  async deleteMeterFromSharingOperation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const removed_meter_status = await validateDto(RemoveMeterFromSharingOperationDTO, req.body);
    await this.sharing_operationService.deleteMeterFromSharingOperation(removed_meter_status);
    logger.info("Meter removed from operation");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
