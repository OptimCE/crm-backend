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

/**
 * Interface for Meter Service.
 * Defines contract for managing meters, their data, and consumption.
 */
export interface IMeterService {
  /**
   * Retrieves a paginated list of meters.
   * @param queryObject - Filtering and paging parameters.
   * @returns Tuple [List, Pagination].
   */
  getMetersList(queryObject: MeterPartialQuery): Promise<[PartialMeterDTO[], Pagination]>;
  /**
   * Retrieves full details of a meter.
   * @param id - EAN or internal ID.
   * @returns Full Meter DTO.
   */
  getMeter(id: string): Promise<MetersDTO>;
  /**
   * Retrieves consumption data for a meter.
   * @param id - EAN or internal ID.
   * @param query_consumptions - Date range for consumption.
   * @returns Consumption DTO.
   */
  getMeterConsumptions(id: string, query_consumptions: MeterConsumptionQuery): Promise<MeterConsumptionDTO>;
  /**
   * Generates an Excel file buffer with consumption data.
   * @param id - EAN or internal ID.
   * @param query_consumptions - Date range for consumption.
   * @returns Excel file buffer.
   */
  downloadMeterConsumptions(id: string, query_consumptions: MeterConsumptionQuery): Promise<Buffer<ArrayBufferLike>>;
  /**
   * Creates a new meter.
   * @param new_meter - DTO for creation.
   */
  addMeter(new_meter: CreateMeterDTO): Promise<void>;

  /**
   * Update a meter.
   * @param updated_meter - DTO for creation.
   */
  updateMeter(updated_meter: UpdateMeterDTO): Promise<void>;
  /**
   * Updates meter data configuration.
   * @param patched_meter_data - DTO including EAN and new data.
   */
  patchMeterData(patched_meter_data: PatchMeterDataDTO): Promise<void>;
  /**
   * Deletes a meter.
   * @param id - EAN or internal ID.
   */
  deleteMeter(id: string): Promise<void>;
}
