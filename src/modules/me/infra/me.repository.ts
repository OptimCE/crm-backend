import type { IMeRepository } from "../domain/i-me.repository.js";
import { inject, injectable } from "inversify";
import { Member } from "../../members/domain/member.models.js";
import { MeDocumentPartialQuery, MeMemberPartialQuery, MeMetersPartialQuery } from "../api/me.dtos.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { DeleteResult, QueryRunner, SelectQueryBuilder } from "typeorm";
import { User, UserMemberLink } from "../../users/domain/user.models.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { Document } from "../../documents/domain/document.models.js";
import { Meter, MeterData } from "../../meters/domain/meter.models.js";
import { GestionnaireInvitation, UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../../invitations/api/invitation.dtos.js";

@injectable()
export class MeRepository implements IMeRepository {
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
    {
      key: "community_name",
      apply: (qb, val) => qb.andWhere("community.name LIKE :community_name", { community_name: `%${val}%` }),
    },
  ];

  // 2. Define Sorts
  private memberPartialSorts: SortDef<Member>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("member.name", direction),
    },
  ];

  private documentFilters: FilterDef<Document>[] = [
    {
      key: "file_name",
      apply: (qb, val) => qb.andWhere("document.file_name ILIKE :file_name", { file_name: `%${val}%` }),
    },
    {
      key: "file_type",
      apply: (qb, val) => qb.andWhere("document.file_type ILIKE :file_type", { file_type: `%${val}%` }),
    },
  ];

  // Define sorts declaratively
  private documentSorts: SortDef<Document>[] = [
    {
      key: "sort_upload_date",
      apply: (qb, direction) => qb.addOrderBy("document.upload_date", direction),
    },
    {
      key: "sort_file_size",
      apply: (qb, direction) => qb.addOrderBy("document.file_size", direction),
    },
  ];

  private managerInvitationFilters: FilterDef<GestionnaireInvitation>[] = [
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("community.name ILIKE :name", { name: `%${val}%` }),
    },
  ];
  private memberInvitationFilters: FilterDef<UserMemberInvitation>[] = [
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("community.name ILIKE :name", { name: `%${val}%` }),
    },
    {
      key: "to_be_encoded",
      apply: (qb, val) => qb.andWhere("invitation.to_be_encoded = :val", { val }),
    },
  ];
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

  private meterFilters: FilterDef<Meter>[] = [
    { key: "EAN", apply: (qb, val) => qb.andWhere("meter.EAN LIKE :ean", { ean: `%${val}%` }) },
    { key: "meter_number", apply: (qb, val) => qb.andWhere("meter.meter_number LIKE :mn", { mn: `%${val}%` }) },
    { key: "community_name", apply: (qb, val) => qb.andWhere("meter_community.name LIKE :community_name", { community_name: `%${val}%` }) },

    // Address Filters
    { key: "street", apply: (qb, val) => qb.andWhere("address.street LIKE :street", { street: `%${val}%` }) },
    { key: "city", apply: (qb, val) => qb.andWhere("address.city LIKE :city", { city: `%${val}%` }) },
    { key: "postcode", apply: (qb, val) => qb.andWhere("address.postcode = :post", { post: val }) },
    { key: "address_number", apply: (qb, val) => qb.andWhere("address.address_number = :an", { an: val }) },
    { key: "supplement", apply: (qb, val) => qb.andWhere("address.supplement LIKE :supp", { supp: `%${val}%` }) },

    // Active Meter Data Filters (Status, Holder, Sharing Op)
    // These rely on the 'active_data' join defined in getMetersList
    {
      key: "status",
      apply: (qb, val) => qb.andWhere("active_data.status = :status", { status: val }),
    },
    {
      key: "holder_id",
      apply: (qb, val) => qb.andWhere("active_data.member = :hid", { hid: val }),
    },
    {
      key: "sharing_operation_id",
      apply: (qb, val) => qb.andWhere("active_data.sharing_operation = :soid", { soid: val }),
    },
    {
      key: "not_sharing_operation_id",
      apply: (qb, val): SelectQueryBuilder<Meter> => {
        const now = new Date();

        return qb
          .andWhere((sub) => {
            const subQuery = sub
              .subQuery()
              .select("md.meter") // or "md.meterEAN" depending on your mapping
              .from(MeterData, "md")
              .where("md.sharing_operation = :not_soid")
              .andWhere("md.start_date <= :now")
              .andWhere("(md.end_date IS NULL OR md.end_date > :now)") // or >= if inclusive
              .getQuery();

            return `meter.EAN NOT IN ${subQuery}`;
          })
          .setParameters({ not_soid: val, now });
      },
    },
  ];
  async getMemberById(id: number, query_runner?: QueryRunner): Promise<Member | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager
      .createQueryBuilder(Member, "member")
      .leftJoinAndSelect("member.individual_details", "individual_details")
      .leftJoinAndSelect("member.company_details", "company_details")
      .innerJoinAndSelect("member.community", "community")
      .innerJoinAndSelect("member.home_address", "home_address")
      .innerJoinAndSelect("member.billing_address", "billing_address")
      .innerJoin(UserMemberLink, "uml", "uml.id_member = member.id")
      .where("member.id = :id", { id: id });
    withUserScope(qb, "uml");
    return await qb.getOne();
  }

  getMembersList(queryDto: MeMemberPartialQuery, query_runner?: QueryRunner): Promise<[Member[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager
      .createQueryBuilder(Member, "member")
      .innerJoinAndSelect("member.home_address", "home_address")
      .innerJoinAndSelect("member.billing_address", "billing_address")
      .innerJoinAndSelect("member.community", "community")
      .leftJoinAndSelect("member.individual_details", "individual_details")
      .leftJoinAndSelect("member.company_details", "company_details")
      // constraint: only members linked to the current user
      .innerJoin(UserMemberLink, "uml", "uml.id_member = member.id");

    // apply user scope on the join table alias
    qb = withUserScope(qb, "uml");

    qb = applyFilters(this.memberPartialFilters, qb, queryDto);
    qb = applySorts(this.memberPartialSorts, qb, queryDto);

    const take = queryDto.limit;
    const skip = (queryDto.page - 1) * take;

    if (!queryDto.sort_name) {
      qb.addOrderBy("member.created_at", "DESC");
    }

    return qb.skip(skip).take(take).getManyAndCount();
  }

  getDocumentById(document_id: number, query_runner?: QueryRunner): Promise<Document | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager
      .createQueryBuilder(Document, "document")
      .innerJoinAndSelect("document.community", "community")
      .innerJoinAndSelect("document.member", "member")
      .innerJoin(UserMemberLink, "uml", "uml.id_member = member.id");
    withUserScope(qb, "uml");

    qb = qb.andWhere("document.id = :id", { id: document_id });
    return qb.getOne();
  }

  getDocuments(query: MeDocumentPartialQuery, query_runner?: QueryRunner): Promise<[Document[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager
      .createQueryBuilder(Document, "document")
      .innerJoinAndSelect("document.community", "community")
      .innerJoinAndSelect("document.member", "member")
      .innerJoin(UserMemberLink, "uml", "uml.id_member = member.id");
    withUserScope(qb, "uml");
    // Apply declarative filters and sorts
    qb = applyFilters(this.documentFilters, qb, query);
    qb = applySorts(this.documentSorts, qb, query);

    // Default Sort: Newest uploads first if no sort is specified in the query
    if (!query.sort_upload_date && !query.sort_file_size) {
      qb.orderBy("document.upload_date", "DESC");
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;

    qb.skip((page - 1) * limit);
    qb.take(limit);

    return qb.getManyAndCount();
  }

  getMeterById(id: string, query_runner?: QueryRunner): Promise<Meter | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(Meter, "meter");

    qb = qb
      .where("meter.EAN = :ean", { ean: id })
      .leftJoinAndSelect("meter.address", "address")
      .leftJoinAndSelect("meter.community", "meter_community")
      // Fetch ALL meter data history for the detail view
      .leftJoinAndSelect("meter.meter_data", "meter_data")
      .leftJoinAndSelect("meter_data.member", "member")
      .leftJoinAndSelect("member.community", "member_community")
      .leftJoinAndSelect("meter_data.sharing_operation", "sharing_operation")
      // Order by start_date DESC so active/future is usually first, history follows
      .addOrderBy("meter_data.start_date", "DESC")
      .innerJoin(UserMemberLink, "uml", "uml.id_member = member.id");
    withUserScope(qb, "uml");

    return qb.getOne();
  }

  getMeters(query: MeMetersPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { user_id } = getContext();

    let qb = manager.createQueryBuilder(Meter, "meter");

    // Security fallback: no user in context = no results
    if (!user_id) {
      qb.andWhere("1=0");
      return qb.getManyAndCount();
    }

    // Joins for display
    qb.leftJoinAndSelect("meter.address", "address");
    qb.leftJoinAndSelect("meter.community", "meter_community");

    // Join active MeterData for display and filtering
    const now = new Date();
    qb.leftJoinAndSelect(
      "meter.meter_data",
      "active_data",
      `
        active_data.start_date <= :now
        AND (
          active_data.end_date IS NULL
          OR active_data.end_date > :now
        )
        `,
      { now },
    );
    qb.leftJoinAndSelect("active_data.member", "member");
    qb.leftJoinAndSelect("member.community", "member_community");
    qb.leftJoinAndSelect("active_data.sharing_operation", "sharing_operation");

    // Access control: meter must have ANY meter_data (past, present, or future)
    // linked to a member owned by the current user
    qb.andWhere(
      `EXISTS (
            SELECT 1 FROM meter_data sub_md
            INNER JOIN user_member_link sub_uml ON sub_uml.id_member = sub_md.id_member
            INNER JOIN "user" sub_u ON sub_u.id = sub_uml.id_user
            WHERE sub_md.ean = meter.EAN
            AND sub_u.auth_user_id = :contextAuthId
        )`,
      { contextAuthId: user_id },
    );

    // Apply Filters
    qb = applyFilters(this.meterFilters, qb, query);

    // Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Ordering (Default by EAN if not specified)
    qb.orderBy("meter.EAN", "ASC");

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

  async getOwnMembersPendingInvitationById(id: number, query_runner?: QueryRunner): Promise<Member | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const qb = manager.createQueryBuilder(UserMemberInvitation, "invitation");

    // Security Scope
    withUserScope(qb, "invitation");

    // 1. Join Invitation Relations
    qb.leftJoinAndSelect("invitation.community", "inv_community")
      .leftJoinAndSelect("invitation.user", "user")
      .leftJoinAndSelect("invitation.member", "member");

    // 2. Join Member Deep Relations (anchored to the 'member' alias)
    qb.leftJoinAndSelect("member.home_address", "home_address")
      .leftJoinAndSelect("member.billing_address", "billing_address")
      .leftJoinAndSelect("member.community", "member_community")
      .leftJoinAndSelect("member.individual_details", "individual")
      .leftJoinAndSelect("individual.manager", "ind_manager")
      .leftJoinAndSelect("member.company_details", "company")
      .leftJoinAndSelect("company.manager", "comp_manager");

    qb.where("invitation.id = :id", { id });

    // 3. Execute and Extract
    const invitation = await qb.getOne();

    // Return the nested member object, or null if invitation/member doesn't exist
    return invitation?.member || null;
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

  async saveUserMemberLink(internal_user_id: number, id_member: number, query_runner?: QueryRunner): Promise<UserMemberLink> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const new_user_member_link: UserMemberLink = manager.create(UserMemberLink, {
      user: { id: internal_user_id } as User,
      member: { id: id_member } as Member,
    });
    return await manager.save(new_user_member_link);
  }

  async deleteUserMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return await manager.delete(UserMemberInvitation, { id: id_invitation });
  }

  async deleteGestionnaireInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return await manager.delete(GestionnaireInvitation, { id: id_invitation });
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
}
