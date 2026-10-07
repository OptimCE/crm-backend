import { validate, type ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AppError } from "../middlewares/error.middleware.js";
import { GLOBAL_ERRORS, LocalError } from "../errors/errors.js";

/** The field whose constraint validateDto reports. */
interface FailingField {
  /** `title`, or the path of a nested field: `member.name`, `iterations[1].consumers[0].name`. */
  path: string | undefined;
  value: unknown;
  constraints: Record<string, string>;
}

/**
 * Appends a property to the path of the object holding it, the way class-validator prints
 * paths: `member` + `name` -> `member.name`, and an array index `items` + `1` -> `items[1]`.
 * @param parentPath - Path of the holding object; undefined at the top level.
 * @param property - The property, undefined on class-validator's "unknown value" error.
 * @returns The property's path.
 */
const propertyPath = (parentPath: string | undefined, property: string | undefined): string | undefined => {
  if (parentPath === undefined) return property;
  if (property === undefined) return parentPath;
  return /^\d+$/.test(property) ? `${parentPath}[${property}]` : `${parentPath}.${property}`;
};

/**
 * Finds the first error that carries constraints of its own, depth-first and in declaration order.
 * A `@ValidateNested()` property reports its child's failures under `children` and has no
 * `constraints` itself, so the top-level errors alone do not say which field failed. An error's
 * own constraints are taken before its children's, so a failing top-level field is reported
 * exactly as before.
 * @param errors - Sibling validation errors, in declaration order.
 * @param parentPath - Path of the object holding them; undefined at the top level.
 * @returns The failing field, or undefined if no error carries constraints.
 */
const firstFailingField = (errors: ValidationError[], parentPath?: string): FailingField | undefined => {
  for (const error of errors) {
    const path = propertyPath(parentPath, error.property);
    if (error.constraints && Object.keys(error.constraints).length > 0) {
      return { path, value: error.value, constraints: error.constraints };
    }
    const nested = firstFailingField(error.children ?? [], path);
    if (nested) return nested;
  }
  return undefined;
};

/**
 * Validates a plain object against a DTO class using class-validator.
 * Transforms the object to an instance of the DTO class before validation.
 * The first failing field is reported, including one inside a `@ValidateNested()` property.
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
    const failing = firstFailingField(errors);

    if (failing) {
      const msg = Object.values(failing.constraints)[0];

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
          failing.path, // <--- Pass the field name (its path when nested, e.g. "member.home_address.street")
          failing.value, // <--- Pass the value
        ),
        422,
      );
    }

    // Not expected: class-validator drops errors that have neither constraints nor children.
    throw new AppError(GLOBAL_ERRORS.EXCEPTION, 422);
  }

  return output;
};
