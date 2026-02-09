import pino from "pino";
import { context, trace } from "@opentelemetry/api";
import config from "config";
import {getContext} from "../middlewares/context.js";

/**
 * Initializes a Pino logger with OpenTelemetry integration
 * @param serviceName - The name of the service to be used in logs
 * @returns Configured Pino logger instance
 */
function initLogger(serviceName: string): pino.Logger {
  const targets: any = [
    {
      target: "pino-pretty",
      level: "info",
      options: { colorize: true },
    },
  ];
  if (process.env.REMOTE_LOGGING && process.env.REMOTE_LOGGING === "true") {
    targets.push({
      target: "pino-opentelemetry-transport",
      options: {
        resourceAttributes: {
          "service.name": serviceName,
        },
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://192.168.190.128:4318",
        includeTraceContext: true,
      },
    });
  }

  return pino({
    // ✅ NEW: The Mixin injects context into EVERY log automatically
    mixin: () => {
      const ctx = getContext();
      // Returns an object that is merged into the final log JSON
      return {
        user_id: ctx.user_id,
        community_id: ctx.community_id,
        role: ctx.role,
        source_ip: ctx.source_ip
      };
    },
    // You can remove the 'user' serializer now, as it's handled by the mixin
    serializers: {
      request: (request: any) => {
        return {
          object: request,
        };
      },
    },
    transport: {
      targets,
    },
    formatters: {
      log: (log) => {
        const currentSpan = trace.getSpan(context.active());
        if (currentSpan) {
          const { traceId, spanId, traceFlags } = currentSpan.spanContext();
          log.trace_id = traceId;
          log.span_id = spanId;
          log.trace_flags = traceFlags;
        }
        return log;
      },
    },
  });
}

/**
 * Configured Pino logger instance for the application
 * @type {pino.Logger}
 */
const logger: pino.Logger = initLogger(config.get("microservice_name"));

export default logger;
