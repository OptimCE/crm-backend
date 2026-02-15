import { inject, injectable } from "inversify";
import type { IInvitationService } from "../domain/i-invitation.service.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IInvitationRepository } from "../domain/i-invitation.repository.js";
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
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { DeleteResult, type QueryRunner } from "typeorm";
import { GestionnaireInvitation, UserMemberInvitation } from "../domain/invitation.models.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { Company, Individual, Member } from "../../members/domain/member.models.js";
import type { IMemberService } from "../../members/domain/i-member.service.js";
import type { IUserRepository } from "../../users/domain/i-user.repository.js";
import type { IIamService } from "../../../shared/iam/i-iam.service.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { Role } from "../../../shared/dtos/role.js";
import { toUserManagerInvitationDTO, toUserMemberInvitationDTO } from "../shared/to_dto.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import type { ICommunityRepository } from "../../communities/domain/i-community.repository.js";
import { INVITATION_ERRORS } from "../shared/invitation.errors.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import { CompanyDTO, IndividualDTO } from "../../members/api/member.dtos.js";
import { query } from "express-validator";
import { toMemberDTO } from "../../members/shared/to_dto.js";

/**
 * Service implementation for managing invitations.
 * Orchestrates database operations, IAM updates, and validation for invitations.
 */
@injectable()
export class InvitationService implements IInvitationService {
  constructor(
    @inject("InvitationRepository") private invitationRepository: IInvitationRepository,
    @inject("CommunityRepository") private communityRepository: ICommunityRepository,
    @inject("MemberService") private memberService: IMemberService,
    @inject("UserRepository") private userRepository: IUserRepository,
    @inject("IAMService") private iam_service: IIamService,
    @inject("AuthContext") private authContext: IAuthContextRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  /**
   * Accepts a manager invitation.
   * Verifies the invitation, user, and roles.
   * Updates community role in DB and IAM.
   * @param accept_invitation - DTO with invitation ID.
   * @param query_runner - Database transaction runner.
   * @throws AppError if validations fail or DB/IAM updates error.
   */
  @Transactional()
  async acceptInvitationManager(accept_invitation: AcceptInvitationDTO, query_runner?: QueryRunner): Promise<void> {
    // Fetch invitation
    const invitation: GestionnaireInvitation | null = await this.invitationRepository.getInvitationManagerById(
      accept_invitation.invitation_id,
      query_runner,
    );
    if (!invitation) {
      logger.error({ operation: "acceptInvitationManager" }, "Invitation manager not found");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.INVITATION_MANAGER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationManager" }, "The user can't accept this invitation");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.MISMATCH_USER_ID, 400);
    }
    const existing_user = await this.communityRepository.getCommunityUser(invitation.user.id, invitation.community.id, query_runner);
    if (existing_user && existing_user.role === Role.ADMIN) {
      logger.error(
        { operation: "acceptInvitationManager" },
        "The user can't accept this invitation - An admin can't accept an invitation to become a manager",
      );
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ADMIN_CANT_ACCEPT_MANAGER_INVITATION, 400);
    }
    if (existing_user && existing_user.role === Role.GESTIONNAIRE) {
      logger.error({ operation: "acceptInvitationManager" }, "The user can't accept this invitation - Already manager of this community");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.ALREADY_MANAGER, 400);
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
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.DATABASE_SAVE_UPDATE, 400);
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
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MANAGER.IAM_SERVICE_SAVE_UPDATE, 400);
    }
  }

  /**
   * Accepts a member invitation.
   * Links user to member profile and adds to community in DB and IAM.
   * @param accept_invitation - DTO with invitation ID.
   * @param query_runner - Database transaction runner.
   * @throws AppError if validations fail or DB/IAM updates error.
   */
  @Transactional()
  async acceptInvitationMember(accept_invitation: AcceptInvitationDTO, query_runner?: QueryRunner): Promise<void> {
    // Fetch invitation
    const invitation: UserMemberInvitation | null = await this.invitationRepository.getInvitationMemberById(
      accept_invitation.invitation_id,
      query_runner,
    );
    if (!invitation) {
      logger.error({ operation: "acceptInvitationMember" }, "Invitation member not found");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.INVITATION_MEMBER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationMember" }, "The user can't accept this invitation");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.MISMATCH_USER_ID, 400);
    }
    try {
      await this.invitationRepository.saveUserMemberLink(internal_user_id, invitation.member!.id, query_runner);
    } catch (err) {
      logger.error({ operation: "acceptInvitationMember", error: err }, "An error happened during the saving of the user member link");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_MEMBER_LINK, 400);
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
        throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.DATABASE_SAVE_USER_COMMUNITY, 400);
      }

      // Add the user to community if not present yet with the role Member
      try {
        const { user_id } = getContext();
        await this.iam_service.addUserToCommunity(user_id!, invitation.community!.auth_community_id, Role.MEMBER);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMember", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the IAM service",
        );
        throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER.IAM_SERVICE_SAVE_USER_COMMUNITY, 400);
      }
    } else {
      logger.info({ operation: "acceptInvitationMember" }, "The user is already part of this community");
    }
  }

  /**
   * Accepts a member invitation and creates/encodes a new member profile.
   * Links user to new member and adds to community in DB and IAM.
   * @param accept_invitation - DTO with invitation ID and member details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if validations fail or DB/IAM updates error.
   */
  @Transactional()
  async acceptInvitationMemberWEncoded(accept_invitation: AcceptInvitationWEncodedDTO, query_runner?: QueryRunner): Promise<void> {
    const invitation: UserMemberInvitation | null = await this.invitationRepository.getInvitationMemberById(
      accept_invitation.invitation_id,
      query_runner,
    );
    if (!invitation) {
      logger.error({ operation: "acceptInvitationMemberWEncoded" }, "Invitation member not found");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.INVITATION_MEMBER_NOT_FOUND, 400);
    }
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    if (!invitation.user || internal_user_id !== invitation.user.id) {
      logger.error({ operation: "acceptInvitationMemberWEncoded" }, "The user can't accept this invitation");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.MISMATCH_USER_ID, 400);
    }
    let new_member: Individual | Company | undefined;
    try {
      new_member = await this.memberService.sharedAddMember(accept_invitation.member, query_runner!);
      if (!new_member) {
        logger.error({ operation: "acceptInvitationMemberWEncoded" }, "An error happened during adding a new member: new_member undefined");
        throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "acceptInvitationMemberWEncoded", error: err }, "An error happened during adding a new member");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_MEMBER_SAVE, 400);
    }
    // Add the member link
    try {
      await this.invitationRepository.saveUserMemberLink(internal_user_id, invitation.member!.id, query_runner);
    } catch (err) {
      logger.error({ operation: "acceptInvitationMemberWEncoded", error: err }, "An error happened during the saving of the user member link");
      throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_MEMBER_LINK, 400);
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
        throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.DATABASE_SAVE_USER_COMMUNITY, 400);
      }

      // Add the user to community if not present yet with the role Member
      try {
        const { user_id } = getContext();
        await this.iam_service.addUserToCommunity(user_id!, invitation.community!.auth_community_id, Role.MEMBER);
      } catch (err) {
        logger.error(
          { operation: "acceptInvitationMemberWEncoded", error: err },
          "The user can't accept this invitation: An error happened while adding the user to the community in the IAM service",
        );
        throw new AppError(INVITATION_ERRORS.ACCEPT_INVITATION_MEMBER_ENCODED.IAM_SERVICE_SAVE_USER_COMMUNITY, 400);
      }
    } else {
      logger.info({ operation: "acceptInvitationMemberWEncoded" }, "The user is already part of this community");
    }
  }

  /**
   * Cancels a manager invitation.
   * @param id_invitation - ID of the invitation.
   * @param query_runner - Database transaction runner.
   * @throws AppError if cancellation fails.
   */
  @Transactional()
  async cancelManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.invitationRepository.cancelManagerInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "cancelManagerInvitation" }, "An error happened during the cancelling of the manager invitation");
        throw new AppError(INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "cancelManagerInvitation", error: err }, "An exception happened during the cancelling of the manager invitation");
      throw new AppError(INVITATION_ERRORS.CANCEL_MANAGER_INVITATION.DATABASE_CANCEL, 400);
    }
  }

  /**
   * Cancels a member invitation.
   * @param id_invitation - ID of the invitation.
   * @param query_runner - Database transaction runner.
   * @throws AppError if cancellation fails.
   */
  @Transactional()
  async cancelMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.invitationRepository.cancelMemberInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "cancelMemberInvitation" }, "An error happened during the cancelling of the member invitation");
        throw new AppError(INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "cancelMemberInvitation", error: err }, "An error happened during the cancelling of the member invitation");
      throw new AppError(INVITATION_ERRORS.CANCEL_MEMBER_INVITATION.DATABASE_CANCEL, 400);
    }
  }

  /**
   * Refuses a manager invitation.
   * @param id_invitation - ID of the invitation.
   * @param query_runner - Database transaction runner.
   * @throws AppError if refusal fails.
   */
  @Transactional()
  async refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.invitationRepository.refuseManagerInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "refuseManagerInvitation" }, "An error happened during the refusing of the manager invitation");
        throw new AppError(INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "refuseManagerInvitation", error: err }, "An error happened during the refusing of the manager invitation");
      throw new AppError(INVITATION_ERRORS.REFUSE_MANAGER_INVITATION.DATABASE_REFUSE, 400);
    }
  }

  /**
   * Refuses a member invitation.
   * @param id_invitation - ID of the invitation.
   * @param query_runner - Database transaction runner.
   * @throws AppError if refusal fails.
   */
  @Transactional()
  async refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<void> {
    try {
      const deleted_result: DeleteResult = await this.invitationRepository.refuseMemberInvitation(id_invitation, query_runner);
      if (deleted_result.affected !== 1) {
        logger.error({ operation: "refuseMemberInvitation" }, "An error happened during the refusing of the member invitation");
        throw new AppError(INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE, 400);
      }
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "refuseMemberInvitation", error: err }, "An error happened during the refusing of the member invitation");
      throw new AppError(INVITATION_ERRORS.REFUSE_MEMBER_INVITATION.DATABASE_REFUSE, 400);
    }
  }

  /**
   * Retrieves pending manager invitations.
   * @param query - Query filters.
   * @returns Tuple of [UserManagerInvitationDTO[], Pagination].
   */
  async getManagersPendingInvitation(query: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]> {
    const [values, total]: [GestionnaireInvitation[], number] = await this.invitationRepository.getManagersPendingInvitation(query);
    const return_values = values.map((value) => toUserManagerInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves pending member invitations.
   * @param query - Query filters.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  async getMembersPendingInvitation(query: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]> {
    const [values, total]: [UserMemberInvitation[], number] = await this.invitationRepository.getMembersPendingInvitation(query);
    const return_values = values.map((value) => toUserMemberInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves own pending manager invitations.
   * @param query - Query filters.
   * @returns Tuple of [UserManagerInvitationDTO[], Pagination].
   */
  async getOwnManagerPendingInvitation(query: UserManagerInvitationQuery): Promise<[UserManagerInvitationDTO[], Pagination]> {
    const [values, total]: [GestionnaireInvitation[], number] = await this.invitationRepository.getOwnManagersPendingInvitation(query);
    const return_values = values.map((value) => toUserManagerInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves own pending member invitations.
   * @param query - Query filters.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  async getOwnMemberPendingInvitation(query: UserMemberInvitationQuery): Promise<[UserMemberInvitationDTO[], Pagination]> {
    const [values, total]: [UserMemberInvitation[], number] = await this.invitationRepository.getOwnMembersPendingInvitation(query);
    const return_values = values.map((value) => toUserMemberInvitationDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }
  /**
   * Retrieves own pending member invitation by id.
   * @param id - Invitation id.
   * @returns Tuple of [UserMemberInvitationDTO[], Pagination].
   */
  async getOwnMemberPendingInvitationById(id: number): Promise<IndividualDTO | CompanyDTO> {
    const value: Member | null = await this.invitationRepository.getOwnMembersPendingInvitationById(id);
    if (!value) {
      logger.error({ operation: "getOwnMemberPendingInvitationById" }, `Invitation not found / Member null in this invitation (${id})`);
      throw new AppError(INVITATION_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND, 400);
    }
    return toMemberDTO(value);
  }

  /**
   * Invites a user to become a manager.
   * @param invitation - Invitation details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if database save fails.
   */
  @Transactional()
  async inviteUserToBecomeManager(invitation: InviteUser, query_runner?: QueryRunner): Promise<void> {
    const user = await this.userRepository.getUserByEmail(invitation.user_email, query_runner);
    try {
      await this.invitationRepository.inviteUserToBecomeManager(invitation.user_email, user, query_runner);
    } catch (err) {
      logger.error({ operation: "inviteUserToBecomeManager", error: err }, "An error happened during the invitation of a user to become manager");
      throw new AppError(INVITATION_ERRORS.INVITE_USER_TO_BECOME_MANAGER.DATABASE_SAVE, 400);
    }
  }

  /**
   * Invites a user to become a member.
   * @param invitation - Invitation details.
   * @param query_runner - Database transaction runner.
   * @throws AppError if database save fails.
   */
  @Transactional()
  async inviteUserToBecomeMember(invitation: InviteUser, query_runner?: QueryRunner): Promise<void> {
    const user = await this.userRepository.getUserByEmail(invitation.user_email, query_runner);
    try {
      await this.invitationRepository.inviteUserToBecomeMember(invitation.user_email, user, query_runner);
    } catch (err) {
      logger.error({ operation: "inviteUserToBecomeMember", error: err }, "An error happened during the invitation of a user to become member");
      throw new AppError(INVITATION_ERRORS.INVITE_USER_TO_BECOME_MEMBER.DATABASE_SAVE, 400);
    }
  }
}
