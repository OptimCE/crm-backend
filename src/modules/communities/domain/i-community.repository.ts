import type { CommunityQueryDTO, CommunityUsersQueryDTO, CreateCommunityDTO, UpdateCommunityDTO } from "../api/community.dtos.js";
import type { QueryRunner } from "typeorm";
import type { Community, CommunityUser } from "./community.models.js";
import type { Role } from "../../../shared/dtos/role.js";

/**
 * Raw shape of the readiness aggregate row.
 *
 * Every counter is typed `string`: node-postgres returns `COUNT()` as a string to
 * avoid precision loss, and concatenating instead of adding is a silent bug. The
 * mapper coerces with `Number()`.
 */
export interface CommunityDashboardCountsRow {
  members_total: string;
  members_active: string;
  members_inactive: string;
  members_pending: string;
  members_without_user: string;
  members_incomplete: string;
  meters_total: string;
  meters_active: string;
  meters_inactive: string;
  meters_waiting_grd: string;
  meters_waiting_manager: string;
  meters_without_active_data: string;
  meters_not_in_sharing_operation: string;
  operations_total: string;
  operations_without_valid_key: string;
  operations_with_pending_key: string;
  member_invitations_pending: string;
  member_invitations_to_be_encoded: string;
  manager_invitations_pending: string;
  vat_number: string | null;
  legal_name: string | null;
  iban: string | null;
  account_holder_name: string | null;
  headquarters_address_id: number | null;
  regulator: string;
}

export interface ICommunityRepository {
  /**
   * One row of readiness counters for the active community, evaluated on `as_of`.
   * Returns null when the active community no longer exists.
   */
  getDashboardCounts(as_of: string, query_runner?: QueryRunner): Promise<CommunityDashboardCountsRow | null>;
  /** Named sharing operations with no APPROVED key valid on `as_of`, capped at `limit`. */
  getOperationsWithoutValidKey(as_of: string, limit: number, query_runner?: QueryRunner): Promise<{ id: number; name: string }[]>;
  addCommunity(new_community: CreateCommunityDTO, org_id: string, query_runner?: QueryRunner): Promise<Community>;
  getAllPublicCommunities(query: CommunityQueryDTO, query_runner?: QueryRunner): Promise<[Community[], number]>;
  getCommunityById(id: number, query_runner?: QueryRunner): Promise<{ community: Community; member_count: number } | null>;
  getAdmins(query: CommunityUsersQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]>;
  getMyCommunities(query: CommunityQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]>;
  getUsers(query: CommunityUsersQueryDTO, query_runner?: QueryRunner): Promise<[CommunityUser[], number]>;
  getCommunityUser(id_user: number, id_community: number, query_runner?: QueryRunner): Promise<CommunityUser | null>;
  addUserCommunity(id_user: number, id_community: number, role: Role, query_runner?: QueryRunner): Promise<CommunityUser>;
  deleteUserCommunity(id_user: number, internal_community_id: number, query_runner?: QueryRunner): Promise<CommunityUser>;
  patchRoleUser(id_user: number, id_community: number, new_role: Role, query_runner?: QueryRunner): Promise<CommunityUser>;
  updateCommunity(
    id_community: number,
    community_details: UpdateCommunityDTO & { headquarters_address_id?: number | null; logo_url?: string | null },
    query_runner?: QueryRunner,
  ): Promise<Community>;
  deleteCommunity(id_community: number, query_runner?: QueryRunner): Promise<Community>;
}
