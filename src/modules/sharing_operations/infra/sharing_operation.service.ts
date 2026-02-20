import type { ISharingOperationService } from "../domain/i-sharing_operation.service.js";
import { inject, injectable } from "inversify";
import type { ISharingOperationRepository } from "../domain/i-sharing_operation.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
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
} from "../api/sharing_operation.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SharingOpConsumption, SharingOperation, SharingOperationKey } from "../domain/sharing_operation.models.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { toSharingOperation, toSharingOperationConsumptions, toSharingOperationKeyDTO, toSharingOperationPartialDTO } from "../shared/to_dto.js";
import * as xlsx from "xlsx";
import type { QueryRunner } from "typeorm";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { IMeterRepository } from "../../meters/domain/i-meter.repository.js";
import { Meter, MeterConsumption } from "../../meters/domain/meter.models.js";
import type { IKeyRepository } from "../../keys/domain/i-key.repository.js";
import { SHARING_OPERATION_ERRORS } from "../shared/sharing_operation.errors.js";
import { MEMBER_ERRORS } from "../../members/shared/member.errors.js";
import { SharingKeyStatus } from "../shared/sharing_operation.types.js";
import { MeterDataStatus } from "../../meters/shared/meter.types.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import { PartialMeterDTO } from "../../meters/api/meter.dtos.js";
import { toMeterPartialDTO } from "../../meters/shared/to_dto.js";
import { KeyPartialQuery } from "../../keys/api/key.dtos.js";

@injectable()
export class SharingOperationService implements ISharingOperationService {
  constructor(
    @inject("SharingOperationRepository") private sharing_operationRepository: ISharingOperationRepository,
    @inject("MeterRepository") private meterRepository: IMeterRepository,
    @inject("KeyRepository") private keyRepository: IKeyRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  /**
   * Uploads and processes consumption data from an Excel file.
   * Parses the file, validates EANs against authorized meters, aggregates data globally and per meter,
   * and saves it to the database.
   * @param dto - DTO containing the file and sharing operation ID.
   * @param query_runner - Optional query runner for transaction.
   * @throws AppError if file parsing fails, validation fails, or database error occurs.
   */
  @Transactional()
  async addConsumptionDataToSharing(dto: AddConsumptionDataDTO, query_runner?: QueryRunner): Promise<void> {
    // 1. Parse the Excel File
    const buffer = dto.file.buffer;
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetNames = ["Brut Rep", "Partagé Rep", "Net Rep"];

    // 1.5 Get Authorized EANs for this Sharing Operation
    // We fetch the list of EANs that have a MeterData entry linked to this Sharing Operation (Active or Historic)
    // This ensures we only aggregate/save data for meters that are actually part of the operation.
    const authorizedEansSet = await this.sharing_operationRepository.getAuthorizedEans(dto.id_sharing_operation, query_runner);
    if (authorizedEansSet.size === 0) {
      logger.error({ operation: "addConsumptionDataToSharing" }, "No meter authorized to be added");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.NO_METER_AUTHORIZED, 400);
    }
    // Data Structures
    const parsedSheets: Record<
      string,
      {
        timestamp: string;
        dateObj: Date;
        ean: string;
        type: string;
        value: number;
      }[]
    > = {};

    // Map<EAN, Map<ISO_TIMESTAMP, Data>>
    const meterMap = new Map<
      string,
      Map<
        string,
        {
          timestamp: Date;
          gross: number;
          net: number;
          shared: number;
          inj_gross: number;
          inj_net: number;
          inj_shared: number;
        }
      >
    >();

    const sharingAgg = new Map<
      string, // ISO Timestamp
      {
        timestamp: Date;
        gross: number;
        net: number;
        shared: number;
        inj_gross: number;
        inj_net: number;
        inj_shared: number;
      }
    >();

    // 2. Iterate Sheets and Rows
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue; // Skip if sheet missing

      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      if (rows.length < 2) continue;

      const headers: string[] = rows[0] as string[];
      const eans = rows[1] as (string | number | null)[];

      // Map columns to EANs and Types
      const columnMap = headers
        .map((header, index) => {
          const type = header.includes("Prélèvement") ? "consumption" : header.includes("Injection") ? "injection" : null;
          // Check if EAN is present AND is authorized for this sharing operation
          const ean = eans[index] ? String(eans[index]).trim() : null;

          return type && ean && authorizedEansSet.has(ean) ? { index, ean: ean, type } : null;
        })
        .filter((item): item is { index: number; ean: string; type: string } => item !== null);

      const sheetData: {
        timestamp: string;
        dateObj: Date;
        ean: string;
        type: string;
        value: number;
      }[] = [];

      // Skip headers (start at index 4 based on legacy code)
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        const rawTimestamp = row[0] as string | number | null;
        if (!rawTimestamp) continue;

        const timestamp = this.parseExcelDate(rawTimestamp);
        const isoTimestamp = timestamp.toISOString();

        for (const col of columnMap) {
          const value = row[col.index] as string | number | null;
          if (value === null || value === undefined) continue;
          const numValue = typeof value === "number" ? value : parseFloat(String(value));
          if (isNaN(numValue)) continue;

          sheetData.push({
            timestamp: isoTimestamp,
            dateObj: timestamp,
            ean: col.ean,
            type: col.type,
            value: numValue,
          });

          // --- Aggregation Logic (Global) ---

          // 1. Init Aggregation map if missing
          if (!sharingAgg.has(isoTimestamp)) {
            sharingAgg.set(isoTimestamp, {
              timestamp: timestamp,
              gross: 0,
              net: 0,
              shared: 0,
              inj_gross: 0,
              inj_net: 0,
              inj_shared: 0,
            });
          }
          const agg = sharingAgg.get(isoTimestamp)!;

          // 2. Aggregate values based on Sheet and Type
          if (col.type === "consumption") {
            if (sheetName === "Brut Rep") agg.gross += numValue;
            if (sheetName === "Net Rep") agg.net += numValue;
            if (sheetName === "Partagé Rep") agg.shared += numValue;
          } else if (col.type === "injection") {
            if (sheetName === "Brut Rep") agg.inj_gross += numValue;
            if (sheetName === "Net Rep") agg.inj_net += numValue;
            if (sheetName === "Partagé Rep") agg.inj_shared += numValue;
          }

          // --- Aggregation Logic (Meter) ---

          if (!meterMap.has(col.ean)) {
            meterMap.set(col.ean, new Map());
          }
          const meterTimeMap = meterMap.get(col.ean)!;

          if (!meterTimeMap.has(isoTimestamp)) {
            meterTimeMap.set(isoTimestamp, {
              timestamp: timestamp,
              gross: 0,
              net: 0,
              shared: 0,
              inj_gross: 0,
              inj_net: 0,
              inj_shared: 0,
            });
          }
          const meterAgg = meterTimeMap.get(isoTimestamp)!;

          if (col.type === "consumption") {
            if (sheetName === "Brut Rep") meterAgg.gross = numValue;
            if (sheetName === "Net Rep") meterAgg.net = numValue;
            if (sheetName === "Partagé Rep") meterAgg.shared = numValue;
          } else if (col.type === "injection") {
            if (sheetName === "Brut Rep") meterAgg.inj_gross = numValue;
            if (sheetName === "Net Rep") meterAgg.inj_net = numValue;
            if (sheetName === "Partagé Rep") meterAgg.inj_shared = numValue;
          }
        }
      }
      parsedSheets[sheetName] = sheetData;
    }

    // 3. Prepare Data for Repository

    // 3a. Global Consumption
    const consumptionsToSave: Partial<SharingOpConsumption>[] = Array.from(sharingAgg.values()).map((agg) => ({
      timestamp: agg.timestamp,
      gross: agg.gross,
      net: agg.net,
      shared: agg.shared,
      inj_gross: agg.inj_gross,
      inj_net: agg.inj_net,
      inj_shared: agg.inj_shared,
    }));

    // 3b. Meter Consumption
    const meterConsumptionsToSave: (Partial<MeterConsumption> & { ean: string })[] = [];
    for (const [ean, timeMap] of meterMap.entries()) {
      for (const agg of timeMap.values()) {
        meterConsumptionsToSave.push({
          ean: ean,
          timestamp: agg.timestamp,
          gross: agg.gross,
          net: agg.net,
          shared: agg.shared,
          inj_gross: agg.inj_gross,
          inj_net: agg.inj_net,
          inj_shared: agg.inj_shared,
        });
      }
    }

    if (consumptionsToSave.length === 0) {
      logger.warn({ operation: "addConsumptionData" }, "No consumption data found in file");
      return;
    }

    // 4. Save to Repository
    try {
      // Save global aggregation
      await this.sharing_operationRepository.addConsumptions(dto.id_sharing_operation, consumptionsToSave, query_runner);

      // Save meter-specific consumption if any
      if (meterConsumptionsToSave.length > 0) {
        await this.meterRepository.addMeterConsumptions(dto.id_sharing_operation, meterConsumptionsToSave, query_runner);
      }
    } catch (err) {
      logger.error({ operation: "addConsumptionData", error: err }, "Failed to save consumption data");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_CONSUMPTION_DATA.DATABASE_ADD, 400);
    }
  }

  /**
   * Helper to parse Excel dates (which can be strings or numbers).
   * @param date - Date value from Excel (number or string).
   * @returns Parsed Date object.
   * @throws AppError if date format is invalid.
   */
  private parseExcelDate(date: string | number): Date {
    if (typeof date === "number") {
      // Excel dates are days since 1900-01-01. JS is ms since 1970.
      // approx conversion: (value - 25569) * 86400 * 1000
      // Or use xlsx helper:
      const parsed = xlsx.SSF.parse_date_code(date);
      return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
    }
    // Try parsing string directly
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      logger.error({ operation: "parseExcelData" }, "Invalid date format in Excel");
      throw new AppError(SHARING_OPERATION_ERRORS.PARSE_EXCEL_DATA.INVALID_DATE_FORMAT, 400);
    }
    return parsedDate;
  }
  /**
   * Adds an allocation key to a sharing operation, setting it to a pending/waiting status.
   * Validates both the sharing operation and the key exist.
   * @param new_key_to_operation - DTO with key ID and sharing ID.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async addKeyToSharing(new_key_to_operation: AddKeyToSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    const { id_sharing, id_key } = new_key_to_operation;

    // 1. Validate Sharing Operation
    const sharingOp = await this.sharing_operationRepository.getSharingOperationById(id_sharing, query_runner);
    if (!sharingOp) {
      logger.warn({ operation: "addKeyToSharing", id_sharing }, "Sharing operation not found or not accessible");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.SHARING_OPERATION_NOT_FOUND, 400);
    }

    // 2. Validate Key
    // Assuming KeyRepository has a method to get/validate key by ID.
    // If not, we should at least try to fetch it.
    const key = await this.keyRepository.getKeyById(id_key, query_runner);
    if (!key) {
      logger.warn({ operation: "addKeyToSharing", id_key }, "Allocation Key not found or not accessible");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.ALLOCATION_KEY_NOT_FOUND, 400);
    }

    // 3. Add Key to Sharing Operation
    try {
      // We use current date as start_date since DTO doesn't provide it
      await this.sharing_operationRepository.addKeyToSharing(id_sharing, id_key, new Date(), query_runner);
    } catch (err) {
      logger.error({ operation: "addKeyToSharing", error: err }, "Failed to add key to sharing operation");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_KEY_TO_SHARING.DATABASE_ADD, 400);
    }
  }

  /**
   * Adds a list of meters to a sharing operation.
   * Validates that meters participate in the community and adds them with 'WAITING_GRD' status.
   * @param new_meters_to_operation - DTO with meter EANs and sharing ID.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async addMeterToSharing(new_meters_to_operation: AddMeterToSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    const { id_sharing, date, ean_list } = new_meters_to_operation;

    // 1. Security Check: Sharing Operation
    // Verify the sharing operation exists and belongs to the user's community.
    // The repository method automatically applies the community scope.
    const sharingOp = await this.sharing_operationRepository.getSharingOperationById(id_sharing, query_runner);
    if (!sharingOp) {
      logger.warn({ operation: "addMeterToSharing", id_sharing }, "Sharing operation not found or not accessible");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.SHARING_OPERATION_NOT_FOUND, 400);
    }

    // 2. Security Check: Meters
    // Verify that all meters in the list exist and belong to the user's community.
    const areMetersValid = await this.meterRepository.areMetersInCommunity(ean_list, query_runner);
    if (!areMetersValid) {
      logger.warn({ operation: "addMeterToSharing", ean_list }, "One or more meters not found in the community");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.METERS_INVALID, 400);
    }

    try {
      for (const ean of ean_list) {
        await this.meterRepository.addMeterData(
          ean,
          {
            sharing_operation: { id: id_sharing } as SharingOperation,
            start_date: new Date(date).toISOString().split("T")[0], // Ensure YYYY-MM-DD
            status: MeterDataStatus.WAITING_GRD,
          },
          query_runner,
        );
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "addMeterToSharing", error: err }, "Failed to add meters to sharing operation");
      throw new AppError(SHARING_OPERATION_ERRORS.ADD_METER_TO_SHARING.DATABASE_ADD, 400);
    }
  }

  /**
   * Creates a new sharing operation entity.
   * @param new_sharing_operations - DTO with details for the new operation.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async createSharingOperation(new_sharing_operations: CreateSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    try {
      await this.sharing_operationRepository.createSharingOperation(new_sharing_operations, query_runner);
    } catch (err) {
      logger.error({ operation: "createSharingOperation", error: err }, `An error occurred while saving a new sharing operation`);
      throw new AppError(SHARING_OPERATION_ERRORS.CREATE_SHARING_OPERATION.DATABASE_ADD, 400);
    }
  }

  /**
   * Retrieves a sharing operation by ID.
   * @param id_sharing - ID of the sharing operation.
   * @returns SharingOperationDTO.
   * @throws AppError if not found.
   */
  async getSharingOperation(id_sharing: number): Promise<SharingOperationDTO> {
    const value: SharingOperation | null = await this.sharing_operationRepository.getSharingOperationById(id_sharing);
    if (!value) {
      logger.error({ operation: "getSharingOperation" }, `No sharing operation found with id ${id_sharing} found`);
      throw new AppError(SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND, 400);
    }
    return toSharingOperation(value);
  }

  /**
   * Retrieves consumption data for a sharing operation based on query parameters.
   * @param id_sharing - ID of the sharing operation.
   * @param query - Date range filters.
   * @returns SharingOpConsumptionDTO with time series data.
   * @throws AppError if no data found.
   */
  async getSharingOperationConsumption(id_sharing: number, query: SharingOperationConsumptionQuery): Promise<SharingOpConsumptionDTO> {
    const values: SharingOpConsumption[] | null = await this.sharing_operationRepository.getSharingOperationConsumption(id_sharing, query);
    if (!values || values.length === 0) {
      let message = `No sharing operation consumptions found with id ${id_sharing} found`;
      if (query.date_start && query.date_end) {
        message += ` between ${query.date_start} and ${query.date_end}`;
      } else {
        if (query.date_end) {
          message += ` that start at ${query.date_start}`;
        }
        if (query.date_end) {
          message += ` that end at ${query.date_end}`;
        }
      }
      logger.error({ operation: "getSharingOperationConsumption" }, message);
      throw new AppError(SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND, 400);
    }
    return toSharingOperationConsumptions(values);
  }

  /**
   * Generates an Excel file containing consumption data.
   * @param id_sharing - ID of the sharing operation.
   * @param query - Date range filters.
   * @param query_runner - Optional query runner.
   * @returns Buffer containing the Excel file.
   */
  async downloadSharingOperationConsumptions(
    id_sharing: number,
    query: SharingOperationConsumptionQuery,
    query_runner?: QueryRunner,
  ): Promise<Buffer> {
    // 1. Fetch data using the existing repository method
    const consumptions = await this.sharing_operationRepository.getSharingOperationConsumption(id_sharing, query, query_runner);

    if (!consumptions || consumptions.length === 0) {
      let message = `No sharing operation consumptions found for id ${id_sharing}`;
      if (query.date_start && query.date_end) {
        message += ` between ${query.date_start} and ${query.date_end}`;
      }
      logger.warn({ operation: "downloadSharingOperationConsumptions" }, message);
      throw new AppError(SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION_CONSUMPTION.NO_CONSUMPTION_FOUND, 400);
    }

    // 2. Map data to Excel friendly format (Flat object)
    const data = consumptions.map((c) => ({
      Timestamp: c.timestamp,
      Gross: c.gross,
      Net: c.net,
      Shared: c.shared,
      "Injection Gross": c.inj_gross,
      "Injection Net": c.inj_net,
      "Injection Shared": c.inj_shared,
    }));

    // 3. Create Excel
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Consommations");

    // 4. Return Buffer
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Retrieves a paginated list of sharing operations.
   * @param query - Query parameters for filtering and pagination.
   * @returns Tuple of [List, Pagination].
   */
  async getSharingOperationList(query: SharingOperationPartialQuery): Promise<[SharingOperationPartialDTO[], Pagination]> {
    const [values, total]: [SharingOperation[], number] = await this.sharing_operationRepository.getSharingOperationList(query);
    const return_values = values.map((value) => toSharingOperationPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Updates the status of an allocation key within a sharing operation.
   * Handles lifecycle logic: closing previous keys, activating new ones, etc.
   * @param patched_key_status - DTO with key ID and new status.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async patchKeyStatus(patched_key_status: PatchKeyToSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    const { id_sharing, id_key, status, date } = patched_key_status;

    // 1. Validate existence (Optional if we assume IDs are correct, but good for safety)
    const sharingOp = await this.sharing_operationRepository.getSharingOperationById(id_sharing, query_runner);
    if (!sharingOp) {
      logger.error({ operation: "patchKeyStatus" }, `Sharing Operation with Id (${id_sharing}) was not found`);
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.SHARING_OPERATION_NOT_FOUND, 400);
    }

    const newStartDate = new Date(date);
    const prevEndDate = new Date(newStartDate);
    // Set end date to "start date - 1 day"
    prevEndDate.setDate(prevEndDate.getDate() - 1);

    try {
      if (status === SharingKeyStatus.REJECTED) {
        await this.sharing_operationRepository.rejectSpecificKeyEntry(id_sharing, id_key, prevEndDate, query_runner);
        return;
      }

      if (status === SharingKeyStatus.APPROVED) {
        // Close any currently active approved key for this sharing op (so only one active)
        // (depends on your model; keep if needed)
        await this.sharing_operationRepository.closeActiveApprovedKey(id_sharing, prevEndDate, query_runner);

        // Close the current open entry for this key (pending)
        await this.sharing_operationRepository.closeSpecificKeyEntry(id_sharing, id_key, prevEndDate, query_runner);

        // Create the new approved entry starting at decisionDate (if your model uses a new row)
        await this.sharing_operationRepository.addSharingKeyEntry(id_sharing, id_key, prevEndDate, status, query_runner);
        return;
      }
    } catch (err) {
      logger.error({ operation: "patchKeyStatus", error: err }, "Failed to patch key status");
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_KEY_STATUS.DATABASE_UPDATE, 400);
    }
  }
  /**
   * Updates the status of a meter within a sharing operation.
   * Validates meter existence, community membership, and current linkage to the operation.
   * @param patched_meter_status - DTO with meter EAN and new status.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async patchMeterStatus(patched_meter_status: PatchMeterToSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    if (!query_runner) {
      logger.error({ operation: "patchMeterStatus" }, "Query runner undefined");
      throw new AppError(MEMBER_ERRORS.DATABASE.QUERY_RUNNER_MANDATORY, 400);
    }
    const { id_sharing, id_meter, status, date } = patched_meter_status;

    // 1. Validate Sharing Operation
    const sharingOp = await this.sharing_operationRepository.getSharingOperationById(id_sharing, query_runner);
    if (!sharingOp) {
      logger.error({ operation: "patchMeterStatus" }, `The sharing operation id ${id_sharing} was not found`);
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.SHARING_OPERATION_NOT_FOUND, 400);
    }

    // 2. Validate Meter Community (Security)
    const isMeterInCommunity = await this.meterRepository.areMetersInCommunity([id_meter], query_runner);
    if (!isMeterInCommunity) {
      logger.error({ operation: "patchMeterStatus", id_meter }, "Meter not found in community");
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_IN_COMMUNITY, 400);
    }

    // 3. Validate Consistency: Is the meter currently linked to this sharing operation?
    // We check the latest configuration to ensure we are patching the correct "active" state.
    const latestMeterData = await this.meterRepository.getLastMeterData(id_meter, query_runner);

    if (!latestMeterData) {
      logger.error({ operation: "patchMeterStatus" }, "No latest meter data found");
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.LATEST_METER_DATA_NOT_FOUND, 400);
    }

    // Check if the current sharing operation matches the one we are trying to patch
    if (latestMeterData.sharing_operation?.id !== id_sharing) {
      logger.warn(
        {
          operation: "patchMeterStatus",
          id_meter,
          current_sharing: latestMeterData.sharing_operation?.id,
          target_sharing: id_sharing,
        },
        "Attempt to patch meter status for a sharing operation it is not currently part of",
      );
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.METER_NOT_PART_OF_SHARING, 400);
    }

    // 4. Delegate to MeterRepository to handle history/update
    // id_meter corresponds to the EAN (string) of the meter directly
    try {
      await this.meterRepository.addMeterData(
        id_meter,
        {
          sharing_operation: { id: id_sharing } as SharingOperation,
          start_date: new Date(date).toISOString().split("T")[0],
          status: status,
        },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "patchMeterStatus", error: err }, "Failed to patch meter status");
      throw new AppError(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.DATABASE_ADD, 400);
    }
  }

  /**
   * Deletes a sharing operation.
   * @param id_sharing - ID of the operation to delete.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async deleteSharingOperation(id_sharing: number, query_runner?: QueryRunner): Promise<void> {
    const delete_result = await this.sharing_operationRepository.deleteSharingOperation(id_sharing, query_runner);
    if (delete_result.affected !== 1) {
      logger.error({ operation: "deleteSharingOperation" }, "The deletion failed");
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.DATABASE_DELETE, 400);
    }
  }
  /**
   * Removes a meter from a sharing operation (logically deletes the link by setting status to INACTIVE).
   * @param removed_meter_status - DTO with meter EAN and operation ID.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async deleteMeterFromSharingOperation(removed_meter_status: RemoveMeterFromSharingOperationDTO, query_runner?: QueryRunner): Promise<void> {
    const { id_sharing, id_meter, date } = removed_meter_status;

    // 1. Validate Sharing Operation
    const sharingOp = await this.sharing_operationRepository.getSharingOperationById(id_sharing, query_runner);
    if (!sharingOp) {
      logger.error({ operation: "deleteMeterFromSharingOperation" }, `The sharing operation id ${id_sharing} was not found`);
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.SHARING_OPERATION_NOT_FOUND, 400);
    }

    // 2. Validate Meter Community (Security)
    const isMeterInCommunity = await this.meterRepository.areMetersInCommunity([id_meter], query_runner);
    if (!isMeterInCommunity) {
      logger.error({ operation: "deleteMeterFromSharingOperation", id_meter }, "Meter not found in community");
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_IN_COMMUNITY, 400);
    }

    // 3. Validate Consistency: Is the meter currently linked to this sharing operation?
    const latestMeterData = await this.meterRepository.getLastMeterData(id_meter, query_runner);

    if (!latestMeterData) {
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.LATEST_METER_DATA_NOT_FOUND, 400);
    }

    if (latestMeterData.sharing_operation?.id !== id_sharing) {
      logger.warn(
        {
          operation: "deleteMeterFromSharingOperation",
          id_meter,
          current_sharing: latestMeterData.sharing_operation?.id,
          target_sharing: id_sharing,
        },
        "Attempt to remove meter from a sharing operation it is not currently part of",
      );
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.METER_NOT_PART_OF_SHARING, 400);
    }

    // 4. Delegate to MeterRepository to handle history/update
    // Set sharingOperation to null and status to INACTIVE
    try {
      await this.meterRepository.addMeterData(
        id_meter,
        {
          sharing_operation: null,
          start_date: new Date(date).toISOString().split("T")[0],
          status: MeterDataStatus.INACTIVE,
        },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "deleteMeterFromSharingOperation", error: err }, "Failed to remove meter from sharing operation");
      throw new AppError(SHARING_OPERATION_ERRORS.DELETE_METER_FROM_SHARING.DATABASE_ADD, 400);
    }
  }

  async getSharingOperationMetersList(sharing_operation_id: number, query: SharingOperationMetersQuery): Promise<[PartialMeterDTO[], Pagination]> {
    const [values, total]: [Meter[], number] = await this.sharing_operationRepository.getSharingOperationMetersList(sharing_operation_id, query);
    const return_values = values.map((value) => toMeterPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getSharingOperationKeysList(sharing_operation_id: number, query: KeyPartialQuery): Promise<[SharingOperationKeyDTO[], Pagination]> {
    const [values, total]: [SharingOperationKey[], number] = await this.sharing_operationRepository.getSharingOperationKeysList(
      sharing_operation_id,
      query,
    );
    const return_values = values.map((value) => toSharingOperationKeyDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }
}
