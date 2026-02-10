import { inject, injectable } from "inversify";
import type { NextFunction, Request, Response } from "express";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { IKeyService } from "../domain/i-key.service.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import { CreateKeyDTO, KeyDTO, KeyPartialDTO, KeyPartialQuery, UpdateKeyDTO } from "./key.dtos.js";
import { ApiResponse, ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import logger from "../../../shared/monitor/logger.js";
import ExcelJS from "exceljs";
const keyControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

/**
 * Controller responsible for handling key-related HTTP requests
 * Provides endpoints for managing keys and key simulations
 */
@injectable()
export class KeyController {
  /**
   * Creates a new KeyController instance
   * @param keyService - Service for key operations
   */
  constructor(@inject("KeyService") private readonly keyService: IKeyService) {}

  /**
   * Retrieves a paginated list of keys (partial view).
   * @param req - Express request object. Query: KeyPartialQuery.
   * @param res - Express response object. Returns list of KeyPartialDTO.
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("getKeysList", { url: "/keys/", method: "get" })
  async getKeysList(req: Request, res: Response, _next: NextFunction) {
    const queryObject = await validateDto(KeyPartialQuery, req.query);
    const [result, pagination] = await this.keyService.getPartialKeyList(queryObject);
    logger.info("Key list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<KeyPartialDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves a specific key by ID.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns KeyDTO.
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("getKey", { url: "/keys/:id", method: "get" })
  async getKey(req: Request, res: Response, _next: NextFunction) {
    const result = await this.keyService.getKey(+req.params.id);
    logger.info("Key successfully retrieved");
    res.status(200).json(new ApiResponse<KeyDTO>(result, SUCCESS));
  }

  /**
   * Prepares a key for download (simulated/export).
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns KeyDTO (or Excel blob if implemented directly, currently returns DTO context).
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("downloadKey", { url: "/keys/:id/download", method: "get" })
  async downloadKey(req: Request, res: Response, _next: NextFunction) {
    const workbook = await this.keyService.downloadKey(+req.params.id);
    logger.info("Key list successfully retrieved, ready to download");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const filenameBase = req.t("download_key.download_name", { ns: "key" }) + ".xlsx";
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.xlsx"`);
    (workbook as ExcelJS.Workbook).xlsx.write(res).then(() => res.end());
  }

  /**
   * Creates a new key configuration.
   * @param req - Express request object. Body: CreateKeyDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("addKey", { url: "/keys/", method: "post" })
  async addKey(req: Request, res: Response, _next: NextFunction) {
    const new_key = await validateDto(CreateKeyDTO, req.body);
    await this.keyService.addKey(new_key);
    logger.info("Key added successfully");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates an existing key.
   * @param req - Express request object. Body: UpdateKeyDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("updateKey", { url: "/keys/", method: "put" })
  async updateKey(req: Request, res: Response, _next: NextFunction) {
    const updated_key = await validateDto(UpdateKeyDTO, req.body);
    await this.keyService.updateKey(updated_key);
    logger.info("Key updated successfully");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Deletes a key by ID.
   * @param req - Express request object. Params: id.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @keyControllerTraceDecorator.traceSpan("deleteKey", { url: "/keys/:id", method: "delete" })
  async deleteKey(req: Request, res: Response, _next: NextFunction) {
    await this.keyService.deleteKey(+req.params.id);
    logger.info("Key deleted successfully");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
