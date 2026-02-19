import type { GestionnaireInvitation, UserMemberInvitation } from "../domain/invitation.models.js";
import type { UserManagerInvitationDTO, UserMemberInvitationDTO } from "../api/invitation.dtos.js";
import { toCommunityPartial } from "../../communities/shared/to_dto.js";

export function toUserManagerInvitationDTO(invitation: GestionnaireInvitation): UserManagerInvitationDTO {
  return {
    user_email: invitation.userEmail,
    id: invitation.id,
    community: toCommunityPartial(invitation.community),
    created_at: invitation.created_at,
  };
}

export function toUserMemberInvitationDTO(invitation: UserMemberInvitation): UserMemberInvitationDTO {
  return {
    id: invitation.id,
    user_email: invitation.userEmail,
    member_id: invitation.member ? invitation.member.id : undefined,
    community: toCommunityPartial(invitation.community),
    created_at: invitation.created_at,
    member_name: invitation.memberName ? invitation.memberName : undefined,
    to_be_encoded: invitation.toBeEncoded,
  };
}
