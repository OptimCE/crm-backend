import { context, propagation, SpanStatusCode, trace, type Tracer, type Context, type Span } from "@opentelemetry/api";
import logger from "./logger.js";
import { ApiResponse } from "../dtos/ApiResponses.js";
import type { Request } from "express";
import type { Response } from "express";
/**
 * Utility class for working with OpenTelemetry traces
 */
export class TracerUtility {
  private tracer: Tracer;

  /**
   * Creates a new TracerUtility instance
   * @param {string} tracerName - The name to use for the tracer
   */
  constructor(tracerName: string) {
    this.tracer = trace.getTracer(tracerName);
  }

  /**
   * Injects tracing headers into the provided headers object
   * @param headers - The headers object to inject into
   * @returns The headers with tracing information added
   */
  injectTracingHeaders(headers = {}) {
    const carrier = {};
    propagation.inject(context.active(), carrier);
    return { ...headers, ...carrier };
  }

  /**
   * Starts a new span
   * @param  spanName - The name of the span to create
   * @param spanAttributes - Additional attributes to add to the span
   * @param headers - Headers containing context information
   * @returns The created span
   */
  startSpan(spanName: string, spanAttributes: any = {}, headers: any = {}) {
    const extractedContext = propagation.extract(context.active(), headers);
    const span = this.tracer.startSpan(spanName, spanAttributes, extractedContext);
    //@ts-expect-error: 'value' may be unknown
    Object.entries(spanAttributes).forEach(([key, value]) => span.setAttribute(key, value));
    return span;
  }

  /**
   * Starts a new span for a request
   * @param spanName - The name of the span to create
   * @param req - The request object
   * @param spanAttributes - Additional attributes to add to the span
   * @returns The created span
   */
  startSpanReq(spanName: string, req: Request, spanAttributes: any = {}) {
    const span = this.tracer.startSpan(spanName);
    span.setAttribute("http.method", req.method);
    //@ts-expect-error: 'value' may be unknown
    Object.entries(spanAttributes).forEach(([key, value]) => span.setAttribute(key, value));
    return span;
  }

  /**
   * Starts a new active span for a request and executes a function within its context
   * @template T - The return type of the function
   * @param spanName - The name of the span to create
   * @param req - The request object
   * @param spanAttributes - Additional attributes to add to the span
   * @param context - The context to use for the span
   * @param fn - The function to execute within the span's context
   * @returns The result of the function execution
   */
  startActiveSpanReq<T>(spanName: string, req: Request, spanAttributes: any, context: Context, fn: (span: Span) => Promise<T>): Promise<T> {
    return this.tracer.startActiveSpan(spanName, { attributes: spanAttributes }, context, async (span) => {
      span.setAttribute("http.method", req.method);
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    });
  }

  /**
   * Starts a new active span and executes a function within its context
   * @template T - The return type of the function
   * @param spanName - The name of the span to create
   * @param spanAttributes - Additional attributes to add to the span
   * @param header - Headers containing context information
   * @param fn - The function to execute within the span's context
   * @returns The result of the function execution
   */
  startActiveSpan<T>(spanName: string, spanAttributes: any, header: any, fn: (span: Span) => Promise<T>): Promise<T> {
    const ctx = propagation.extract(context.active(), header);
    return this.tracer.startActiveSpan(spanName, { attributes: spanAttributes }, ctx, async (span) => {
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    });
  }

  /**
   * Handles an exception and updates the span accordingly
   * @param res - The Express response object
   * @param span - The span to update
   * @param e - The exception that occurred
   * @param errorReturned - The error to return in the response
   * @param operationName - The operation name
   * @param errorStatusCode - The HTTP status code to use for the error response (default: 400)
   */
  handleException(res: Response, span: Span, e: Error, errorReturned: number, operationName: string, errorStatusCode = 400) {
    logger.error(`(${operationName}) Error: ` + e);
    span.recordException(e);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.setAttribute("http.status_code", errorStatusCode);
    res.status(errorStatusCode).json(new ApiResponse("Error", errorReturned));
    span.end();
  }
}
