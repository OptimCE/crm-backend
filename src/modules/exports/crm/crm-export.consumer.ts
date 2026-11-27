import type { ExportHandler } from "../../../shared/export/kit/part-runner.js";
import { runExportConsumer } from "../../../shared/export/kit/consumer.js";
import { exportStorageSettingsFromEnv, S3PartStore } from "../../../shared/export/kit/s3-part-store.js";
import type { ExportNats } from "../../../shared/export/export-nats.js";
import logger from "../../../shared/monitor/logger.js";

/**
 * The `crm` part's listener, inside the API process (contracts/export: a handler lives in its
 * service's existing process). It waits for the export NATS connection in the background and
 * never holds the API up; one part at a time (max_ack_pending 1). Its storage account is
 * export-crm (EXPORT_STORAGE_*): without it the listener does not start, and every export waits
 * for `crm` until the worker's timeout fails it.
 */
export class CrmExportConsumer {
  private readonly controller = new AbortController();
  private running: Promise<void> | undefined;
  private store: S3PartStore | undefined;

  constructor(
    private readonly nats: ExportNats,
    private readonly handler: ExportHandler,
  ) {}

  start(): void {
    if (this.running) return;
    let settings;
    try {
      settings = exportStorageSettingsFromEnv();
    } catch (err) {
      logger.error(
        { operation: "export:crm_consumer_disabled", error: (err as Error).message },
        "crm export part disabled: no export storage account",
      );
      return;
    }
    const store = new S3PartStore(settings);
    this.store = store;
    this.running = (async (): Promise<void> => {
      const nc = await this.nats.whenReady();
      if (!nc || this.controller.signal.aborted) return;
      await runExportConsumer({
        nc,
        service: "crm",
        handler: this.handler,
        store,
        logger,
        signal: this.controller.signal,
        expectedBucket: settings.bucket,
      });
    })().catch((err: unknown) => {
      logger.error({ operation: "export:crm_consumer_stopped", error: (err as Error).message }, "crm export listener stopped");
    });
  }

  /** Stops pulling; a part in progress is nak'ed and redelivered to the next instance. */
  async stop(): Promise<void> {
    this.controller.abort();
    await this.running;
    this.store?.destroy();
  }
}
