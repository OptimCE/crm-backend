import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IInvitationRepository } from "../domain/i-invitation.repository.js";
import { DeleteResult, type QueryRunner } from "typeorm";
import { GestionnaireInvitation, UserMemberInvitation } from "../domain/invitation.models.js";
import { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../api/invitation.dtos.js";
import { User, UserMemberLink } from "../../users/domain/user.models.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";

@injectable()
export class InvitationRepository implements IInvitationRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}
  // 1. Define Filters
  private managerInvitationFilters: FilterDef<GestionnaireInvitation>[] = [
    {
      key: "name",
      // Filtering by Community Name linked to the invitation
      apply: (qb, val) => qb.andWhere("community.name ILIKE :name", { name: `%${val}%` }),
    },
  ];
  private memberInvitationFilters: FilterDef<UserMemberInvitation>[] = [
    {
      key: "name",
      // Filtering by Community Name
      apply: (qb, val) => qb.andWhere("community.name ILIKE :name", { name: `%${val}%` }),
    },
    {
      key: "to_be_encoded",
      apply: (qb, val) => qb.andWhere("invitation.to_be_encoded = :val", { val }),
    },
  ];

  // 2. Define Sorts
  private managerInvitationSorts: SortDef<GestionnaireInvitation>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("community.name", direction),
    },
    {
      key: "sort_date",
      apply: (qb, direction) => qb.addOrderBy("invitation.created_at", direction),
    },
  ];
  private memberInvitationSorts: SortDef<UserMemberInvitation>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("community.name", direction),
    },
    {
      key: "sort_date",
      apply: (qb, direction) => qb.addOrderBy("invitation.created_at", direction),
    },
  ];

  async cancelManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return await manager
      .createQueryBuilder()
      .delete()
      .from(GestionnaireInvitation)
      .where("id = :id", { id: id_invitation })
      .andWhere("community = :community_id", { community_id: internal_community_id })
      .execute();
  }

  async cancelMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return await manager
      .createQueryBuilder()
      .delete()
      .from(UserMemberInvitation)
      .where("id = :id", { id: id_invitation })
      .andWhere("community = :community_id", { community_id: internal_community_id })
      .execute();
  }

  async refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    return await manager
      .createQueryBuilder()
      .delete()
      .from(GestionnaireInvitation)
      .where("id = :id", { id: id_invitation })
      .andWhere("user = :user_id", { user_id: internal_user_id })
      .execute();
  }

  async refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    return await manager
      .createQueryBuilder()
      .delete()
      .from(UserMemberInvitation)
      .where("id = :id", { id: id_invitation })
      .andWhere("user = :user_id", { user_id: internal_user_id })
      .execute();
  }

  async getInvitationManagerById(invitation_id: number, query_runner?: QueryRunner): Promise<GestionnaireInvitation | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return manager.findOne(GestionnaireInvitation, {
      where: { id: invitation_id },
      relations: ["user", "community"],
    });
  }

  async getInvitationMemberById(invitation_id: number, query_runner?: QueryRunner): Promise<UserMemberInvitation | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.findOne(UserMemberInvitation, {
      where: { id: invitation_id },
      relations: ["user", "community", "member"],
    });
  }

  async getManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(GestionnaireInvitation, "invitation");
    // Security Scope
    withCommunityScope(qb, "invitation");
    // Joins required for filtering/sorting and data display
    qb.leftJoinAndSelect("invitation.community", "community");
    qb.leftJoinAndSelect("invitation.user", "user");

    // Apply Logic
    qb = applyFilters(this.managerInvitationFilters, qb, query);
    qb = applySorts(this.managerInvitationSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Default sort if none provided (prevents random order on pagination)
    if (!query.sort_name && !query.sort_date) {
      qb.addOrderBy("invitation.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(UserMemberInvitation, "invitation");
    // Security Scope
    withCommunityScope(qb, "invitation");
    // Joins required for filtering/sorting and data display
    qb.leftJoinAndSelect("invitation.community", "community");
    qb.leftJoinAndSelect("invitation.user", "user");
    qb.leftJoinAndSelect("invitation.member", "member");

    // Apply Logic
    qb = applyFilters(this.memberInvitationFilters, qb, query);
    qb = applySorts(this.memberInvitationSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Default sort if none provided (prevents random order on pagination)
    if (!query.sort_name && !query.sort_date) {
      qb.addOrderBy("invitation.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getOwnManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(GestionnaireInvitation, "invitation");
    // Security Scope
    withUserScope(qb, "invitation");
    // Joins required for filtering/sorting and data display
    qb.leftJoinAndSelect("invitation.community", "community");
    qb.leftJoinAndSelect("invitation.user", "user");

    // Apply Logic
    qb = applyFilters(this.managerInvitationFilters, qb, query);
    qb = applySorts(this.managerInvitationSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Default sort if none provided (prevents random order on pagination)
    if (!query.sort_name && !query.sort_date) {
      qb.addOrderBy("invitation.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getOwnMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(UserMemberInvitation, "invitation");
    // Security Scope
    withUserScope(qb, "invitation");
    // Joins required for filtering/sorting and data display
    qb.leftJoinAndSelect("invitation.community", "community");
    qb.leftJoinAndSelect("invitation.user", "user");
    qb.leftJoinAndSelect("invitation.member", "member");

    // Apply Logic
    qb = applyFilters(this.memberInvitationFilters, qb, query);
    qb = applySorts(this.memberInvitationSorts, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Default sort if none provided (prevents random order on pagination)
    if (!query.sort_name && !query.sort_date) {
      qb.addOrderBy("invitation.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async inviteUserToBecomeManager(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<GestionnaireInvitation> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const new_manager_invitation: GestionnaireInvitation = manager.create(GestionnaireInvitation, {
      userEmail: user_email,
      user: user,
      community: { id: internal_community_id },
    });
    return await manager.save(new_manager_invitation);
  }

  async inviteUserToBecomeMember(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<UserMemberInvitation> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const new_member_invitation: UserMemberInvitation = manager.create(UserMemberInvitation, {
      userEmail: user_email,
      user: user,
      toBeEncoded: true,
      community: { id: internal_community_id },
    });
    return await manager.save(new_member_invitation);
  }

  async saveUserMemberLink(internal_user_id: number, id_member: number, query_runner?: QueryRunner): Promise<UserMemberLink> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const new_user_member_link: UserMemberLink = manager.create(UserMemberLink, {
      user: { id: internal_user_id },
      member: { id: id_member },
    });
    return await manager.save(new_user_member_link);
  }
}
