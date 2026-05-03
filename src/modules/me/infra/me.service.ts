import { inject, injectable } from "inversify";
import type { IMeService } from "../domain/i-me.service.js";
import type { IMeRepository } from "../domain/i-me.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { DownloadDocument } from "../../documents/api/document.dtos.js";
import {
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
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Member } from "../../members/domain/member.models.js";
import { toMemberPartialDTO, toMemberDTO, toDocumentExposed, toMeterDTO, toMeterPartialDTO } from "../shared/to_dto.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { MEMBER_ERRORS } from "../../members/shared/member.errors.js";
import { Document } from "../../documents/domain/document.models.js";
import { DOCUMENT_ERRORS } from "../../documents/shared/document.errors.js";
import type { IStorageService } from "../../../shared/storage/i-storage.service.js";
import { Meter } from "../../meters/domain/meter.models.js";
import { METER_ERRORS } from "../../meters/shared/meter.errors.js";
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
    const return_values = values.map((value) => toMemberPartialDTO(value));
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

  async getMeters(query: MeMetersPartialQuery): Promise<[MePartialMeterDTO[], Pagination]> {
    const [values, total]: [Meter[], number] = await this.meRepository.getMeters(query);
    const return_values = values.map((value) => toMeterPartialDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
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
  }

  @Transactional()
  async refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.meRepository.refuseManagerInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "refuseManagerInvitation" }, "An error happened during the refusing of the manager invitation");
        throw new AppError(ME_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE, 400);
      }
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
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "refuseMemberInvitation", error: err }, "An error happened during the refusing of the member invitation");
      throw new AppError(ME_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE, 400);
    }
  }
}
