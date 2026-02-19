import type {
  CreateSharingOperationDTO,
  SharingOperationConsumptionQuery,
  SharingOperationMetersQuery,
  SharingOperationPartialQuery,
} from "../api/sharing_operation.dtos.js";
import type { SharingOpConsumption, SharingOperation, SharingOperationKey } from "./sharing_operation.models.js";
import type { DeleteResult, QueryRunner } from "typeorm";
import type { SharingKeyStatus } from "../shared/sharing_operation.types.js";
import type { Meter } from "../../meters/domain/meter.models.js";
import type { KeyPartialQuery } from "../../keys/api/key.dtos.js";

export interface ISharingOperationRepository {
  getSharingOperationList(query: SharingOperationPartialQuery, query_runner?: QueryRunner): Promise<[SharingOperation[], number]>;
  getSharingOperationById(id_sharing: number, query_runner?: QueryRunner): Promise<SharingOperation | null>;
  getSharingOperationConsumption(
    id_sharing: number,
    query: SharingOperationConsumptionQuery,
    query_runner?: QueryRunner,
  ): Promise<SharingOpConsumption[] | null>;
  createSharingOperation(new_sharing_op: CreateSharingOperationDTO, query_runner?: QueryRunner): Promise<SharingOperation>;
  addConsumptions(id_sharing_operation: number, consumptionsToSave: Partial<SharingOpConsumption>[], query_runner?: QueryRunner): Promise<void>;
  getAuthorizedEans(id_sharing_operation: number, query_runner?: QueryRunner): Promise<Set<string>>;
  addKeyToSharing(id_sharing: number, id_key: number, start_date: Date, query_runner?: QueryRunner): Promise<SharingOperationKey>;
  closeSpecificKeyEntry(id_sharing: number, id_key: number, prevEndDate: Date, query_runner?: QueryRunner): Promise<void>;
  closeActiveApprovedKey(id_sharing: number, prevEndDate: Date, query_runner?: QueryRunner): Promise<void>;
  rejectSpecificKeyEntry(id_sharing: number, id_key: number, end_date: Date, query_runner?: QueryRunner): Promise<void>;
  addSharingKeyEntry(
    id_sharing: number,
    id_key: number,
    newStartDate: Date,
    status: SharingKeyStatus,
    query_runner?: QueryRunner,
  ): Promise<SharingOperationKey>;
  deleteSharingOperation(id_sharing: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  getSharingOperationMetersList(id_sharing: number, query: SharingOperationMetersQuery, query_runner?: QueryRunner): Promise<[Meter[], number]>;
  getSharingOperationKeysList(id_sharing: number, query: KeyPartialQuery, query_runner?: QueryRunner): Promise<[SharingOperationKey[], number]>;
}
