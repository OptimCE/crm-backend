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

  /**
   * Time-limited URL for the community logo, or null when there is none.
   *
   * Deliberately NOT `logo_url`: that column holds a raw storage key, so
   * exposing it would give the client an unrenderable string. Presigned in the
   * service, one call per row, each failure degrading to null.
   */
  @Expose()
  logo_presigned_url!: string | null;
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

/**
 * Community-level fields the readiness dashboard chases. Names mirror
 * `CommunityDetailDTO` exactly so the frontend can derive its i18n key and its
 * "fix this" link from the field name alone.
 */
export type CommunityLegalField =
  | "vat_number"
  | "legal_name"
  | "iban"
  | "account_holder_name"
  | "headquarters_address"
  | "regulator";

export class CommunityDashboardMembersDTO {
  @Expose()
  total!: number;

  /** MemberStatus.ACTIVE */
  @Expose()
  active!: number;

  /** MemberStatus.INACTIVE */
  @Expose()
  inactive!: number;

  /** MemberStatus.PENDING */
  @Expose()
  pending!: number;

  /** Members with no `user_member_link` row — nobody can log in as them. */
  @Expose()
  without_user_account!: number;

  /** See the rule documented on {@link CommunityDashboardDTO}. */
  @Expose()
  incomplete!: number;
}

export class CommunityDashboardMetersDTO {
  @Expose()
  total!: number;

  /** Counted from the `meter_data` row in force on `as_of`. MeterDataStatus.ACTIVE */
  @Expose()
  active!: number;

  @Expose()
  inactive!: number;

  @Expose()
  waiting_grd!: number;

  @Expose()
  waiting_manager!: number;

  /**
   * Meters with NO `meter_data` row covering `as_of` at all — they have no
   * status, no holder and no operation. A different failure from the one below,
   * with a different fix, so both are reported.
   */
  @Expose()
  without_active_data!: number;

  /** Meters whose row in force on `as_of` has `id_sharing_operation IS NULL`. */
  @Expose()
  not_in_sharing_operation!: number;
}

export class CommunityDashboardOperationRefDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

export class CommunityDashboardSharingOperationsDTO {
  @Expose()
  total!: number;

  /** Operations with no APPROVED key whose validity window covers `as_of`. */
  @Expose()
  without_valid_key!: number;

  /** Operations with a key still awaiting approval (PENDING and not closed). */
  @Expose()
  with_pending_key!: number;

  /** Named operations behind `without_valid_key`, capped — the count is the truth. */
  @Expose()
  operations_without_valid_key!: CommunityDashboardOperationRefDTO[];
}

export class CommunityDashboardInvitationsDTO {
  @Expose()
  member_pending!: number;

  /** Of `member_pending`, those whose member record still has to be encoded. */
  @Expose()
  member_to_be_encoded!: number;

  @Expose()
  manager_pending!: number;
}

export class CommunityDashboardLegalInfoDTO {
  /** Field names still unset. Empty array means complete. */
  @Expose()
  missing_fields!: CommunityLegalField[];

  @Expose()
  complete!: boolean;
}

/**
 * Single-call readiness aggregate for the manager dashboard, scoped to the
 * active community from the request context — never from a query parameter.
 *
 * **`members.incomplete` rule.** Every column involved is `NOT NULL` in the DDL
 * and the create DTOs are all `@IsNotEmpty`, so "incomplete" can only mean an
 * empty/whitespace string or a missing sub-type row. A member counts when ANY of:
 *
 * 1. `member.name` or `member.iban` is blank;
 * 2. the sub-type row is missing — `member_type = INDIVIDUAL` with no `individual`
 *    row, or `COMPANY` with no `company` row. This is the state that makes
 *    `toMemberDTO` throw "Data inconsistency" on the detail endpoint;
 * 3. `individual.nrn` / `individual.email` blank, or `company.vat_number` blank;
 * 4. the home or billing address is missing, or its street/postcode/city is blank.
 *
 * Deliberately NOT counted: `individual.phone_number` and `individual.id_manager`
 * are `@IsOptional` by design, and `status = PENDING` is reported as a status
 * rather than as a defect.
 *
 * **`legal_info.missing_fields`.** `regulator` is `NOT NULL DEFAULT
 * 'BE-WAL-CWAPE'`, so it can never be absent — it is reported only when blank or
 * no longer an assignable code in the shared registry.
 */
export class CommunityDashboardDTO {
  /** Calendar date (`YYYY-MM-DD`) the windowed counters were evaluated at. */
  @Expose()
  as_of!: string;

  @Expose()
  members!: CommunityDashboardMembersDTO;

  @Expose()
  meters!: CommunityDashboardMetersDTO;

  @Expose()
  sharing_operations!: CommunityDashboardSharingOperationsDTO;

  @Expose()
  invitations!: CommunityDashboardInvitationsDTO;

  @Expose()
  legal_info!: CommunityDashboardLegalInfoDTO;
}
