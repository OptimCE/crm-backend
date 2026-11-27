import { JSONCodec } from "nats";
import logger from "../../../shared/monitor/logger.js";
import type { ExportNats } from "../../../shared/export/export-nats.js";
import {
  EXPORT_JOB_REQUESTED_SUBJECT,
  EXPORT_SCHEMA_VERSION,
  EXPORTS_STREAM,
  msgIdForJob,
  type ExportJobRequested,
} from "../../../shared/export/kit/contract.js";
import type { IExportJobPublisher } from "../domain/i-export.ports.js";

const codec = JSONCodec<ExportJobRequested>();
const PUBLISH_TIMEOUT_MS = 2_000;

/** `export.job.requested`, with `<exportId>:requested` as Nats-Msg-Id (contracts/export/README.md §3). */
export class NatsExportJobPublisher implements IExportJobPublisher {
  constructor(private readonly nats: ExportNats) {}

  async requested(exportId: string): Promise<boolean> {
    const nc = this.nats.connection();
    if (!nc) {
      logger.warn({ operation: "export:job_requested", export_id: exportId }, "Export: NATS not ready, the worker's sweep will pick the job up");
      return false;
    }
    try {
      await nc.jetstream().publish(EXPORT_JOB_REQUESTED_SUBJECT, codec.encode(jobRequested(exportId)), {
        msgID: msgIdForJob(exportId),
        expect: { streamName: EXPORTS_STREAM },
        timeout: PUBLISH_TIMEOUT_MS,
      });
      return true;
    } catch (err) {
      logger.warn(
        { operation: "export:job_requested", export_id: exportId, error: (err as Error).message },
        "Export: export.job.requested not published, the worker's sweep will pick the job up",
      );
      return false;
    }
  }
}

export function jobRequested(exportId: string): ExportJobRequested {
  return { schemaVersion: EXPORT_SCHEMA_VERSION, exportId };
}
