import type { Request, Response, NextFunction } from "express";
import { GLOBAL_ERRORS, type LocalError } from "../errors/errors.js";
import logger from "../monitor/logger.js";
import * as myRes from "../dtos/ApiResponses.js";
interface HttpErrorResponse {
  response?: {
    status?: number;
    data?: {
      error_code?: number;
      data?: string;
    };
  };
  field?: string;
  value?: unknown;
  stack?: string;
}
/**
 * Custom application error class that extends the standard Error
 * Includes additional properties for HTTP status code and application error code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number;
  public readonly field?: string;
  public readonly value?: unknown;
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
  toJSON(): Record<string, unknown> {
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
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  const appError = err instanceof AppError ? err : null;
  const httpErr = err as HttpErrorResponse;

  let statusCode: number = 500;
  let errorCode: number = GLOBAL_ERRORS.EXCEPTION.errorCode;
  let message: string = GLOBAL_ERRORS.EXCEPTION.message;

  if (appError || (err as { constructor: { name: string } }).constructor?.name === "AppError") {
    const e = err as AppError;
    statusCode = e.statusCode;
    errorCode = e.errorCode;
    message = req.t(e.message, {
      field: e.field ?? "Field",
      value: e.value,
    });
  } else {
    let find = false;
    const responseData = httpErr.response?.data;
    if (responseData?.error_code && responseData?.data) {
      message = responseData.data;
      errorCode = responseData.error_code;
      statusCode = httpErr.response?.status ?? 500;
      find = true;
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
    field: httpErr.field,
    stack: httpErr.stack,
    path: req.path,
  });

  res.status(statusCode).json(new myRes.ApiResponse(message, errorCode));
};
