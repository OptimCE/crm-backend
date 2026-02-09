import {GestionnaireInvitation, UserMemberInvitation} from "./invitation.models.js";
import {DeleteResult, type QueryRunner} from "typeorm";
import {
    UserManagerInvitationQuery,
    UserMemberInvitationQuery
} from "../api/invitation.dtos.js";
import {User, UserMemberLink} from "../../users/domain/user.models.js";

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
    inviteUserToBecomeManager(user_email: string, user?: User|null, query_runner?: QueryRunner): Promise<GestionnaireInvitation>;
    inviteUserToBecomeMember(user_email: string, user?: User|null, query_runner?: QueryRunner): Promise<UserMemberInvitation>;
}