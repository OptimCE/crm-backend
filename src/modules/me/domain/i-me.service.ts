import type {
  MeCompanyDTO,
  MeDocumentDTO,
  MeDocumentPartialQuery,
  MeIndividualDTO,
  MeMemberPartialQuery,
  MeMembersPartialDTO,
  MeMeterDTO,
  MeMetersPartialQuery,
  MePartialMeterDTO,
} from "../api/me.dtos.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { DownloadDocument } from "../../documents/api/document.dtos.js";
import type {
  AcceptInvitationDTO,
  AcceptInvitationWEncodedDTO,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "../../invitations/api/invitation.dtos.js";
import type { CompanyDTO, IndividualDTO } from "../../members/api/member.dtos.js";

export interface IMeService {
  getDocuments(query: MeDocumentPartialQuery): Promise<[MeDocumentDTO[], Pagination]>;
  downloadDocument(id: number): Promise<DownloadDocument>;
  getMembers(query: MeMemberPartialQuery): Promise<[MeMembersPartialDTO[], Pagination]>;
  getMemberById(id: number): Promise<MeIndividualDTO | MeCompanyDTO>;
  getMeters(query: MeMetersPartialQuery): Promise<[MePartialMeterDTO[], Pagination]>;
  getMeterById(id: string): Promise<MeMeterDTO>;
  getOwnManagerPendingInvitation(query: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]>;
  getOwnMemberPendingInvitation(query: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]>;
  getOwnMemberPendingInvitationById(id: number): Promise<IndividualDTO | CompanyDTO>;
  acceptInvitationMember(accept_invitation: AcceptInvitationDTO): Promise<void>;
  acceptInvitationMemberWEncoded(accept_invitation: AcceptInvitationWEncodedDTO): Promise<void>;
  acceptInvitationManager(accept_invitation: AcceptInvitationDTO): Promise<void>;
  refuseManagerInvitation(id_invitation: number): Promise<void>;
  refuseMemberInvitation(id_invitation: number): Promise<void>;
}
