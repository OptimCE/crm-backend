/* eslint-disable no-console */
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
/**
 * Initializes the OpenTelemetry SDK for tracing
 * @param serviceName - The name of the service to be used in traces
 * @returns Object containing the initialized SDK
 */
const init = function (serviceName: string): { sdk: NodeSDK | undefined } {
  let sdk: NodeSDK | undefined;

  if (process.env.REMOTE_LOGGING && process.env.REMOTE_LOGGING === "true") {
    const traceExporter = new OTLPTraceExporter({});

    sdk = new NodeSDK({
      traceExporter,
      instrumentations: [new HttpInstrumentation(), ...getNodeAutoInstrumentations()],
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
      }),
    });

    sdk.start();

    process.on("SIGTERM", () => {
      sdk!
        .shutdown()
        .then(
          () => console.log("SDK shut down successfully"),
          (err) => console.log("Error shutting down SDK", err),
        )
        .finally(() => process.exit(0));
    });
  } else {
    console.log("No remote logging");
  }

  return { sdk };
};

export default init;
