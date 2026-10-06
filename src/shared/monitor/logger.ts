import config from "config";
import pino from "pino";
import pretty from "pino-pretty";
import { context, trace } from "@opentelemetry/api";
import { getContext } from "../middlewares/context.js";

/**
 * Initializes a Pino logger with OpenTelemetry integration
 * @param serviceName - The name of the service to be used in logs
 * @returns Configured Pino logger instance
 */

function initLogger(serviceName: string): pino.Logger {
  const options: pino.LoggerOptions = {
    // ✅ NEW: The Mixin injects context into EVERY log automatically
    mixin: () => {
      const ctx = getContext();
      // Returns an object that is merged into the final log JSON
      return {
        user_id: ctx.user_id,
        community_id: ctx.community_id,
        role: ctx.role,
        source_ip: ctx.source_ip,
      };
    },
    // You can remove the 'user' serializer now, as it's handled by the mixin
    serializers: {
      request: (request: unknown) => {
        return {
          object: request,
        };
      },
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
  };

  // Tests write through an in-process, synchronous stream, never a transport.
  // Jest re-evaluates this module for every test file, and a transport runs in a
  // worker thread that nothing closes: one leaked thread (plus a 4 MB buffer) per
  // suite, and thread-stream's READY handshake can miss its snapshot under load,
  // leaving the worker ref'd so the jest process never exits.
  if (process.env.NODE_ENV === "test") {
    return pino(options, pretty({ colorize: true, sync: true }));
  }

  const targets: pino.TransportTargetOptions[] = [
    {
      target: "pino-pretty",
      level: "info",
      options: { colorize: true },
    },
  ];
  if (config.get("remote_logging.status") && config.get("remote_logging.status") === "true") {
    targets.push({
      target: "pino-opentelemetry-transport",
      options: {
        resourceAttributes: {
          "service.name": serviceName,
        },
        endpoint: config.get("remote_logging.opentelemetry.exporterEndpoint"),
        includeTraceContext: true,
      },
    });
  }

  return pino({
    ...options,
    transport: {
      targets,
    },
  });
}

/**
 * Configured Pino logger instance for the application
 * @type {pino.Logger}
 */
const logger: pino.Logger = initLogger(config.get("microservice_name"));

export default logger;
