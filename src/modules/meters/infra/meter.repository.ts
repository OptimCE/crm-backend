import type { IMeterRepository } from "../domain/i-meter.repository.js";
import { Meter, MeterConsumption, MeterData } from "../domain/meter.models.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DeepPartial, DeleteResult, In, type QueryRunner, SelectQueryBuilder, UpdateResult } from "typeorm";
import { CreateMeterDTO, MeterConsumptionQuery, MeterPartialQuery, UpdateMeterDTO } from "../api/meter.dtos.js";
import { applyFilters, FilterDef } from "../../../shared/database/filters.js";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { Address } from "../../../shared/address/address.models.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { METER_ERRORS } from "../shared/meter.errors.js";
import logger from "../../../shared/monitor/logger.js";
import { MeterDataStatus } from "../shared/meter.types.js";

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
  async addMeterConsumptions(
    id_sharing: number,
    consumptions: (Partial<MeterConsumption> & { ean: string })[],
    query_runner?: QueryRunner,
  ): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

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
          });
        } else {
          // Create new
          return manager.create(MeterConsumption, {
            ...item,
            meter: { EAN: item.ean },
            sharing_operation: { id: id_sharing },
            community: { id: internal_community_id },
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

    const newStart = new Date(new_data.start_date as string);
    newStart.setHours(0, 0, 0, 0);

    if (latestMeterData) {
      const latestStart = new Date(latestMeterData.start_date);
      latestStart.setHours(0, 0, 0, 0);

      // Case 1: Future configuration exists -> Error
      // We cannot easily insert history before a future state without complex re-linking.
      if (latestStart.getTime() > newStart.getTime()) {
        logger.error({ operation: "addMeterData" }, `Conflict: Meter ${ean} already has a configuration starting on ${latestMeterData.start_date}`);
        throw new AppError(METER_ERRORS.ADD_METER_DATA.CONFLICT_CONFIG_ALREADY_EXISTING, 400);
      }

      // Case 2: Configuration exists on the SAME day -> Update it
      // This allows correcting a mistake made for "today" or "future date".
      if (latestStart.getTime() === newStart.getTime()) {
        // Merge the new data into the existing one
        const updated = manager.merge(MeterData, latestMeterData, new_data);
        return await manager.save(updated);
      }

      // Case 3: Configuration exists in the past -> Close it
      // Close if it's currently open (null) OR if it currently ends AFTER our new start (overlap)
      if (!latestMeterData.end_date || new Date(latestMeterData.end_date).getTime() >= newStart.getTime()) {
        const prevEndDate = new Date(newStart);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        latestMeterData.end_date = prevEndDate.toISOString().split("T")[0];
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
    // 3. Apply Filters
    qb = applyFilters(this.meterFilters, qb, query);
    // 4. Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    // Ordering (Default by EAN if not specified)
    qb.orderBy("meter.EAN", "ASC");

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    let qb = manager.createQueryBuilder(MeterConsumption, "consumption");

    // Scope to community and specific meter EAN
    qb = qb.where("consumption.meter = :ean", { ean }).andWhere("consumption.community = :commId", { commId: internal_community_id });

    if (query.date_start) {
      qb = qb.andWhere("consumption.timestamp >= :start", { start: query.date_start });
    }
    if (query.date_end) {
      qb = qb.andWhere("consumption.timestamp <= :end", { end: query.date_end });
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

  async updateMeter(update_meter: UpdateMeterDTO, query_runner?: QueryRunner): Promise<UpdateResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const address = manager.create(Address, update_meter.address);
    const savedAddress = await manager.save(address);
    return manager.update(
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
    const prevEndDate = new Date(previous_start_date);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const previousRecord = await manager.findOne(MeterData, {
      where: {
        meter: { EAN: ean },
        end_date: prevEndDate.toISOString().split("T")[0],
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
}
