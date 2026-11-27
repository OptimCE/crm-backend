import type { NextFunction, Request, Response } from "express";
import type { LocalError } from "../errors/errors.js";
import logger from "../monitor/logger.js";
import { getContext } from "./context.js";
import { AppError } from "./error.middleware.js";

/** A login stamped this far in the future is a clock skew, beyond it a wrong value. */
const MAX_FUTURE_SKEW_SECONDS = 60;

/**
 * Step-up: lets the request through only if the user logged in interactively within
 * `maxAgeSeconds` (the token's `auth_time`, see Context.auth_time). Otherwise answers 401 with
 * `error`, whose code tells the front to send the user through Keycloak with `max_age` and replay
 * the request. A token without `auth_time` (password grant) never passes.
 *
 * Same rule as the signature annexe's `fresh_caller` (signature/api/deps.py).
 */
export function freshAuthChecker(
  maxAgeSeconds: number,
  error: LocalError,
  now: () => number = Date.now,
): (req: Request, res: Response, next: NextFunction) => void {
  if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new Error(`freshAuthChecker needs a positive number of seconds, got ${maxAgeSeconds}`);
  }
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const { auth_time } = getContext();
    const nowSeconds = Math.floor(now() / 1000);
    const age = auth_time === undefined ? undefined : nowSeconds - auth_time;
    if (age === undefined || age > maxAgeSeconds || age < -MAX_FUTURE_SKEW_SECONDS) {
      logger.warn({ operation: "freshAuthChecker", age_seconds: age ?? null, max_age_seconds: maxAgeSeconds }, "Recent login required");
      throw new AppError(error, 401);
    }
    next();
  };
}
