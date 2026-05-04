import type { CommunityDTO, CommunityDetailDTO, MyCommunityDTO, UsersCommunityDTO } from "../api/community.dtos.js";
import type { Community, CommunityUser } from "../domain/community.models.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";

export function toUsersCommunityDTO(community_user: CommunityUser): UsersCommunityDTO {
  return {
    email: community_user.user.email,
    role: community_user.role,
    id_community: community_user.id_community,
    id_user: community_user.id_user,
    first_name: community_user.user.firstName,
    last_name: community_user.user.lastName,
    phone: community_user.user.phoneNumber,
  };
}

export function toCommunityDTO(community: Community): CommunityDTO {
  return {
    id: community.id,
    name: community.name,
    logo_url: community.logo_url,
  };
}

export function toCommunityPartial(community: Community): CommunityDTO {
  return {
    id: community.id,
    name: community.name,
    logo_url: community.logo_url,
  };
}

export function toCommunityDetailDTO(community: Community, member_count: number, logo_presigned_url?: string | null): CommunityDetailDTO {
  return {
    id: community.id,
    name: community.name,
    auth_community_id: community.auth_community_id,
    created_at: community.created_at,
    updated_at: community.updated_at,
    member_count,
    description: community.description,
    website_url: community.website_url,
    logo_url: community.logo_url,
    logo_presigned_url: logo_presigned_url ?? null,
    headquarters_address: community.headquarters_address ? toAddressDTO(community.headquarters_address) : null,
  };
}

export function toMyCommunityDTO(community: CommunityUser): MyCommunityDTO {
  return {
    id: community.id_community,
    auth_community_id: community.community.auth_community_id,
    role: community.role,
    name: community.community.name,
  };
}
