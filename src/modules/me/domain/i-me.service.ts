import type {
  MeAllocationSharesDTO,
  MeAllocationSharesQuery,
  MeCompanyDTO,
  MeDocumentDTO,
  MeDocumentPartialQuery,
  MeEnergySummaryDTO,
  MeEnergySummaryQuery,
  MeIndividualDTO,
  MeMemberPartialQuery,
  MeMembersPartialDTO,
  MeMeterDTO,
  MeMetersPartialQuery,
  MePartialMeterDTO,
} from "../api/me.dtos.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { MeterMapDTO } from "../../meters/api/meter.dtos.js";
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
import type { MeterConsumptionDTO, MeterConsumptionQuery } from "../../meters/api/meter.dtos.js";

export interface IMeService {
  getDocuments(query: MeDocumentPartialQuery): Promise<[MeDocumentDTO[], Pagination]>;
  downloadDocument(id: number): Promise<DownloadDocument>;
  getMembers(query: MeMemberPartialQuery): Promise<[MeMembersPartialDTO[], Pagination]>;
  getMemberById(id: number): Promise<MeIndividualDTO | MeCompanyDTO>;
  getMeters(query: MeMetersPartialQuery): Promise<[MePartialMeterDTO[], Pagination]>;

  /** Plottable meters this user owns, across every community they belong to. */
  getMetersMap(query: MeMetersPartialQuery): Promise<MeterMapDTO>;
  getMeterById(id: string): Promise<MeMeterDTO>;
  getMeterConsumptions(id: string, query: MeterConsumptionQuery): Promise<MeterConsumptionDTO>;
  /**
   * The caller's own allocation-key share per (community, sharing operation,
   * meter), evaluated on `query.at` or today. Cross-community; unlinked users get
   * an empty list rather than an error.
   */
  getAllocationShares(query: MeAllocationSharesQuery): Promise<MeAllocationSharesDTO>;
  getEnergySummary(query: MeEnergySummaryQuery): Promise<MeEnergySummaryDTO>;
  getOwnManagerPendingInvitation(query: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]>;
  getOwnMemberPendingInvitation(query: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]>;
  getOwnMemberPendingInvitationById(id: number): Promise<IndividualDTO | CompanyDTO>;
  acceptInvitationMember(accept_invitation: AcceptInvitationDTO): Promise<void>;
  acceptInvitationMemberWEncoded(accept_invitation: AcceptInvitationWEncodedDTO): Promise<void>;
  acceptInvitationManager(accept_invitation: AcceptInvitationDTO): Promise<void>;
  refuseManagerInvitation(id_invitation: number): Promise<void>;
  refuseMemberInvitation(id_invitation: number): Promise<void>;
}
