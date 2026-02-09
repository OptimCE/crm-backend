import { Expose, Type } from "class-transformer";
import { PaginationQuery, type Sort } from "../../../shared/dtos/query.dtos.js";
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { CommunityDTO } from "../../communities/api/community.dtos.js";
import { CreateMemberDTO } from "../../members/api/member.dtos.js";
import { INVITATION_ERRORS } from "../shared/invitation.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";

/**
 * DTO for querying member invitations for specific users.
 * Supports pagination and filtering.
 */
export class UserMemberInvitationQuery extends PaginationQuery {
    /**
     * Filter by member name.
     */
    @Type(() => String)
    @IsString(withError(INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    name?: string;

    /**
     * Filter by encoding status (to be encoded or not).
     */
    @Type(() => Boolean)
    @IsBoolean(withError(INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.BOOLEAN))
    @IsOptional()
    to_be_encoded?: boolean;

    /**
     * Sort by name.
     */
    @IsIn(['ASC', 'DESC'], withError(INVITATION_ERRORS.GENERIC_VALIDATION.SORT))
    @IsOptional()
    sort_name?: Sort;

    /**
     * Sort by creation date.
     */
    @IsIn(['ASC', 'DESC'], withError(INVITATION_ERRORS.GENERIC_VALIDATION.SORT))
    @IsOptional()
    sort_date?: Sort;
}

/**
 * DTO representing an invitation for a user to become a member.
 */
export class UserMemberInvitationDTO {
    /**
     * Unique ID of the invitation.
     */
    @Expose()
    id!: number;
    /**
     * ID of the member (if linked/existing).
     */
    @Expose()
    member_id?: number;
    /**
     * Name of the member.
     */
    @Expose()
    member_name?: string;
    /**
     * Email of the user invited.
     */
    @Expose()
    user_email!: string;
    /**
     * Date of invitation creation.
     */
    @Expose()
    created_at!: Date;
    /**
     * Whether the member needs to be encoded (details filled).
     */
    @Expose()
    to_be_encoded!: boolean;
    /**
     * Community details associated with the invitation.
     */
    @Expose()
    community!: CommunityDTO;
}

/**
 * DTO for querying manager invitations.
 */
export class UserManagerInvitationQuery extends PaginationQuery {
    /**
     * Filter by name.
     */
    @Type(() => String)
    @IsString(withError(INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    name?: string;

    /**
     * Sort by name.
     */
    @IsIn(['ASC', 'DESC'], withError(INVITATION_ERRORS.GENERIC_VALIDATION.SORT))
    @IsOptional()
    sort_name?: Sort;

    /**
     * Sort by date.
     */
    @IsIn(['ASC', 'DESC'], withError(INVITATION_ERRORS.GENERIC_VALIDATION.SORT))
    @IsOptional()
    sort_date?: Sort;
}
/**
 * DTO representing an invitation for a user to become a manager.
 */
export class UserManagerInvitationDTO {
    /**
     * Invitation ID.
     */
    @Expose()
    id!: number;
    /**
     * Email of the user.
     */
    @Expose()
    user_email!: string;
    /**
     * Community details.
     */
    @Expose()
    community!: CommunityDTO;
    /**
     * Creation date.
     */
    @Expose()
    created_at!: Date;
}

/**
 * DTO for sending an invitation.
 */
export class InviteUser {
    /**
     * Email of the user to invite.
     */
    @Expose()
    @Type(() => String)
    @IsEmail({}, withError(INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL))
    @IsNotEmpty(withError(INVITATION_ERRORS.GENERIC_VALIDATION.EMPTY))
    user_email!: string;
}



/**
 * DTO for accepting an invitation.
 */
export class AcceptInvitationDTO {
    /**
     * ID of the invitation to accept.
     */
    @Expose()
    @Type(() => Number)
    @IsInt(withError(INVITATION_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(INVITATION_ERRORS.GENERIC_VALIDATION.EMPTY))
    invitation_id!: number;
}

/**
 * DTO for accepting an invitation with additional member details.
 * Used when the member needs to be encoded/created during acceptance.
 */
export class AcceptInvitationWEncodedDTO extends AcceptInvitationDTO {
    /**
     * Member details to create/update.
     */
    @Expose()
    @Type(() => CreateMemberDTO)
    @ValidateNested()
    @IsNotEmpty(withError(INVITATION_ERRORS.GENERIC_VALIDATION.EMPTY))
    member!: CreateMemberDTO;
}