import config from "config";
import type { ExportSettings } from "../shared/export.settings.js";

/** The export worker's settings, in milliseconds. Built from config `export` + `export.worker`. */
export interface ExportWorkerSettings {
  natsUrl: string;
  bucket: string;
  tickMs: number;
  pendingGraceMs: number;
  partTimeoutMs: number;
  maxPartAttempts: number;
  jobMaxAgeMs: number;
  maxAssemblyAttempts: number;
  assemblyLeaseMs: number;
  assemblyRetryMs: number;
  retentionMs: number;
  documentBuckets: string[];
  heartbeatFile: string;
  platformVersion: string;
}

interface WorkerConfig {
  tick_seconds: number;
  pending_grace_seconds: number;
  part_timeout_minutes: number;
  max_part_attempts: number;
  job_max_age_hours: number;
  max_assembly_attempts: number;
  assembly_lease_seconds: number;
  assembly_retry_seconds: number;
  document_buckets: string[];
  heartbeat_file: string;
  platform_version: string;
}

export function loadExportWorkerSettings(): ExportWorkerSettings {
  const exportConfig = config.get<ExportSettings>("export");
  const worker = config.get<WorkerConfig>("export.worker");
  for (const key of [
    "tick_seconds",
    "pending_grace_seconds",
    "part_timeout_minutes",
    "max_part_attempts",
    "job_max_age_hours",
    "max_assembly_attempts",
    "assembly_lease_seconds",
    "assembly_retry_seconds",
  ] as const) {
    if (!Number.isInteger(worker[key]) || worker[key] <= 0) throw new Error(`export.worker.${key} must be a positive integer, got ${worker[key]}`);
  }
  if (worker.document_buckets.length === 0) throw new Error("export.worker.document_buckets (EXPORT_DOCUMENT_BUCKETS) is empty");
  return {
    natsUrl: exportConfig.nats_url,
    bucket: exportConfig.bucket,
    tickMs: worker.tick_seconds * 1000,
    pendingGraceMs: worker.pending_grace_seconds * 1000,
    partTimeoutMs: worker.part_timeout_minutes * 60_000,
    maxPartAttempts: worker.max_part_attempts,
    jobMaxAgeMs: worker.job_max_age_hours * 3_600_000,
    maxAssemblyAttempts: worker.max_assembly_attempts,
    assemblyLeaseMs: worker.assembly_lease_seconds * 1000,
    assemblyRetryMs: worker.assembly_retry_seconds * 1000,
    retentionMs: exportConfig.retention_days * 86_400_000,
    documentBuckets: [...worker.document_buckets],
    heartbeatFile: worker.heartbeat_file,
    platformVersion: worker.platform_version,
  };
}
