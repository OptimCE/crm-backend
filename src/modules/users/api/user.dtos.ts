import { Expose, Type } from "class-transformer";
import { AddressDTO, CreateAddressDTO } from "../../../shared/address/address.dtos.js";
import { IsOptional, IsString, ValidateNested } from "class-validator";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { USER_ERRORS } from "../shared/user.errors.js";

/**
 * DTO representing a user's profile and contact information.
 */
export class UserDTO {
    @Expose()
    id!: number;

    /**
     * First name of the user.
     */
    @Expose()
    first_name?: string | null;

    /**
     * Last name of the user.
     */
    @Expose()
    last_name?: string | null;

    /**
     * National Register Number (or equivalent ID).
     */
    @Expose()
    nrn?: string | null;

    /**
     * Contact phone number.
     */
    @Expose()
    phone_number?: string | null;

    /**
     * Email address (unique identifier).
     */
    @Expose()
    email!: string;

    /**
     * International Bank Account Number.
     */
    @Expose()
    iban?: string | null;

    /**
     * Primary residential address.
     */
    @Expose()
    home_address?: AddressDTO;

    /**
     * Billing address, if different from home address.
     */
    @Expose()
    billing_address?: AddressDTO;
}

/**
 * DTO for updating user information.
 * All fields are optional; only provided fields will be updated.
 */
export class UpdateUserDTO {
    @Expose()
    @Type(() => String)
    @IsString(withError(USER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    first_name?: string;

    @Expose()
    @Type(() => String)
    @IsString(withError(USER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    last_name?: string;

    @Expose()
    @Type(() => String)
    @IsString(withError(USER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    nrn?: string;

    @Expose()
    @Type(() => String)
    @IsString(withError(USER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    phone_number?: string;

    @Expose()
    @Type(() => String)
    @IsString(withError(USER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    iban?: string;

    @Expose()
    @Type(() => CreateAddressDTO)
    @ValidateNested()
    @IsOptional()
    home_address?: CreateAddressDTO;

    @Expose()
    @Type(() => CreateAddressDTO)
    @ValidateNested()
    @IsOptional()
    billing_address?: CreateAddressDTO;
}