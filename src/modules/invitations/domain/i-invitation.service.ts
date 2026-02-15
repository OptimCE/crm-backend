import {
  AcceptInvitationDTO,
  AcceptInvitationWEncodedDTO,
  InviteUser,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "../api/invitation.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import {CompanyDTO, IndividualDTO} from "../../members/api/member.dtos.js";

/**
 * Interface for Invitation Service.
 * Defines contract for managing member and manager invitations.
 */
export interface IInvitationService {
  /**
   * Retrieves pending member invitations.
   * @param queryObject - Query filters.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  getMembersPendingInvitation(queryObject: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]>;
  /**
   * Retrieves pending manager invitations.
   * @param queryObject - Query filters.
   * @returns Tuple of [UserManagerInvitationDTO[], Pagination].
   */
  getManagersPendingInvitation(queryObject: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]>;
  /**
   * Retrieves own pending member invitations.
   * @param queryObject - Query filters.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  getOwnMemberPendingInvitation(queryObject: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]>;
  /**
   * Retrieves own pending member invitations.
   * @param id - Invitation id.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  getOwnMemberPendingInvitationById(id: number): Promise<IndividualDTO|CompanyDTO>;
  /**
   * Retrieves own pending manager invitations.
   * @param queryObject - Query filters.
   * @returns Tuple of [UserManagerInvitationDTO[], Pagination].
   */
  getOwnManagerPendingInvitation(queryObject: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]>;
  /**
   * Invites a user to become a member.
   * @param invitation - Invitation details.
   */
  inviteUserToBecomeMember(invitation: InviteUser): Promise<void>;
  /**
   * Invites a user to become a manager.
   * @param invitation - Invitation details.
   */
  inviteUserToBecomeManager(invitation: InviteUser): Promise<void>;
  /**
   * Accepts a member invitation.
   * @param accept_invitation - Acceptance details.
   */
  acceptInvitationMember(accept_invitation: AcceptInvitationDTO): Promise<void>;
  /**
   * Accepts a member invitation and encodes member details.
   * @param accept_invitation - Acceptance details with member data.
   */
  acceptInvitationMemberWEncoded(accept_invitation: AcceptInvitationWEncodedDTO): Promise<void>;
  /**
   * Accepts a manager invitation.
   * @param accept_invitation - Acceptance details.
   */
  acceptInvitationManager(accept_invitation: AcceptInvitationDTO): Promise<void>;
  /**
   * Cancels a member invitation.
   * @param id_invitation - ID of the invitation to cancel.
   */
  cancelMemberInvitation(id_invitation: number): Promise<void>;
  /**
   * Cancels a manager invitation.
   * @param id_invitation - ID of the invitation to cancel.
   */
  cancelManagerInvitation(id_invitation: number): Promise<void>;
  /**
   * Refuses a member invitation.
   * @param id_invitation - ID of the invitation to refuse.
   */
  refuseMemberInvitation(id_invitation: number): Promise<void>;
  /**
   * Refuses a manager invitation.
   * @param id_invitation - ID of the invitation to refuse.
   */
  refuseManagerInvitation(id_invitation: number): Promise<void>;
}
