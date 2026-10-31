import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { RegulatoryLinkStatus } from "../domain/regulatory-link-status.models.js";
import type { IRegulatoryRepository, RegulatoryStatusFilters } from "../domain/i-regulatory.repository.js";

/** The subscription feature of the annexe that writes these rows. */
const ADMINISTRATIVE_DOCUMENT_FEATURE = "administrative-document";

@injectable()
export class RegulatoryRepository implements IRegulatoryRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  /**
   * DISTINCT ON keeps one row per subject; the ORDER BY decides which: the
   * episode whose authorised period covers `date` first (one with no
   * `valid_from` was never authorised, so it covers nothing; `valid_to` is the
   * last day in), then the newest. Never response-cached: the annexe writes this table straight into
   * the database, so no route of the core would ever invalidate a cache.
   */
  async latestBySubject(filters: RegulatoryStatusFilters, query_runner?: QueryRunner): Promise<RegulatoryLinkStatus[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { community_id } = getContext();
    if (!community_id) {
      return [];
    }
    const qb = manager
      .createQueryBuilder(RegulatoryLinkStatus, "rls")
      .distinctOn(["rls.id_sharing_operation", "rls.subject_type", "rls.subject_ref"])
      .innerJoin("community", "scope_community", "scope_community.id = rls.id_community")
      .innerJoin(
        "community_subscription",
        "subscription",
        "subscription.id_community = rls.id_community AND subscription.feature = :feature AND subscription.is_active",
        { feature: ADMINISTRATIVE_DOCUMENT_FEATURE },
      )
      .where("scope_community.auth_community_id = :contextAuthId", { contextAuthId: community_id })
      .andWhere("rls.id_sharing_operation = :operation", { operation: filters.id_sharing_operation });
    if (filters.subject_type !== undefined) {
      qb.andWhere("rls.subject_type = :subject_type", { subject_type: filters.subject_type });
    }
    if (filters.subject_ref !== undefined) {
      qb.andWhere("rls.subject_ref = :subject_ref", { subject_ref: filters.subject_ref });
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
}
