import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import { UserOnboarding } from "../domain/onboarding.models.js";
import type { IOnboardingRepository } from "../domain/i-onboarding.repository.js";
import type { OnboardingOutcome } from "../shared/onboarding.tours.js";

@injectable()
export class OnboardingRepository implements IOnboardingRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  async list(query_runner?: QueryRunner): Promise<UserOnboarding[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager.createQueryBuilder(UserOnboarding, "onboarding");
    // Joins app_user on the caller's auth id: a user whose CRM row does not
    // exist yet (GET /users/ creates it lazily) simply has no states.
    withUserScope(qb, "onboarding");
    return qb.orderBy("onboarding.tour_key", "ASC").getMany();
  }

  async findForUpdate(id_user: number, tour_key: string, query_runner?: QueryRunner): Promise<UserOnboarding | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager
      .createQueryBuilder(UserOnboarding, "onboarding")
      .where("onboarding.id_user = :id_user", { id_user })
      .andWhere("onboarding.tour_key = :tour_key", { tour_key });
    // A row lock needs a transaction; outside one, a plain read is all there is.
    if (query_runner?.isTransactionActive) qb.setLock("pessimistic_write");
    return qb.getOne();
  }

  async insertIfAbsent(
    id_user: number,
    tour_key: string,
    outcome: OnboardingOutcome,
    tour_version: string | null,
    query_runner?: QueryRunner,
  ): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(UserOnboarding)
      .values({ id_user, tour_key, outcome, tour_version })
      .orIgnore()
      .returning(["id_user"])
      .execute();
    return (result.raw as unknown[]).length > 0;
  }

  async update(row: UserOnboarding, query_runner?: QueryRunner): Promise<UserOnboarding> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(UserOnboarding, row);
  }
}
