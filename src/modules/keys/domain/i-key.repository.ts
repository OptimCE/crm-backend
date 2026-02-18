import { CreateIterationDTO, CreateKeyDTO, KeyPartialQuery } from "../api/key.dtos.js";
import { AllocationKey } from "./key.models.js";
import { DeleteResult, type QueryRunner } from "typeorm";

export interface IKeyRepository {
  getPartialKeyList(query: KeyPartialQuery, query_runner?: QueryRunner): Promise<[AllocationKey[], number]>;
  getKeyById(key_id: number, query_runner?: QueryRunner): Promise<AllocationKey | null>;
  createKey(new_key: CreateKeyDTO, query_runner?: QueryRunner): Promise<AllocationKey>;
  updateKey(allocation_key: AllocationKey, query_runner?: QueryRunner): Promise<AllocationKey>;
  createChildren(parent_key: AllocationKey, iterations: CreateIterationDTO[], query_runner?: QueryRunner): Promise<boolean>;
  deleteChildren(parent_key: AllocationKey, query_runner?: QueryRunner): Promise<boolean>;
  deleteKey(key_id: number, query_runner?: QueryRunner): Promise<DeleteResult>;
}
