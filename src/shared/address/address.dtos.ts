import { Expose, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { PartialType } from '@nestjs/mapped-types';
import { withError } from "../errors/dtos.errors.validation.js";
/**
 * DTO for creating a new address.
 */
export class CreateAddressDTO {
    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
    street!: string;

    @Expose()
    @Type(() => Number)
    @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
    number!: number;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
    city!: string;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.EMPTY))
    postcode!: string;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    supplement?: string;
}
/**
 * DTO for updating an existing address.
 * All fields are optional.
 */
export class UpdateAddressDTO {
    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    street?: string;

    @Expose()
    @Type(() => Number)
    @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsOptional()
    number?: number;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    city?: string;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    postcode?: string;

    @Expose()
    @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    supplement?: string;
}
/**
 * DTO representing a full address.
 */
export class AddressDTO {
    @Expose()
    id!: number;
    @Expose()
    street!: string;
    @Expose()
    number!: number;
    @Expose()
    postcode!: string;
    @Expose()
    supplement?: string;
    @Expose()
    city!: string;
}
