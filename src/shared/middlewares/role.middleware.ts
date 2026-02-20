import { type Role, ROLE_HIERARCHY } from "../dtos/role.js";
import type { Request } from "express";
import type { Response } from "express";
import type { NextFunction } from "express";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import logger from "../monitor/logger.js";
import { AppError } from "./error.middleware.js";
import { getContext } from "./context.js";
/**
 * Creates a middleware function that checks if the user has sufficient role privileges
 * @param allowedRole - The minimum role level required to access the resource
 * @returns Express middleware function that checks user role
 */
export function roleChecker(allowedRole: Role): (req: Request, res: Response, next: NextFunction) => void {
  /**
   * Express middleware that verifies user role against required role
   * @param _req - Express request object (unused)
   * @param _res - Express response object (unused)
   * @param next - Express next function
   */
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const { role } = getContext();
    if (!role) {
      logger.error("Role missing");
      throw new AppError(GLOBAL_ERRORS.AUTHORIZATION_MISSING, 401);
    }
    const hierarchy = ROLE_HIERARCHY[role];
    const hierarchyAllowed = ROLE_HIERARCHY[allowedRole];
    if (hierarchy >= hierarchyAllowed) {
      next();
    } else {
      logger.error("Role Insufficient");
      throw new AppError(GLOBAL_ERRORS.UNAUTHORIZED, 403);
    }
  };
}
