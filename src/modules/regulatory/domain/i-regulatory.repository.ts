import type { QueryRunner } from "typeorm";
import type { RegulatoryLinkStatus, RegulatorySubjectType } from "./regulatory-link-status.models.js";

export interface RegulatoryStatusFilters {
  id_sharing_operation: number;
  subject_type?: RegulatorySubjectType;
  subject_ref?: string;
  /** `YYYY-MM-DD`: prefer the episode whose period covers it. */
  date?: string;
}

export interface IRegulatoryRepository {
  /**
   * One episode per subject of the operation: the one covering `date` if
   * given, else the newest. Scoped to the request's community, and empty when
   * the community's administrative-document subscription is not active (the
   * statuses stay stored, they are just not shown).
   */
  latestBySubject(filters: RegulatoryStatusFilters, query_runner?: QueryRunner): Promise<RegulatoryLinkStatus[]>;
}
