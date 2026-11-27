import config from "config";

/** config `export` (config/*.cjs). */
export interface ExportSettings {
  nats_url: string;
  services: string[];
  step_up_max_age_seconds: number;
  max_requests_per_day: number;
  retention_days: number;
  download_url_ttl_seconds: number;
  bucket: string;
  download: {
    public_endpoint: string;
    region: string;
    access_key: string;
    secret_key: string;
  };
}

/** Same rule as `service` in contracts/export/schemas/common.schema.json. */
const SERVICE_NAME = /^[a-z][a-z0-9-]{1,62}$/u;

/** Reads and checks config `export`. Throws at boot rather than creating unanswerable exports. */
export function loadExportSettings(): ExportSettings {
  const settings = config.get<ExportSettings>("export");
  const services = settings.services;
  if (services.length === 0) throw new Error("export.services (EXPORT_SERVICES) is empty");
  for (const service of services) {
    if (!SERVICE_NAME.test(service)) throw new Error(`export.services: ${JSON.stringify(service)} is not a service name`);
  }
  if (new Set(services).size !== services.length) throw new Error("export.services names a service twice");
  for (const key of ["step_up_max_age_seconds", "max_requests_per_day", "retention_days", "download_url_ttl_seconds"] as const) {
    const value = settings[key];
    if (!Number.isInteger(value) || value <= 0) throw new Error(`export.${key} must be a positive integer, got ${value}`);
  }
  return settings;
}
