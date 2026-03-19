import type { Member } from "../../members/domain/member.models.js";
import type { MeDocumentPartialQuery, MeMemberPartialQuery, MeMetersPartialQuery } from "../api/me.dtos.js";
import type { DeleteResult, QueryRunner } from "typeorm";
import type { Document } from "../../documents/domain/document.models.js";
import type { UserMemberLink } from "../../users/domain/user.models.js";
import type { Meter } from "../../meters/domain/meter.models.js";
import type { GestionnaireInvitation, UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../../invitations/api/invitation.dtos.js";

export interface IMeRepository {
  getMemberById(id: number, query_runner?: QueryRunner): Promise<Member | null>;
  getMembersList(query: MeMemberPartialQuery, query_runner?: QueryRunner): Promise<[Member[], number]>;
  getDocumentById(document_id: number, query_runner?: QueryRunner): Promise<Document | null>;
  getDocuments(query: MeDocumentPartialQuery, query_runner?: QueryRunner): Promise<[Document[], number]>;
  getMeterById(id: string, query_runner?: QueryRunner): Promise<Meter | null>;
  getMeters(query: MeMetersPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]>;
  getOwnManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]>;
  getOwnMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]>;
  getOwnMembersPendingInvitationById(id: number, query_runner?: QueryRunner): Promise<Member | null>;
  getInvitationManagerById(invitation_id: number, query_runner?: QueryRunner): Promise<GestionnaireInvitation | null>;
  getInvitationMemberById(invitation_id: number, query_runner?: QueryRunner): Promise<UserMemberInvitation | null>;
  saveUserMemberLink(internal_user_id: number, id_member: number, query_runner?: QueryRunner): Promise<UserMemberLink>;
  deleteUserMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  deleteGestionnaireInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
}
