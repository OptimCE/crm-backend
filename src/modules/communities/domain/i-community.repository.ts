import type { CommunityQueryDTO, CommunityUsersQueryDTO, CreateCommunityDTO, UpdateCommunityDTO } from "../api/community.dtos.js";
import type { QueryRunner } from "typeorm";
import type { Community, CommunityUser } from "./community.models.js";
import type { Role } from "../../../shared/dtos/role.js";

export interface ICommunityRepository {
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
