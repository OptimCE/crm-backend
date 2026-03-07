import type {
  InviteUser,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "../api/invitation.dtos.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
/**
 * Interface for Invitation Service.
 * Defines contract for managing member and manager invitations.
 */
export interface IInvitationService {
  getMembersPendingInvitation(queryObject: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]>;
  getManagersPendingInvitation(queryObject: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]>;
  inviteUserToBecomeMember(invitation: InviteUser): Promise<void>;
  inviteUserToBecomeManager(invitation: InviteUser): Promise<void>;
  cancelMemberInvitation(id_invitation: number): Promise<void>;
  cancelManagerInvitation(id_invitation: number): Promise<void>;
}
