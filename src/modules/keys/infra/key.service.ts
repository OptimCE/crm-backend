import type { IKeyService } from "../domain/i-key.service.js";
import { CreateKeyDTO, KeyDTO, KeyPartialDTO, KeyPartialQuery, UpdateKeyDTO } from "../api/key.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { inject, injectable } from "inversify";
import type { IKeyRepository } from "../domain/i-key.repository.js";
import { toKeyDTO, toKeyPartialDTO } from "../shared/to_dto.js";
import ExcelJS from "exceljs";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import type { QueryRunner } from "typeorm";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { AllocationKey } from "../domain/key.models.js";
import { KEY_ERRORS } from "../shared/key.errors.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import { Column } from "exceljs";
import { CellValue } from "exceljs";

/**
 * Service implementation for managing allocation keys.
 * Handles creation, update, deletion, and export of keys and their iterations.
 */
@injectable()
export class KeyService implements IKeyService {
  constructor(
    @inject("KeyRepository") private keyRepository: IKeyRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  /**
   * Retrieves valid keys as a partial list.
   * @param query - Query parameters for filtering/paging.
   * @returns Tuple of [KeyPartialDTO[], Pagination].
   */
  async getPartialKeyList(query: KeyPartialQuery): Promise<[KeyPartialDTO[], Pagination]> {
    const [values, total] = await this.keyRepository.getPartialKeyList(query);
    const return_values = values.map((value) => toKeyPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves details of a specific key.
   * @param key_id - ID of the key.
   * @returns KeyDTO with full details (iterations/consumers).
   * @throws AppError if key not found.
   */
  async getKey(key_id: number): Promise<KeyDTO> {
    const value = await this.keyRepository.getKeyById(key_id);
    if (!value) {
      logger.error({ operation: "getKey" }, `No key found with id ${key_id} found`);
      throw new AppError(KEY_ERRORS.GET_KEY.KEY_NOT_FOUND, 400);
    }
    return toKeyDTO(value);
  }
  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column: Partial<Column>) => {
      const length = column.header!.length;
      const maxWidth = column.values!.map((v: CellValue) => v?.toString()?.length ?? 15);
      column.width = Math.max(length, 15, ...maxWidth);
    });
  }
  /**
   * Generates an Excel file for the key distribution simulation.
   * @param key_id - ID of the key.
   * @returns Workbook object (ExcelJS).
   * @throws AppError if generation fails.
   */
  async downloadKey(key_id: number): Promise<ExcelJS.Workbook> {
    try {
      const key = await this.getKey(key_id);
      const workbook = new ExcelJS.Workbook();
      const worksheetHome = workbook.addWorksheet("Accueil");
      worksheetHome.columns = [
        { header: "Nom", key: "name" },
        { header: "Description", key: "description" },
        { header: "Lien vers la clé", key: "link_key" },
        { header: "Lien vers les crédits", key: "link_credit" },
      ];
      worksheetHome.addRow({
        name: key.name,
        description: key.description,
        link_key: { text: "Lien", hyperlink: "#'Clef de répartition'!A1" },
        link_credit: { text: "Lien", hyperlink: "#'Crédit'!A1", style: { font: { color: { argb: "FF0000FF" } } } },
      });
      worksheetHome.getCell("C2").font = { color: { argb: "FF0000FF" } };
      worksheetHome.getCell("D2").font = { color: { argb: "FF0000FF" } };
      this.autoFitColumns(worksheetHome);
      const worksheet = workbook.addWorksheet("Clef de répartition");
      worksheet.columns = [
        { header: "Iteration n°", key: "number" },
        { header: "Pourcentage VA", key: "va_percentage" },
        { header: "Nom", key: "name" },
        { header: "VAP", key: "vp_percentage" },
      ];
      worksheet.duplicateRow(1, 1, true);
      worksheet.getCell("A1").value = "Itération";
      worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.mergeCells("A1:B1");
      worksheet.getCell("C1").value = "Consommateur";
      worksheet.getCell("C1").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.mergeCells("C1:D1");
      key.iterations.forEach((iteration) => {
        iteration.consumers.forEach((consumer) => {
          let vp_percentage_consumer = consumer.energy_allocated_percentage * 100 + "%";
          if (consumer.energy_allocated_percentage === -1) {
            vp_percentage_consumer = "PRORATA";
          }

          worksheet.addRow({
            number: iteration.number,
            va_percentage: iteration.energy_allocated_percentage * 100 + "%",
            name: consumer.name,
            vp_percentage: vp_percentage_consumer,
          });
        });
      });
      this.autoFitColumns(worksheet);
      return await this.addCreditToExcel(workbook);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error(
        {
          operation: "downloadKey",
          error: err,
        },
        "Exception while trying to download a key",
      );
      throw new AppError(KEY_ERRORS.DOWNLOAD_KEY.DOWNLOAD_KEY, 400);
    }
  }
  /**
   * Adds credit information to the Excel workbook.
   * @param workbook - ExcelJS workbook.
   * @returns Workbook with credits.
   */
  async addCreditToExcel(workbook: ExcelJS.Workbook): Promise<ExcelJS.Workbook> {
    try {
      const worksheet = workbook.addWorksheet("Crédit");
      const imageID = workbook.addImage({
        filename: "images/logo.png",
        extension: "png",
      });
      worksheet.addImage(imageID, "A1:E22");
      worksheet.mergeCells("A1:E22");

      worksheet.getCell("G1").value = "Locomotrice";
      worksheet.getCell("G1").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.mergeCells("G1:I1");
      worksheet.getCell("G3").value = "Excel obtenu via le gestionnaire de clef développé dans le cadre du projet Locomotrice";
      worksheet.mergeCells("G3:O3");
      return workbook;
    } catch (e) {
      logger.error(
        {
          operation: "addCreditToExcel",
          error: e,
        },
        "Exception while adding credit to excel",
      );
      throw new AppError(KEY_ERRORS.DOWNLOAD_KEY.ADD_CREDIT_EXCEL, 400);
    }
  }

  /**
   * Creates a new key definition with its iterations and consumers.
   * @param new_key - DTO containing key details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if database operations fail.
   */
  @Transactional()
  async addKey(new_key: CreateKeyDTO, query_runner?: QueryRunner): Promise<void> {
    let saved: AllocationKey;
    try {
      saved = await this.keyRepository.createKey(new_key, query_runner);
    } catch (err) {
      logger.error({ operation: "addKey", error: err }, "An exception occurred while adding a new key");
      throw new AppError(KEY_ERRORS.ADD_KEY.ADD_KEY_DATABASE, 400);
    }
    try {
      const save_children = await this.keyRepository.createChildren(saved, new_key.iterations, query_runner);
      if (!save_children) {
        logger.error({ operation: "addKey" }, "Error while adding children in the database");
        throw new AppError(KEY_ERRORS.ADD_KEY.ADD_CHILDREN_DATABASE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "addKey", error: err }, "Error while adding children in the database");
      throw new AppError(KEY_ERRORS.ADD_KEY.ADD_CHILDREN_DATABASE, 400);
    }
  }

  /**
   * Updates an existing key definition.
   * Replaces old iterations/consumers with new ones.
   * @param updated_key - DTO with updated details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if key not found or database operations fail.
   */
  @Transactional()
  async updateKey(updated_key: UpdateKeyDTO, query_runner?: QueryRunner): Promise<void> {
    const existing_key = await this.keyRepository.getKeyById(updated_key.id, query_runner);
    if (!existing_key) {
      logger.error({ operation: "updateKey" }, "Key not found");
      throw new AppError(KEY_ERRORS.UPDATE_KEY.KEY_NOT_FOUND, 400);
    }
    existing_key.name = updated_key.name;
    existing_key.description = updated_key.description;
    let updated_key_model: AllocationKey;
    try {
      updated_key_model = await this.keyRepository.updateKey(existing_key, query_runner);
    } catch (err) {
      logger.error({ operation: "updateKey", error: err }, "An exception occurred while updating a key");
      throw new AppError(KEY_ERRORS.UPDATE_KEY.UPDATE_KEY_DATABASE, 400);
    }
    try {
      const deleted_former_childrens = await this.keyRepository.deleteChildren(updated_key_model, query_runner);
      if (!deleted_former_childrens) {
        logger.error({ operation: "updateKey" }, "Deletion of former childrens failed");
        throw new AppError(KEY_ERRORS.UPDATE_KEY.DELETE_CHILDREN_DATABASE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "updateKey", error: err }, "Deletion of former childrens failed");
      throw new AppError(KEY_ERRORS.UPDATE_KEY.DELETE_CHILDREN_DATABASE, 400);
    }
    try {
      const result = await this.keyRepository.createChildren(updated_key_model, updated_key.iterations, query_runner);
      if (!result) {
        logger.error({ operation: "updateKey" }, "Creating children failed");
        throw new AppError(KEY_ERRORS.UPDATE_KEY.ADD_CHILDREN_DATABASE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "updateKey", error: err }, "Creating children failed");
      throw new AppError(KEY_ERRORS.UPDATE_KEY.ADD_CHILDREN_DATABASE, 400);
    }
  }

  /**
   * Deletes a key by ID.
   * @param key_id - ID of the key to delete.
   * @param query_runner - Database transaction runner.
   * @throws AppError if database delete fails.
   */
  @Transactional()
  async deleteKey(key_id: number, query_runner?: QueryRunner): Promise<void> {
    const delete_result = await this.keyRepository.deleteKey(key_id, query_runner);
    if (delete_result.affected !== 1) {
      logger.error({ operation: "deleteKey" }, "The deletion failed");
      throw new AppError(KEY_ERRORS.DELETE_KEY.DATABASE_DELETE, 400);
    }
  }
}
