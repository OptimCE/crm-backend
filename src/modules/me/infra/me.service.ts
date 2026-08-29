import { inject, injectable } from "inversify";
import type { IMeService } from "../domain/i-me.service.js";
import type { IMeRepository, MeKeyConsumerRow, MeKeyIterationRow } from "../domain/i-me.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DownloadDocument } from "../../documents/api/document.dtos.js";
import {
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
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Member } from "../../members/domain/member.models.js";
import {
  toMemberPartialWithCompletenessDTO,
  toMemberDTO,
  toDocumentExposed,
  toMeAllocationShareDTO,
  toMeAllocationSharesDTO,
  toMeEnergySummaryDTO,
  toMeterDTO,
  toMeterPartialDTO,
} from "../shared/to_dto.js";
import { appTodayISO, lastClosedMonthISO, monthBoundsISO, toCalendarDateString } from "../../../shared/utils/date.utils.js";

/**
 * Hard ceiling on allocation-share rows. Not a page/limit contract: the tile's
 * point is "my share everywhere", so paginating it would fragment the only useful
 * view. This exists so a pathological account degrades instead of exhausting memory.
 */
const ALLOCATION_SHARES_ROW_CAP = 500;

/** The same ceiling, and for the same reason, on the energy summary's meters. */
const ENERGY_SUMMARY_ROW_CAP = 500;
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { MEMBER_ERRORS } from "../../members/shared/member.errors.js";
import { Document } from "../../documents/domain/document.models.js";
import { DOCUMENT_ERRORS } from "../../documents/shared/document.errors.js";
import type { IStorageService } from "../../../shared/storage/i-storage.service.js";
import { Meter } from "../../meters/domain/meter.models.js";
import { METER_ERRORS } from "../../meters/shared/meter.errors.js";
import { MeterConsumptionDTO, MeterConsumptionQuery, MeterMapDTO } from "../../meters/api/meter.dtos.js";
import { toMeterConsumptionDTO, toMeMeterMapPointDTO } from "../../meters/shared/to_dto.js";
import { METER_MAP_MAX_POINTS } from "../../meters/shared/meter.types.js";
import {
  AcceptInvitationDTO,
  AcceptInvitationWEncodedDTO,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "../../invitations/api/invitation.dtos.js";
import { GestionnaireInvitation, UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import { toUserManagerInvitationDTO, toUserMemberInvitationDTO } from "../../invitations/shared/to_dto.js";
import { toMemberDTO as toInvitationMemberDTO } from "../../members/shared/to_dto.js";
import { CompanyDTO, IndividualDTO } from "../../members/api/member.dtos.js";
import { ME_ERRORS } from "../shared/me.errors.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { DeleteResult, type QueryRunner } from "typeorm";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import type { ICommunityRepository } from "../../communities/domain/i-community.repository.js";
import type { IIamService } from "../../../shared/iam/i-iam.service.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import type { IMemberService } from "../../members/domain/i-member.service.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { Role } from "../../../shared/dtos/role.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";
import { Company, Individual } from "../../members/domain/member.models.js";

@injectable()
export class MeService implements IMeService {
  constructor(
    @inject("MeRepository") private meRepository: IMeRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("StorageService") private storageService: IStorageService,
    @inject("CommunityRepository") private communityRepository: ICommunityRepository,
    @inject("IAMService") private iam_service: IIamService,
    @inject("AuthContext") private authContext: IAuthContextRepository,
    @inject("MemberService") private memberService: IMemberService,
    @inject("AuditLogService") private auditLogService: IAuditLogService,
  ) {}

  async downloadDocument(id: number): Promise<DownloadDocument> {
    // Retrieve entry from database
    const document: Document | null = await this.meRepository.getDocumentById(id);
    if (!document) {
      logger.error({ operation: "downloadDocument" }, `Document ${id} not found`);
      throw new AppError(DOCUMENT_ERRORS.DOWNLOAD_DOCUMENT.DOCUMENT_NOT_FOUND, 400);
    }
    // Generate presigned URL for direct download
    const url = await this.storageService.getDocumentUrl(document.file_url);
    return {
      url,
      fileName: document.file_name,
      fileType: document.file_type,
    };
  }

  async getDocuments(query: MeDocumentPartialQuery): Promise<[MeDocumentDTO[], Pagination]> {
    const [values, total]: [Document[], number] = await this.meRepository.getDocuments(query);
    const return_values = values.map((value) => toDocumentExposed(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getMemberById(id: number): Promise<MeIndividualDTO | MeCompanyDTO> {
    const value: Member | null = await this.meRepository.getMemberById(id);
    if (!value) {
      logger.error({ operation: "getMember" }, `No member found with id ${id} found`);
      throw new AppError(MEMBER_ERRORS.GET_MEMBER.NOT_FOUND, 400);
    }
    return toMemberDTO(value);
  }

  async getMembers(query: MeMemberPartialQuery): Promise<[MeMembersPartialDTO[], Pagination]> {
    const [values, total]: [Member[], number] = await this.meRepository.getMembersList(query);
    const return_values = values.map((value) => toMemberPartialWithCompletenessDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getMeterById(id: string): Promise<MeMeterDTO> {
    const value: Meter | null = await this.meRepository.getMeterById(id);
    if (!value) {
      logger.error({ operation: "getMeter" }, `No meter found with id ${id} found`);
      throw new AppError(METER_ERRORS.GET_METER.METER_NOT_FOUND, 400);
    }
    return toMeterDTO(value);
  }

  async getMeterConsumptions(id: string, query: MeterConsumptionQuery): Promise<MeterConsumptionDTO> {
    // The repository only returns readings inside the current user's members'
    // ownership windows, so an unknown or unowned EAN yields empty series
    // rather than an error (no EAN existence oracle for members).
    const consumptions = await this.meRepository.getMeterConsumptions(id, query);
    return toMeterConsumptionDTO(id, consumptions);
  }

  async getMeters(query: MeMetersPartialQuery): Promise<[MePartialMeterDTO[], Pagination]> {
    const [values, total]: [Meter[], number] = await this.meRepository.getMeters(query);
    const return_values = values.map((value) => toMeterPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getMetersMap(query: MeMetersPartialQuery): Promise<MeterMapDTO> {
    const cap = METER_MAP_MAX_POINTS;
    const [values, total_plottable, total_matching] = await this.meRepository.getMetersMap(query, cap);

    const truncated = values.length > cap;
    const points = (truncated ? values.slice(0, cap) : values).map((value) => toMeMeterMapPointDTO(value));

    return {
      points,
      total_matching,
      total_plottable,
      missing_coordinates: Math.max(0, total_matching - total_plottable),
      truncated,
      cap,
    };
  }

  /**
   * The caller's own share of the allocation key in force, per (community,
   * sharing operation, meter). Cross-community — the row filter is
   * `user_member_link`, never a role or an active community.
   *
   * Four small reads rather than one join: the shares are a tree
   * (holding → key → iterations → consumers) whose leaves are needed per
   * iteration, and a single flattened join would multiply the holdings by the
   * consumers and need re-grouping anyway.
   */
  async getAllocationShares(query: MeAllocationSharesQuery): Promise<MeAllocationSharesDTO> {
    const at = query.at ? toCalendarDateString(query.at) : appTodayISO();

    const holdings = await this.meRepository.getOwnMeterHoldings(at, ALLOCATION_SHARES_ROW_CAP);
    if (holdings.length === 0) {
      // An unlinked user gets an empty result rather than a 403 — same convention
      // as getMeterConsumptions, and it avoids a membership existence oracle.
      return toMeAllocationSharesDTO(at, []);
    }

    const operation_ids = [...new Set(holdings.map((h) => h.operation_id))];
    const keys = await this.meRepository.getKeysInForce(operation_ids, at);
    const keyByOperation = new Map(keys.map((k) => [k.operation_id, k]));

    const key_ids = [...new Set(keys.map((k) => k.key_id))];
    const eans = [...new Set(holdings.map((h) => h.ean))];
    const [iterations, consumers] = await Promise.all([
      this.meRepository.getKeyIterations(key_ids),
      this.meRepository.getKeyConsumersForEans(key_ids, eans),
    ]);

    const iterationsByKey = new Map<number, MeKeyIterationRow[]>();
    for (const iteration of iterations) {
      const bucket = iterationsByKey.get(iteration.key_id);
      if (bucket) bucket.push(iteration);
      else iterationsByKey.set(iteration.key_id, [iteration]);
    }

    const shares = holdings.map((holding) => {
      const key = keyByOperation.get(holding.operation_id);
      // Consumers are matched per EAN: two holdings sharing a key must not see
      // each other's rows.
      const consumersByIteration = new Map<number, MeKeyConsumerRow[]>();
      for (const consumer of consumers) {
        if (consumer.consumer_name.trim() !== holding.ean) continue;
        const bucket = consumersByIteration.get(consumer.iteration_id);
        if (bucket) bucket.push(consumer);
        else consumersByIteration.set(consumer.iteration_id, [consumer]);
      }
      return toMeAllocationShareDTO(holding, key, key ? (iterationsByKey.get(key.key_id) ?? []) : [], consumersByIteration);
    });

    return toMeAllocationSharesDTO(at, shares);
  }

  /**
   * The caller's consumption totals for one calendar month, across every
   * community. Cross-community and role-free, like the rest of `/me/*`.
   *
   * One aggregate read rather than 1+N series reads:
   * `/me/meters/{ean}/consumptions` returns seven unbounded quarter-hourly
   * arrays, so composing this client-side would pull thousands of rows per
   * meter to render four numbers on the app's most-loaded page.
   *
   * A meter with no readings in the window produces no row, so it is simply
   * absent — the alternative, a row of zeroes, would tell the member they
   * consumed nothing when the truth is that we do not know.
   */
  async getEnergySummary(query: MeEnergySummaryQuery): Promise<MeEnergySummaryDTO> {
    const { start, end } = monthBoundsISO(query.month ?? lastClosedMonthISO());
    const rows = await this.meRepository.getOwnEnergyTotals(start, end, ENERGY_SUMMARY_ROW_CAP);
    return toMeEnergySummaryDTO(start, end, rows);
  }

  async getOwnManagerPendingInvitation(query: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]> {
    const [values, total]: [GestionnaireInvitation[], number] = await this.meRepository.getOwnManagersPendingInvitation(query);
    const return_values = values.map((value) => toUserManagerInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getOwnMemberPendingInvitation(query: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]> {
    const [values, total]: [UserMemberInvitation[], number] = await this.meRepository.getOwnMembersPendingInvitation(query);
    const return_values = values.map((value) => toUserMemberInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  async getOwnMemberPendingInvitationById(id: number): Promise<IndividualDTO | CompanyDTO> {
    const value: Member | null = await this.meRepository.getOwnMembersPendingInvitationById(id);
    if (!value) {
      logger.error({ operation: "getOwnMemberPendingInvitationById" }, `Invitation not found / Member null in this invitation (${id})`);
      throw new AppError(ME_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND, 400);
    }
    return toInvitationMemberDTO(value);
  }

  @Transactional()
  async acceptInvitationManager(accept_invitation: AcceptInvitationDTO, query_runner?: QueryRunner): Promise<void> {
    const invitation: GestionnaireInvitation | null = await this.meRepository.getInvitationManagerById(accept_invitation.invitation_id, query_runner);
    if (!invitation) {
      logger.error({ operation: "acceptInvitationManager" }, "Invitation manager not found");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationManager" }, "The user can't accept this invitation");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID, 400);
    }
    const existing_user = await this.communityRepository.getCommunityUser(invitation.user.id, invitation.community.id, query_runner);
    if (existing_user && existing_user.role === Role.ADMIN) {
      logger.error(
        { operation: "acceptInvitationManager" },
        "The user can't accept this invitation - An admin can't accept an invitation to become a manager",
      );
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION, 400);
    }
    if (existing_user && existing_user.role === Role.GESTIONNAIRE) {
      logger.error({ operation: "acceptInvitationManager" }, "The user can't accept this invitation - Already manager of this community");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER, 400);
    }
    try {
      if (existing_user && existing_user.role === Role.MEMBER) {
        await this.communityRepository.patchRoleUser(invitation.user.id, invitation.community.id, Role.GESTIONNAIRE, query_runner);
      } else {
        await this.communityRepository.addUserCommunity(invitation.user.id, invitation.community.id, Role.GESTIONNAIRE, query_runner);
      }
    } catch (err) {
      logger.error(
        { operation: "acceptInvitationManager", error: err },
        "The user can't accept this invitation: An error happened while adding/updating the user to the community in the database",
      );
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE, 400);
    }
    try {
      const { user_id } = getContext();
      if (existing_user && existing_user.role === Role.MEMBER) {
        await this.iam_service.updateUserRole(user_id!, invitation.community!.auth_community_id, Role.GESTIONNAIRE);
      } else {
        await this.iam_service.addUserToCommunity(user_id!, invitation.community!.auth_community_id, Role.GESTIONNAIRE);
      }
    } catch (err) {
      logger.error(
        { operation: "acceptInvitationManager", error: err },
        "The user can't accept this invitation: An error happened while adding the user to the community in the IAM service",
      );
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE, 400);
    }
    const result = await this.meRepository.deleteGestionnaireInvitation(invitation.id);
    if (result.affected !== 1) {
      logger.error({ operation: "acceptInvitationManager" }, "An error happend while deleting the user invitation at the end");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MANAGER.DELETE_INVITATION_FAILED, 400);
    }
    await this.auditLogService.log(
      {
        action: AUDIT_ACTIONS.MANAGER_INVITATION_ACCEPTED,
        entity_type: "manager_invitation",
        entity_id: String(invitation.id),
        payload: { community_id: invitation.community.id, community_name: invitation.community.name, granted_role: Role.GESTIONNAIRE },
      },
      query_runner,
    );
  }

  @Transactional()
  async acceptInvitationMember(accept_invitation: AcceptInvitationDTO, query_runner?: QueryRunner): Promise<void> {
    const invitation: UserMemberInvitation | null = await this.meRepository.getInvitationMemberById(accept_invitation.invitation_id, query_runner);
    if (!invitation) {
      logger.error({ operation: "acceptInvitationMember" }, "Invitation member not found");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationMember" }, "The user can't accept this invitation");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID, 400);
    }
    try {
      await this.meRepository.saveUserMemberLink(internal_user_id, invitation.member!.id, query_runner);
    } catch (err) {
      logger.error({ operation: "acceptInvitationMember", error: err }, "An error happened during the saving of the user member link");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK, 400);
    }
    const existing_user = await this.communityRepository.getCommunityUser(invitation.user.id, invitation.community.id, query_runner);
    if (!existing_user) {
      try {
        await this.communityRepository.addUserCommunity(invitation.user.id, invitation.community.id, Role.MEMBER, query_runner);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMember", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the database",
        );
        throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY, 400);
      }
      try {
        const { user_id } = getContext();
        await this.iam_service.addUserToCommunity(user_id!, invitation.community!.auth_community_id, Role.MEMBER);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMember", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the IAM service",
        );
        throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY, 400);
      }
    } else {
      logger.info({ operation: "acceptInvitationMember" }, "The user is already part of this community");
    }
    const result = await this.meRepository.deleteUserMemberInvitation(invitation.id);
    if (result.affected !== 1) {
      logger.error({ operation: "acceptInvitationMember" }, "An error happend while deleting the user invitation at the end");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED, 400);
    }
    await this.auditLogService.log(
      {
        action: AUDIT_ACTIONS.MEMBER_INVITATION_ACCEPTED,
        entity_type: "member_invitation",
        entity_id: String(invitation.id),
        payload: { community_id: invitation.community.id, community_name: invitation.community.name, member_id: invitation.member!.id },
      },
      query_runner,
    );
  }

  @Transactional()
  async acceptInvitationMemberWEncoded(accept_invitation: AcceptInvitationWEncodedDTO, query_runner?: QueryRunner): Promise<void> {
    const invitation: UserMemberInvitation | null = await this.meRepository.getInvitationMemberById(accept_invitation.invitation_id, query_runner);
    if (!invitation) {
      logger.error({ operation: "acceptInvitationMemberWEncoded" }, "Invitation member not found");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationMemberWEncoded" }, "The user can't accept this invitation");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID, 400);
    }
    let new_member: Individual | Company | undefined;
    try {
      const internal_community_id = invitation.community.id;
      new_member = await this.memberService.sharedAddMember(accept_invitation.member, internal_community_id, query_runner!);
      if (!new_member) {
        logger.error({ operation: "acceptInvitationMemberWEncoded" }, "An error happened during adding a new member: new_member undefined");
        throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "acceptInvitationMemberWEncoded", error: err }, "An error happened during adding a new member");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE, 400);
    }
    try {
      await this.meRepository.saveUserMemberLink(internal_user_id, new_member.id, query_runner);
    } catch (err) {
      logger.error({ operation: "acceptInvitationMemberWEncoded", error: err }, "An error happened during the saving of the user member link");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK, 400);
    }
    const existing_user = await this.communityRepository.getCommunityUser(invitation.user.id, invitation.community.id, query_runner);
    if (!existing_user) {
      try {
        await this.communityRepository.addUserCommunity(invitation.user.id, invitation.community.id, Role.MEMBER, query_runner);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMemberWEncoded", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the database",
        );
        throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY, 400);
      }
      try {
        const { user_id } = getContext();
        await this.iam_service.addUserToCommunity(user_id!, invitation.community!.auth_community_id, Role.MEMBER);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMemberWEncoded", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the IAM service",
        );
        throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY, 400);
      }
    } else {
      logger.info({ operation: "acceptInvitationMemberWEncoded" }, "The user is already part of this community");
    }
    const result = await this.meRepository.deleteUserMemberInvitation(invitation.id);
    if (result.affected !== 1) {
      logger.error({ operation: "acceptInvitationMember" }, "An error happend while deleting the user invitation at the end");
      throw new AppError(ME_ERRORS.ACCEPT_INVITATION_MEMBER.DELETE_INVITATION_FAILED, 400);
    }
    await this.auditLogService.log(
      {
        action: AUDIT_ACTIONS.MEMBER_INVITATION_ACCEPTED,
        entity_type: "member_invitation",
        entity_id: String(invitation.id),
        payload: { community_id: invitation.community.id, community_name: invitation.community.name, member_id: new_member.id },
      },
      query_runner,
    );
  }

  @Transactional()
  async refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.meRepository.refuseManagerInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "refuseManagerInvitation" }, "An error happened during the refusing of the manager invitation");
        throw new AppError(ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE, 400);
      }
      await this.auditLogService.log(
        { action: AUDIT_ACTIONS.MANAGER_INVITATION_REFUSED, entity_type: "manager_invitation", entity_id: String(id_invitation), payload: {} },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "refuseManagerInvitation", error: err }, "An error happened during the refusing of the manager invitation");
      throw new AppError(ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE, 400);
    }
  }

  @Transactional()
  async refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.meRepository.refuseMemberInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "refuseMemberInvitation" }, "An error happened during the refusing of the member invitation");
        throw new AppError(ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE, 400);
      }
      await this.auditLogService.log(
        { action: AUDIT_ACTIONS.MEMBER_INVITATION_REFUSED, entity_type: "member_invitation", entity_id: String(id_invitation), payload: {} },
        query_runner,
      );
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "refuseMemberInvitation", error: err }, "An error happened during the refusing of the member invitation");
      throw new AppError(ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE, 400);
    }
  }
}
