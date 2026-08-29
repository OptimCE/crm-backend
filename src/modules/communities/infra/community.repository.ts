import type { CommunityDashboardCountsRow, ICommunityRepository, PublicCommunityMapRow } from "../domain/i-community.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { inject, injectable } from "inversify";
import { CommunityMapQuery, CommunityQueryDTO, CommunityUsersQueryDTO, CreateCommunityDTO, UpdateCommunityDTO } from "../api/community.dtos.js";
import type { QueryRunner } from "typeorm";
import { Community, CommunityUser } from "../domain/community.models.js";
import { Member } from "../../members/domain/member.models.js";
import { MemberStatus, MemberType } from "../../members/shared/member.types.js";
import { MeterDataStatus } from "../../meters/shared/meter.types.js";
import { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";
import { SharingKeyStatus } from "../../sharing_operations/shared/sharing_operation.types.js";
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
      regulator: new_community.regulator,
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
    {
      key: "sort_id",
      apply: (qb, direction) => qb.addOrderBy("community.id", direction),
    },
  ];

  communityFilters: FilterDef<Community>[] = [
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("community.name LIKE :name", { name: `%${val}%` }),
    },
    {
      key: "regulator",
      apply: (qb, val) => qb.andWhere("community.regulator = :regulator", { regulator: val }),
    },
  ];

  communitySorts: SortDef<Community>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("community.name", direction),
    },
    {
      key: "sort_id",
      apply: (qb, direction) => qb.addOrderBy("community.id", direction),
    },
  ];

  /**
   * One row of readiness counters for the active community.
   *
   * `withCommunityScope` is deliberately NOT used here: it hard-codes the join
   * alias `scope_community`, so it can be applied at most once per builder and
   * cannot reach inside sibling subqueries. The tenant is resolved once from the
   * context (same pattern as `SharingOperationRepository.patchVisibility`) and
   * every subquery filters on it explicitly — so no counter can silently escape
   * its tenant.
   *
   * All counters are correlated scalar subqueries over `id_community`-indexed
   * tables, evaluated for exactly one community. The legal columns ride along for
   * free because the statement is already `FROM community`.
   */
  async getDashboardCounts(as_of: string, query_runner?: QueryRunner): Promise<CommunityDashboardCountsRow | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const cid = await this.authContext.getInternalCommunityId(query_runner);

    // The meter_data row "in force" on :as_of. end_date is the LAST day held
    // (addMeterData closes a holding with `next_start - 1 day`), so both bounds
    // are inclusive — `> :as_of` would under-report on a handover day.
    const IN_FORCE = `md.start_date <= CAST(:as_of AS date) AND (md.end_date IS NULL OR md.end_date >= CAST(:as_of AS date))`;
    const meterStatus = (status: MeterDataStatus): string => `
      (SELECT COUNT(DISTINCT md.ean) FROM meter_data md
        WHERE md.id_community = c.id AND md.status = ${status} AND ${IN_FORCE})`;

    const qb = manager
      .createQueryBuilder()
      .from(Community, "c")
      .select(`(SELECT COUNT(*) FROM member m WHERE m.id_community = c.id)`, "members_total")
      .addSelect(`(SELECT COUNT(*) FROM member m WHERE m.id_community = c.id AND m.status = ${MemberStatus.ACTIVE})`, "members_active")
      .addSelect(`(SELECT COUNT(*) FROM member m WHERE m.id_community = c.id AND m.status = ${MemberStatus.INACTIVE})`, "members_inactive")
      .addSelect(`(SELECT COUNT(*) FROM member m WHERE m.id_community = c.id AND m.status = ${MemberStatus.PENDING})`, "members_pending")
      .addSelect(
        `(SELECT COUNT(*) FROM member m
            WHERE m.id_community = c.id
              AND NOT EXISTS (SELECT 1 FROM user_member_link uml WHERE uml.id_member = m.id))`,
        "members_without_user",
      )
      // Every column below is NOT NULL in the DDL, so "missing" can only be an
      // empty/whitespace string — or an absent sub-type row, which is the state
      // that makes toMemberDTO throw "Data inconsistency" on the detail endpoint.
      // phone_number and id_manager are @IsOptional by design and are not counted.
      .addSelect(
        `(SELECT COUNT(*)
            FROM member m
            LEFT JOIN individual i  ON i.id  = m.id
            LEFT JOIN company    co ON co.id = m.id
            JOIN address ha ON ha.id = m.id_home_address
            JOIN address ba ON ba.id = m.id_billing_address
           WHERE m.id_community = c.id
             AND (
                  COALESCE(TRIM(m.name), '') = ''
               OR COALESCE(TRIM(m.iban), '') = ''
               OR (m.member_type = ${MemberType.INDIVIDUAL} AND i.id IS NULL)
               OR (m.member_type = ${MemberType.COMPANY}    AND co.id IS NULL)
               OR (m.member_type = ${MemberType.INDIVIDUAL}
                   AND (COALESCE(TRIM(i.nrn), '') = '' OR COALESCE(TRIM(i.email), '') = ''))
               OR (m.member_type = ${MemberType.COMPANY} AND COALESCE(TRIM(co.vat_number), '') = '')
               OR COALESCE(TRIM(ha.street), '') = '' OR COALESCE(TRIM(ha.postcode), '') = '' OR COALESCE(TRIM(ha.city), '') = ''
               OR COALESCE(TRIM(ba.street), '') = '' OR COALESCE(TRIM(ba.postcode), '') = '' OR COALESCE(TRIM(ba.city), '') = ''
             ))`,
        "members_incomplete",
      )
      .addSelect(`(SELECT COUNT(*) FROM meter mt WHERE mt.id_community = c.id)`, "meters_total")
      .addSelect(meterStatus(MeterDataStatus.ACTIVE), "meters_active")
      .addSelect(meterStatus(MeterDataStatus.INACTIVE), "meters_inactive")
      .addSelect(meterStatus(MeterDataStatus.WAITING_GRD), "meters_waiting_grd")
      .addSelect(meterStatus(MeterDataStatus.WAITING_MANAGER), "meters_waiting_manager")
      // Distinct from the counter below: this meter has NO row covering today at
      // all, so it has no status, no holder and no operation. Different fix.
      .addSelect(
        `(SELECT COUNT(*) FROM meter mt
            WHERE mt.id_community = c.id
              AND NOT EXISTS (SELECT 1 FROM meter_data md WHERE md.ean = mt.ean AND ${IN_FORCE}))`,
        "meters_without_active_data",
      )
      .addSelect(
        `(SELECT COUNT(DISTINCT md.ean) FROM meter_data md
            WHERE md.id_community = c.id AND md.id_sharing_operation IS NULL AND ${IN_FORCE})`,
        "meters_not_in_sharing_operation",
      )
      .addSelect(`(SELECT COUNT(*) FROM sharing_operation so WHERE so.id_community = c.id)`, "operations_total")
      .addSelect(
        `(SELECT COUNT(*) FROM sharing_operation so
            WHERE so.id_community = c.id
              AND NOT EXISTS (
                SELECT 1 FROM sharing_operation_key sok
                 WHERE sok.id_sharing_operation = so.id
                   AND sok.status = ${SharingKeyStatus.APPROVED}
                   AND sok.start_date <= CAST(:as_of AS date)
                   AND (sok.end_date IS NULL OR sok.end_date >= CAST(:as_of AS date))))`,
        "operations_without_valid_key",
      )
      // `end_date IS NULL` is load-bearing. Approving a key INSERTS a new APPROVED
      // row and only closes the PENDING one (patchKeyStatus) — its status stays 2
      // forever. Without this predicate every historically-approved key would be
      // reported as still awaiting approval.
      .addSelect(
        `(SELECT COUNT(DISTINCT sok.id_sharing_operation) FROM sharing_operation_key sok
            WHERE sok.id_community = c.id AND sok.status = ${SharingKeyStatus.PENDING} AND sok.end_date IS NULL)`,
        "operations_with_pending_key",
      )
      .addSelect(`(SELECT COUNT(*) FROM user_member_invitation umi WHERE umi.id_community = c.id)`, "member_invitations_pending")
      .addSelect(
        `(SELECT COUNT(*) FROM user_member_invitation umi WHERE umi.id_community = c.id AND umi.to_be_encoded)`,
        "member_invitations_to_be_encoded",
      )
      .addSelect(`(SELECT COUNT(*) FROM gestionnaire_invitation gi WHERE gi.id_community = c.id)`, "manager_invitations_pending")
      .addSelect("c.vat_number", "vat_number")
      .addSelect("c.legal_name", "legal_name")
      .addSelect("c.iban", "iban")
      .addSelect("c.account_holder_name", "account_holder_name")
      .addSelect("c.headquarters_address_id", "headquarters_address_id")
      .addSelect("c.regulator", "regulator")
      .where("c.id = :cid", { cid })
      .setParameter("as_of", as_of);

    const row = await qb.getRawOne<CommunityDashboardCountsRow>();
    return row ?? null;
  }

  async getOperationsWithoutValidKey(as_of: string, limit: number, query_runner?: QueryRunner): Promise<{ id: number; name: string }[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const cid = await this.authContext.getInternalCommunityId(query_runner);

    return manager
      .createQueryBuilder(SharingOperation, "so")
      .select("so.id", "id")
      .addSelect("so.name", "name")
      .where("so.id_community = :cid", { cid })
      // Same predicate as the `operations_without_valid_key` counter above; the
      // two must agree, which is why the count is the source of truth and this
      // list is only the (capped) naming of it.
      .andWhere(
        `NOT EXISTS (
           SELECT 1 FROM sharing_operation_key sok
            WHERE sok.id_sharing_operation = so.id
              AND sok.status = :approved
              AND sok.start_date <= CAST(:as_of AS date)
              AND (sok.end_date IS NULL OR sok.end_date >= CAST(:as_of AS date)))`,
        { approved: SharingKeyStatus.APPROVED, as_of },
      )
      .orderBy("so.name", "ASC")
      .limit(limit)
      .getRawMany<{ id: number; name: string }>();
  }

  async getAllPublicCommunities(query: CommunityQueryDTO, query_runner?: QueryRunner): Promise<[Community[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager
      .createQueryBuilder(Community, "community")
      .innerJoin("sharing_operation", "so", "so.id_community = community.id AND so.is_public = :isPublic", { isPublic: true });

    qb = applyFilters(this.communityFilters, qb, query);
    qb = applySorts(this.communitySorts, qb, query);

    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getPublicCommunitiesMap(query: CommunityMapQuery, limit: number, query_runner?: QueryRunner): Promise<PublicCommunityMapRow[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const qb = manager
      .createQueryBuilder(Community, "community")
      // INNER: reproduces the existing definition of "public community" used by
      // getAllPublicCommunities — at least one public sharing operation.
      .innerJoin("sharing_operation", "so", "so.id_community = community.id AND so.is_public = :isPublic", { isPublic: true })
      // LEFT, deliberately. The "a public operation covers at least one commune"
      // rule lives in patchVisibility, not in a DB constraint, so a legacy row
      // can be public with no municipalities. An inner join would make such a
      // community vanish from the map entirely; a left join draws it with an
      // empty zone so it still appears in the list beside it.
      .leftJoin("sharing_operation_municipality", "som", "som.id_sharing_operation = so.id")
      .select("community.id", "id")
      .addSelect("community.name", "name")
      .addSelect("community.regulator", "regulator")
      .addSelect("array_agg(DISTINCT som.nis_code)", "nis_codes")
      .addSelect("count(DISTINCT so.id)", "public_operations_count")
      .groupBy("community.id")
      .addGroupBy("community.name")
      .addGroupBy("community.regulator")
      .orderBy("community.name", "ASC")
      .limit(limit);

    if (query.regulator) {
      qb.andWhere("community.regulator = :regulator", { regulator: query.regulator });
    }

    return qb.getRawMany<PublicCommunityMapRow>();
  }

  async getCommunityById(id: number, query_runner?: QueryRunner): Promise<{ community: Community; member_count: number } | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const community = await manager.findOne(Community, { where: { id }, relations: ["headquarters_address"] });
    if (!community) {
      return null;
    }

    const member_count = await manager.count(Member, { where: { community: { id } } });

    return { community, member_count };
  }

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

  async updateCommunity(
    id_community: number,
    community_details: UpdateCommunityDTO & { headquarters_address_id?: number | null; logo_url?: string | null },
    query_runner?: QueryRunner,
  ): Promise<Community> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const community = await manager.findOne(Community, { where: { id: id_community }, relations: ["headquarters_address"] });
    if (!community) {
      logger.error({ operation: "updateCommunity" }, `Community with id ${id_community} not found`);
      throw new AppError(COMMUNITY_ERRORS.UPDATE_COMMUNITY.COMMUNITY_NOT_FOUND, 400);
    }

    if (community_details.name !== undefined) community.name = community_details.name;
    if (community_details.description !== undefined) community.description = community_details.description;
    if (community_details.website_url !== undefined) community.website_url = community_details.website_url;
    if (community_details.regulator !== undefined) community.regulator = community_details.regulator;
    if (community_details.vat_number !== undefined) community.vat_number = community_details.vat_number;
    if (community_details.legal_name !== undefined) community.legal_name = community_details.legal_name;
    if (community_details.iban !== undefined) community.iban = community_details.iban;
    if (community_details.account_holder_name !== undefined) community.account_holder_name = community_details.account_holder_name;
    if (community_details.logo_url !== undefined) community.logo_url = community_details.logo_url;
    if (community_details.headquarters_address_id !== undefined) community.headquarters_address_id = community_details.headquarters_address_id;

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
