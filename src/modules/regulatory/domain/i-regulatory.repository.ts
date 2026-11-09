import type { QueryRunner } from "typeorm";
import type { RegulatoryLinkStatus, RegulatorySubjectType } from "./regulatory-link-status.models.js";

export interface RegulatoryStatusFilters {
  /** Every operation of the community when omitted (the global meters list). */
  id_sharing_operation?: number;
  subject_type?: RegulatorySubjectType;
  /** One or several EANs (or key ids); every subject when omitted. */
  subject_ref?: string[];
  /** `YYYY-MM-DD`: prefer the episode whose period covers it. */
  date?: string;
}

export interface IRegulatoryRepository {
  /**
   * One episode per subject and operation: the one covering `date` if given,
   * else the newest. Scoped to the request's community, and empty when the
   * community's administrative-document subscription is not active (the
   * statuses stay stored, they are just not shown).
   */
  latestBySubject(filters: RegulatoryStatusFilters, query_runner?: QueryRunner): Promise<RegulatoryLinkStatus[]>;

  /**
   * Whether the procedure drives this meter's status in this operation, so the
   * CRM's own status may not be set by hand: the module is active for the
   * request's community and the meter's newest episode there is live (to
   * notify … leaving) or refused. Ended and withdrawn hand it back.
   */
  drivesMeter(id_sharing_operation: number, ean: string, query_runner?: QueryRunner): Promise<boolean>;

  /**
   * How many subjects of the operation have a live episode (to notify …
   * leaving) while the module is active: deleting the operation would cascade
   * them away with their regulatory history.
   */
  countLiveInOperation(id_sharing_operation: number, query_runner?: QueryRunner): Promise<number>;
}
