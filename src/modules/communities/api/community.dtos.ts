import { Expose, Type } from "class-transformer";
import { IsEmail, IsIBAN, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import { Role } from "../../../shared/dtos/role.js";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import type { Sort } from "../../../shared/dtos/query.dtos.js";
import { COMMUNITY_ERRORS } from "../shared/community.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { AddressDTO, CreateAddressDTO } from "../../../shared/address/address.dtos.js";
import { IsActiveRegulator, IsKnownRegulator } from "../shared/is-active-regulator.validator.js";
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
   * Filter communities by regulator code.
   * Must be a known regulator code (active or not) if provided.
   */
  @Type(() => String)
  @IsKnownRegulator(withError(COMMUNITY_ERRORS.VALIDATION.INVALID_REGULATOR))
  @IsOptional()
  regulator?: string;

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
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  logo_url!: string | null;
}

/**
 * DTO returned by the public communities list. Includes a short-lived
 * presigned logo URL so the client can render the image directly.
 */
export class PublicCommunityDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  logo_url!: string | null;

  /** Coded regulator the community is notified to (see reference/regulators.json). */
  @Expose()
  regulator!: string;

  /** Short-lived presigned URL (~15 min). Null when the community has no logo or URL generation failed. */
  @Expose()
  logo_presigned_url!: string | null;
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

  @Expose()
  first_name?: string | null;

  @Expose()
  last_name?: string | null;

  @Expose()
  phone?: string | null;
}

/**
 * DTO representing a detailed view of a community.
 */
export class CommunityDetailDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  auth_community_id!: string;

  @Expose()
  created_at!: Date;

  @Expose()
  updated_at!: Date;

  @Expose()
  member_count!: number;

  /** Coded regulator the community is notified to (see reference/regulators.json). */
  @Expose()
  regulator!: string;

  @Expose()
  description?: string | null;

  @Expose()
  website_url?: string | null;

  /** Storage key in MinIO/S3 (e.g. `documents/<uuid>-name.png`). */
  @Expose()
  logo_url?: string | null;

  /** Short-lived presigned URL (~15 min) for direct logo display. */
  @Expose()
  logo_presigned_url?: string | null;

  @Expose()
  headquarters_address?: AddressDTO | null;

  /** VAT / BTW number of the community. */
  @Expose()
  vat_number?: string | null;

  /** Official registered legal name, distinct from the display `name`. */
  @Expose()
  legal_name?: string | null;

  /** IBAN of the community's bank account. */
  @Expose()
  iban?: string | null;

  /** Name the bank account is held under — only set when it differs from `legal_name`. */
  @Expose()
  account_holder_name?: string | null;
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

  /**
   * Coded regulator the community is notified to. Required; must be a currently
   * active code from the shared registry (see reference/regulators.json).
   */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  @IsActiveRegulator(withError(COMMUNITY_ERRORS.VALIDATION.INVALID_REGULATOR))
  regulator!: string;
}

/**
 * DTO for partial updates to an existing community.
 * All fields are optional — only the provided fields are applied.
 */
export class UpdateCommunityDTO {
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.EMPTY))
  @IsOptional()
  name?: string;

  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  description?: string | null;

  @Type(() => String)
  @IsUrl({}, withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  website_url?: string | null;

  /**
   * Coded regulator the community is notified to. Optional on update; when
   * present must be a currently active code (see reference/regulators.json).
   * Changing this is admin-gated and audited.
   */
  @Type(() => String)
  @IsActiveRegulator(withError(COMMUNITY_ERRORS.VALIDATION.INVALID_REGULATOR))
  @IsOptional()
  regulator?: string;

  @ValidateNested()
  @Type(() => CreateAddressDTO)
  @IsOptional()
  headquarters_address?: CreateAddressDTO;

  /** VAT / BTW number. Free-text, optional. */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  vat_number?: string | null;

  /** Official registered legal name, distinct from the display `name`. Optional. */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  legal_name?: string | null;

  /** IBAN of the bank account. Optional; validated as a well-formed IBAN when present. */
  @Type(() => String)
  @IsIBAN(withError(COMMUNITY_ERRORS.VALIDATION.INVALID_IBAN))
  @IsOptional()
  iban?: string | null;

  /** Account holder name — only persisted when it differs from `legal_name`. Optional. */
  @Type(() => String)
  @IsString(withError(COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  account_holder_name?: string | null;
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
