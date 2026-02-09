import logger from "../monitor/logger.js";
import {AppError} from "./error.middleware.js";
import {GLOBAL_ERRORS} from "../errors/errors.js";
import type { Request } from 'express';
import type {Response} from 'express'
import type { NextFunction } from "express";
import {getContext} from "./context.js";
/**
 * Middleware factory that creates a middleware to check if a user ID is present
 * @returns Express middleware function that validates the userId property
 * @throws AppError if userId is not valid (undefined)
 */
export function idChecker() {
    return (req: Request, _res: Response, next: NextFunction) => {
        const {user_id} = getContext();
        if (user_id !== undefined) {
            next();
        } else {
            logger.error("Authentification missing");
            throw new AppError(GLOBAL_ERRORS.UNAUTHENTICATED, 400);
        }
    };
}
