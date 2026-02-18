import { Expose, Type } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../../../shared/dtos/role.js";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import type { Sort } from "../../../shared/dtos/query.dtos.js";
import { COMMUNITY_ERRORS } from "../shared/community.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
/**
 * DTO for querying communities with pagination and filtering.
 */
export class CommunityQueryDTO extends PaginationQuery {
  /**
   * Filter communities by name (partial match).
   * Must be a string if provided.
   */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  name?: string;

  /**
   * Sort order for the 'name' field.
   * Accepted values: 'ASC', 'DESC'.
   */
  @IsIn(["ASC", "DESC"], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_name?: Sort;

  /**
   * Sort order for the 'id' field.
   * Accepted values: 'ASC', 'DESC'.
   */
  @IsIn(["ASC", "DESC"], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_id?: Sort;
}

/**
 * DTO for querying users within a community with pagination and filtering.
 */
export class CommunityUsersQueryDTO extends PaginationQuery {
  /**
   * Filter users by email (exact or partial match depending on implementation).
   * Must be a valid email string if provided.
   */
  @Type(() => String)
  @IsEmail({}, withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
  @IsOptional()
  email?: string;

  /**
   * Filter users by role.
   * Accepted values: Role.GESTIONNAIRE, Role.ADMIN, Role.MEMBER.
   */
  @IsIn([Role.GESTIONNAIRE, Role.ADMIN, Role.MEMBER], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_ROLE.MEMBER_MANAGER_ADMIN))
  @IsOptional()
  role?: Role;

  /**
   * Sort order for the 'email' field.
   * Accepted values: 'ASC', 'DESC'.
   */
  @IsIn(["ASC", "DESC"], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_email?: Sort;

  /**
   * Sort order for the 'id' field.
   * Accepted values: 'ASC', 'DESC'.
   */
  @IsIn(["ASC", "DESC"], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_id?: Sort;

  /**
   * Sort order for the 'role' field.
   * Accepted values: 'ASC', 'DESC'.
   */
  @IsIn(["ASC", "DESC"], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_role?: Sort;
}

/**
 * DTO representing a simple view of a community.
 */
export class CommunityDTO {
  /**
   * The unique identifier of the community (internal DB ID).
   */
  @Expose()
  id!: number;
  /**
   * The name of the community.
   */
  @Expose()
  name!: string;
}

/**
 * DTO representing a community from the perspective of the current user.
 * Includes the user's role in that community.
 */
export class MyCommunityDTO {
  /**
   * The unique identifier of the community (internal DB ID).
   */
  @Expose()
  id!: number;
  /**
   * The unique identifier of the community in the IAM system.
   */
  @Expose()
  auth_community_id!: string;
  /**
   * The name of the community.
   */
  @Expose()
  name!: string;
  /**
   * The role of the current user in this community.
   */
  @Expose()
  role!: Role;
}

/**
 * DTO representing a user's membership in a community.
 */
export class UsersCommunityDTO {
  /**
   * The unique identifier of the user (internal DB ID).
   */
  @Expose()
  id_user!: number;
  /**
   * The unique identifier of the community (internal DB ID).
   */
  @Expose()
  id_community!: number;
  /**
   * The email address of the user.
   */
  @Expose()
  email!: string;
  /**
   * The role the user holds in the community.
   */
  @Expose()
  role!: Role;
}

/**
 * DTO for creating or updating a community.
 */
export class CreateCommunityDTO {
  /**
   * The name of the community.
   * Must be a non-empty string.
   */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  name!: string;
}

/**
 * DTO for patching (updating) a user's role within a community.
 */
export class PatchRoleUserDTO {
  /**
   * The ID of the user whose role is being updated.
   * Must be an integer.
   */
  @Type(() => Number)
  @IsInt(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_user!: number;

  /**
   * The new role to assign to the user.
   * Accepted values: Role.MEMBER, Role.ADMIN, Role.GESTIONNAIRE.
   */
  @Type(() => String)
  @IsIn([Role.MEMBER, Role.ADMIN, Role.GESTIONNAIRE], withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_ROLE.MEMBER_MANAGER_ADMIN))
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  new_role!: Role;
}
