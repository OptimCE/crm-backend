import type { IMeterService } from "../domain/i-meter.service.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IMeterRepository } from "../domain/i-meter.repository.js";
import {
  CreateMeterDTO,
  MeterConsumptionDTO,
  MeterConsumptionQuery,
  MeterPartialQuery,
  MetersDTO,
  PartialMeterDTO,
  PatchMeterDataDTO,
  UpdateMeterDTO,
} from "../api/meter.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Meter } from "../domain/meter.models.js";
import { toMeterConsumptionDTO, toMeterDTO, toMeterPartialDTO } from "../shared/to_dto.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import * as xlsx from "xlsx";
import type { QueryRunner } from "typeorm";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { METER_ERRORS } from "../shared/meter.errors.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import { Member } from "../../members/domain/member.models.js";
import { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";

/**
 * Service implementation for managing meters.
 * Handles creation, update, deletion, retrieval, and consumption data management.
 */
@injectable()
export class MeterService implements IMeterService {
  constructor(
    @inject("MeterRepository") private meterRepository: IMeterRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  /**
   * Creates a new meter including its physical properties and initial configuration.
   * @param new_meter - DTO with meter details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if meter already exists or DB error.
   */
  @Transactional()
  async addMeter(new_meter: CreateMeterDTO, query_runner?: QueryRunner): Promise<void> {
    // 1. Check if meter exists (EAN Uniqueness)
    // We use query_runner to ensure we see uncommitted changes if any, though likely not needed for this check
    const existing = await this.meterRepository.getMeter(new_meter.EAN, query_runner);
    if (existing) {
      logger.warn({ operation: "addMeter", ean: new_meter.EAN }, "Meter already exists");
      throw new AppError(METER_ERRORS.ADD_METER.ALREADY_EXIST, 409);
    }

    try {
      // 2. Create Physical Meter & Address
      await this.meterRepository.createMeter(new_meter, query_runner);

      // 3. Add Initial Configuration (MeterData)
      // We map the flat DTO structure to the entity structure expected by addMeterData
      const initial = new_meter.initial_data;

      await this.meterRepository.addMeterData(
        new_meter.EAN,
        {
          start_date: initial.start_date.toISOString().split("T")[0],
          end_date: initial.end_date ? initial.end_date.toISOString().split("T")[0] : null,
          status: initial.status,
          rate: initial.rate,
          client_type: initial.client_type,
          description: initial.description,
          sampling_power: initial.sampling_power,
          amperage: initial.amperage,
          grd: initial.grd,
          injection_status: initial.injection_status,
          production_chain: initial.production_chain,
          total_generating_capacity: initial.total_generating_capacity,
          member: initial.member_id ? ({ id: initial.member_id } as Member) : null,
          sharing_operation: initial.sharing_operation_id ? ({ id: initial.sharing_operation_id } as SharingOperation) : null,
        },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "addMeter", error: err }, "Failed to create meter");
      throw new AppError(METER_ERRORS.ADD_METER.DATABASE_ADD, 400);
    }
  }
  /**
   * Deletes a meter.
   * @param id - EAN or internal ID of the meter to delete.
   * @param query_runner - Database transaction runner.
   * @throws AppError if deletion fails.
   */
  @Transactional()
  async deleteMeter(id: string, query_runner?: QueryRunner): Promise<void> {
    const deleted = await this.meterRepository.deleteMeter(id, query_runner);
    console.log(`DELETED : ${deleted}`);
    console.log(deleted);
    if (deleted.affected !== 1) {
      logger.error({ operation: "deleteMeter" }, "Failed to delete meter");
      throw new AppError(METER_ERRORS.DELETE_METER.DATABASE_DELETE, 400);
    }
  }

  /**
   * Generates an Excel file buffer containing consumption data for a specific meter.
   * @param id - EAN or internal ID.
   * @param query - Date range for filtering.
   * @returns Buffer containing the Excel file.
   * @throws AppError if no consumptions found.
   */
  async downloadMeterConsumptions(id: string, query: MeterConsumptionQuery): Promise<Buffer> {
    const consumptions = await this.meterRepository.getMeterConsumptions(id, query);

    if (!consumptions || consumptions.length === 0) {
      let message = `No consumptions found for meter ${id}`;
      if (query.date_start && query.date_end) {
        message += ` between ${query.date_start} and ${query.date_end}`;
      }
      logger.warn({ operation: "downloadMeterConsumptions" }, message);
      throw new AppError(METER_ERRORS.DOWNLOAD_METER_CONSUMPTIONS.NO_CONSUMPTIONS, 400);
    }

    const data = consumptions.map((c) => ({
      Timestamp: c.timestamp,
      Gross: c.gross,
      Net: c.net,
      Shared: c.shared,
      "Injection Gross": c.inj_gross,
      "Injection Net": c.inj_net,
      "Injection Shared": c.inj_shared,
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Consommations");

    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Retrieves full details of a meter.
   * @param id - EAN or internal ID.
   * @returns Full Meter DTO.
   * @throws AppError if meter not found.
   */
  async getMeter(id: string): Promise<MetersDTO> {
    const value: Meter | null = await this.meterRepository.getMeter(id);
    if (!value) {
      logger.error({ operation: "getMeter" }, `No meter found with id ${id} found`);
      throw new AppError(METER_ERRORS.GET_METER.METER_NOT_FOUND, 400);
    }
    return toMeterDTO(value);
  }

  /**
   * Retrieves consumption data for a specific meter.
   * @param id - EAN or internal ID.
   * @param query_consumptions - Date range.
   * @returns MeterConsumptionDTO.
   */
  async getMeterConsumptions(id: string, query_consumptions: MeterConsumptionQuery): Promise<MeterConsumptionDTO> {
    // Retrieve consumption data from repository
    const consumptions = await this.meterRepository.getMeterConsumptions(id, query_consumptions);
    // Transform to DTO
    return toMeterConsumptionDTO(id, consumptions);
  }

  /**
   * Retrieves a paginated list of meters.
   * @param query - Filtering/paging parameters.
   * @returns Tuple [List, Pagination].
   */
  async getMetersList(query: MeterPartialQuery): Promise<[PartialMeterDTO[], Pagination]> {
    const [values, total]: [Meter[], number] = await this.meterRepository.getMetersList(query);
    const return_values = values.map((value) => toMeterPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Updates/Patches meter data configuration for a specific period.
   * Creates a new MeterData entry linked to the meter.
   * @param patched_meter_data - DTO containing EAN and new configuration.
   * @param query_runner - Database transaction runner.
   * @throws AppError if meter not found or DB error.
   */
  @Transactional()
  async patchMeterData(patched_meter_data: PatchMeterDataDTO, query_runner?: QueryRunner): Promise<void> {
    // 1. Check if meter exists
    const meter = await this.meterRepository.getMeter(patched_meter_data.EAN, query_runner);
    if (!meter) {
      logger.warn({ operation: "patchMeterData", ean: patched_meter_data.EAN }, "Meter not found");
      throw new AppError(METER_ERRORS.PATCH_METER_DATA.METER_NOT_FOUND, 400);
    }

    try {
      await this.meterRepository.addMeterData(
        patched_meter_data.EAN,
        {
          start_date: patched_meter_data.start_date.toISOString().split("T")[0],
          end_date: patched_meter_data.end_date ? patched_meter_data.end_date.toISOString().split("T")[0] : null,
          status: patched_meter_data.status,
          rate: patched_meter_data.rate,
          client_type: patched_meter_data.client_type,
          description: patched_meter_data.description,
          sampling_power: patched_meter_data.sampling_power,
          amperage: patched_meter_data.amperage,
          grd: patched_meter_data.grd,
          injection_status: patched_meter_data.injection_status,
          production_chain: patched_meter_data.production_chain,
          total_generating_capacity: patched_meter_data.total_generating_capacity,
          member: patched_meter_data.member_id ? ({ id: patched_meter_data.member_id } as Member) : null,
          sharing_operation: patched_meter_data.sharing_operation_id ? ({ id: patched_meter_data.sharing_operation_id } as SharingOperation) : null,
        },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "patchMeterData", error: err }, "Failed to patch meter data");
      throw new AppError(METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE, 400);
    }
  }
  @Transactional()
  async updateMeter(updated_meter: UpdateMeterDTO, query_runner?: QueryRunner): Promise<void> {
    try {
      const updated_result = await this.meterRepository.updateMeter(updated_meter, query_runner);
      if (updated_result.affected !== 1) {
        logger.error({ operation: "updateMeter" }, "Failed to update meter");
        throw new AppError(METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "updateMeter", error: err }, "Failed to update meter");
      throw new AppError(METER_ERRORS.PATCH_METER_DATA.DATABASE_UPDATE, 400);
    }
  }
}
