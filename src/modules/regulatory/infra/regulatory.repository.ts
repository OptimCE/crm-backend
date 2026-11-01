import { inject, injectable } from "inversify";
import type { EntityManager, QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { RegulatoryLinkStatus, RegulatoryStatus, RegulatorySubjectType } from "../domain/regulatory-link-status.models.js";
import type { IRegulatoryRepository, RegulatoryStatusFilters } from "../domain/i-regulatory.repository.js";

/** The subscription feature of the annexe that writes these rows. */
const ADMINISTRATIVE_DOCUMENT_FEATURE = "administrative-document";

/** Live episodes: filed and not yet over (to notify … leaving). */
const LIVE_STATUSES = [
  RegulatoryStatus.TO_NOTIFY,
  RegulatoryStatus.PENDING_GRD,
  RegulatoryStatus.PENDING_REGULATOR,
  RegulatoryStatus.AUTHORIZED,
  RegulatoryStatus.ACTIVE,
  RegulatoryStatus.LEAVING,
];

/** The procedure drives the meter's status: a live episode, or a refusal the manager has to act on. */
const DRIVING_STATUSES = [...LIVE_STATUSES, RegulatoryStatus.REFUSED];

/**
 * The scope every read shares: the request's community, and only while its
 * administrative-document subscription is active (the module off, the rows
 * stay stored but say nothing).
 */
const SCOPE_SQL =
  "FROM regulatory_link_status rls " +
  "JOIN community scope_community ON scope_community.id = rls.id_community " +
  "JOIN community_subscription subscription ON subscription.id_community = rls.id_community " +
  "  AND subscription.feature = $1 AND subscription.is_active " +
  "WHERE scope_community.auth_community_id = $2 ";

@injectable()
export class RegulatoryRepository implements IRegulatoryRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  private manager(query_runner?: QueryRunner): EntityManager {
    return query_runner ? query_runner.manager : this.dataSource.manager;
  }

  /**
   * DISTINCT ON keeps one row per subject and operation; the ORDER BY decides
   * which: the episode whose authorised period covers `date` first (one with no
   * `valid_from` was never authorised, so it covers nothing; `valid_to` is the
   * last day in), then the newest. Never response-cached: the annexe writes this table straight into
   * the database, so no route of the core would ever invalidate a cache.
   */
  async latestBySubject(filters: RegulatoryStatusFilters, query_runner?: QueryRunner): Promise<RegulatoryLinkStatus[]> {
    const { community_id } = getContext();
    if (!community_id) {
      return [];
    }
    const qb = this.manager(query_runner)
      .createQueryBuilder(RegulatoryLinkStatus, "rls")
      .distinctOn(["rls.id_sharing_operation", "rls.subject_type", "rls.subject_ref"])
      .innerJoin("community", "scope_community", "scope_community.id = rls.id_community")
      .innerJoin(
        "community_subscription",
        "subscription",
        "subscription.id_community = rls.id_community AND subscription.feature = :feature AND subscription.is_active",
        { feature: ADMINISTRATIVE_DOCUMENT_FEATURE },
      )
      .where("scope_community.auth_community_id = :contextAuthId", { contextAuthId: community_id });
    if (filters.id_sharing_operation !== undefined) {
      qb.andWhere("rls.id_sharing_operation = :operation", { operation: filters.id_sharing_operation });
    }
    if (filters.subject_type !== undefined) {
      qb.andWhere("rls.subject_type = :subject_type", { subject_type: filters.subject_type });
    }
    if (filters.subject_ref !== undefined && filters.subject_ref.length > 0) {
      qb.andWhere("rls.subject_ref IN (:...subject_refs)", { subject_refs: filters.subject_ref });
    }
    qb.orderBy("rls.id_sharing_operation").addOrderBy("rls.subject_type").addOrderBy("rls.subject_ref");
    if (filters.date !== undefined) {
      qb.addOrderBy(
        "CASE WHEN rls.valid_from IS NOT NULL AND rls.valid_from <= CAST(:on AS DATE) " +
          "AND (rls.valid_to IS NULL OR rls.valid_to >= CAST(:on AS DATE)) THEN 0 ELSE 1 END",
      ).setParameter("on", filters.date);
    }
    qb.addOrderBy("rls.id", "DESC");
    return qb.getMany();
  }

  async drivesMeter(id_sharing_operation: number, ean: string, query_runner?: QueryRunner): Promise<boolean> {
    const { community_id } = getContext();
    if (!community_id) {
      return false;
    }
    const rows = (await this.manager(query_runner).query(
      `SELECT rls.regulatory_status ${SCOPE_SQL}` +
        "AND rls.id_sharing_operation = $3 AND rls.subject_type = $4 AND rls.subject_ref = $5 " +
        "ORDER BY rls.id DESC LIMIT 1",
      [ADMINISTRATIVE_DOCUMENT_FEATURE, community_id, id_sharing_operation, RegulatorySubjectType.METER, ean],
    )) as { regulatory_status: number }[];
    return rows.length > 0 && DRIVING_STATUSES.includes(Number(rows[0].regulatory_status));
  }

  async countLiveInOperation(id_sharing_operation: number, query_runner?: QueryRunner): Promise<number> {
    const { community_id } = getContext();
    if (!community_id) {
      return 0;
    }
    const rows = (await this.manager(query_runner).query(
      `SELECT count(DISTINCT (rls.subject_type, rls.subject_ref))::int AS count ${SCOPE_SQL}` +
        "AND rls.id_sharing_operation = $3 AND rls.regulatory_status = ANY($4)",
      [ADMINISTRATIVE_DOCUMENT_FEATURE, community_id, id_sharing_operation, LIVE_STATUSES],
    )) as { count: number }[];
    return rows[0]?.count ?? 0;
  }
}
