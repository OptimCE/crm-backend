import { PaginationQuery, type Sort } from "../../../shared/dtos/query.dtos.js";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, Validate, ValidateNested } from "class-validator";
import { Expose, Type } from "class-transformer";
import { AreConsumersSumOneConstraint, AreIterationsSumOneConstraint } from "../shared/validator.dtos.js";
import { KEY_ERRORS } from "../shared/key.errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";

/**
 * DTO for querying keys with pagination and filtering.
 */
export class KeyPartialQuery extends PaginationQuery {
    /**
     * Filter by description.
     */
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    description?: string;

    /**
     * Filter by name.
     */
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsOptional()
    name?: string;

    /**
     * Sort by name.
     */
    @IsIn(['ASC', 'DESC'], withError(KEY_ERRORS.GENERIC_VALIDATION.SORT))
    @IsOptional()
    sort_name?: Sort;
}


/**
 * Partial DTO representing a key (summary view).
 */
export class KeyPartialDTO {
    /**
     * Unique ID of the key.
     */
    @Expose()
    id!: number;
    /**
     * Name of the key.
     */
    @Expose()
    name!: string;
    /**
     * Description of the key.
     */
    @Expose()
    description!: string;
}
/**
 * DTO representing a consumer within an iteration.
 */
export class ConsumerDTO {
    /**
     * Unique ID of the consumer.
     */
    @Expose()
    id!: number;
    /**
     * Name of the consumer.
     */
    @Expose()
    name!: string;
    /**
     * Energy allocated to this consumer (percentage or value).
     */
    @Expose()
    energy_allocated_percentage!: number;
}
/**
 * DTO representing an iteration of the key distribution.
 */
export class IterationDTO {
    /**
     * Unique ID of the iteration.
     */
    @Expose()
    id!: number;
    /**
     * Iteration number (sequence).
     */
    @Expose()
    number!: number;
    /**
     * Total energy allocated in this iteration.
     */
    @Expose()
    energy_allocated_percentage!: number;
    /**
     * List of consumers in this iteration.
     */
    @Expose()
    consumers!: ConsumerDTO[];
}
/**
 * Full DTO representing a key, including its iterations.
 */
export class KeyDTO extends KeyPartialDTO {
    /**
     * List of iterations defined for this key.
     */
    @Expose()
    iterations!: IterationDTO[];
}


/**
 * DTO for creating a new consumer.
 */
export class CreateConsumerDTO {
    /**
     * Name of the consumer.
     */
    @Expose()
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    name!: string;

    /**
     * Energy allocated.
     * Range: -1 (PRORATA) to 1 (100%).
     */
    @Expose()
    @Type(() => Number)
    @Min(-1, withError(KEY_ERRORS.VALIDATION.CREATE_CONSUMER.ENERGY_ALLOCATED_PERCENTAGE_MIN_MINUS_1))
    @Max(1, withError(KEY_ERRORS.VALIDATION.CREATE_CONSUMER.ENERGY_ALLOCATED_PERCENTAGE_MAX_1))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    energy_allocated_percentage!: number;
}

/**
 * DTO for creating a new iteration.
 */
export class CreateIterationDTO {
    /**
     * Iteration number (0, 1, or 2).
     */
    @Expose()
    @Type(() => Number)
    @Min(0, withError(KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MIN_0))
    @Max(2, withError(KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MAX_2))
    @IsInt(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    number!: number;

    /**
     * Total energy percentage for this iteration.
     */
    @Expose()
    @Type(() => Number)
    @Min(0, withError(KEY_ERRORS.VALIDATION.CREATE_ITERATION.ENERGY_ALLOCATED_PERCENTAGE_MIN_0))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    energy_allocated_percentage!: number;

    /**
     * List of consumers.
     * Must adhere to sum constraints.
     */
    @Expose()
    @Type(() => CreateConsumerDTO)
    @ValidateNested({ each: true })
    @Validate(AreConsumersSumOneConstraint, ['energy_allocated_percentage'], withError(KEY_ERRORS.VALIDATION.CREATE_ITERATION.CONSUMER_SUM_1))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    consumers!: CreateConsumerDTO[];
}

/**
 * DTO for creating a new key.
 */
export class CreateKeyDTO {
    /**
     * Name of the key.
     */
    @Expose()
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    name!: string;

    /**
     * Description of the key.
     */
    @Expose()
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    description!: string;

    /**
     * Iterations for the key.
     * Must sum up correctly.
     */
    @Expose()
    @Type(() => CreateIterationDTO)
    @ValidateNested({ each: true })
    @Validate(AreIterationsSumOneConstraint, ['energy_allocated_percentage'], withError(KEY_ERRORS.VALIDATION.CREATE_KEY.ITERATION_SUM_1))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    iterations!: CreateIterationDTO[];
}

/**
 * DTO for updating an existing key.
 */
export class UpdateKeyDTO {
    /**
     * ID of the key to update.
     */
    @Expose()
    @Type(() => Number)
    @IsInt(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    id!: number;
    /**
     * New name.
     */
    @Expose()
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    name!: string;
    /**
     * New description.
     */
    @Expose()
    @Type(() => String)
    @IsString(withError(KEY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    description!: string;
    /**
     * New iterations configuration.
     */
    @Expose()
    @Type(() => CreateIterationDTO)
    @ValidateNested({ each: true })
    @Validate(AreIterationsSumOneConstraint, ['energy_allocated_percentage'], withError(KEY_ERRORS.VALIDATION.UPDATE_KEY.ITERATION_SUM_1))
    @IsNotEmpty(withError(KEY_ERRORS.GENERIC_VALIDATION.EMPTY))
    iterations!: CreateIterationDTO[];
}