import config from "config";
import type { NextFunction, Request, Response } from "express";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import logger from "../monitor/logger.js";
import { AppError } from "./error.middleware.js";
import { getContext } from "./context.js";

/**
 * Restricts a route to the platform operators listed under `config_key`: the Keycloak user ids
 * (the `x-user-id` the gateway injects) allowed to run it.
 *
 * For operations that act on every community at once, where a community role proves nothing —
 * anyone can create a community and become its ADMIN. An empty or missing list admits nobody,
 * so a deployment that has not named its operators keeps the route closed.
 * @param config_key - Config path of a string array of Keycloak user ids.
 */
export function operatorChecker(config_key: string): (req: Request, res: Response, next: NextFunction) => void {
  const operators = new Set<string>(config.has(config_key) ? config.get<string[]>(config_key) : []);

  return (_req: Request, _res: Response, next: NextFunction): void => {
    const { user_id } = getContext();
    if (!user_id || !operators.has(user_id)) {
      logger.warn({ user_id, config_key }, "Not a platform operator for this route");
      throw new AppError(GLOBAL_ERRORS.UNAUTHORIZED, 403);
    }
    next();
  };
}
