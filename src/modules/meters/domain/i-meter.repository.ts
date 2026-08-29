import type { Meter, MeterConsumption, MeterData } from "./meter.models.js";
import type { DeleteResult, QueryRunner, UpdateResult } from "typeorm";
import type { CreateMeterDTO, MeterConsumptionQuery, MeterMapQuery, MeterPartialQuery, UpdateMeterDTO } from "../api/meter.dtos.js";

export interface IMeterRepository {
  addMeterConsumptions(id_sharing: number, consumptions: (Partial<MeterConsumption> & { ean: string })[], query_runner?: QueryRunner): Promise<void>;
  addMeterData(ean: string, new_data: Partial<MeterData>, query_runner?: QueryRunner): Promise<MeterData>;
  areMetersInCommunity(eans: string[], query_runner?: QueryRunner): Promise<boolean>;
  getLastMeterData(ean: string, query_runner?: QueryRunner): Promise<MeterData | null>;
  countActiveMeterDataForMember(memberId: number, query_runner?: QueryRunner): Promise<number>;
  getMetersList(query: MeterPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]>;

  /**
   * Plottable meters for the map plus the counters the UI needs to be honest
   * about coverage.
   *
   * @param take - Hard cap; the implementation fetches take+1 so the caller can
   *   detect truncation without a second COUNT.
   * @returns [rows, total_plottable, total_matching]
   */
  getMetersMap(query: MeterMapQuery, take: number, query_runner?: QueryRunner): Promise<[Meter[], number, number]>;
  getMeter(id: string, query_runner?: QueryRunner): Promise<Meter | null>;
  getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]>;
  createMeter(new_meter: CreateMeterDTO, query_runner?: QueryRunner): Promise<Meter>;
  deleteMeter(id: string, query_runner?: QueryRunner): Promise<DeleteResult>;
  /**
   * Updates a meter and re-points it at a freshly saved address row.
   *
   * Returns the new address id alongside the UpdateResult so the caller can
   * geocode it. Without that, the service would have to re-read the meter just
   * to learn the id of a row this method already had in hand — and the fact
   * that an update ALWAYS creates a new address row (rather than mutating the
   * old one) is exactly the kind of thing worth making visible at the service
   * boundary rather than leaving buried here.
   */
  updateMeter(
    update_meter: UpdateMeterDTO,
    query_runner?: QueryRunner,
  ): Promise<{ result: UpdateResult; address_id: number }>;
  getMeterData(id: number, query_runner?: QueryRunner): Promise<MeterData | null>;
  deleteMeterData(meter_data: MeterData, query_runner?: QueryRunner): Promise<MeterData>;
  activePreviousInactiveMeterData(
    ean: string,
    previous_start_date: string,
    previous_end_date?: string | null,
    query_runner?: QueryRunner,
  ): Promise<UpdateResult>;
}
