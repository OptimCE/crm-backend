import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";

@ValidatorConstraint({ name: "IterationsValid", async: false })
export class AreIterationsSumOneConstraint implements ValidatorConstraintInterface {
  validate(items: unknown, args: ValidationArguments) {
    if (!items || !Array.isArray(items)) return false;

    let sum = 0;
    for (const item of items) {
      const value = item[args.constraints[0]]; // e.g. 'energy_allocated_percentage'
      sum += value;
    }

    // Logic: Sum must be approx 1
    if (sum >= 0.999 && sum <= 1.001) sum = 1;
    return sum === 1;
  }
  defaultMessage(_args: ValidationArguments) {
    return JSON.stringify(GLOBAL_ERRORS.EXCEPTION);
  }
}

@ValidatorConstraint({ name: "ConsumersValid", async: false })
export class AreConsumersSumOneConstraint implements ValidatorConstraintInterface {
  validate(items: unknown, args: ValidationArguments) {
    if (!items || !Array.isArray(items)) return false;

    let sum = 0;
    let hasProrata = false;

    for (const item of items) {
      const value = item[args.constraints[0]];

      if (value === -1) {
        hasProrata = true;
      } else {
        sum += value;
      }
    }

    // Logic: If NO prorata, sum must be 1. If prorata exists, all good
    if (!hasProrata) {
      if (sum >= 0.999 && sum <= 1.001) sum = 1;
      return sum === 1;
    }

    return true;
  }
  defaultMessage(_args: ValidationArguments) {
    return JSON.stringify(GLOBAL_ERRORS.EXCEPTION);
  }
}
