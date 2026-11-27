import { inject, injectable } from "inversify";
import type { EntityManager, QueryRunner, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { Role } from "../../../shared/dtos/role.js";
import { ACTIVE_EXPORT_STATUSES, ExportJob, ExportPart, type ExportScopeType } from "../domain/export.models.js";
import type { ExportCommunityRow, ExportRequesterRow, IExportRepository, NewExportJob } from "../domain/i-export.repository.js";

@injectable()
export class ExportRepository implements IExportRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  private manager(query_runner?: QueryRunner): EntityManager {
    return query_runner ? query_runner.manager : this.dataSource.manager;
  }

  async findRequester(auth_user_id: string, query_runner?: QueryRunner): Promise<ExportRequesterRow | null> {
    const rows: ExportRequesterRow[] = await this.manager(query_runner).query(
      `SELECT id, locale, first_name, last_name, email FROM app_user WHERE auth_user_id = $1`,
      [auth_user_id],
    );
    return rows[0] ?? null;
  }

  async findCommunity(auth_community_id: string, query_runner?: QueryRunner): Promise<ExportCommunityRow | null> {
    const rows: { id: number; name: string }[] = await this.manager(query_runner).query(
      `SELECT id, name FROM community WHERE auth_community_id = $1`,
      [auth_community_id],
    );
    return rows[0] ?? null;
  }

  async lockScope(scope_type: ExportScopeType, scope_id: string, query_runner: QueryRunner): Promise<void> {
    // Transaction-scoped: released at COMMIT or ROLLBACK, never leaked by an early return.
    await query_runner.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`export_job:${scope_type}:${scope_id}`]);
  }

  async findActive(requester_user_id: string, scope_type: ExportScopeType, scope_id: string, query_runner?: QueryRunner): Promise<ExportJob | null> {
    return this.manager(query_runner)
      .createQueryBuilder(ExportJob, "job")
      .where("job.requester_user_id = :requester_user_id", { requester_user_id })
      .andWhere("job.scope_type = :scope_type", { scope_type })
      .andWhere("job.scope_id = :scope_id", { scope_id })
      .andWhere("job.status IN (:...statuses)", { statuses: [...ACTIVE_EXPORT_STATUSES] })
      .getOne();
  }

  async countRequestsSince(scope_type: ExportScopeType, scope_id: string, since: Date, query_runner?: QueryRunner): Promise<number> {
    return this.manager(query_runner)
      .createQueryBuilder(ExportJob, "job")
      .where("job.scope_type = :scope_type", { scope_type })
      .andWhere("job.scope_id = :scope_id", { scope_id })
      .andWhere("job.created_at > :since", { since })
      .getCount();
  }

  async create(job: NewExportJob, query_runner: QueryRunner): Promise<void> {
    const manager = query_runner.manager;
    await manager.insert(ExportJob, {
      id: job.id,
      scope_type: job.scope_type,
      scope_id: job.scope_id,
      id_community: job.id_community,
      requester_user_id: job.requester_user_id,
      id_requester: job.id_requester,
      status: "pending",
      schema_version: job.schema_version,
      locale: job.locale,
    });
    if (job.parts.length > 0) {
      await manager.insert(
        ExportPart,
        job.parts.map((part) => ({ id: part.id, export_job_id: job.id, service: part.service, status: "pending" as const })),
      );
    }
  }

  async listByRequester(id_requester: number, page: number, limit: number): Promise<[ExportJob[], number]> {
    return this.listQuery()
      .where("job.id_requester = :id_requester", { id_requester })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async listByCommunity(id_community: number, page: number, limit: number): Promise<[ExportJob[], number]> {
    return this.listQuery()
      .where("job.id_community = :id_community", { id_community })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async findById(id: string): Promise<ExportJob | null> {
    return this.listQuery().leftJoinAndSelect("job.parts", "part").where("job.id = :id", { id }).addOrderBy("part.service", "ASC").getOne();
  }

  async otherAdminIds(id_community: number, id_user: number, query_runner?: QueryRunner): Promise<number[]> {
    const rows: { id_user: number }[] = await this.manager(query_runner).query(
      `SELECT id_user FROM community_user WHERE id_community = $1 AND role = $2 AND id_user <> $3 ORDER BY id_user`,
      [id_community, Role.ADMIN, id_user],
    );
    return rows.map((row) => row.id_user);
  }

  /** Jobs with what a row shows: who asked, for which community. Newest first. */
  private listQuery(): SelectQueryBuilder<ExportJob> {
    return this.dataSource.manager
      .createQueryBuilder(ExportJob, "job")
      .innerJoin("job.requester", "requester")
      .addSelect(["requester.id", "requester.firstName", "requester.lastName", "requester.email", "requester.auth_user_id"])
      .leftJoin("job.community", "community")
      .addSelect(["community.id", "community.name", "community.auth_community_id"])
      .orderBy("job.created_at", "DESC")
      .addOrderBy("job.id", "ASC");
  }
}
