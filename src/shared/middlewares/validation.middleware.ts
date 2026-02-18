import { validationResult } from "express-validator";
import { GLOBAL_ERRORS, LocalError } from "../errors/errors.js";
import { AppError } from "./error.middleware.js";
import logger from "../monitor/logger.js";
import type { Request } from "express";
import type { Response } from "express";
import type { NextFunction } from "express";
/**
 * Middleware that validates request data using express-validator
 * Processes validation errors and converts them to AppError format
 * @param req - The Express request object containing validation results
 * @param _res - The Express response object (unused)
 * @param next - The next middleware function
 * @throws AppError If validation fails
 */
export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const firstError = errors.array()[0];
  let error: any;
  try {
    if (firstError.msg instanceof LocalError) {
      error = new AppError(firstError.msg, 422);
    } else {
      const parsedError = JSON.parse(firstError.msg);

      if (parsedError && parsedError.errorCode && parsedError.message) {
        error = new AppError(new LocalError(parsedError.errorCode, parsedError.message), parsedError.statusCode);
      } else {
        throw new Error("Invalid error format");
      }
    }
  } catch (e) {
    logger.error(e);
    error = new AppError(GLOBAL_ERRORS.EXCEPTION, 422);
  }
  logger.info({ error }, "Validation failed");
  logger.info({ errors: error }, "Validation failed");
  throw new AppError(error, 422);
};
