import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { ICommunityService } from "../domain/i-community.service.js";
import type { ICommunityRepository } from "../domain/i-community.repository.js";
import { inject, injectable } from "inversify";
import {
  CommunityQueryDTO,
  CommunityUsersQueryDTO,
  CreateCommunityDTO,
  MyCommunityDTO,
  PatchRoleUserDTO,
  UsersCommunityDTO,
} from "../api/community.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { QueryRunner } from "typeorm";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { Community, CommunityUser } from "../domain/community.models.js";
import { Role } from "../../../shared/dtos/role.js";
import { toMyCommunityDTO, toUsersCommunityDTO } from "../shared/to_dto.js";
import type { IIamService } from "../../../shared/iam/i-iam.service.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { COMMUNITY_ERRORS } from "../shared/community.errors.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";

/**
 * Implementation of the Community Service.
 * Manages community creation, updates, membership, and IAM synchronization.
 */
@injectable()
export class CommunityService implements ICommunityService {
  constructor(
    @inject("CommunityRepository") private community_repository: ICommunityRepository,
    @inject("IAMService") private iam_service: IIamService,
    @inject("AuthContext") private authContext: IAuthContextRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  /**
   * Adds a new community.
   * Creates the community in the IAM service first, then in the local database.
   * @param new_community - DTO containing the name of the new community.
   * @param query_runner - Optional query runner for transaction control.
   * @throws AppError if IAM creation or DB save fails.
   */
  @Transactional()
  async addCommunity(new_community: CreateCommunityDTO, query_runner?: QueryRunner): Promise<void> {
    //TODO: Handle where there is an exception (like delete the community in keycloack and so )
    // 1. Create the community in the IAM provider
    // Retrieve the new org_id
    let org_id: string;
    try {
      org_id = await this.iam_service.createCommunity(new_community);
      console.log("ORG ID : ", org_id);
    } catch (err) {
      logger.error({ operation: "addCommunity", error: err }, "An exception occurred while creating a new community in the IAM providers");
      throw new AppError(COMMUNITY_ERRORS.ADD_COMMUNITY.IAM_ERROR_CREATE, 400);
    }
    let new_community_model;
    try {
      new_community_model = await this.community_repository.addCommunity(new_community, org_id, query_runner);
    } catch (err) {
      logger.error({ operation: "addCommunity", error: err }, "An exception occurred while creating a new community in the database");
      throw new AppError(COMMUNITY_ERRORS.ADD_COMMUNITY.DATABASE_SAVE_EXCEPTION, 400);
    }
    // Add the user to the community
    try {
      const { user_id } = getContext();
      await this.iam_service.addUserToCommunity(user_id!, org_id, Role.ADMIN);
    } catch (err) {
      logger.error(
        { operation: "addCommunity", error: err },
        "An exception occurred while adding the user to the new community in the IAM providers",
      );
      throw new AppError(COMMUNITY_ERRORS.ADD_COMMUNITY.IAM_ERROR_CREATE, 400);
    }
    try {
      const internal_user_id = await this.authContext.getInternalUserId(query_runner);
      await this.community_repository.addUserCommunity(internal_user_id, new_community_model.id, Role.ADMIN, query_runner);
    } catch (err) {
      logger.error({ operation: "addCommunity", error: err }, "An exception occurred while adding the user to the new community in the database");
      throw new AppError(COMMUNITY_ERRORS.ADD_COMMUNITY.DATABASE_SAVE_EXCEPTION, 400);
    }
  }

  /**
   * Updates an existing community.
   * Updates the name in the local database first, then in the IAM service.
   * @param updated_community - DTO containing the new community details.
   * @param query_runner - Optional query runner.
   * @throws AppError if DB update or IAM update fails.
   */
  @Transactional()
  async updateCommunity(updated_community: CreateCommunityDTO, query_runner?: QueryRunner): Promise<void> {
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    let community_updated: Community;
    try {
      community_updated = await this.community_repository.updateCommunity(internal_community_id, updated_community);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "updateCommunity", error: err }, "An exception occurred while updating the community in the database");
      throw new AppError(COMMUNITY_ERRORS.UPDATE_COMMUNITY.DATABASE_UPDATE_EXCEPTION, 400);
    }
    try {
      await this.iam_service.updateCommunity(community_updated.auth_community_id, updated_community.name);
    } catch (err) {
      logger.error({ operation: "updateCommunity", error: err }, "An exception occurred while creating a new community in the IAM service");
      throw new AppError(COMMUNITY_ERRORS.UPDATE_COMMUNITY.IAM_ERROR_UPDATE, 400);
    }
  }

  /**
   * Retrieves admins and managers of the community in context.
   * @param query - Query parameters.
   * @returns A tuple of UsersCommunityDTO[] and Pagination.
   */
  async getAdmins(query: CommunityUsersQueryDTO): Promise<[UsersCommunityDTO[], Pagination]> {
    const [values, total] = await this.community_repository.getAdmins(query);
    const return_values = values.map((value) => toUsersCommunityDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves communities where the current user is a member.
   * @param query - Query parameters.
   * @returns A tuple of MyCommunityDTO[] and Pagination.
   */
  async getMyCommunities(query: CommunityQueryDTO): Promise<[MyCommunityDTO[], Pagination]> {
    const [values, total] = await this.community_repository.getMyCommunities(query);
    console.log("VALUES : ", values);
    const return_values = values.map((value) => toMyCommunityDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Retrieves users of the community in context.
   * @param query - Query parameters.
   * @returns A tuple of UsersCommunityDTO[] and Pagination.
   */
  async getUsers(query: CommunityUsersQueryDTO): Promise<[UsersCommunityDTO[], Pagination]> {
    const [values, total] = await this.community_repository.getUsers(query);
    const return_values = values.map((value) => toUsersCommunityDTO(value));
    const total_pages = Math.ceil(total / query.limit);
    return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }];
  }

  /**
   * Helper method to delete a user from a community (database and IAM).
   * @param id_user - ID of the user to delete.
   * @param id_community - ID of the community.
   * @param query_runner - Query runner.
   * @throws AppError if deletion fails.
   */
  async deleteUser(id_user: number, id_community: number, query_runner: QueryRunner): Promise<void> {
    // 1. Delete it from the database and fetch the deleted user
    let user_deleted: CommunityUser;
    try {
      user_deleted = await this.community_repository.deleteUserCommunity(id_user, id_community, query_runner);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "deleteUser", error: err }, "An exception occurred while deleting a user in the database");
      throw new AppError(COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.DATABASE_DELETE_USER_EXCEPTION, 400);
    }
    // 2. Delete it from the IAM provider (fetch the iam provider ids from user_deleted)
    // If fail, throw exception to rollback
    try {
      await this.iam_service.deleteUserFromCommunity(user_deleted.user.auth_user_id, user_deleted.community.auth_community_id);
    } catch (err) {
      logger.error({ operation: "deleteUser", error: err }, "An exception occurred while deleting a user in the IAM provider");
      throw new AppError(COMMUNITY_ERRORS.DELETE_USER_COMMUNITY.IAM_DELETE_USER_FROM_COMMUNITY, 400);
    }
  }

  /**
   * Kicks a user from the community in context.
   * @param id_user - ID of the user to kick.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async kickUser(id_user: number, query_runner?: QueryRunner): Promise<void> {
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    await this.deleteUser(id_user, internal_community_id, query_runner!);
  }
  /**
   * Allows the current user to leave a community.
   * @param id_community - ID of the community to leave.
   * @param query_runner - Optional query runner.
   */
  @Transactional()
  async leave(id_community: number, query_runner?: QueryRunner): Promise<void> {
    // 1. Delete it from the database and fetch the deleted user
    const internal_user_id = await this.authContext.getInternalUserId(query_runner);
    await this.deleteUser(internal_user_id, id_community, query_runner!);
  }

  /**
   * Helper method to update a user's role in a community (database and IAM).
   * @param id_user - User ID.
   * @param id_community - Community ID.
   * @param new_role - New role to assign.
   * @param query_runner - Query runner.
   * @returns The updated CommunityUser entity.
   * @throws AppError if update fails.
   */
  async updateUserRole(id_user: number, id_community: number, new_role: Role, query_runner: QueryRunner): Promise<CommunityUser> {
    let updated_result: CommunityUser;
    try {
      updated_result = await this.community_repository.patchRoleUser(id_user, id_community, new_role, query_runner);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "patchRoleUser", error: err }, "The update of the user fails in the database");
      throw new AppError(COMMUNITY_ERRORS.UPDATE_USER_ROLE.DATABASE_PATCH_ROLE_EXCEPTION, 400);
    }
    try {
      await this.iam_service.updateUserRole(updated_result.user.auth_user_id, updated_result.community.auth_community_id, new_role);
    } catch (err) {
      logger.error({ operation: "patchRoleUser", error: err }, "The update of the user fails in the IAM providers");
      throw new AppError(COMMUNITY_ERRORS.UPDATE_USER_ROLE.IAM_UPDATE_USER_ROLE, 400);
    }
    return updated_result;
  }

  /**
   * Patches a user's role in the current community.
   * If the new role is ADMIN, downgrades the current user to GESTIONNAIRE.
   * @param patched_role - DTO containing details.
   * @param query_runner - Optional query runner.
   * @throws AppError if any step fails.
   */
  @Transactional()
  async patchRoleUser(patched_role: PatchRoleUserDTO, query_runner?: QueryRunner): Promise<void> {
    // Update the user role
    let updated_result: CommunityUser;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    try {
      updated_result = await this.updateUserRole(patched_role.id_user, internal_community_id, patched_role.new_role, query_runner!);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "patchRoleUser", error: err }, "The update of the user fails");
      throw new AppError(COMMUNITY_ERRORS.PATCH_ROLE_USER.EXCEPTION, 400);
    }
    if (updated_result.role === Role.ADMIN) {
      // Downgrade the user making the request
      const internal_user_id = await this.authContext.getInternalUserId(query_runner);
      try {
        await this.updateUserRole(internal_user_id, internal_community_id, Role.GESTIONNAIRE, query_runner!);
      } catch (err) {
        if (isAppErrorLike(err)) {
          throw err;
        }
        logger.error({ operation: "patchRoleUser", error: err }, "The update of the user fails");
        throw new AppError(COMMUNITY_ERRORS.PATCH_ROLE_USER.EXCEPTION, 400);
      }
    }
  }

  /**
   * Deletes a community completely.
   * @param id_community - ID of the community to delete.
   * @param query_runner - Optional query runner.
   * @throws AppError if ID mismatch or deletion fails.
   */
  @Transactional()
  async deleteCommunity(id_community: number, query_runner?: QueryRunner): Promise<void> {
    let deleted_community: Community;
    const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
    if (id_community !== internal_community_id) {
      logger.error({ operation: "deleteCommunity" }, "The user is not in the same community than the one targetted for deletion");
      throw new AppError(COMMUNITY_ERRORS.DELETE_COMMUNITY.MISMATCH_ID, 400);
    }
    try {
      deleted_community = await this.community_repository.deleteCommunity(id_community, query_runner);
    } catch (err) {
      if (isAppErrorLike(err)) {
        throw err;
      }
      logger.error({ operation: "deleteCommunity", error: err }, "The deletion of the community fails in the database");
      throw new AppError(COMMUNITY_ERRORS.DELETE_COMMUNITY.DATABASE_DELETE_EXCEPTION, 400);
    }
    try {
      await this.iam_service.deleteCommunity(deleted_community.auth_community_id);
    } catch (err) {
      logger.error({ operation: "deleteCommunity", error: err }, "The deletion of the community fails in the IAM service");
      throw new AppError(COMMUNITY_ERRORS.DELETE_COMMUNITY.IAM_DELETE_COMMUNITY, 400);
    }
  }
}
