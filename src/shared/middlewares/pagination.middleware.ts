import type { NextFunction } from "express";
import type { Request } from "express";
import type { Response } from "express";
export interface PaginationReceive {
  page: number;
  limit: number;
  offset: number;
}
export const DEFAULT_ELEMENT_BY_PAGE = 10;
/**
 * Middleware for handling pagination in Express routes
 * Extracts and processes pagination parameters from requests
 */
export class PaginationMiddleware {
  /** Default number of elements per page */
  elementByPage = DEFAULT_ELEMENT_BY_PAGE;

  /**
   * Creates a new PaginationMiddleware instance
   * @param elementByPage - Number of elements to display per page
   */
  constructor(elementByPage: number) {
    this.elementByPage = elementByPage;
    this.paginationMiddleware = this.paginationMiddleware.bind(this);
  }

  /**
   * Express middleware function that processes pagination parameters
   * @param req - Express request object
   * @param _res - Express response object
   * @param next - Express next function
   */
  paginationMiddleware(req: Request, _res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || this.elementByPage;
    const offset = (page - 1) * limit;

    req.pagination = { page, limit, offset };
    next();
  }
}
