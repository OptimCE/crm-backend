import type { QueryRunner } from "typeorm";
import type { CommunitySubscription } from "./annexes-services.models.js";

export interface IAnnexesServicesRepository {
  findActiveByCommunity(internal_community_id: number, query_runner?: QueryRunner): Promise<CommunitySubscription[]>;
  findByCommunityAndFeature(
    internal_community_id: number,
    feature: string,
    query_runner?: QueryRunner,
  ): Promise<CommunitySubscription | null>;
  createSubscription(
    internal_community_id: number,
    feature: string,
    is_active: boolean,
    query_runner?: QueryRunner,
  ): Promise<CommunitySubscription>;
  setActive(subscription_id: number, is_active: boolean, query_runner?: QueryRunner): Promise<void>;
}
