import {
    CreateSharingOperationDTO,
    SharingOperationConsumptionQuery,
    SharingOperationPartialQuery
} from "../api/sharing_operation.dtos.js";
import {
    SharingOpConsumption,
    SharingOperation,
    SharingOperationKey
} from "./sharing_operation.models.js";
import {DeleteResult, type QueryRunner} from "typeorm";
import {SharingKeyStatus} from "../shared/sharing_operation.types.js";

export interface ISharingOperationRepository{
    getSharingOperationList(query: SharingOperationPartialQuery, query_runner?: QueryRunner): Promise<[SharingOperation[], number]>;
    getSharingOperationById(id_sharing: number, query_runner?: QueryRunner): Promise<SharingOperation | null>;
    getSharingOperationConsumption(id_sharing: number, query: SharingOperationConsumptionQuery, query_runner?: QueryRunner): Promise<SharingOpConsumption[] | null>;
    createSharingOperation(new_sharing_op: CreateSharingOperationDTO, query_runner?: QueryRunner): Promise<SharingOperation>
    addConsumptions(id_sharing_operation: number, consumptionsToSave: Partial<SharingOpConsumption>[], query_runner?: QueryRunner): any;
    getAuthorizedEans(id_sharing_operation: number, query_runner?: QueryRunner): Promise<Set<string>>;
    addKeyToSharing(id_sharing: number, id_key: number, start_date: Date, query_runner?: QueryRunner): Promise<SharingOperationKey>
    closeSpecificKeyEntry(id_sharing: number, id_key: number, prevEndDate: Date, query_runner?: QueryRunner): any;
    closeActiveApprovedKey(id_sharing: number, prevEndDate: Date, query_runner?: QueryRunner): any;
    addSharingKeyEntry(id_sharing: number, id_key: number, newStartDate: Date, status: SharingKeyStatus, query_runner?: QueryRunner): any;
    deleteSharingOperation(id_sharing: number, query_runner?: QueryRunner): Promise<DeleteResult> ;
}