import { inject, injectable } from "inversify";
import type { IInvitationService } from "../domain/i-invitation.service.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IInvitationRepository } from "../domain/i-invitation.repository.js";
import {
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
import type { IUserRepository } from "../../users/domain/i-user.repository.js";
import { toUserManagerInvitationDTO, toUserMemberInvitationDTO } from "../shared/to_dto.js";
import { INVITATION_ERRORS } from "../shared/invitation.errors.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";

/**
 * Service implementation for managing invitations.
 * Orchestrates database operations, IAM updates, and validation for invitations.
 */
@injectable()
export class InvitationService implements IInvitationService {
  constructor(
    @inject("InvitationRepository") private invitationRepository: IInvitationRepository,
    @inject("UserRepository") private userRepository: IUserRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

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
