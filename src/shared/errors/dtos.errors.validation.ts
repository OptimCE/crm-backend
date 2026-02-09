import {LocalError} from "./errors.js";
import {ValidationArguments, ValidationOptions} from "class-validator";

export const withError = (errorBase: LocalError, options?: ValidationOptions): ValidationOptions => {
    return {
        ...options,
        message: (args: ValidationArguments) => {

            const dynamicError = {
                ...errorBase,
                field: args.property || '/',
                value: args.value
            };

            return JSON.stringify(dynamicError);
        }
    };
};