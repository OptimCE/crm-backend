import type { GestionnaireInvitation, UserMemberInvitation } from "./invitation.models.js";
import type { DeleteResult, QueryRunner } from "typeorm";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../api/invitation.dtos.js";
import type { User } from "../../users/domain/user.models.js";

export interface IInvitationRepository {
  cancelManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  cancelMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  getManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]>;
  getMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]>;
  inviteUserToBecomeManager(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<GestionnaireInvitation>;
  inviteUserToBecomeMember(user_email: string, user?: User | null, query_runner?: QueryRunner): Promise<UserMemberInvitation>;
}
