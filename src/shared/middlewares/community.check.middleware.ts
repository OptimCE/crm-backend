import logger from "../monitor/logger.js";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { AppError } from "./error.middleware.js";
import type { Request } from "express";
import type { Response } from "express";
import type { NextFunction } from "express";
import { getContext } from "./context.js";

/**
 * Middleware factory that creates a middleware to check if a community ID is present
 * Used to ensure that routes requiring a community context have a valid community ID
 * @returns Express middleware function that validates the community_id property
 * @throws AppError If community_id is not valid (undefined)
 */
export function communityIdChecker(): (_req: Request, _res: Response, next: NextFunction) => void {
  /**
   * Express middleware that checks for a valid community ID
   * @param _req - Express request object (unused)
   * @param _res - Express response object (unused)
   * @param next - Express next function
   * @throws AppError If community_id is not valid
   */
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const context = getContext();
    if (context.community_id !== undefined) {
      next();
    } else {
      logger.error("Authorization missing");
      throw new AppError(GLOBAL_ERRORS.AUTHORIZATION_MISSING, 400);
    }
  };
}
