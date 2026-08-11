import type {
  IMeRepository,
  MeEnergyMeterRow,
  MeKeyConsumerRow,
  MeKeyInForceRow,
  MeKeyIterationRow,
  MeMeterHoldingRow,
} from "../domain/i-me.repository.js";
import { Consumer, Iteration } from "../../keys/domain/key.models.js";
import { SharingOperationKey } from "../../sharing_operations/domain/sharing_operation.models.js";
import { SharingKeyStatus } from "../../sharing_operations/shared/sharing_operation.types.js";
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
import { Meter, MeterConsumption, MeterData } from "../../meters/domain/meter.models.js";
import { MeterConsumptionQuery } from "../../meters/api/meter.dtos.js";
import { CONSUMPTION_TIMEZONE, toCalendarDateString } from "../../../shared/utils/date.utils.js";
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
            INNER JOIN "app_user" sub_u ON sub_u.id = sub_uml.id_user
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

  async getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { user_id } = getContext();

    let qb = manager.createQueryBuilder(MeterConsumption, "consumption");

    // Security fallback: no user in context = no results
    if (!user_id) {
      qb.andWhere("1=0");
      return qb.getMany();
    }

    qb = qb.where("consumption.meter = :ean", { ean });

    // Ownership-window scoping: a reading is visible only if one of the current
    // user's members held the meter on the reading's calendar day. A meter that
    // changed holder mid-month therefore shows each member only their own slice.
    qb = qb.andWhere(
      `EXISTS (
            SELECT 1 FROM meter_data sub_md
            INNER JOIN user_member_link sub_uml ON sub_uml.id_member = sub_md.id_member
            INNER JOIN "app_user" sub_u ON sub_u.id = sub_uml.id_user
            WHERE sub_md.ean = consumption.ean
            AND sub_u.auth_user_id = :contextAuthId
            AND (consumption.timestamp AT TIME ZONE '${CONSUMPTION_TIMEZONE}')::date
                BETWEEN sub_md.start_date AND COALESCE(sub_md.end_date, 'infinity'::date)
        )`,
      { contextAuthId: user_id },
    );

    if (query.date_start) {
      qb = qb.andWhere(`(consumption.timestamp AT TIME ZONE '${CONSUMPTION_TIMEZONE}')::date >= CAST(:dateStart AS date)`, {
        dateStart: toCalendarDateString(query.date_start),
      });
    }
    if (query.date_end) {
      qb = qb.andWhere(`(consumption.timestamp AT TIME ZONE '${CONSUMPTION_TIMEZONE}')::date <= CAST(:dateEnd AS date)`, {
        dateEnd: toCalendarDateString(query.date_end),
      });
    }

    qb = qb.orderBy("consumption.timestamp", "ASC");

    return qb.getMany();
  }

  /**
   * Meters the caller's members hold on `at`, restricted to those attached to a
   * sharing operation (a meter outside one has no key and therefore no share).
   *
   * The ownership predicate is anchored on `md.id_member` — the holder of THIS
   * row — rather than on `getMeters`' looser "any member of mine ever held this
   * EAN". That difference is the whole authorization: with the loose form, a
   * member who transferred a meter away would keep seeing the new holder's share.
   *
   * The window is inclusive on both ends because `addMeterData` closes a holding
   * with `next_start - 1 day`, making `end_date` the last day held.
   */
  getOwnMeterHoldings(at: string, limit: number, query_runner?: QueryRunner): Promise<MeMeterHoldingRow[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { user_id } = getContext();

    const qb = manager.createQueryBuilder(MeterData, "md");

    // Security fallback: no user in context = no results
    if (!user_id) {
      qb.andWhere("1=0");
      return qb.getRawMany<MeMeterHoldingRow>();
    }

    return qb
      // `ean` is the FK column behind the `meter` relation, not a mapped property
      // on MeterData, so it has to come through the join.
      .innerJoin("md.meter", "mt")
      .innerJoin("md.member", "mem")
      .innerJoin("md.sharing_operation", "so")
      .innerJoin("md.community", "com")
      .select("mt.EAN", "ean")
      .addSelect("mem.id", "member_id")
      .addSelect("mem.name", "member_name")
      .addSelect("so.id", "operation_id")
      .addSelect("so.name", "operation_name")
      .addSelect("so.type", "operation_type")
      .addSelect("com.id", "community_id")
      .addSelect("com.name", "community_name")
      .addSelect("com.logo_url", "community_logo_url")
      .addSelect("md.start_date", "holding_start_date")
      .addSelect("md.end_date", "holding_end_date")
      .where("CAST(:at AS date) BETWEEN md.start_date AND COALESCE(md.end_date, 'infinity'::date)", { at })
      .andWhere(
        `EXISTS (
            SELECT 1 FROM user_member_link sub_uml
            INNER JOIN "app_user" sub_u ON sub_u.id = sub_uml.id_user
            WHERE sub_uml.id_member = md.id_member
            AND sub_u.auth_user_id = :contextAuthId
        )`,
        { contextAuthId: user_id },
      )
      .orderBy("com.name", "ASC")
      .addOrderBy("so.name", "ASC")
      .addOrderBy("mt.EAN", "ASC")
      // A cap rather than a page/limit contract: the tile's whole point is "my
      // share everywhere", so paginating it would fragment the only useful view.
      // This exists so a pathological account degrades instead of exhausting memory.
      .limit(limit)
      .getRawMany<MeMeterHoldingRow>();
  }

  /**
   * Per-meter consumption totals for a calendar window, across every community.
   *
   * Aggregated in Postgres rather than by fetching series and summing in
   * TypeScript: `/me/meters/{ean}/consumptions` returns seven unbounded
   * quarter-hourly arrays, so the landing page would otherwise pull ~3000 rows
   * per meter per month just to render four numbers.
   *
   * **The ownership predicate is the windowed one**, character for character
   * the same as `getMeterConsumptions`': a reading counts only if one of the
   * caller's members held that meter on the reading's own calendar day. The
   * looser "ever held this EAN" form used by `getMeters` would hand a former
   * holder the current holder's kWh — the meter-transfer case is real in this
   * product, not hypothetical.
   *
   * The join to `meter` is what carries the community, and it is an inner join
   * on purpose: a reading whose meter row has vanished has no community to
   * attribute it to and must not be silently folded into a total.
   */
  getOwnEnergyTotals(
    period_start: string,
    period_end: string,
    limit: number,
    query_runner?: QueryRunner,
  ): Promise<MeEnergyMeterRow[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { user_id } = getContext();

    const qb = manager.createQueryBuilder(MeterConsumption, "consumption");

    // Security fallback: no user in context = no results
    if (!user_id) {
      qb.andWhere("1=0");
      return qb.getRawMany<MeEnergyMeterRow>();
    }

    const localDay = `(consumption.timestamp AT TIME ZONE '${CONSUMPTION_TIMEZONE}')::date`;

    return qb
      .innerJoin("consumption.meter", "mt")
      .innerJoin("mt.community", "com")
      .select("mt.EAN", "ean")
      .addSelect("mt.meter_number", "meter_number")
      .addSelect("com.id", "community_id")
      .addSelect("com.name", "community_name")
      .addSelect("com.logo_url", "community_logo_url")
      .addSelect("COUNT(consumption.id)", "reading_count")
      .addSelect("SUM(consumption.gross)", "gross")
      .addSelect("SUM(consumption.shared)", "shared")
      .addSelect("SUM(consumption.inj_gross)", "inj_gross")
      .addSelect("SUM(consumption.inj_shared)", "inj_shared")
      .where(`${localDay} BETWEEN CAST(:periodStart AS date) AND CAST(:periodEnd AS date)`, {
        periodStart: period_start,
        periodEnd: period_end,
      })
      .andWhere(
        `EXISTS (
            SELECT 1 FROM meter_data sub_md
            INNER JOIN user_member_link sub_uml ON sub_uml.id_member = sub_md.id_member
            INNER JOIN "app_user" sub_u ON sub_u.id = sub_uml.id_user
            WHERE sub_md.ean = consumption.ean
            AND sub_u.auth_user_id = :contextAuthId
            AND ${localDay}
                BETWEEN sub_md.start_date AND COALESCE(sub_md.end_date, 'infinity'::date)
        )`,
        { contextAuthId: user_id },
      )
      .groupBy("mt.EAN")
      .addGroupBy("mt.meter_number")
      .addGroupBy("com.id")
      .addGroupBy("com.name")
      .addGroupBy("com.logo_url")
      .orderBy("com.name", "ASC")
      .addOrderBy("mt.EAN", "ASC")
      // A cap, not a pagination contract: "my energy everywhere" is the whole
      // point, so paging it would fragment the only useful view. This exists so
      // a pathological account degrades instead of exhausting memory.
      .limit(limit)
      .getRawMany<MeEnergyMeterRow>();
  }

  getKeysInForce(operation_ids: number[], at: string, query_runner?: QueryRunner): Promise<MeKeyInForceRow[]> {
    // TypeORM emits invalid SQL for an empty `IN (:...ids)`.
    if (operation_ids.length === 0) return Promise.resolve([]);
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return (
      manager
        .createQueryBuilder(SharingOperationKey, "sok")
        .innerJoin("sok.allocation_key", "ak")
        .select("sok.id_sharing_operation", "operation_id")
        .addSelect("ak.id", "key_id")
        .addSelect("ak.name", "key_name")
        .addSelect("sok.start_date", "key_start_date")
        .addSelect("sok.end_date", "key_end_date")
        // One winner per operation: latest start, then highest id. Overlapping
        // approved windows are not supposed to exist, but the DB does not forbid
        // them and a duplicated row would silently double a member's share.
        .distinctOn(["sok.id_sharing_operation"])
        .where("sok.id_sharing_operation IN (:...ids)", { ids: operation_ids })
        .andWhere("sok.status = :approved", { approved: SharingKeyStatus.APPROVED })
        .andWhere("sok.start_date <= CAST(:at AS date)", { at })
        .andWhere("(sok.end_date IS NULL OR sok.end_date >= CAST(:at AS date))", { at })
        .orderBy("sok.id_sharing_operation", "ASC")
        .addOrderBy("sok.start_date", "DESC")
        .addOrderBy("sok.id", "DESC")
        .getRawMany<MeKeyInForceRow>()
    );
  }

  getKeyIterations(key_ids: number[], query_runner?: QueryRunner): Promise<MeKeyIterationRow[]> {
    if (key_ids.length === 0) return Promise.resolve([]);
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Read separately from the consumers so an iteration the caller's EAN is
    // absent from still appears, as a 0 % contribution rather than as a gap.
    return manager
      .createQueryBuilder(Iteration, "it")
      // `id_key` is the FK column behind `allocation_key`, not a mapped property.
      .innerJoin("it.allocation_key", "ak")
      .select("ak.id", "key_id")
      .addSelect("it.id", "iteration_id")
      .addSelect("it.number", "iteration_number")
      .addSelect("it.energy_allocated_percentage", "iteration_share")
      .where("ak.id IN (:...key_ids)", { key_ids })
      .orderBy("ak.id", "ASC")
      .addOrderBy("it.number", "ASC")
      .getRawMany<MeKeyIterationRow>();
  }

  getKeyConsumersForEans(key_ids: number[], eans: string[], query_runner?: QueryRunner): Promise<MeKeyConsumerRow[]> {
    if (key_ids.length === 0 || eans.length === 0) return Promise.resolve([]);
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return (
      manager
        .createQueryBuilder(Consumer, "cons")
        .innerJoin("cons.iteration", "it")
        .innerJoin("it.allocation_key", "ak")
        .select("it.id", "iteration_id")
        .addSelect("cons.id", "consumer_id")
        .addSelect("cons.name", "consumer_name")
        .addSelect("cons.energy_allocated_percentage", "consumer_share")
        .where("ak.id IN (:...key_ids)", { key_ids })
        // `consumer.name` is varchar(255) free text with NO foreign key to a meter.
        // TRIM only — EANs are digits, so there is no case to fold.
        .andWhere("TRIM(cons.name) IN (:...eans)", { eans })
        .getRawMany<MeKeyConsumerRow>()
    );
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
