import { inject, injectable } from "inversify";
import { normaliseEan } from "../../meters/shared/ean.js";
import type { ISharingOperationRepository } from "../domain/i-sharing_operation.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import {
  CreateSharingOperationDTO,
  SharingOperationConsumptionQuery,
  SharingOperationMetersQuery,
  SharingOperationMetersQueryType,
  SharingOperationPartialQuery,
} from "../api/sharing_operation.dtos.js";
import { SharingOpConsumption, SharingOperation, SharingOperationKey, SharingOperationMunicipality } from "../domain/sharing_operation.models.js";
import { DeleteResult, In, type QueryRunner, SelectQueryBuilder } from "typeorm";
import { withCommunityScope } from "../../../shared/database/withCommunity.js";
import { CONSUMPTION_WRITE_CHUNK_SIZE, lockConsumptionImport, readingColumns, timeWindow } from "../../../shared/database/consumption-import.js";
import { applyFilters, applySorts, FilterDef, SortDef } from "../../../shared/database/filters.js";
import { Meter, MeterData } from "../../meters/domain/meter.models.js";
import { CONSUMPTION_TIMEZONE, toCalendarDateString } from "../../../shared/utils/date.utils.js";
import { addDaysISO, appTodayISO } from "../../../shared/utils/date.utils.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { SharingKeyStatus } from "../shared/sharing_operation.types.js";
import { KeyPartialQuery } from "../../keys/api/key.dtos.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { SHARING_OPERATION_ERRORS } from "../shared/sharing_operation.errors.js";

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
    {
      // EXISTS subquery instead of JOIN: keeps `getManyAndCount` accurate when an
      // operation links to several municipalities (a JOIN would multiply rows and
      // break the LIMIT, same reason municipalities are loaded separately below).
      key: "municipality_nis_codes",
      apply: (qb, val): undefined | SelectQueryBuilder<SharingOperation> => {
        const codes = val as number[];
        if (codes.length === 0) return;
        return qb.andWhere(
          `EXISTS (
             SELECT 1 FROM sharing_operation_municipality som
             WHERE som.id_sharing_operation = sharing_op.id
               AND som.nis_code IN (:...nis_codes)
           )`,
          { nis_codes: codes },
        );
      },
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

    // 5. Page-then-load municipalities. Joining municipalities directly on the
    // paginated query inflates row count and breaks LIMIT, so we paginate first
    // and then enrich the result with the municipality relation.
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    await this.loadMunicipalitiesInto(manager, items);
    return [items, total];
  }

  async getSharingOperationById(id_sharing: number, query_runner?: QueryRunner): Promise<SharingOperation | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(SharingOperation, "sharing_op");

    withCommunityScope(qb, "sharing_op");

    // andWhere, not where: `.where()` would replace the community condition the scope just added,
    // and every service method that uses this lookup as its access check would pass for any community.
    qb = qb
      .andWhere("sharing_op.id = :id", { id: id_sharing })
      // Load the parent community so the DTO can surface its (read-only) regulator.
      .leftJoinAndSelect("sharing_op.community", "community")
      // Now we can use leftJoinAndSelect because we added the relation to the model
      .leftJoinAndSelect("sharing_op.keys", "keys")
      // Join the allocationKey to get details for the DTO
      .leftJoinAndSelect("keys.allocation_key", "allocation_key")
      // Order by start date DESC so the most recent keys (candidates for active/waiting) come first
      .addOrderBy("keys.start_date", "DESC");

    const item = await qb.getOne();
    if (item) {
      await this.loadMunicipalitiesInto(manager, [item]);
    }
    return item;
  }

  /**
   * Public-facing list of a community's sharing operations: only those flagged
   * `is_public = true`. No tenant scoping — the public flag is the access
   * control. Used by the new `/communities/:id/sharing_operations/public` route.
   */
  async getPublicCommunitySharingOperations(
    community_id: number,
    query: SharingOperationPartialQuery,
    query_runner?: QueryRunner,
  ): Promise<[SharingOperation[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager
      .createQueryBuilder(SharingOperation, "sharing_op")
      .where("sharing_op.is_public = :is_public", { is_public: true })
      .andWhere("sharing_op.id_community = :community_id", { community_id });

    qb = applyFilters(this.sharingOpFilters, qb, query);
    qb = applySorts(this.sharingOpSorts, qb, query);

    const take = query.limit;
    const skip = (query.page - 1) * take;
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    await this.loadMunicipalitiesInto(manager, items);
    return [items, total];
  }

  private async loadMunicipalitiesInto(manager: SharingOperationRepository["dataSource"]["manager"], operations: SharingOperation[]): Promise<void> {
    if (operations.length === 0) return;
    const ids = operations.map((op) => op.id);
    const links = await manager.find(SharingOperationMunicipality, {
      where: { id_sharing_operation: In(ids) },
      relations: ["municipality", "municipality.postal_codes"],
    });
    const byOpId = new Map<number, SharingOperationMunicipality[]>();
    for (const link of links) {
      const arr = byOpId.get(link.id_sharing_operation) ?? [];
      arr.push(link);
      byOpId.set(link.id_sharing_operation, arr);
    }
    for (const op of operations) {
      op.municipalities = byOpId.get(op.id) ?? [];
    }
  }

  async updateSharingOperationFields(id_sharing: number, partial: { name?: string; type?: number }, query_runner?: QueryRunner): Promise<number> {
    const updates: { name?: string; type?: number } = {};
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.type !== undefined) updates.type = partial.type;
    if (Object.keys(updates).length === 0) return 0;

    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    const result = await manager
      .createQueryBuilder()
      .update(SharingOperation)
      .set(updates)
      .where("id = :id_sharing", { id_sharing })
      .andWhere("id_community = :community_id", { community_id: internal_community_id })
      .execute();

    return result.affected ?? 0;
  }

  async replaceMunicipalities(id_sharing: number, nis_codes: number[], query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    await manager.delete(SharingOperationMunicipality, { id_sharing_operation: id_sharing });
    if (nis_codes.length === 0) return;
    const rows = nis_codes.map((nis_code) =>
      manager.create(SharingOperationMunicipality, {
        id_sharing_operation: id_sharing,
        nis_code,
      }),
    );
    await manager.save(rows);
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

    // Date filters on Brussels local calendar dates (matches billing period semantics).
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

    // Sort by timestamp ASC (standard for time series)
    qb = qb.orderBy("consumption.timestamp", "ASC");

    return qb.getMany();
  }

  /**
   * Monthly coverage aggregate over `sharing_op_consumption` for one operation.
   *
   * Groups rows by Brussels calendar month and counts them. `CONSUMPTION_TIMEZONE`
   * is inlined into the SQL exactly as the sibling `getSharingOperationConsumption`
   * date filter does (it is a hardcoded constant, never user input), so the month
   * boundary matches the chart: e.g. a timestamp at Brussels-local
   * `2026-01-31 23:45` lands in `2026-01`. `to_char(date_trunc(...))` returns the
   * final `YYYY-MM` string straight from the DB, avoiding any JS timezone re-shift.
   */
  getSharingOperationConsumptionCoverage(id_sharing: number, query_runner?: QueryRunner): Promise<{ month: string; count: string }[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager
      .createQueryBuilder(SharingOpConsumption, "consumption")
      .select(`to_char(date_trunc('month', consumption.timestamp AT TIME ZONE '${CONSUMPTION_TIMEZONE}'), 'YYYY-MM')`, "month")
      .addSelect("COUNT(*)", "count")
      .where("consumption.sharing_operation = :id", { id: id_sharing })
      .groupBy("month")
      .orderBy("month", "ASC");

    // Tenant scoping — same as the row-level consumption query.
    withCommunityScope(qb, "consumption");

    return qb.getRawMany<{ month: string; count: string }>();
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

    const saved = await manager.save(sharing_op);

    const nis_codes = new_sharing_op.municipality_nis_codes ?? [];
    if (nis_codes.length > 0) {
      const links = nis_codes.map((nis_code) =>
        manager.create(SharingOperationMunicipality, {
          id_sharing_operation: saved.id,
          nis_code,
        }),
      );
      await manager.save(links);
    }

    return saved;
  }

  /**
   * Upsert one import's operation-wide totals: one row per (operation,
   * timestamp), holding the latest import's values. Set-based for the reason
   * given on `MeterRepository.addMeterConsumptions`, which runs next in the
   * same transaction and under the same `lockConsumptionImport`.
   */
  async addConsumptions(id_sharing: number, consumptions: Partial<SharingOpConsumption>[], query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    if (consumptions.length === 0) return;
    await lockConsumptionImport(manager, internal_community_id);

    // 1. Rows already stored for this operation in the file's time window.
    const times = consumptions.map((c) => new Date(c.timestamp!).getTime());
    const [from, to] = timeWindow(times);
    const existing: { id: number; timestamp: Date }[] = await manager.query(
      `SELECT id, "timestamp" FROM sharing_op_consumption
       WHERE id_sharing_operation = $1::int AND "timestamp" BETWEEN $2::timestamptz AND $3::timestamptz`,
      [id_sharing, from, to],
    );
    const idsByTime = new Map<number, number[]>();
    for (const row of existing) {
      const time = new Date(row.timestamp).getTime();
      const ids = idsByTime.get(time);
      if (ids) ids.push(row.id);
      else idsByTime.set(time, [row.id]);
    }

    // 2. Update the rows that exist, insert the others.
    const updates: { id: number; reading: Partial<SharingOpConsumption> }[] = [];
    const inserts: { time: number; reading: Partial<SharingOpConsumption> }[] = [];
    consumptions.forEach((reading, index) => {
      const ids = idsByTime.get(times[index]);
      if (ids) {
        ids.forEach((id) => updates.push({ id, reading }));
      } else {
        inserts.push({ time: times[index], reading });
      }
    });

    for (let i = 0; i < updates.length; i += CONSUMPTION_WRITE_CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CONSUMPTION_WRITE_CHUNK_SIZE);
      await manager.query(
        `UPDATE sharing_op_consumption AS soc
         SET gross = v.gross, net = v.net, shared = v.shared,
             inj_gross = v.inj_gross, inj_net = v.inj_net, inj_shared = v.inj_shared
         FROM unnest($1::int[], $2::float8[], $3::float8[], $4::float8[], $5::float8[], $6::float8[], $7::float8[])
           AS v(id, gross, net, shared, inj_gross, inj_net, inj_shared)
         WHERE soc.id = v.id
           AND (soc.gross, soc.net, soc.shared, soc.inj_gross, soc.inj_net, soc.inj_shared)
               IS DISTINCT FROM (v.gross, v.net, v.shared, v.inj_gross, v.inj_net, v.inj_shared)`,
        [chunk.map((u) => u.id), ...readingColumns(chunk.map((u) => u.reading))],
      );
    }
    for (let i = 0; i < inserts.length; i += CONSUMPTION_WRITE_CHUNK_SIZE) {
      const chunk = inserts.slice(i, i + CONSUMPTION_WRITE_CHUNK_SIZE);
      await manager.query(
        `INSERT INTO sharing_op_consumption
           (id_sharing_operation, "timestamp", gross, net, shared, inj_gross, inj_net, inj_shared, id_community)
         SELECT $8::int, v.ts, v.gross, v.net, v.shared, v.inj_gross, v.inj_net, v.inj_shared, $9::int
         FROM unnest($1::timestamptz[], $2::float8[], $3::float8[], $4::float8[], $5::float8[], $6::float8[], $7::float8[])
           AS v(ts, gross, net, shared, inj_gross, inj_net, inj_shared)`,
        [chunk.map((c) => new Date(c.time).toISOString()), ...readingColumns(chunk.map((c) => c.reading)), id_sharing, internal_community_id],
      );
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
      // normaliseEan, not bare String(): the workbook side trims its EANs, and
      // a set built without trimming can never match a stored EAN that carries
      // stray whitespace. Both sides go through the same normaliser.
      if (val) set.add(normaliseEan(String(val)));
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

  async patchVisibility(id_sharing: number, is_public: boolean, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);

    await manager
      .createQueryBuilder()
      .update(SharingOperation)
      .set({ is_public })
      .where("id = :id_sharing", { id_sharing })
      .andWhere("community = :community_id", { community_id: internal_community_id })
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
    // The query parameter is `address_number`; the Address property is `number`.
    // TypeORM passes an unknown property path through verbatim, so
    // "address.address_number" reached Postgres as a column that does not exist
    // and turned every filtered request into a 500. Same fix as
    // meters/infra/meter.repository.ts.
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
  getSharingOperationMetersList(id_sharing: number, query: SharingOperationMetersQuery, query_runner?: QueryRunner): Promise<[Meter[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager.createQueryBuilder(Meter, "meter");
    const now = appTodayISO();

    // 1. Join Address
    qb.leftJoinAndSelect("meter.address", "address");

    // 2. Inner-join the MeterData record we want to expose for this row.
    qb.innerJoinAndSelect("meter.meter_data", "active_data");

    // The holder of that record, for the Holder column of the operation's meter
    // tables and the import dialog. Many-to-one on a record already joined: at
    // most one row per record, so neither the page nor the count moves. Same
    // alias as MeterRepository.getMetersList. A join only, never a .where():
    // withCommunityScope's condition must stay in the WHERE.
    qb.leftJoinAndSelect("active_data.member", "holder");

    // 3. Apply Temporal Logic + Sharing Operation ID
    qb.where("active_data.id_sharing_operation = :id_sharing", { id_sharing });

    // `end_date` is INCLUSIVE — the last day the meter is held. `addMeterData`
    // closes a predecessor with `end_date = newStart - 1 day` (see
    // meter.repository.ts), so a meter on its handover day is still in the
    // operation. Every branch below honours that, and PAST is the exact
    // complement of NOW: `end_date < now` against `end_date >= now`. Moving one
    // without the other makes a meter ending today show up in both tabs, or
    // neither.
    switch (query.type) {
      case SharingOperationMetersQueryType.PAST: {
        qb.andWhere("active_data.end_date IS NOT NULL").andWhere("active_data.end_date < :now", { now });
        // Range-overlap filter: a meter's past participation overlaps [range_from, range_to]
        // when start_date <= range_to AND (end_date IS NULL OR end_date >= range_from).
        if (query.start_date_from) {
          qb.andWhere("(active_data.end_date IS NULL OR active_data.end_date >= :range_from)", { range_from: query.start_date_from });
        }
        if (query.end_date_to) {
          qb.andWhere("active_data.start_date <= :range_to", { range_to: query.end_date_to });
        }
        // Pick the most recent historical record per meter.
        qb.andWhere((sub) => {
          const subQuery = sub
            .subQuery()
            .select("MAX(md.start_date)")
            .from(MeterData, "md")
            .where("md.ean = meter.ean")
            .andWhere("md.id_sharing_operation = :id_sharing")
            .andWhere("md.end_date IS NOT NULL AND md.end_date < :now")
            .getQuery();
          return "active_data.start_date = " + subQuery;
        });
        break;
      }

      case SharingOperationMetersQueryType.NOW:
        qb.andWhere("active_data.start_date <= :now", { now });
        qb.andWhere("(active_data.end_date IS NULL OR active_data.end_date >= :now)", { now });
        break;

      case SharingOperationMetersQueryType.FUTURE: {
        // Snapshot semantics: for each meter, the unique record valid at `future_at`.
        // Default is tomorrow so the FUTURE tab answers "what will be in the operation next".
        // This naturally includes currently-active meters that continue past `future_at` AND
        // newly-scheduled meters that have started by then.
        const futureAt = query.future_at ?? addDaysISO(now, 1);
        qb.andWhere("active_data.start_date <= :future_at", { future_at: futureAt });
        qb.andWhere("(active_data.end_date IS NULL OR active_data.end_date >= :future_at)", { future_at: futureAt });
        break;
      }

      case SharingOperationMetersQueryType.AT_DATE: {
        // Point-in-time snapshot at an arbitrary date, past or future. Defaults to today.
        // Both bounds are INCLUSIVE, like every other branch here.
        const at = query.at ?? now;
        qb.andWhere("active_data.start_date <= :at", { at });
        qb.andWhere("(active_data.end_date IS NULL OR active_data.end_date >= :at)", { at });
        break;
      }
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

  /** Community that owns the sharing operation — used to stamp consumption rows. */
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
