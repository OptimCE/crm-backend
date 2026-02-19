import { Expose, Type } from "class-transformer";
import { PaginationQuery, type Sort } from "../../../shared/dtos/query.dtos.js";
import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { AddressDTO, CreateAddressDTO, UpdateAddressDTO } from "../../../shared/address/address.dtos.js";
import { MEMBER_ERRORS } from "../shared/member.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { MemberStatus, MemberType } from "../shared/member.types.js";

/**
 * DTO for querying members with pagination, filtering, and sorting.
 */
export class MemberPartialQuery extends PaginationQuery {
  /**
   * Filter by member name.
   */
  @Type(() => String)
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  name?: string;

  /**
   * Filter by member type (e.g., INDIVIDUAL, COMPANY).
   */
  @Type(() => Number)
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsOptional()
  member_type?: MemberType;

  /**
   * Filter by member status (e.g., ACTIVE, INACTIVE).
   */
  @Type(() => Number)
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsOptional()
  status?: MemberStatus;

  /**
   * Sort by name (ASC or DESC).
   */
  @IsIn(["ASC", "DESC"], withError(MEMBER_ERRORS.GENERIC_VALIDATION.SORT))
  @IsOptional()
  sort_name?: Sort;
}

export class MemberLinkQueryDTO {
  @Type(() => String)
  @IsEmail({}, withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  email!: string;
}

/**
 * Partial DTO representing a member (summary view).
 */
export class MembersPartialDTO {
  /**
   * Unique ID of the member.
   * @example: 1
   */
  @Expose()
  id!: number;
  /**
   * Name of the member.
   */
  @Expose()
  name!: string;
  /**
   * Type of the member (Individual or Company).
   */
  @Expose()
  member_type!: MemberType;
  /**
   * Status of the member.
   */
  @Expose()
  status!: MemberStatus;
}

/**
 * Full DTO representing a member, including address definitions.
 */
export class MemberDTO extends MembersPartialDTO {
  /**
   * IBAN of the member.
   */
  @Expose()
  iban!: string;
  /**
   * Home address of the member.
   */
  @Expose()
  home_address!: AddressDTO;
  /**
   * Billing address of the member.
   */
  @Expose()
  billing_address!: AddressDTO;
  /**
   * Linked user email, if associated with a user account.
   */
  @Expose()
  user_link_email?: string;
}
/**
 * DTO representing a manager associated with a member.
 */
export class ManagerDTO {
  /**
   * Unique ID of the manager.
   */
  @Expose()
  id!: number;
  /**
   * National Registry Number of the manager.
   */
  @Expose()
  NRN!: string;
  /**
   * First name of the manager.
   */
  @Expose()
  name!: string;
  /**
   * Surname of the manager.
   */
  @Expose()
  surname!: string;
  /**
   * Email address of the manager.
   */
  @Expose()
  email!: string;
  /**
   * Phone number of the manager.
   */
  @Expose()
  phone_number?: string;
}
/**
 * DTO representing a manager associated with a member.
 */
export class CreateManagerDTO {
  /**
   * National Registry Number of the manager.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  NRN!: string;
  /**
   * First name of the manager.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  name!: string;
  /**
   * Surname of the manager.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  surname!: string;
  /**
   * Email address of the manager.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  email!: string;
  /**
   * Phone number of the manager.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  phone_number?: string;
}

/**
 * Data Transfer Object for individual members
 * Extends MembersDTO with individual-specific information
 */
/**
 * Data Transfer Object for individual members
 * Extends MembersDTO with individual-specific information
 */
export class IndividualDTO extends MemberDTO {
  /**
   * National Registry Number.
   */
  @Expose()
  NRN!: string;
  /**
   * First name.
   */
  @Expose()
  first_name!: string;
  /**
   * Contact email.
   */
  @Expose()
  email!: string;
  /**
   * Phone number.
   */
  @Expose()
  phone_number!: string;
  /**
   * Whether the social rate applies.
   */
  @Expose()
  social_rate!: boolean;
  /**
   * Optional manager (e.g., if under guardianship).
   */
  @Expose()
  manager?: ManagerDTO;
}

/**
 * Data Transfer Object for legal entity members
 * Extends MembersDTO with legal entity-specific information
 */
/**
 * Data Transfer Object for legal entity members
 * Extends MembersDTO with legal entity-specific information
 */
export class CompanyDTO extends MemberDTO {
  /**
   * VAT number of the company.
   */
  @Expose()
  vat_number!: string;
  /**
   * Manager or contact person for the company.
   */
  @Expose()
  manager!: ManagerDTO;
}
/**
 * DTO for creating a new member.
 * Contains common fields and type-specific fields (Individual vs Company).
 * Uses conditional validation based on `member_type`.
 */
export class CreateMemberDTO {
  // ========================================================================
  // COMMON FIELDS (Applies to everyone)
  // ========================================================================
  /**
   * Name of the member (Full name or Company name).
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  name!: string;

  /**
   * Type of the member (1: INDIVIDUAL, 2: COMPANY).
   */
  @Expose()
  @Type(() => Number)
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  member_type!: MemberType;

  /**
   * Status of the member.
   */
  @Expose()
  @Type(() => Number)
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  status!: MemberStatus;

  /**
   * IBAN of the member.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  iban!: string;

  /**
   * Home address details.
   */
  @Expose()
  @ValidateNested()
  @Type(() => CreateAddressDTO)
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  home_address!: CreateAddressDTO;

  /**
   * Billing address details.
   */
  @Expose()
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateNested()
  @Type(() => CreateAddressDTO)
  billing_address!: CreateAddressDTO;

  // ========================================================================
  // INDIVIDUAL SPECIFIC FIELDS (Validate only if INDIVIDUAL)
  // ========================================================================
  /**
   * First name (Individual only).
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.INDIVIDUAL)
  first_name!: string;

  /**
   * National Registry Number (Individual only).
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.INDIVIDUAL)
  NRN!: string; // National Registry Number

  /**
   * Contact email (Individual only).
   */
  @Expose()
  @IsEmail({}, withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.INDIVIDUAL)
  email!: string;

  /**
   * Phone number (Individual only).
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  @ValidateIf((o) => o.member_type === MemberType.INDIVIDUAL)
  phone_number?: string;

  /**
   * Social rate eligibility (Individual only).
   */
  @Expose()
  @Type(() => Boolean)
  @IsBoolean(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.BOOLEAN))
  @ValidateIf((o) => o.member_type === MemberType.INDIVIDUAL)
  social_rate!: boolean;

  // ========================================================================
  // COMPANY SPECIFIC FIELDS (Validate only if COMPANY)
  // ========================================================================
  /**
   * VAT number (Company only).
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.COMPANY)
  vat_number!: string;

  // ========================================================================
  // SHARED RELATIONS (But with different rules)
  // ========================================================================

  /**
   * Optional Manager (e.g. for companies or individuals under guardianship).
   */
  @Expose()
  @ValidateNested()
  @Type(() => CreateManagerDTO)
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.COMPANY || o.manager !== undefined)
  manager?: CreateManagerDTO;
}

/**
 * DTO for updating an existing member.
 * Most fields are optional to allow partial updates.
 */
export class UpdateMemberDTO {
  // We include ID mostly for reference if you pass it in body,
  // but usually, the ID comes from the URL (e.g., PUT /members/:id).
  /**
   * ID of the member to update.
   */
  @Expose()
  @IsInt(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  id!: number;

  // ========================================================================
  // COMMON FIELDS (All Optional now)
  // ========================================================================
  /**
   * New name.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  name?: string;

  // We removed member_type. Changing generic structure usually requires a migration, not a simple update.

  /**
   * New status.
   */
  @Expose()
  @Type(() => Number)
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsOptional()
  status?: MemberStatus;

  /**
   * New IBAN.
   */
  @Expose()
  @Type(() => String)
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  iban?: string;

  /**
   * New home address details.
   */
  @Expose()
  @Type(() => UpdateAddressDTO)
  @ValidateNested()
  @IsOptional()
  home_address?: UpdateAddressDTO;

  /**
   * New billing address details.
   */
  @Expose()
  @Type(() => UpdateAddressDTO)
  @ValidateNested()
  @IsOptional()
  billing_address?: UpdateAddressDTO;

  // ========================================================================
  // INDIVIDUAL SPECIFIC FIELDS
  // Logic: If the client sends 'first_name', we validate it.
  // The Service layer is responsible for ensuring we don't save 'first_name' to a Company.
  // ========================================================================
  /**
   * Update first name.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  first_name?: string;

  /**
   * Update NRN.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  NRN?: string;

  /**
   * Update email.
   */
  @Expose()
  @IsEmail({}, withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
  @IsOptional()
  email?: string;

  /**
   * Update phone number.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  phone_number?: string;

  /**
   * Update social rate.
   */
  @Expose()
  @Type(() => Boolean)
  @IsBoolean(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.BOOLEAN))
  @IsOptional()
  social_rate?: boolean;

  // ========================================================================
  // COMPANY SPECIFIC FIELDS
  // ========================================================================
  /**
   * Update VAT number.
   */
  @Expose()
  @IsString(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  vat_number?: string;

  // ========================================================================
  // RELATIONS
  // ========================================================================
  /**
   * Update Manager ID.
   */
  @Expose()
  @ValidateNested()
  @Type(() => CreateManagerDTO)
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  @ValidateIf((o) => o.member_type === MemberType.COMPANY || o.manager !== undefined)
  manager?: CreateManagerDTO;
}

/**
 * DTO for patching member status only.
 */
export class PatchMemberStatusDTO {
  /**
   * ID of the member.
   */
  @Expose()
  @IsInt(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_member!: number;

  /**
   * New status.
   */
  @Expose()
  @IsEnum(MemberType, withError(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_TYPE))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  status!: MemberStatus;
}

/**
 * DTO for inviting a user to link to a member account.
 */
export class PatchMemberInviteUserDTO {
  /**
   * ID of the member.
   */
  @Expose()
  @IsInt(withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  id_member!: number;
  /**
   * Email of the user to invite.
   */
  @Expose()
  @IsEmail({}, withError(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
  @IsNotEmpty(withError(MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY))
  user_email!: string;
}

/**
 * DTO representing the link status between a member and a user account.
 */
export class MemberLinkDTO {
  /**
   * Email of the linked user (or invited email).
   */
  @Expose()
  user_email?: string;
  /**
   * User ID if linked.
   */
  @Expose()
  user_id?: number;
  /**
   * Status of the link (ACTIVE, PENDING, INACTIVE).
   */
  @Expose()
  status?: MemberStatus;

  /**
   * Id either of the member link or of the member invitation
   */
  @Expose()
  id?: number;
}
