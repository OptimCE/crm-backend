/**
 * The export contract (contracts/export/README.md), as constants and types.
 *
 * The JSON Schemas in assets/export/schemas are the source of truth for the wire format; these
 * types mirror them for the compiler and are checked against them at runtime (schemas.ts).
 */

export const EXPORT_SCHEMA_VERSION = "1.0";
export const EXPORT_SCHEMA_MAJOR = 1;

export const EXPORTS_STREAM = "EXPORTS";
export const EXPORT_SUBJECT_ROOT = "export.>";
export const EXPORT_JOB_REQUESTED_SUBJECT = "export.job.requested";
export const EXPORT_PART_DONE_SUBJECT = "export.part.done";
export const EXPORT_PART_FAILED_SUBJECT = "export.part.failed";
export const EXPORT_STREAM_MAX_AGE_MS = 24 * 3600 * 1000;
export const EXPORT_STREAM_DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export const DEFAULT_EXPORT_BUCKET = "exports";

/** Redelivery policy of a part request (README §3, "Règles"). */
export const EXPORT_MAX_DELIVER = 5;
export const EXPORT_ACK_WAIT_MS = 60_000;
/** Delay before redelivery after the n-th failed delivery (index n - 1). */
export const EXPORT_NAK_DELAYS_MS = [10_000, 60_000, 300_000, 300_000] as const;

export function requestSubject(service: string): string {
  return `export.request.${service}`;
}

export function serviceDurable(service: string): string {
  return `export-${service}`;
}

export function partPrefix(exportId: string, service: string): string {
  return `parts/${exportId}/${service}/`;
}

/**
 * Written under the part's prefix once every file is complete, holding the `export.part.done` it
 * answers. A redelivery of the same attempt replays it instead of rewriting files the worker may
 * already be reading. Not an archive file: `.export/` is reserved and never listed in `files`.
 */
export const PART_DONE_MARKER = ".export/done.json";
export const RESERVED_PART_DIR = ".export/";

export function msgIdForRequest(partId: string, attempt: number): string {
  return `${partId}:${attempt}`;
}

export function msgIdForResponse(partId: string, attempt: number, outcome: "done" | "failed"): string {
  return `${partId}:${attempt}:${outcome}`;
}

export function msgIdForJob(exportId: string): string {
  return `${exportId}:requested`;
}

/** The body of `export.job.requested`: the worker reads everything else from export_job. */
export interface ExportJobRequested {
  schemaVersion: string;
  exportId: string;
}

export type ScopeType = "user" | "community";

export interface ExportScope {
  type: ScopeType;
  /** Keycloak id: the user's `sub` or the community's group id. */
  id: string;
}

export interface ExportRequest {
  schemaVersion: string;
  exportId: string;
  partId: string;
  service: string;
  attempt: number;
  scope: ExportScope;
  requester: { userId: string };
  requestedAt: string;
  storage: { bucket: string; prefix: string };
}

export interface PartFile {
  path: string;
  key: string;
  size: number;
  sha256: string;
  contentType: string;
}

export interface PartReference {
  bucket: string;
  key: string;
  targetPath: string;
  size?: number;
  sha256?: string;
  contentType?: string;
}

export interface SummaryItem {
  labelKey: string;
  count: number;
}

export type OmittedReason = "below_threshold" | "consent_missing";

export interface OmittedItem {
  what: string;
  reason: OmittedReason;
}

export interface PartDone {
  schemaVersion: string;
  exportId: string;
  partId: string;
  service: string;
  attempt: number;
  files: PartFile[];
  references: PartReference[];
  summary: SummaryItem[];
  omitted: OmittedItem[];
  producedAt: string;
}

export type PartErrorCode = "scope_not_found" | "forbidden" | "corrupt_data" | "unsupported_schema" | "internal";

export interface PartFailed {
  schemaVersion: string;
  exportId: string;
  partId: string;
  service: string;
  attempt: number;
  errorCode: PartErrorCode;
  errorDetail: string;
  failedAt: string;
}

export interface JobRequested {
  schemaVersion: string;
  exportId: string;
}

/** `"1.3"` → 1; anything unparsable → NaN. */
export function schemaMajor(version: unknown): number {
  if (typeof version !== "string") return Number.NaN;
  const match = /^(\d+)\.\d+$/.exec(version);
  return match ? Number(match[1]) : Number.NaN;
}
