import type { GestionnaireInvitation, UserMemberInvitation } from "./invitation.models.js";
import type { DeleteResult, QueryRunner } from "typeorm";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../api/invitation.dtos.js";
import type { User, UserMemberLink } from "../../users/domain/user.models.js";
import type { Member } from "../../members/domain/member.models.js";

export interface IInvitationRepository {
  getInvitationManagerById(invitation_id: number, query_runner?: QueryRunner): Promise<GestionnaireInvitation | null>;
  getInvitationMemberById(invitation_id: number, query_runner?: QueryRunner): Promise<UserMemberInvitation | null>;
  saveUserMemberLink(internal_user_id: number, id: number, query_runner?: QueryRunner): Promise<UserMemberLink>;
  cancelManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  cancelMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  getManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]>;
  getMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]>;
  getOwnManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]>;
  getOwnMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]>;
  getOwnMembersPendingInvitationById(id: number, query_runner?: QueryRunner): Promise<Member | null>;
  inviteUserToBecomeManager(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<GestionnaireInvitation>;
  inviteUserToBecomeMember(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<UserMemberInvitation>;
  deleteUserMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
}
