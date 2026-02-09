import type {QueryRunner} from "typeorm";

export interface IAuthContextRepository{
    getInternalCommunityId(query_runner?: QueryRunner): Promise<number>;
    getInternalUserId(query_runner?: QueryRunner): Promise<number>;
}