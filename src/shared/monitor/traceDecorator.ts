import type { Request, Response, NextFunction } from "express";
import { context, SpanStatusCode, propagation, type Span } from "@opentelemetry/api";
import { TracerUtility } from "./tracer.utility.js";
import logger from "./logger.js";

/**
 * Utility class for adding OpenTelemetry tracing to Express routes
 */
class TraceDecorator {
  private readonly tracingUtility: TracerUtility;

  /**
   * Creates a new TraceDecorator instance
   * @param {string} tracerName - The name to use for the tracer
   */
  constructor(tracerName: string) {
    this.tracingUtility = new TracerUtility(tracerName);
  }

  /**
   * Injects tracing headers into the provided headers object
   * @param headers - The headers object to inject into
   * @returns The headers with tracing information added
   */
  injectTracingHeaders(headers = {}): Record<string, unknown> {
    const carrier = {};
    propagation.inject(context.active(), carrier);
    return { ...headers, ...carrier };
  }

  /**
   * Creates a decorator that wraps a route handler with tracing functionality
   * @param spanName - The name of the span to create
   * @param spanAttributes - Additional attributes to add to the span
   * @returns A decorator function for route handlers
   */
  traceSpan(spanName: string, spanAttributes: Record<string, string> = {}) {
    const tracingUtility = this.tracingUtility;

    return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
      const originalMethod = descriptor.value;

      descriptor.value = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
        const extractedContext = propagation.extract(context.active(), req.headers);
        await tracingUtility.startActiveSpanReq(spanName, req, spanAttributes, extractedContext, async (span: Span) => {
          if (!res.locals.patched) {
            const originalStatus = res.status.bind(res);
            res.status = (code: number): Response => {
              span.setAttribute("http.status_code", code);
              res.locals.statusCode = code;
              return originalStatus(code);
            };
            res.locals.patched = true;
          }
          try {
            await originalMethod.apply(this, [req, res, next, span]);
            span.setStatus({ code: SpanStatusCode.OK });
          } catch (e) {
            span.recordException(e as Error);
            logger.error("(" + spanName + ")Exception : " + e);
            next(e);
          } finally {
            if (res.locals.statusCode >= 400) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
          }
        });
      };
    };
  }
}

export default TraceDecorator;
