import { inject, injectable } from "inversify";
import type { IMemberRepository } from "../domain/i-member.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DeleteResult, type QueryRunner } from "typeorm";
import { Company, Individual, Manager, Member } from "../domain/member.models.js";
import { MemberLinkQueryDTO, MemberPartialQuery } from "../api/member.dtos.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { User, UserMemberLink } from "../../users/domain/user.models.js";
import { UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { Community } from "../../communities/domain/community.models.js";

@injectable()
export class MemberRepository implements IMemberRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}

  // 1. Define Filters
  private memberPartialFilters: FilterDef<Member>[] = [
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("member.name LIKE :name", { name: `%${val}%` }),
    },
    {
      key: "member_type",
      apply: (qb, val) => qb.andWhere("member.member_type = :mtype", { mtype: val }),
    },
    {
      key: "status",
      apply: (qb, val) => qb.andWhere("member.status = :status", { status: val }),
    },
  ];

  // 2. Define Sorts
  private memberPartialSorts: SortDef<Member>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("member.name", direction),
    },
  ];

  async deleteMember(id_member: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // 1. Get the current scope (security context)
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    // 2. Execute Delete with BOTH checks
    // We use QueryBuilder to strictly enforce the AND condition
    return await manager
      .createQueryBuilder()
      .delete()
      .from(Member)
      .where("id = :id", { id: id_member })
      .andWhere("community = :communityId", { communityId: internal_community_id }) // explicit scope check
      .execute();
  }

  async deleteMemberLink(id_member: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    // 1. Create the subquery SQL string separately
    // This generates: SELECT "m"."id" FROM "member" "m" WHERE ...
    const subQuery = manager
      .createQueryBuilder(Member, "m")
      .select("m.id")
      .where("m.id = :id") // Uses the same parameter name ':id'
      .andWhere("m.id_community = :communityId")
      .getQuery();

    // 2. Inject it into the delete query
    return await manager
      .createQueryBuilder()
      .delete()
      .from(UserMemberLink)
      .where("id_member = :id", { id: id_member }) // This provides ':id'
      .andWhere(`id_member IN (${subQuery})`, { communityId: internal_community_id }) // This provides ':communityId'
      .execute();
  }

  async getFullMember(id_member: number, query_runner?: QueryRunner): Promise<Member | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const qb = manager.createQueryBuilder(Member, "member");

    // 1. Join Base Relations
    qb.leftJoinAndSelect("member.home_address", "home_address")
      .leftJoinAndSelect("member.billing_address", "billing_address")
      .leftJoinAndSelect("member.community", "community");

    // 2. Join Sub-Entities (and their managers)
    // We fetch BOTH. One will be null, the other will be populated.
    qb.leftJoinAndSelect("member.individual_details", "individual")
      .leftJoinAndSelect("individual.manager", "ind_manager")
      .leftJoinAndSelect("member.company_details", "company")
      .leftJoinAndSelect("company.manager", "comp_manager");

    qb.where("member.id = :id", { id: id_member });

    // Optional: Security Scope
    withCommunityScope(qb, "member");

    return await qb.getOne();
  }

  async getMember(id_member: number, query_runner?: QueryRunner): Promise<Member | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const qb = manager.createQueryBuilder(Member, "member");
    qb.where("member.id = :id", { id: id_member });

    // Optional: Security Scope
    withCommunityScope(qb, "member");

    return await qb.getOne();
  }

  async getMembersList(queryDto: MemberPartialQuery, query_runner?: QueryRunner): Promise<[Member[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(Member, "member");

    // Security Scope
    withCommunityScope(qb, "member");

    // Apply Logic
    qb = applyFilters(this.memberPartialFilters, qb, queryDto);
    qb = applySorts(this.memberPartialSorts, qb, queryDto);

    // Pagination
    const take = queryDto.limit;
    const skip = (queryDto.page - 1) * take;

    // Default sort if none provided (prevents random order on pagination)
    if (!queryDto.sort_name) {
      qb.addOrderBy("member.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  saveMember(member: Member, query_runner?: QueryRunner): Promise<Member> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(member);
  }

  saveCompany(company: Company, query_runner?: QueryRunner): Promise<Company> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(company);
  }

  saveIndividual(individual: Individual, query_runner?: QueryRunner): Promise<Individual> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(individual);
  }

  async addInvitationToMember(id_member: number, user_email: string, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    // Normalize email for comparison
    const normalized_email = user_email.toLowerCase().trim();

    // 1. Lookup User: See if a registered user exists with this email
    const existing_user = await manager.findOne(User, {
      where: { email: normalized_email },
    });

    // 2. Find existing invitation (Upsert logic)
    // We look for an invitation for this member in this community
    let invitation = await manager.findOne(UserMemberInvitation, {
      where: {
        member: { id: id_member },
        community: { id: internal_community_id },
      },
    });

    // 3. Create new if not exists
    if (!invitation) {
      invitation = new UserMemberInvitation();
      invitation.member = { id: id_member } as Member;
      invitation.community = { id: internal_community_id } as Community;
      invitation.toBeEncoded = false; // Default value
    }

    invitation.userEmail = normalized_email;

    invitation.user = existing_user ? existing_user : null;

    // 5. Save
    await manager.save(UserMemberInvitation, invitation);
  }

  /**
   * Finds the active link between a specific member and a user.
   * Includes the User relation to get email/id.
   */
  async getMemberLink(id_member: number, query: MemberLinkQueryDTO, query_runner?: QueryRunner): Promise<UserMemberLink | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    return await manager
      .createQueryBuilder(UserMemberLink, "link")
      .leftJoinAndSelect("link.user", "user") // Load User to get the email
      .innerJoin("link.member", "member") // Join member to check community scope
      .where("member.id = :id", { id: id_member })
      .andWhere("member.community = :communityId", { communityId: internal_community_id })
      .andWhere("user.email = :email", { email: query.email })
      .getOne();
  }

  /**
   * Finds a pending invitation for a specific member.
   */
  async getMemberInvitation(id_member: number, query: MemberLinkQueryDTO, query_runner?: QueryRunner): Promise<UserMemberInvitation | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    return await manager
      .createQueryBuilder(UserMemberInvitation, "invite")
      .where("invite.member = :id", { id: id_member })
      // Security check: Ensure the invitation belongs to the current community context
      .andWhere("invite.community = :communityId", { communityId: internal_community_id })
      .andWhere("invite.userEmail =:userEmail", { userEmail: query.email })
      .getOne();
  }

  saveManager(new_manager: Manager, query_runner?: QueryRunner): Promise<Manager> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.save(new_manager);
  }
}
