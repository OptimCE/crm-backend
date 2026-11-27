import config from "config";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

/**
 * The worker's OpenTelemetry: traces and (by the SDK's default, OTLP) the counters of
 * metrics.ts, when remote logging is on. Unlike shared/monitor/tracer.ts it installs no SIGTERM
 * handler of its own: that one exits the process as soon as the SDK is flushed, which would cut
 * the worker's own shutdown (handing an assembly back) short. The entry point shuts it down last.
 */
export function startWorkerTelemetry(serviceName: string): { shutdown(): Promise<void> } {
  if (config.get("remote_logging.status") !== "true") return { shutdown: async () => undefined };
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({}),
    instrumentations: [getNodeAutoInstrumentations()],
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
  });
  sdk.start();
  return { shutdown: () => sdk.shutdown().catch(() => undefined) };
}
