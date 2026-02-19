import type { IKeyRepository } from "../domain/i-key.repository.js";
import { CreateConsumerDTO, CreateIterationDTO, CreateKeyDTO, KeyPartialQuery } from "../api/key.dtos.js";
import { AllocationKey, Consumer, Iteration } from "../domain/key.models.js";
import { inject, injectable } from "inversify";
import { DeleteResult, type QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";

import logger from "../../../shared/monitor/logger.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";

@injectable()
export class KeyRepository implements IKeyRepository {
  /**
   * Creates a new KeyRepository instance
   *
   * @param dataSource - Data source for database operations
   * @param authContext - Auth context to retrieve internal ids
   */
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}

  keyPartialFilters: FilterDef<AllocationKey>[] = [
    {
      key: "description",
      apply: (qb, val) => qb.andWhere("key.description LIKE :desc", { desc: `%${val}%` }),
    },
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("key.name LIKE :name", { name: `%${val}%` }),
    },
  ];
  keyPartialSorts: SortDef<AllocationKey>[] = [
    {
      key: "sort_name", // Looks for 'sort_name' in the DTO
      apply: (qb, direction) => qb.addOrderBy("key.name", direction),
    },
  ];
  getPartialKeyList(queryDto: KeyPartialQuery, query_runner?: QueryRunner): Promise<[AllocationKey[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(AllocationKey, "key");
    withCommunityScope(qb, "key");
    qb = applyFilters(this.keyPartialFilters, qb, queryDto);

    qb = applySorts(this.keyPartialSorts, qb, queryDto);

    // 3. Pagination
    const take = queryDto.limit;
    const skip = (queryDto.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  getKeyById(key_id: number, query_runner?: QueryRunner): Promise<AllocationKey | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(AllocationKey, "key");
    qb = qb.leftJoinAndSelect("key.iterations", "iteration");

    // 2. Join the Consumers (Direct child of Iteration)
    qb = qb.leftJoinAndSelect("iteration.consumers", "consumer");
    withCommunityScope(qb, "key");
    qb = qb.andWhere("key.id = :id", { id: key_id });
    qb = qb.addOrderBy("iteration.number", "ASC");
    return qb.getOne();
  }

  async createKey(new_key: CreateKeyDTO, query_runner?: QueryRunner): Promise<AllocationKey> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const new_key_model = manager.create(AllocationKey, {
      name: new_key.name,
      description: new_key.description,
      community: { id: internal_community_id },
    });
    return await manager.save(new_key_model);
  }

  async updateKey(allocation_key: AllocationKey, query_runner?: QueryRunner): Promise<AllocationKey> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(allocation_key);
  }

  async createChildren(parent_key: AllocationKey, iterations: CreateIterationDTO[], query_runner?: QueryRunner): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    for (const iterDto of iterations) {
      // Create Iteration
      const iteration = manager.create(Iteration, {
        number: iterDto.number,
        energy_allocated_percentage: iterDto.energy_allocated_percentage,
        allocation_key: parent_key,
        community: { id: internal_community_id },
      });
      let savedIteration: Iteration;
      try {
        savedIteration = await manager.save(iteration);
      } catch (err) {
        logger.error({ operation: "createChildren", error: err }, "Error while saving iterations");
        return false;
      }
      // Create Consumers for this Iteration
      const consumers = iterDto.consumers.map((consDto: CreateConsumerDTO) =>
        manager.create(Consumer, {
          name: consDto.name,
          energy_allocated_percentage: consDto.energy_allocated_percentage,
          iteration: savedIteration,
          community: { id: internal_community_id },
        }),
      );
      try {
        await manager.save(consumers);
      } catch (err) {
        logger.error({ operation: "createChildren", error: err }, "Error while saving consumers");
        return false;
      }
    }
    return true;
  }

  async deleteChildren(parent_key: AllocationKey, query_runner?: QueryRunner): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const existing_iterations = await manager.find(Iteration, {
      where: { allocation_key: { id: parent_key.id } },
    });
    if (existing_iterations.length > 0) {
      const iterationsRemoved = await manager.remove(existing_iterations);
      return iterationsRemoved.length === existing_iterations.length;
    }
    return true;
  }

  async deleteKey(key_id: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return await manager.delete(AllocationKey, {
      id: key_id,
      community: { id: internal_community_id },
    });
  }
}
