import { registerDecorator, type ValidationOptions } from "class-validator";
import { isActiveRegulator, isKnownRegulator } from "./regulator.js";

/**
 * Validates that the value is a currently-active regulator code from the shared
 * registry. Codes are loaded at runtime (not at compile time), so this checks
 * per request via the loader rather than capturing a fixed array the way
 * `@IsIn([...])` does.
 */
export function IsActiveRegulator(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: "isActiveRegulator",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isActiveRegulator(value);
        },
      },
    });
  };
}

/**
 * Validates that the value is any defined regulator code (active or not). Used
 * for read-only contexts such as list filtering, where filtering by a
 * not-yet-active code is still meaningful.
 */
export function IsKnownRegulator(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: "isKnownRegulator",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isKnownRegulator(value);
        },
      },
    });
  };
}
