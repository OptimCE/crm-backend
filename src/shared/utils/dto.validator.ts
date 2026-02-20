import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AppError } from "../middlewares/error.middleware.js";
import { GLOBAL_ERRORS, LocalError } from "../errors/errors.js";

/**
 * Validates a plain object against a DTO class using class-validator.
 * Transforms the object to an instance of the DTO class before validation.
 * @template T - The DTO class type.
 * @param DtoClass - The constructor of the DTO class.
 * @param body - The plain object to validate.
 * @returns A promise resolving to the typed DTO instance if valid.
 * @throws AppError if validation fails (422 Unprocessable Entity).
 */
export const validateDto = async <T extends object>(DtoClass: { new (): T }, body: unknown): Promise<T> => {
  const output = plainToInstance(DtoClass, body);
  const errors = await validate(output);
  if (errors.length > 0) {
    const firstError = errors[0];
    const constraints = firstError.constraints;

    if (constraints) {
      const msg = Object.values(constraints)[0];

      // 1. Try to parse as JSON (Success case from 'withError')
      try {
        const parsed = JSON.parse(msg);
        if (parsed.errorCode && parsed.message) {
          throw new AppError(parsed as LocalError, 422);
        }
      } catch (e) {
        // If the error we just threw is caught, re-throw it up the chain
        if (e instanceof AppError) throw e;
        // Otherwise, it was a JSON syntax error; proceed to fallback
      }

      // 2. Fallback: Standard class-validator error (e.g. "email must be an email")
      throw new AppError(
        new LocalError(
          GLOBAL_ERRORS.EXCEPTION.errorCode,
          msg,
          firstError.property, // <--- Pass the field name
          firstError.value, // <--- Pass the value
        ),
        422,
      );
    }

    // Fallback for weird edge cases (like nested validation failures without constraints)
    throw new AppError(GLOBAL_ERRORS.EXCEPTION, 422);
  }

  return output;
};
