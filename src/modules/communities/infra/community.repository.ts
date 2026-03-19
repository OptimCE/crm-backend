import type { ICommunityRepository } from "../domain/i-community.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { inject, injectable } from "inversify";
import { CommunityQueryDTO, CommunityUsersQueryDTO, CreateCommunityDTO } from "../api/community.dtos.js";
import type { QueryRunner } from "typeorm";
import { Community, CommunityUser } from "../domain/community.models.js";
import { Role } from "../../../shared/dtos/role.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { COMMUNITY_ERRORS } from "../shared/community.errors.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";

@injectable()
export class CommunityRepository implements ICommunityRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}

  async addCommunity(new_community: CreateCommunityDTO, org_id: string, query_runner?: QueryRunner): Promise<Community> {
    // Use the provided query runner (transaction) or default to the datasource manager
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Note: We do not need getInternalCommunityId here because we are creating the tenant itself.
    const comm = manager.create(Community, {
      name: new_community.name,
      auth_community_id: org_id,
    });

    return manager.save(comm);
  }

  async deleteUserCommunity(id_user: number, id_community: number, query_runner?: QueryRunner): Promise<CommunityUser> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Fetch the entity first to return it (needed for IAM cleanup)
    // We need relations to get auth_user_id and auth_community_id
    const communityUser = await manager.findOne(CommunityUser, {
      where: {
        id_user: id_user,
        id_community: id_community,
      },
      relations: ["user", "community"],
    });

    if (!communityUser) {
      logger.error({ operation: "deleteUserCommunity" }, `CommunityUser not found for user ${id_user} in community ${id_community}`);
      throw new AppError(COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.COMMUNITY_USER_NOT_FOUND, 400);
    }

    // remove returns the removed entity
    return await manager.remove(communityUser);
  }

  // --- Filters Definition ---
  communityUserFilters: FilterDef<CommunityUser>[] = [
    {
      key: "role",
      apply: (qb, val) => qb.andWhere("community_user.role = :role", { role: val }),
    },
    {
      key: "email",
      // Searching in the joined 'user' entity fields.
      // Adjust 'first_name'/'last_name' if your User entity uses different naming (e.g., only 'name' or 'username')
      apply: (qb, val) => qb.andWhere("user.email LIKE :search", { search: `%${val}%` }),
    },
  ];
  myCommunityFilters: FilterDef<CommunityUser>[] = [
    {
      key: "name", // Filter by community name
      apply: (qb, val) => qb.andWhere("community.name LIKE :name", { name: `%${val}%` }),
    },
    {
      key: "role",
      apply: (qb, val) => qb.andWhere("community_user.role = :role", { role: val }),
    },
  ];

  // --- Sorts Definition ---
  communityUserSorts: SortDef<CommunityUser>[] = [
    {
      key: "sort_email",
      apply: (qb, direction) => qb.addOrderBy("user.email", direction),
    },
    {
      key: "sort_id",
      apply: (qb, direction) => qb.addOrderBy("user.id", direction),
    },
    {
      key: "sort_role",
      apply: (qb, direction) => qb.addOrderBy("community_user.role", direction),
    },
  ];
  myCommunitySorts: SortDef<CommunityUser>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("community.name", direction),
    },
    {
      key: "sort_role",
      apply: (qb, direction) => qb.addOrderBy("community_user.role", direction),
    },
  ];

  async getAdmins(query: CommunityUsersQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager
      .createQueryBuilder(CommunityUser, "community_user")
      .leftJoinAndSelect("community_user.user", "user")
      // Specific constraint for getAdmins: Only GESTIONNAIRE or ADMIN
      .andWhere("community_user.role IN (:...adminRoles)", { adminRoles: [Role.GESTIONNAIRE, Role.ADMIN] });
    withCommunityScope(qb, "community_user");
    // Apply Filters (allows further refining, e.g. searching by name within the admin list)
    qb = applyFilters(this.communityUserFilters, qb, query);

    // Apply Sorts
    qb = applySorts(this.communityUserSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getMyCommunities(query: CommunityQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(CommunityUser, "community_user").leftJoinAndSelect("community_user.community", "community");
    withUserScope(qb, "community_user");
    // Apply Filters (e.g. searching for a specific community name)
    qb = applyFilters(this.myCommunityFilters, qb, query);

    // Apply Sorts
    qb = applySorts(this.myCommunitySorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getUsers(query: CommunityUsersQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(CommunityUser, "community_user").leftJoinAndSelect("community_user.user", "user");
    withCommunityScope(qb, "community_user");
    // Apply Filters
    qb = applyFilters(this.communityUserFilters, qb, query);

    // Apply Sorts
    qb = applySorts(this.communityUserSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async patchRoleUser(id_user: number, id_community: number, new_role: Role, query_runner?: QueryRunner): Promise<CommunityUser> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Fetch the user relation (for auth_user_id) and community relation (for auth_community_id)
    // because the service layer needs these for the subsequent IAM update.
    const communityUser = await manager.findOne(CommunityUser, {
      where: {
        id_user: id_user,
        id_community: id_community,
      },
      relations: ["user", "community"],
    });

    if (!communityUser) {
      logger.error({ operation: "patchRoleUser" }, `CommunityUser not found for user ${id_user} in community ${id_community}`);
      throw new AppError(COMMUNITY_ERRORS.PATCH_ROLE_USER.COMMUNITY_USER_NOT_FOUND, 400);
    }

    communityUser.role = new_role;

    return await manager.save(communityUser);
  }

  async updateCommunity(id_community: number, community_details: CreateCommunityDTO, query_runner?: QueryRunner): Promise<Community> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const community = await manager.findOne(Community, { where: { id: id_community } });
    if (!community) {
      logger.error({ operation: "updateCommunity" }, `Community with id ${id_community} not found`);
      throw new AppError(COMMUNITY_ERRORS.UPDATE_COMMUNITY.COMMUNITY_NOT_FOUND, 400);
    }

    // Update only the name
    community.name = community_details.name;

    return await manager.save(community);
  }

  async deleteCommunity(id_community: number, query_runner?: QueryRunner): Promise<Community> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const community = await manager.findOne(Community, { where: { id: id_community } });
    if (!community) {
      logger.error({ operation: "deleteCommunity" }, `Community with id ${id_community} not found`);
      throw new AppError(COMMUNITY_ERRORS.DELETE_COMMUNITY.COMMUNITY_NOT_FOUND, 400);
    }

    return await manager.remove(community);
  }

  async addUserCommunity(id_user: number, id_community: number, role: Role, query_runner?: QueryRunner): Promise<CommunityUser> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const new_community_user = manager.create(CommunityUser, {
      id_user: id_user,
      id_community: id_community,
      role: role,
    });
    return await manager.save(new_community_user);
  }

  getCommunityUser(id_user: number, id_community: number, query_runner?: QueryRunner): Promise<CommunityUser | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return manager.findOne(CommunityUser, { where: { id_user: id_user, id_community: id_community } });
  }
}
