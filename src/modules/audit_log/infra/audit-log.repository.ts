import { inject, injectable } from "inversify";
import type { QueryRunner, SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "../../../shared/database/database.connector.js";
import { applyFilters, applySorts, type FilterDef, type SortDef } from "../../../shared/database/filters.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { Community } from "../../communities/domain/community.models.js";
import { AuditLog } from "../domain/audit-log.models.js";
import type { AuditLogFilters, IAuditLogRepository } from "../domain/i-audit-log.repository.js";
import type { AuditLogQueryDTO } from "../api/audit-log.dtos.js";

@injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  private readonly filters: FilterDef<AuditLog>[] = [
    {
      key: "action",
      apply: (qb, val) => qb.andWhere("audit_log.action = :action", { action: val }),
    },
    {
      key: "entity_type",
      apply: (qb, val) => qb.andWhere("audit_log.entity_type = :entity_type", { entity_type: val }),
    },
    {
      key: "entity_id",
      apply: (qb, val) => qb.andWhere("audit_log.entity_id = :entity_id", { entity_id: val }),
    },
    {
      key: "user_id",
      apply: (qb, val) => qb.andWhere("audit_log.user_id = :user_id", { user_id: val }),
    },
    {
      key: "from",
      apply: (qb, val) => qb.andWhere("audit_log.timestamp >= :from", { from: val }),
    },
    {
      key: "to",
      apply: (qb, val) => qb.andWhere("audit_log.timestamp <= :to", { to: val }),
    },
  ];

  private readonly sorts: SortDef<AuditLog>[] = [
    {
      key: "sort_timestamp",
      apply: (qb, direction) => qb.addOrderBy("audit_log.timestamp", direction),
    },
  ];

  async insert(entry: Partial<AuditLog>, query_runner?: QueryRunner): Promise<AuditLog> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const row = manager.create(AuditLog, entry);
    return manager.save(AuditLog, row);
  }

  async list(query: AuditLogQueryDTO, query_runner?: QueryRunner): Promise<[AuditLog[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(AuditLog, "audit_log");
    this.applyCommunityScope(qb);

    qb = applyFilters(this.filters, qb, query);
    qb = applySorts(this.sorts, qb, query);

    if (!query.sort_timestamp) {
      qb.addOrderBy("audit_log.timestamp", "DESC");
    }
    qb.addOrderBy("audit_log.id", "DESC");

    const take = query.limit;
    const skip = (query.page - 1) * take;
    return qb.skip(skip).take(take).getManyAndCount();
  }

  async count(filters: AuditLogFilters, query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(AuditLog, "audit_log");
    this.applyCommunityScope(qb);
    qb = applyFilters(this.filters, qb, filters);
    return qb.getCount();
  }

  async findForExport(filters: AuditLogFilters, query_runner?: QueryRunner): Promise<AuditLog[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    let qb = manager.createQueryBuilder(AuditLog, "audit_log");
    this.applyCommunityScope(qb);
    qb = applyFilters(this.filters, qb, filters);
    qb = applySorts(this.sorts, qb, filters);
    if (!filters.sort_timestamp) {
      qb.addOrderBy("audit_log.timestamp", "DESC");
    }
    qb.addOrderBy("audit_log.id", "DESC");
    return qb.getMany();
  }

  /**
   * Restrict reads to the current community. We join the community table by
   * `auth_community_id` rather than calling `AuthContextRepository` so that the
   * repository remains self-contained (the helper that emits writes already
   * resolves the internal ID via AuthContext).
   */
  private applyCommunityScope(qb: SelectQueryBuilder<AuditLog>): void {
    const { community_id } = getContext();
    if (community_id) {
      qb.innerJoin(Community, "scope_community", "scope_community.id = audit_log.id_community").andWhere(
        "scope_community.auth_community_id = :contextAuthId",
        { contextAuthId: community_id },
      );
    } else {
      qb.andWhere("1=0");
    }
  }
}
