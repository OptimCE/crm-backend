import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { CommunitySubscription } from "../domain/annexes-services.models.js";
import type { IAnnexesServicesRepository } from "../domain/i-annexes-services.repository.js";

@injectable()
export class AnnexesServicesRepository implements IAnnexesServicesRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  async findActiveByCommunity(internal_community_id: number, query_runner?: QueryRunner): Promise<CommunitySubscription[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.find(CommunitySubscription, {
      where: { id_community: internal_community_id, is_active: true },
    });
  }

  async findByCommunityAndFeature(
    internal_community_id: number,
    feature: string,
    query_runner?: QueryRunner,
  ): Promise<CommunitySubscription | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.findOne(CommunitySubscription, {
      where: { id_community: internal_community_id, feature },
    });
  }

  async createSubscription(
    internal_community_id: number,
    feature: string,
    is_active: boolean,
    query_runner?: QueryRunner,
  ): Promise<CommunitySubscription> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const subscription = manager.create(CommunitySubscription, {
      id_community: internal_community_id,
      feature,
      is_active,
    });
    return manager.save(CommunitySubscription, subscription);
  }

  async setActive(subscription_id: number, is_active: boolean, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    await manager.update(CommunitySubscription, { id: subscription_id }, { is_active });
  }
}
