import { inject, injectable } from "inversify";
import type { ISharingOperationRepository } from "../domain/i-sharing_operation.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import {
  CreateSharingOperationDTO,
  SharingOperationConsumptionQuery,
  SharingOperationMetersQuery,
  SharingOperationMetersQueryType,
  SharingOperationPartialQuery,
} from "../api/sharing_operation.dtos.js";
import { SharingOpConsumption, SharingOperation, SharingOperationKey } from "../domain/sharing_operation.models.js";
import {DeleteResult, In, type QueryRunner, SelectQueryBuilder} from "typeorm";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { Meter, MeterData } from "../../meters/domain/meter.models.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { SharingKeyStatus } from "../shared/sharing_operation.types.js";
import { KeyPartialQuery } from "../../keys/api/key.dtos.js";

@injectable()
export class SharingOperationRepository implements ISharingOperationRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}

  // --- Filters Definition ---
  sharingOpFilters: FilterDef<SharingOperation>[] = [
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("sharing_op.name LIKE :name", { name: `%${val}%` }),
    },
    {
      key: "type",
      // Assuming the DTO passes the value (likely numeric id as string) that matches the DB column
      apply: (qb, val) => qb.andWhere("sharing_op.type = :type", { type: val }),
    },
  ];

  // --- Sorts Definition ---
  sharingOpSorts: SortDef<SharingOperation>[] = [
    {
      key: "sort_name",
      apply: (qb, direction) => qb.addOrderBy("sharing_op.name", direction),
    },
    {
      key: "sort_type",
      apply: (qb, direction) => qb.addOrderBy("sharing_op.type", direction),
    },
  ];

  async getSharingOperationList(query: SharingOperationPartialQuery, query_runner?: QueryRunner): Promise<[SharingOperation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(SharingOperation, "sharing_op");

    // 1. Apply Multi-tenancy scope
    // This ensures we only fetch operations belonging to the context's community
    withCommunityScope(qb, "sharing_op");

    // 2. Apply Filters
    qb = applyFilters(this.sharingOpFilters, qb, query);

    // 3. Apply Sorts
    qb = applySorts(this.sharingOpSorts, qb, query);

    // 4. Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }

  async getSharingOperationById(id_sharing: number, query_runner?: QueryRunner): Promise<SharingOperation | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(SharingOperation, "sharing_op");

    withCommunityScope(qb, "sharing_op");

    qb = qb
      .where("sharing_op.id = :id", { id: id_sharing })
      // Now we can use leftJoinAndSelect because we added the relation to the model
      .leftJoinAndSelect("sharing_op.keys", "keys")
      // Join the allocationKey to get details for the DTO
      .leftJoinAndSelect("keys.allocation_key", "allocation_key")
      // Order by start date DESC so the most recent keys (candidates for active/waiting) come first
      .addOrderBy("keys.start_date", "DESC");

    return qb.getOne();
  }

  async getSharingOperationConsumption(
    id_sharing: number,
    query: SharingOperationConsumptionQuery,
    query_runner?: QueryRunner,
  ): Promise<SharingOpConsumption[] | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(SharingOpConsumption, "consumption");

    withCommunityScope(qb, "consumption");

    // Filter by Sharing Operation ID
    qb = qb.andWhere("consumption.sharing_operation = :id", { id: id_sharing });

    // Date Filters
    if (query.date_start) {
      qb = qb.andWhere("consumption.timestamp >= :start", { start: query.date_start });
    }
    if (query.date_end) {
      qb = qb.andWhere("consumption.timestamp <= :end", { end: query.date_end });
    }

    // Sort by timestamp ASC (standard for time series)
    qb = qb.orderBy("consumption.timestamp", "ASC");

    return qb.getMany();
  }

  async createSharingOperation(new_sharing_op: CreateSharingOperationDTO, query_runner?: QueryRunner): Promise<SharingOperation> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Retrieve the internal community ID (Multitenancy)
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    const sharing_op = manager.create(SharingOperation, {
      name: new_sharing_op.name,
      type: new_sharing_op.type,
      community: { id: internal_community_id },
    });

    return await manager.save(sharing_op);
  }

  async addConsumptions(id_sharing: number, consumptions: Partial<SharingOpConsumption>[], query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    const chunkSize = 1000;
    for (let i = 0; i < consumptions.length; i += chunkSize) {
      const chunk = consumptions.slice(i, i + chunkSize);
      const timestamps = chunk.map((c) => c.timestamp);

      // 1. Find existing entries to override
      const existingEntries = await manager.find(SharingOpConsumption, {
        where: {
          sharing_operation: { id: id_sharing },
          timestamp: In(timestamps),
        },
      });

      // Map for O(1) lookup
      const existingMap = new Map<number, SharingOpConsumption>();
      existingEntries.forEach((e) => existingMap.set(new Date(e.timestamp).getTime(), e));

      // 2. Prepare entities (Update existing OR Create new)
      const entitiesToSave = chunk.map((item) => {
        const itemTime = new Date(item.timestamp!).getTime();
        const existing = existingMap.get(itemTime);

        if (existing) {
          return manager.merge(SharingOpConsumption, existing, item);
        } else {
          return manager.create(SharingOpConsumption, {
            ...item,
            sharing_operation: { id: id_sharing },
            community: { id: internal_community_id },
          });
        }
      });

      await manager.save(entitiesToSave);
    }
  }

  async getAuthorizedEans(id_sharing: number, query_runner?: QueryRunner): Promise<Set<string>> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    const eans = await manager
      .createQueryBuilder(MeterData, "meter_data")
      .select("meter_data.meter") // Selects the FK column value
      .where("meter_data.sharing_operation = :id", { id: id_sharing })
      .distinct(true)
      .getRawMany();

    // Raw result often looks like { meter_data_ean: "123..." }
    const set = new Set<string>();
    eans.forEach((row) => {
      // Check for likely keys
      const val = row.meter_data_ean || row.ean || Object.values(row)[0];
      if (val) set.add(String(val));
    });

    return set;
  }

  async addKeyToSharing(id_sharing: number, id_key: number, start_date: Date, query_runner?: QueryRunner): Promise<SharingOperationKey> {
    return this.addSharingKeyEntry(id_sharing, id_key, start_date, SharingKeyStatus.PENDING, query_runner);
  }

  async addSharingKeyEntry(
    id_sharing: number,
    id_key: number,
    start_date: Date,
    status: SharingKeyStatus,
    query_runner?: QueryRunner,
  ): Promise<SharingOperationKey> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    const entity = manager.create(SharingOperationKey, {
      sharing_operation: { id: id_sharing },
      allocation_key: { id: id_key },
      community: { id: internal_community_id },
      start_date: start_date.toISOString().split("T")[0],
      status: status,
    });

    return await manager.save(entity);
  }

  /**
   * Closes any open entry for a specific key in this sharing operation.
   */
  async closeSpecificKeyEntry(id_sharing: number, id_key: number, end_date: Date, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    await manager
      .createQueryBuilder(SharingOperationKey, "key")
      .update(SharingOperationKey)
      .set({ end_date: end_date.toISOString().split("T")[0] })
      .where("sharing_operation = :id_sharing", { id_sharing })
      .andWhere("allocation_key = :id_key", { id_key })
      .andWhere("end_date IS NULL") // Only close currently open entries
      .execute();
  }

  async rejectSpecificKeyEntry(id_sharing: number, id_key: number, end_date: Date, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    await manager
      .createQueryBuilder(SharingOperationKey, "key")
      .update(SharingOperationKey)
      .set({ end_date: end_date.toISOString().split("T")[0], status: SharingKeyStatus.REJECTED })
      .where("sharing_operation = :id_sharing", { id_sharing })
      .andWhere("allocation_key = :id_key", { id_key })
      .andWhere("end_date IS NULL") // Only close currently open entries
      .execute();
  }
  /**
   * Closes any currently APPROVED (active) keys for this sharing operation.
   * Used when a new key is approved to replace the old one.
   */
  async closeActiveApprovedKey(id_sharing: number, end_date: Date, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    await manager
      .createQueryBuilder(SharingOperationKey, "key")
      .update(SharingOperationKey)
      .set({ end_date: end_date.toISOString().split("T")[0] })
      .where("sharing_operation = :id_sharing", { id_sharing })
      .andWhere("status = :status", { status: SharingKeyStatus.APPROVED })
      .andWhere("end_date IS NULL")
      .execute();
  }

  async deleteSharingOperation(id_sharing: number, query_runner?: QueryRunner): Promise<DeleteResult> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    return await manager.delete(SharingOperation, {
      id: id_sharing,
      community: { id: internal_community_id },
    });
  }
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
  getSharingOperationMetersList(id_sharing: number, query: SharingOperationMetersQuery, query_runner?: QueryRunner): Promise<[Meter[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager.createQueryBuilder(Meter, "meter");
    const now = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // 1. Join Address
    qb.leftJoinAndSelect("meter.address", "address");

    // 2. Select the specific MeterData based on the Query Type
    // We use an Inner Join here because we only want meters that
    // actually HAVE data matching the requested sharing operation period.
    qb.innerJoinAndSelect("meter.meter_data", "active_data");

    // 3. Apply Temporal Logic + Sharing Operation ID
    qb.where("active_data.id_sharing_operation = :id_sharing", { id_sharing });

    switch (query.type) {
      case SharingOperationMetersQueryType.PAST:
        qb.andWhere("active_data.end_date <= :now", { now });
        // Logic: Pick the most recent historical record
        qb.andWhere((sub) => {
          const subQuery = sub
            .subQuery()
            .select("MAX(md.start_date)")
            .from(MeterData, "md")
            .where("md.ean = meter.ean")
            .andWhere("md.id_sharing_operation = :id_sharing")
            .andWhere("md.end_date <= :now")
            .getQuery();
          return "active_data.start_date = " + subQuery;
        });
        break;

      case SharingOperationMetersQueryType.NOW:
        qb.andWhere("active_data.start_date <= :now", { now });
        qb.andWhere("(active_data.end_date IS NULL OR active_data.end_date > :now)", { now });
        break;

      case SharingOperationMetersQueryType.FUTURE:
        qb.andWhere("active_data.start_date > :now", { now });
        // Logic: Pick the nearest upcoming record
        qb.andWhere((sub) => {
          const subQuery = sub
            .subQuery()
            .select("MIN(md.start_date)")
            .from(MeterData, "md")
            .where("md.ean = meter.ean")
            .andWhere("md.id_sharing_operation = :id_sharing")
            .andWhere("md.start_date > :now")
            .getQuery();
          return "active_data.start_date = " + subQuery;
        });
        break;
    }

    // 4. Scopes and Filters
    withCommunityScope(qb, "meter");
    applyFilters(this.meterFilters, qb, query);

    // 5. Pagination
    const take = query.limit || 10;
    const skip = ((query.page || 1) - 1) * take;

    qb.orderBy("meter.EAN", "ASC").skip(skip).take(take);

    return qb.getManyAndCount();
  }
  keyPartialFilters: FilterDef<SharingOperationKey>[] = [
    {
      key: "description",
      apply: (qb, val) => qb.andWhere("key.description LIKE :desc", { desc: `%${val}%` }),
    },
    {
      key: "name",
      apply: (qb, val) => qb.andWhere("key.name LIKE :name", { name: `%${val}%` }),
    },
  ];
  keyPartialSorts: SortDef<SharingOperationKey>[] = [
    {
      key: "sort_name", // Looks for 'sort_name' in the DTO
      apply: (qb, direction) => qb.addOrderBy("key.name", direction),
    },
  ];
  getSharingOperationKeysList(id_sharing: number, query: KeyPartialQuery, query_runner?: QueryRunner): Promise<[SharingOperationKey[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager
      .createQueryBuilder(SharingOperationKey, "op_key")
      .leftJoinAndSelect("op_key.allocation_key", "key")
      .where("op_key.id_sharing_operation = :id_sharing", { id_sharing });
    withCommunityScope(qb, "op_key");
    qb = applyFilters(this.keyPartialFilters, qb, query);

    qb = applySorts(this.keyPartialSorts, qb, query);

    // 3. Pagination
    const take = query.limit;
    const skip = (query.page - 1) * take;

    return qb.skip(skip).take(take).getManyAndCount();
  }
}
