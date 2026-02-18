import xss from "xss";
import type { Request, Response, NextFunction } from "express";

/**
 * Recursively sanitizes data
 */
function xss_object(data: any): any {
  if (data === null) return null;

  if (Array.isArray(data)) {
    return data.map((item) => xss_object(item));
  }

  if (typeof data === "object") {
    const newObject: any = {};
    for (const key in data) {
      // SECURITY: Skip dangerous keys to prevent Prototype Pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObject[key] = xss_object(data[key]);
      }
    }
    return newObject;
  }

  if (typeof data === "string") {
    return xss(data);
  }

  return data;
}

/**
 * Middleware that attempts to sanitize request bodies against XSS attacks.
 * Skips multipart/form-data requests.
 * Recursively sanitizes strings in the request body for POST/PUT/PATCH methods.
 * @param req - Express request
 * @param _res - Express response
 * @param next - Express next function
 */
export function xss_middleware(req: Request, _res: Response, next: NextFunction) {
  const contentType = req.headers["content-type"];
  // Skip multipart (file uploads) to avoid corrupting binary streams / Multipart form-data are being check properly on routes
  if (contentType && contentType.includes("multipart/form-data")) {
    return next();
  }
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
    req.body = xss_object(req.body);
  }
  next();
}
