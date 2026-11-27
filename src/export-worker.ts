import "reflect-metadata";
import config from "config";
import type { IAuditLogService } from "./modules/audit_log/domain/i-audit-log.service.js";
import type { INotificationService } from "./modules/notifications/domain/i-notification.service.js";
import { startWorkerTelemetry } from "./modules/exports/worker/telemetry.js";

// Before anything that should be traced is loaded.
const telemetry = startWorkerTelemetry(config.get("microservice_name"));

const { connect } = await import("nats");
(await import("./container/export-worker.binding.js")).bindExportWorker();
const { container } = await import("./container/di-container.js");
const { AppDataSource } = await import("./shared/database/database.connector.js");
const { default: logger } = await import("./shared/monitor/logger.js");
const { natsPartPublisher } = await import("./shared/export/kit/consumer.js");
const { exportStorageSettingsFromEnv } = await import("./shared/export/kit/s3-part-store.js");
const { ExportOrchestrator } = await import("./modules/exports/worker/orchestrator.js");
const { ExportWorkerRepository } = await import("./modules/exports/worker/worker.repository.js");
const { ExportWorkerNotifier } = await import("./modules/exports/worker/notifier.js");
const { S3ExportObjectStore } = await import("./modules/exports/worker/object-store.js");
const { otelExportMetrics } = await import("./modules/exports/worker/metrics.js");
const { runExportWorker, sleep } = await import("./modules/exports/worker/run-worker.js");
const { loadExportWorkerSettings } = await import("./modules/exports/worker/worker.settings.js");

/**
 * crm-export-worker: a third entrypoint of the crm-backend image, run as its own container. It
 * orchestrates the data exports (modules/exports/worker): it keeps the API free of ZIP assembly
 * and of the expiry job. It binds only the audit log and the notifications
 * (container/export-worker.binding.ts), not the API's adapters and their credentials.
 */
const settings = loadExportWorkerSettings();
const controller = new AbortController();
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    logger.info({ operation: "export_worker:stop", signal }, "Export worker stopping");
    controller.abort();
  });
}

await AppDataSource.initialize();
const store = new S3ExportObjectStore({ ...exportStorageSettingsFromEnv(), bucket: settings.bucket });
const repository = new ExportWorkerRepository(AppDataSource);

let nc: Awaited<ReturnType<typeof connect>> | undefined;
while (!controller.signal.aborted && !nc) {
  try {
    nc = await connect({ servers: settings.natsUrl, name: "crm-export-worker", maxReconnectAttempts: -1 });
  } catch (err) {
    logger.warn({ operation: "export_worker:nats_connect", error: (err as Error).message }, "NATS not reachable; retrying");
    await sleep(5_000, controller.signal);
  }
}

try {
  if (nc) {
    const orchestrator = new ExportOrchestrator({
      repository,
      bus: natsPartPublisher(nc),
      store,
      notifier: new ExportWorkerNotifier(container.get<INotificationService>("NotificationService"), (id, qr) => repository.communityName(id, qr)),
      audit: container.get<IAuditLogService>("AuditLogService"),
      metrics: otelExportMetrics(),
      logger,
      settings,
    });
    await runExportWorker({ nc, orchestrator, logger, signal: controller.signal, tickMs: settings.tickMs, heartbeatFile: settings.heartbeatFile });
  }
} finally {
  await nc?.drain().catch(() => undefined);
  store.destroy();
  await AppDataSource.destroy();
  await telemetry.shutdown();
}
logger.info({ operation: "export_worker:stopped" }, "Export worker stopped");
process.exit(0);
