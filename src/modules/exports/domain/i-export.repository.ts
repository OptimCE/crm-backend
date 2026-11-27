import type { QueryRunner } from "typeorm";
import type { ExportJob, ExportLocale, ExportScopeType } from "./export.models.js";

/** The requester as the CRM knows them. */
export interface ExportRequesterRow {
  id: number;
  locale: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export interface ExportCommunityRow {
  id: number;
  name: string;
}

/** What POST /exports writes: the job, then one pending part per service. */
export interface NewExportJob {
  id: string;
  scope_type: ExportScopeType;
  scope_id: string;
  id_community: number | null;
  requester_user_id: string;
  id_requester: number;
  schema_version: string;
  locale: ExportLocale;
  parts: { id: string; service: string }[];
}

export interface IExportRepository {
  findRequester(auth_user_id: string, query_runner?: QueryRunner): Promise<ExportRequesterRow | null>;

  findCommunity(auth_community_id: string, query_runner?: QueryRunner): Promise<ExportCommunityRow | null>;

  /**
   * Serialises the requests for one scope until the transaction ends, so that two requests at
   * the same moment cannot both pass the 24-hour count. Needs a transaction.
   */
  lockScope(scope_type: ExportScopeType, scope_id: string, query_runner: QueryRunner): Promise<void>;

  /** The requester's export of this scope in progress, if any (uq_export_job_active). */
  findActive(requester_user_id: string, scope_type: ExportScopeType, scope_id: string, query_runner?: QueryRunner): Promise<ExportJob | null>;

  /** Requests for this scope since `since`, whoever made them and however they ended. */
  countRequestsSince(scope_type: ExportScopeType, scope_id: string, since: Date, query_runner?: QueryRunner): Promise<number>;

  create(job: NewExportJob, query_runner: QueryRunner): Promise<void>;

  /** The user's own exports, newest first, with requester and community. */
  listByRequester(id_requester: number, page: number, limit: number): Promise<[ExportJob[], number]>;

  /** Every export of the community, newest first, with requester and community. */
  listByCommunity(id_community: number, page: number, limit: number): Promise<[ExportJob[], number]>;

  /** One export with its parts, requester and community. */
  findById(id: string): Promise<ExportJob | null>;

  /** Internal ids of the community's ADMINs other than `id_user`. */
  otherAdminIds(id_community: number, id_user: number, query_runner?: QueryRunner): Promise<number[]>;
}
