import type { IMeterRepository } from "../domain/i-meter.repository.js";
import { Meter, MeterConsumption, MeterData } from "../domain/meter.models.js";
import { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DeepPartial, DeleteResult, In, type QueryRunner, SelectQueryBuilder, UpdateResult } from "typeorm";
import { CreateMeterDTO, MeterConsumptionQuery, MeterMapQuery, MeterPartialQuery, UpdateMeterDTO } from "../api/meter.dtos.js";
import { applyFilters, FilterDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { Address } from "../../../shared/address/address.models.js";
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
  async addMeterConsumptions(
    id_sharing: number,
    consumptions: (Partial<MeterConsumption> & { ean: string })[],
    query_runner?: QueryRunner,
  ): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const communityId = await this.getSharingOperationCommunityId(id_sharing, manager);

    const chunkSize = 1000;
    for (let i = 0; i < consumptions.length; i += chunkSize) {
      const chunk = consumptions.slice(i, i + chunkSize);
      const eans = chunk.map((c) => c.ean);
      const timestamps = chunk.map((c) => c.timestamp);

      // 1. Find existing entries to override
      const existingEntries = await manager.find(MeterConsumption, {
        where: {
          meter: { EAN: In(eans) },
          timestamp: In(timestamps),
        },
        relations: ["meter"],
      });

      const existingMap = new Map<string, MeterConsumption>();
      existingEntries.forEach((e) => {
        if (e.meter) {
          existingMap.set(`${e.meter.EAN}_${new Date(e.timestamp).getTime()}`, e);
        }
      });

      // 2. Prepare entities (Update existing OR Create new)
      const entitiesToSave = chunk.map((item) => {
        const key = `${item.ean}_${new Date(item.timestamp!).getTime()}`;
        const existing = existingMap.get(key);

        if (existing) {
          // Update existing
          return manager.merge(MeterConsumption, existing, {
            ...item,
            sharing_operation: { id: id_sharing },
            community: { id: communityId },
          });
        } else {
          // Create new
          return manager.create(MeterConsumption, {
            ...item,
            meter: { EAN: item.ean },
            sharing_operation: { id: id_sharing },
            community: { id: communityId },
          });
        }
      });

      await manager.save(entitiesToSave);
    }
  }
  async addMeterData(ean: string, new_data: DeepPartial<MeterData>, query_runner?: QueryRunner): Promise<MeterData> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

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
      member: new_data.member ?? latestMeterData?.member,
      injection_status: new_data.injection_status ?? latestMeterData?.injection_status,
      production_chain: new_data.production_chain ?? latestMeterData?.production_chain,
      total_generating_capacity: new_data.total_generating_capacity ?? latestMeterData?.total_generating_capacity,
      grd: new_data.grd ?? latestMeterData?.grd,
    });

    return await manager.save(meterData);
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
      relations: ["sharing_operation"],
    });
  }

  /**
   * Counts the meter configurations of a member that are currently "active": their record is
   * effective now (start_date <= now < end_date) and their status is anything other than INACTIVE.
   * Used to block member deactivation/deletion while live meters are still attached.
   */
  async countActiveMeterDataForMember(memberId: number, query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const now = appTodayISO();
    return manager
      .createQueryBuilder(MeterData, "md")
      .where("md.member = :memberId", { memberId })
      .andWhere("md.status != :inactive", { inactive: MeterDataStatus.INACTIVE })
      .andWhere("md.start_date <= :now", { now })
      .andWhere("(md.end_date IS NULL OR md.end_date >= :now)", { now })
      .getCount();
  }

  getMeter(id: string, query_runner?: QueryRunner): Promise<Meter | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(Meter, "meter");

    withCommunityScope(qb, "meter");

    qb = qb
      .where("meter.EAN = :ean", { ean: id })
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
  async getMetersMap(query: MeterMapQuery, take: number, query_runner?: QueryRunner): Promise<[Meter[], number, number]> {
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
    // The popup labels the holder and the operation, so unlike getMetersList
    // these two relations are selected explicitly.
    qb.leftJoinAndSelect("active_data.member", "holder");
    qb.leftJoinAndSelect("active_data.sharing_operation", "operation");
    qb.andWhere("address.latitude IS NOT NULL");
    qb.orderBy("meter.EAN", "ASC");

    // take + 1: one row past the cap is how truncation is detected without a
    // second COUNT.
    const [rows, total_plottable] = await qb.take(take + 1).getManyAndCount();

    return [rows, total_plottable, total_matching];
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
    const address = manager.create(Address, meterDto.address);
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
    return manager.delete(Meter, {
      EAN: id,
    });
  }

  async updateMeter(
    update_meter: UpdateMeterDTO,
    query_runner?: QueryRunner,
  ): Promise<{ result: UpdateResult; address_id: number }> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const address = manager.create(Address, update_meter.address);
    const savedAddress = await manager.save(address);
    const result = await manager.update(
      Meter,
      {
        EAN: update_meter.EAN,
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
  async getMeterData(id: number, query_runner?: QueryRunner): Promise<MeterData | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return manager.findOne(MeterData, {
      where: { id },
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
