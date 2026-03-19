import type { CommunityDTO, MyCommunityDTO, UsersCommunityDTO } from "../api/community.dtos.js";
import type { Community, CommunityUser } from "../domain/community.models.js";

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

export function toCommunityPartial(community: Community): CommunityDTO {
  return {
    id: community.id,
    name: community.name,
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
