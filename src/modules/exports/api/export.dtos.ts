import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from "class-validator";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { EXPORT_SCOPE_TYPES, type ExportPartStatus, type ExportScopeType, type ExportStatus } from "../domain/export.types.js";
import { EXPORT_ERRORS } from "../shared/export.errors.js";

/**
 * Body of POST /exports. `community_id` is the community's Keycloak id, what X-Community-ID
 * carries, and must be the active community: the request is checked against the role the token
 * gives there.
 */
export class CreateExportDTO {
  @IsIn([...EXPORT_SCOPE_TYPES], withError(EXPORT_ERRORS.VALIDATION.SCOPE))
  scope!: ExportScopeType;

  @ValidateIf((o: CreateExportDTO) => o.scope === "community")
  @IsString(withError(EXPORT_ERRORS.VALIDATION.COMMUNITY_ID))
  @IsNotEmpty(withError(EXPORT_ERRORS.VALIDATION.COMMUNITY_ID))
  @MaxLength(255, withError(EXPORT_ERRORS.VALIDATION.COMMUNITY_ID))
  community_id?: string;
}

/** Which list GET /exports returns. */
export const EXPORT_LIST_VIEWS = ["mine", "community"] as const;
export type ExportListView = (typeof EXPORT_LIST_VIEWS)[number];

/**
 * Query of GET /exports.
 *  - `mine` (default): the caller's own exports, of either scope (the profile's "Mes exports").
 *  - `community`: every export of the active community, whoever asked for it. ADMIN only.
 */
export class ExportListQueryDTO extends PaginationQuery {
  @IsOptional()
  @IsIn([...EXPORT_LIST_VIEWS], withError(EXPORT_ERRORS.VALIDATION.VIEW))
  view: ExportListView = "mine";
}

export class ExportIdParamDTO {
  @IsUUID("all", withError(EXPORT_ERRORS.VALIDATION.ID))
  id!: string;
}

/** The answer to POST /exports (202). */
export interface ExportCreatedDTO {
  export_id: string;
  status: ExportStatus;
}

export interface ExportRequesterDTO {
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export interface ExportCommunityDTO {
  /** The Keycloak id, what X-Community-ID carries. */
  auth_community_id: string;
  name: string;
}

export interface ExportPartDTO {
  service: string;
  status: ExportPartStatus;
  updated_at: string;
}

/**
 * One export, as a list row or as the detail (`parts` is only in the detail). `is_mine` and
 * `can_download` let another admin see a community export without a download button.
 */
export interface ExportJobDTO {
  id: string;
  scope: ExportScopeType;
  community: ExportCommunityDTO | null;
  status: ExportStatus;
  locale: string;
  requester: ExportRequesterDTO;
  is_mine: boolean;
  can_download: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  size_bytes: number | null;
  /** The error code a failed export ended with (contract errorCode, or the worker's own). */
  error_code: string | null;
  parts?: ExportPartDTO[];
}

/** The answer to POST /exports/{id}/download-url. */
export interface ExportDownloadUrlDTO {
  url: string;
  expires_in: number;
}
