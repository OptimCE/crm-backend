import {Meter, MeterConsumption, MeterData} from "./meter.models.js";
import {DeleteResult, type QueryRunner, UpdateResult} from "typeorm";
import {CreateMeterDTO, MeterConsumptionQuery, MeterPartialQuery, UpdateMeterDTO} from "../api/meter.dtos.js";
import {Address} from "../../../shared/address/address.models.js";

export interface IMeterRepository{
    addMeterConsumptions(id_sharing: number, consumptions: (Partial<MeterConsumption> & { ean: string })[], query_runner?: QueryRunner): Promise<void>
    addMeterData(ean: string, new_data: Partial<MeterData>, query_runner?: QueryRunner): Promise<MeterData>
    areMetersInCommunity(eans: string[], query_runner?: QueryRunner): Promise<boolean>
    getLastMeterData(ean: string, query_runner?: QueryRunner): Promise<MeterData|null>
    getMetersList(query: MeterPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]>;
    getMeter(id: string, query_runner?: QueryRunner): Promise<Meter|null>;
    getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]>
    createMeter(new_meter: CreateMeterDTO, query_runner?: QueryRunner): Promise<Meter>;
    deleteMeter(id: string, query_runner?: QueryRunner): Promise<DeleteResult>;
    updateMeter(update_meter: UpdateMeterDTO, query_runner?: QueryRunner): Promise<UpdateResult>;
}