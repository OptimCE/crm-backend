import { container } from "../di-container.js";
import { ExportNats } from "../../shared/export/export-nats.js";
import type { IExportDownloadSigner, IExportJobPublisher } from "../../modules/exports/domain/i-export.ports.js";
import { NatsExportJobPublisher } from "../../modules/exports/infra/nats-export-job-publisher.js";
import { S3ExportDownloadSigner } from "../../modules/exports/infra/s3-export-download-signer.js";
import { loadExportSettings } from "../../modules/exports/shared/export.settings.js";

/**
 * The data export's network adapters: the NATS connection that announces new exports, and the
 * signer of download URLs. Not bound under test, where both are replaced by fakes. The
 * connection is only created here; app.ts starts it once the database is up.
 */
export function initializeExportAdapters(): void {
  const settings = loadExportSettings();
  const nats = new ExportNats(settings.nats_url);
  container.bind<ExportNats>("ExportNats").toConstantValue(nats);
  container.bind<IExportJobPublisher>("ExportJobPublisher").toConstantValue(new NatsExportJobPublisher(nats));
  container
    .bind<IExportDownloadSigner>("ExportDownloadSigner")
    .toConstantValue(new S3ExportDownloadSigner({ ...settings.download, bucket: settings.bucket }));
}
