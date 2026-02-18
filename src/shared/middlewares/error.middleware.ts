import type { Request, Response, NextFunction } from "express";
import { GLOBAL_ERRORS, LocalError } from "../errors/errors.js";
import logger from "../monitor/logger.js";
import * as myRes from "../dtos/ApiResponses.js";

/**
 * Custom application error class that extends the standard Error
 * Includes additional properties for HTTP status code and application error code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number;
  public readonly field?: string;
  public readonly value?: any;
  /**
   * Creates a new AppError instance
   * @param error - LocalError object containing error code and message
   * @param statusCode - HTTP status code to return
   */
  constructor(error: LocalError, statusCode: number) {
    super(error.message);
    this.statusCode = statusCode;
    this.errorCode = error.errorCode;
    this.field = error.field;
    this.value = error.value;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serializes the error to a JSON object
   * @returns Object containing statusCode, errorCode, and message
   */
  toJSON() {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      field: this.field, // Optional: Include in JSON if you want frontend to see it
    };
  }
}

/**
 * Express error handling middleware
 * Processes errors and sends a standardized error response
 *
 * @param err - Error object to handle
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next middleware function
 * @returns void - Sends error response to client
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message, errorCode } = err;
  if (err instanceof AppError || err.constructor.name === "AppError") {
    const interpolation = {
      field: err.field || "Field", // Fallback if undefined
      value: err.value,
    };

    // req.t will look for {{field}} in your translation string and replace it
    message = req.t(message, interpolation);
  } else {
    let find = false;
    if (err.response) {
      if (err.response.data) {
        const errorData = err.response.data;
        if (errorData && errorData.error_code && errorData.data) {
          message = errorData.data;
          errorCode = errorData.error_code;
          statusCode = err.response.status;
          find = true;
        }
      }
    }
    if (!find) {
      statusCode = 500;
      message = req.t(GLOBAL_ERRORS.EXCEPTION.message);
      errorCode = GLOBAL_ERRORS.EXCEPTION.errorCode;
    }
  }
  logger.error({
    message,
    errorCode,
    statusCode,
    field: err.field,
    stack: err.stack,
    path: req.path,
  });
  res.status(statusCode).json(new myRes.ApiResponse(message, errorCode));
};
