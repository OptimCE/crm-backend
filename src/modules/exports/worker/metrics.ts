import { metrics } from "@opentelemetry/api";

/**
 * The worker's OpenTelemetry counters. With remote logging on, the SDK exports them by OTLP
 * (OTEL_METRICS_EXPORTER defaults to otlp); otherwise they are no-ops. The platform admin's
 * alert on failed exports reads `export_jobs_failed_total`.
 */
export interface ExportWorkerMetrics {
  failed(reason: string, service?: string): void;
  ready(): void;
}

export function otelExportMetrics(): ExportWorkerMetrics {
  const meter = metrics.getMeter("crm-export-worker");
  const failed = meter.createCounter("export_jobs_failed_total", { description: "Data exports that ended failed, by error code and service" });
  const ready = meter.createCounter("export_jobs_ready_total", { description: "Data exports whose archive was written" });
  return {
    failed: (reason, service) => failed.add(1, { reason, service: service ?? "none" }),
    ready: () => ready.add(1),
  };
}

/** Counts in memory: for tests. */
export class RecordingExportMetrics implements ExportWorkerMetrics {
  readonly failures: { reason: string; service?: string }[] = [];
  readyCount = 0;

  failed(reason: string, service?: string): void {
    this.failures.push({ reason, service });
  }

  ready(): void {
    this.readyCount++;
  }
}
