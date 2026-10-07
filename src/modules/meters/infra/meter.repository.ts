import type { IMeterRepository } from "../domain/i-meter.repository.js";
import { Meter, MeterConsumption, MeterData } from "../domain/meter.models.js";
import { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";
import { Member } from "../../members/domain/member.models.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DeepPartial, DeleteResult, EntityManager, In, SelectQueryBuilder, type QueryRunner, UpdateResult } from "typeorm";
import { CreateMeterDTO, MeterConsumptionQuery, MeterMapQuery, MeterPartialQuery, UpdateMeterDTO } from "../api/meter.dtos.js";
import { applyFilters, FilterDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { CONSUMPTION_WRITE_CHUNK_SIZE, lockConsumptionImport, readingColumns, timeWindow } from "../../../shared/database/consumption-import.js";
import { Address } from "../../../shared/address/address.models.js";
import { AddressGeocodeStatus, AddressGeoPrecision } from "../../../shared/address/address.types.js";
import type { CreateAddressDTO } from "../../../shared/address/address.dtos.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { METER_ERRORS } from "../shared/meter.errors.js";
import { SHARING_OPERATION_ERRORS } from "../../sharing_operations/shared/sharing_operation.errors.js";
import logger from "../../../shared/monitor/logger.js";
import { MeterDataStatus } from "../shared/meter.types.js";
import { addDaysISO, appTodayISO, CONSUMPTION_TIMEZONE, toCalendarDateString } from "../../../shared/utils/date.utils.js";

@injectable()
export class MeterRepository implements IMeterRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}
  meterFilters: FilterDef<Meter>[] = [
    { key: "EAN", apply: (qb, val) => qb.andWhere("meter.EAN LIKE :ean", { ean: `%${val}%` }) },
    { key: "meter_number", apply: (qb, val) => qb.andWhere("meter.meter_number LIKE :mn", { mn: `%${val}%` }) },

    // Address Filters
    { key: "street", apply: (qb, val) => qb.andWhere("address.street LIKE :street", { street: `%${val}%` }) },
    { key: "city", apply: (qb, val) => qb.andWhere("address.city LIKE :city", { city: `%${val}%` }) },
    { key: "postcode", apply: (qb, val) => qb.andWhere("address.postcode = :post", { post: val }) },
    // The query parameter is `address_number`; the Address property is `number`.
    // TypeORM passes an unknown property path through verbatim, so the old
    // "address.address_number" reached Postgres as a column that does not exist
    // and turned every filtered request into a 500.
    { key: "address_number", apply: (qb, val) => qb.andWhere("address.number = :an", { an: val }) },
    { key: "supplement", apply: (qb, val) => qb.andWhere("address.supplement LIKE :supp", { supp: `%${val}%` }) },
    // Whether the meter is USABLY on the map. `false` is the repair queue.
    //
    // Deliberately wider than "has a coordinate". The 2026-08-20 migration
    // seeded a commune centroid for every address whose postcode maps to one
    // commune, so most rows DO have a latitude — they just all sit stacked on
    // the centre of their commune. Those are the pins that look authoritative
    // and are wrong, and a queue keyed on `latitude IS NULL` would never show
    // a single one of them.
    {
      key: "located",
      apply: (qb, val) =>
        val
          ? qb.andWhere("address.latitude IS NOT NULL AND address.geo_precision < :approx", {
              approx: AddressGeoPrecision.MUNICIPALITY,
            })
          : qb.andWhere("address.latitude IS NULL OR address.geo_precision IS NULL OR address.geo_precision >= :approx", {
              approx: AddressGeoPrecision.MUNICIPALITY,
            }),
    },

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
        const now = appTodayISO();

        return qb
          .andWhere((sub) => {
            const subQuery = sub
              .subQuery()
              .select("md.meter") // or "md.meterEAN" depending on your mapping
              .from(MeterData, "md")
              .where("md.sharing_operation = :not_soid")
              .andWhere("md.start_date <= :now")
              .andWhere("(md.end_date IS NULL OR md.end_date >= :now)")
              .getQuery();

            return `meter.EAN NOT IN ${subQuery}`;
          })
          .setParameters({ not_soid: val, now });
      },
    },
  ];
  /**
   * Upsert one import's per-meter readings: one row per (EAN, timestamp), whose
   * values, operation and community are those of the latest import.
   *
   * Set-based. This used to be find-then-`manager.save()` in chunks of 1000,
   * which builds a TypeORM subject per row and sends one UPDATE per changed row:
   * a one-month, five-meter RESA file (~15,000 rows) took ~3 s to import and
   * ~10 s to re-import with corrected values, past the gateway's 3 s cap, so the
   * SPA reported a failure for an import that had been saved. Now: one lookup of
   * the rows already stored in the file's time window, then one UPDATE (by id)
   * and one INSERT per chunk.
   *
   * Re-imports stay idempotent, also when two imports overlap (see
   * `lockConsumptionImport`). A key that already holds two rows has both updated.
   */
  async addMeterConsumptions(
    id_sharing: number,
    consumptions: (Partial<MeterConsumption> & { ean: string })[],
    query_runner?: QueryRunner,
  ): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const communityId = await this.getSharingOperationCommunityId(id_sharing, manager);
    if (consumptions.length === 0) return;
    await lockConsumptionImport(manager, communityId);

    // 1. Rows already stored for these meters in the file's time window.
    const times = consumptions.map((c) => new Date(c.timestamp!).getTime());
    const [from, to] = timeWindow(times);
    const existing: { id: number; ean: string; timestamp: Date }[] = await manager.query(
      `SELECT id, ean, "timestamp" FROM meter_consumption
       WHERE ean = ANY($1::varchar[]) AND "timestamp" BETWEEN $2::timestamptz AND $3::timestamptz`,
      [Array.from(new Set(consumptions.map((c) => c.ean))), from, to],
    );
    const idsByKey = new Map<string, number[]>();
    for (const row of existing) {
      const key = `${row.ean}_${new Date(row.timestamp).getTime()}`;
      const ids = idsByKey.get(key);
      if (ids) ids.push(row.id);
      else idsByKey.set(key, [row.id]);
    }

    // 2. Update the rows that exist, insert the others.
    const updates: { id: number; reading: (typeof consumptions)[number] }[] = [];
    const inserts: { time: number; reading: (typeof consumptions)[number] }[] = [];
    consumptions.forEach((reading, index) => {
      const ids = idsByKey.get(`${reading.ean}_${times[index]}`);
      if (ids) {
        ids.forEach((id) => updates.push({ id, reading }));
      } else {
        inserts.push({ time: times[index], reading });
      }
    });

    // A row that already holds the file's values is left alone, so re-sending
    // the same file (the usual retry) costs a lookup instead of a rewrite.
    for (let i = 0; i < updates.length; i += CONSUMPTION_WRITE_CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CONSUMPTION_WRITE_CHUNK_SIZE);
      await manager.query(
        `UPDATE meter_consumption AS mc
         SET gross = v.gross, net = v.net, shared = v.shared,
             inj_gross = v.inj_gross, inj_net = v.inj_net, inj_shared = v.inj_shared,
             id_sharing_operation = $8::int, id_community = $9::int
         FROM unnest($1::int[], $2::float8[], $3::float8[], $4::float8[], $5::float8[], $6::float8[], $7::float8[])
           AS v(id, gross, net, shared, inj_gross, inj_net, inj_shared)
         WHERE mc.id = v.id
           AND (mc.gross, mc.net, mc.shared, mc.inj_gross, mc.inj_net, mc.inj_shared, mc.id_sharing_operation, mc.id_community)
               IS DISTINCT FROM (v.gross, v.net, v.shared, v.inj_gross, v.inj_net, v.inj_shared, $8::int, $9::int)`,
        [chunk.map((u) => u.id), ...readingColumns(chunk.map((u) => u.reading)), id_sharing, communityId],
      );
    }
    for (let i = 0; i < inserts.length; i += CONSUMPTION_WRITE_CHUNK_SIZE) {
      const chunk = inserts.slice(i, i + CONSUMPTION_WRITE_CHUNK_SIZE);
      await manager.query(
        `INSERT INTO meter_consumption
           (ean, "timestamp", gross, net, shared, inj_gross, inj_net, inj_shared, id_sharing_operation, id_community)
         SELECT v.ean, v.ts, v.gross, v.net, v.shared, v.inj_gross, v.inj_net, v.inj_shared, $9::int, $10::int
         FROM unnest($1::varchar[], $2::timestamptz[], $3::float8[], $4::float8[], $5::float8[], $6::float8[], $7::float8[], $8::float8[])
           AS v(ean, ts, gross, net, shared, inj_gross, inj_net, inj_shared)`,
        [
          chunk.map((c) => c.reading.ean),
          chunk.map((c) => new Date(c.time).toISOString()),
          ...readingColumns(chunk.map((c) => c.reading)),
          id_sharing,
          communityId,
        ],
      );
    }
  }
  async addMeterData(ean: string, new_data: DeepPartial<MeterData>, query_runner?: QueryRunner): Promise<MeterData> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    // 0. The configuration is written for the caller's community, so everything it points at
    // must belong to that community too.
    await this.assertReferencesInCommunity(ean, new_data, internal_community_id, manager);

    // 1. Fetch the latest configuration for this meter to handle continuity
    const latestMeterData = await manager.findOne(MeterData, {
      where: { meter: { EAN: ean } },
      order: { start_date: "DESC" },
    });

    const newStart = new_data.start_date as string;

    if (latestMeterData) {
      const latestStart = latestMeterData.start_date;

      // Case 1: Future configuration exists -> Error
      // We cannot easily insert history before a future state without complex re-linking.
      // Lexicographic comparison is correct for zero-padded YYYY-MM-DD strings.
      if (latestStart > newStart) {
        logger.error({ operation: "addMeterData" }, `Conflict: Meter ${ean} already has a configuration starting on ${latestMeterData.start_date}`);
        throw new AppError(METER_ERRORS.ADD_METER_DATA.CONFLICT_CONFIG_ALREADY_EXISTING, 400);
      }

      // Case 2: Configuration exists on the SAME day -> Update it
      // This allows correcting a mistake made for "today" or "future date".
      if (latestStart === newStart) {
        // Merge the new data into the existing one
        const updated = manager.merge(MeterData, latestMeterData, new_data);
        return await manager.save(updated);
      }

      // Case 3: Configuration exists in the past -> Close it
      // Close if it's currently open (null) OR if it currently ends AFTER our new start (overlap)
      if (!latestMeterData.end_date || latestMeterData.end_date >= newStart) {
        latestMeterData.end_date = addDaysISO(newStart, -1);
        await manager.save(latestMeterData);
      }
    }

    // 2. Create new MeterData entry
    // We inherit technical specs from the previous entry to maintain continuity
    // unless they are explicitly overridden in 'new_data'.
    // The holder is inherited only when it is absent: an explicit `null` clears it.
    const member = new_data.member !== undefined ? new_data.member : await this.getHolder(latestMeterData, manager);
    const meterData = manager.create(MeterData, {
      ...new_data, // properties from DTO (e.g. sharing_operation, start_date)
      meter: { EAN: ean },
      community: { id: internal_community_id },

      // Status logic: Use provided status, fallback to existing status (inheritance), or default to WAITING_GRD for new meters
      status: new_data.status ?? latestMeterData?.status ?? MeterDataStatus.WAITING_GRD,

      // Inherit technical fields from latest data if they are not provided in new_data
      description: new_data.description ?? latestMeterData?.description,
      sampling_power: new_data.sampling_power ?? latestMeterData?.sampling_power,
      amperage: new_data.amperage ?? latestMeterData?.amperage,
      rate: new_data.rate ?? latestMeterData?.rate,
      client_type: new_data.client_type ?? latestMeterData?.client_type,
      member,
      injection_status: new_data.injection_status ?? latestMeterData?.injection_status,
      production_chain: new_data.production_chain ?? latestMeterData?.production_chain,
      total_generating_capacity: new_data.total_generating_capacity ?? latestMeterData?.total_generating_capacity,
      grd: new_data.grd ?? latestMeterData?.grd,
    });

    return await manager.save(meterData);
  }

  /**
   * Refuses a configuration that reaches outside the caller's community: a meter, holder or sharing
   * operation of another community. This is the single writer of meter data, so the check covers
   * every endpoint that writes one; each reports "not found" so it doesn't reveal what exists elsewhere.
   */
  private async assertReferencesInCommunity(
    ean: string,
    new_data: DeepPartial<MeterData>,
    community_id: number,
    manager: EntityManager,
  ): Promise<void> {
    if (!(await manager.exists(Meter, { where: { EAN: ean, community: { id: community_id } } }))) {
      logger.warn({ operation: "addMeterData", ean }, "Meter not found in the caller's community");
      throw new AppError(METER_ERRORS.ADD_METER_DATA.METER_NOT_FOUND, 400);
    }
    const member_id = new_data.member?.id;
    if (member_id && !(await manager.exists(Member, { where: { id: member_id, community: { id: community_id } } }))) {
      logger.warn({ operation: "addMeterData", ean, member_id }, "Member not found in the caller's community");
      throw new AppError(METER_ERRORS.ADD_METER_DATA.MEMBER_NOT_FOUND, 400);
    }
    const sharing_operation_id = new_data.sharing_operation?.id;
    if (sharing_operation_id && !(await manager.exists(SharingOperation, { where: { id: sharing_operation_id, community: { id: community_id } } }))) {
      logger.warn({ operation: "addMeterData", ean, sharing_operation_id }, "Sharing operation not found in the caller's community");
      throw new AppError(METER_ERRORS.ADD_METER_DATA.SHARING_OPERATION_NOT_FOUND, 400);
    }
  }

  /**
   * The holder of a configuration, loaded on its own. `addMeterData` fetches the latest row without
   * relations on purpose: its same-day branch merges into that row, and TypeORM's merge ignores an
   * explicit `null` for a relation that is already loaded (so a holder could no longer be cleared).
   */
  private async getHolder(meterData: MeterData | null, manager: EntityManager): Promise<Member | null> {
    if (!meterData) return null;
    const withHolder = await manager.findOne(MeterData, { where: { id: meterData.id }, relations: { member: true } });
    return withHolder?.member ?? null;
  }

  /**
   * Whether an EAN is already registered, in ANY community — deliberately unscoped: the EAN is the
   * meter table's primary key, so a meter can exist only once platform-wide. Creating a meter must
   * be refused when another community holds it; otherwise `save()` would load that row by its key
   * and silently move it (and its whole history) into the caller's community.
   */
  async isEanRegistered(ean: string, query_runner?: QueryRunner): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.exists(Meter, { where: { EAN: ean } });
  }

  async areMetersInCommunity(eans: string[], query_runner?: QueryRunner): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    if (eans.length === 0) return true;

    const count = await manager.count(Meter, {
      where: {
        EAN: In(eans),
        community: { id: internal_community_id },
      },
    });

    return count === eans.length;
  }

  async getLastMeterData(ean: string, query_runner?: QueryRunner): Promise<MeterData | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return manager.findOne(MeterData, {
      where: { meter: { EAN: ean }, community: { id: internal_community_id } },
      order: { start_date: "DESC" },
      relations: ["sharing_operation", "member"],
    });
  }

  /**
   * Counts the meter configurations of a member that are currently "active": their record is
   * effective now (start_date <= now < end_date) and their status is anything other than INACTIVE.
   * Used to block member deactivation/deletion while live meters are still attached.
   * Counted within the caller's community only, so the answer reveals nothing about another
   * community's members.
   */
  async countActiveMeterDataForMember(memberId: number, query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const now = appTodayISO();
    return manager
      .createQueryBuilder(MeterData, "md")
      .where("md.member = :memberId", { memberId })
      .andWhere("md.community = :community_id", { community_id: internal_community_id })
      .andWhere("md.status != :inactive", { inactive: MeterDataStatus.INACTIVE })
      .andWhere("md.start_date <= :now", { now })
      .andWhere("(md.end_date IS NULL OR md.end_date >= :now)", { now })
      .getCount();
  }

  getMeter(id: string, query_runner?: QueryRunner): Promise<Meter | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(Meter, "meter");

    withCommunityScope(qb, "meter");

    // andWhere, not where: `.where()` would replace the community condition the scope just added.
    qb = qb
      .andWhere("meter.EAN = :ean", { ean: id })
      .leftJoinAndSelect("meter.address", "address")
      // Fetch ALL meter data history for the detail view
      .leftJoinAndSelect("meter.meter_data", "meter_data")
      .leftJoinAndSelect("meter_data.member", "member")
      .leftJoinAndSelect("meter_data.sharing_operation", "sharing_operation")
      // Order by start_date DESC so active/future is usually first, history follows
      .addOrderBy("meter_data.start_date", "DESC");

    return qb.getOne();
  }

  getMetersList(query: MeterPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(Meter, "meter");

    // 1. Scope
    withCommunityScope(qb, "meter");

    // 2. Joins
    // Join Address for filtering/display
    qb.leftJoinAndSelect("meter.address", "address");

    // Join ONLY the active MeterData to allow filtering by current status/holder/sharing
    // 'active_data' alias is used in the filters above
    const now = appTodayISO();

    qb.leftJoinAndSelect(
      "meter.meter_data",
      "active_data",
      `
        active_data.start_date <= :now
        AND (
          active_data.end_date IS NULL
          OR active_data.end_date >= :now
        )
        `,
      { now },
    );
    // The holder of the window in force, for the list's Holder column and the
    // live-data device picker. Many-to-one on a window already joined: at most
    // one row per window, so neither the page nor the count moves. Same alias as
    // getMetersMap. A join only, never a .where(): withCommunityScope's
    // condition must stay in the WHERE.
    qb.leftJoinAndSelect("active_data.member", "holder");
    // 3. Apply Filters
    qb = applyFilters(this.meterFilters, qb, query);
    // 4. Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Ordering (Default by EAN if not specified)
    qb.orderBy("meter.EAN", "ASC");

    return qb.skip(skip).take(take).getManyAndCount();
  }

  /**
   * Plottable meters for the map, plus how many matched the filters overall.
   *
   * Two statements on purpose. The first counts everything the filters match,
   * geocoded or not, so the caller can report "812 of 1204 plotted"; the second
   * fetches only the rows that have coordinates. Doing it in one pass would
   * force a conditional aggregate and still not give the caller a truncation
   * signal.
   *
   * Coincident meters are NOT collapsed here: two flats in one building are two
   * EANs and the popup must list both. Grouping is the UI's job.
   *
   * @returns [rows (up to take), total_plottable, total_matching]
   */
  async getMetersMap(query: MeterMapQuery, take: number, query_runner?: QueryRunner): Promise<[Meter[], number, number, number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const now = appTodayISO();

    const build = (): SelectQueryBuilder<Meter> => {
      let qb = manager.createQueryBuilder(Meter, "meter");
      withCommunityScope(qb, "meter");
      qb.leftJoinAndSelect("meter.address", "address");
      qb.leftJoinAndSelect(
        "meter.meter_data",
        "active_data",
        `
        active_data.start_date <= :now
        AND (
          active_data.end_date IS NULL
          OR active_data.end_date >= :now
        )
        `,
        { now },
      );
      qb = applyFilters(this.meterFilters, qb, query);
      return qb;
    };

    const total_matching = await build().getCount();

    const qb = build();
    // The popup labels the holder and the operation. The holder is joined
    // exactly as in getMetersList; the operation is selected only here.
    qb.leftJoinAndSelect("active_data.member", "holder");
    qb.leftJoinAndSelect("active_data.sharing_operation", "operation");
    qb.andWhere("address.latitude IS NOT NULL");
    qb.orderBy("meter.EAN", "ASC");

    // take + 1: one row past the cap is how truncation is detected without a
    // second COUNT.
    const [rows, total_plottable] = await qb.take(take + 1).getManyAndCount();

    // Counted server-side rather than derived from `rows`: the result is capped,
    // so a client-side count would silently under-report on a large community.
    const approximate = await build().andWhere("address.geo_precision >= :approx", { approx: AddressGeoPrecision.MUNICIPALITY }).getCount();

    return [rows, total_plottable, total_matching, approximate];
  }

  async getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    let qb = manager.createQueryBuilder(MeterConsumption, "consumption");

    // Scope to community and specific meter EAN
    qb = qb.where("consumption.meter = :ean", { ean }).andWhere("consumption.community = :commId", { commId: internal_community_id });

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
  async createMeter(meterDto: CreateMeterDTO, query_runner?: QueryRunner): Promise<Meter> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    // 1. Create Address
    // Using manager.create allows TypeORM to handle the DTO structure for Address
    const address = addressWithPin(manager, meterDto.address);
    const savedAddress = await manager.save(address);

    // 2. Create Physical Meter
    const meter = manager.create(Meter, {
      EAN: meterDto.EAN,
      meter_number: meterDto.meter_number,
      tarif_group: meterDto.tarif_group,
      phases_number: meterDto.phases_number,
      reading_frequency: meterDto.reading_frequency,
      address: savedAddress,
      community: { id: internal_community_id },
    });
    return manager.save(meter);
  }

  async deleteMeter(id: string, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return manager.delete(Meter, {
      EAN: id,
      community: { id: internal_community_id },
    });
  }

  async updateMeter(update_meter: UpdateMeterDTO, query_runner?: QueryRunner): Promise<{ result: UpdateResult; address_id: number }> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const address = addressWithPin(manager, update_meter.address);
    const savedAddress = await manager.save(address);
    const result = await manager.update(
      Meter,
      {
        EAN: update_meter.EAN,
        community: { id: internal_community_id },
      },
      {
        address: savedAddress,
        meter_number: update_meter.meter_number,
        tarif_group: update_meter.tarif_group,
        phases_number: update_meter.phases_number,
        reading_frequency: update_meter.reading_frequency,
      },
    );
    return { result, address_id: savedAddress.id };
  }
  /**
   * Repoint a meter at a new address, touching nothing else.
   *
   * The full `updateMeter` is a REPLACE: it also writes meter_number,
   * tarif_group, phases_number and reading_frequency, none of which the list
   * row carries. Repairing an address through it would mean fetching every
   * meter first just to echo its configuration back, and any field the caller
   * got wrong would silently overwrite the real one.
   */
  async updateMeterAddress(
    EAN: string,
    new_address: CreateAddressDTO,
    query_runner?: QueryRunner,
  ): Promise<{ result: UpdateResult; address_id: number }> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    const address = addressWithPin(manager, new_address);
    const savedAddress = await manager.save(address);
    const result = await manager.update(Meter, { EAN, community: { id: internal_community_id } }, { address: savedAddress });
    return { result, address_id: savedAddress.id };
  }

  async getMeterData(id: number, query_runner?: QueryRunner): Promise<MeterData | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    return manager.findOne(MeterData, {
      where: { id, community: { id: internal_community_id } },
      relations: ["meter"], // Essential because your service accesses latest_meter_data.meter.EAN
    });
  }
  async activePreviousInactiveMeterData(
    ean: string,
    previous_start_date: string,
    previous_end_date?: string | null,
    query_runner?: QueryRunner,
  ): Promise<UpdateResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    /**
     * Logic: Find the record for this meter where its end_date
     * matches the start_date of the record we just removed.
     */
    const prevEndDate = addDaysISO(previous_start_date, -1);
    const previousRecord = await manager.findOne(MeterData, {
      where: {
        meter: { EAN: ean },
        end_date: prevEndDate,
      },
    });

    if (!previousRecord) {
      // If no direct predecessor exists, we return an empty update result
      return { affected: -1, raw: [], generatedMaps: [] };
    }

    // Update the predecessor to "inherit" the deleted record's end_date
    return manager.update(
      MeterData,
      { id: previousRecord.id },
      {
        end_date: previous_end_date,
      },
    );
  }

  deleteMeterData(meter_data: MeterData, query_runner?: QueryRunner): Promise<MeterData> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.remove(meter_data);
  }

  private async getSharingOperationCommunityId(id_sharing: number, manager: typeof AppDataSource.manager): Promise<number> {
    const sharingOp = await manager.findOne(SharingOperation, {
      where: { id: id_sharing },
      relations: ["community"],
    });
    if (!sharingOp?.community?.id) {
      throw new AppError(SHARING_OPERATION_ERRORS.GET_SHARING_OPERATION.SHARING_OPERATION_NOT_FOUND, 400);
    }
    return sharingOp.community.id;
  }
}

/**
 * Build an Address entity from a submitted DTO, stamping a supplied coordinate.
 *
 * `manager.create(Address, dto)` copies `latitude`/`longitude` but leaves
 * `geo_precision` NULL, and a coordinate with no precision is not a usable pin:
 * the map cannot tell a rooftop from a commune centre, and the repair queue —
 * which treats NULL precision as "not located" — would hand the meter straight
 * back to the operator who just fixed it.
 *
 * MANUAL, matching `AddressRepository.addAddress`: the user chose this point,
 * whether by picking it from the register or by hand, and no later batch should
 * overwrite it.
 */
function addressWithPin(manager: EntityManager, dto: CreateAddressDTO): Address {
  const has_pin = dto.latitude !== undefined && dto.longitude !== undefined;
  return manager.create(Address, {
    ...dto,
    geo_precision: has_pin ? AddressGeoPrecision.MANUAL : null,
    geo_source: has_pin ? "manual" : null,
    geocoded_at: has_pin ? new Date() : null,
    geocode_status: has_pin ? AddressGeocodeStatus.OK : AddressGeocodeStatus.NEVER,
  });
}
