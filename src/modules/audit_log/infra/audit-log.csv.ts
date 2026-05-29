import type { AuditLog } from "../domain/audit-log.models.js";

export const AUDIT_LOG_CSV_COLUMNS = [
  "id",
  "timestamp",
  "action",
  "source",
  "entity_type",
  "entity_id",
  "user_id",
  "user_email",
  "payload",
] as const;

/**
 * RFC 4180 field escape: wrap in double-quotes if the value contains a
 * delimiter, a quote, or a newline; double any inner quotes.
 */
export function escapeCsvField(value: string): string {
  if (value === "") return "";
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function auditLogCsvHeader(): string {
  return AUDIT_LOG_CSV_COLUMNS.join(",");
}

export function auditLogCsvRow(row: AuditLog): string {
  return [
    escapeCsvField(String(row.id)),
    escapeCsvField(row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString()),
    escapeCsvField(row.action),
    escapeCsvField(row.source),
    escapeCsvField(row.entity_type),
    escapeCsvField(row.entity_id ?? ""),
    escapeCsvField(row.user_id !== null && row.user_id !== undefined ? String(row.user_id) : ""),
    escapeCsvField(row.user_email ?? ""),
    escapeCsvField(JSON.stringify(row.payload ?? {})),
  ].join(",");
}

export function auditLogCsvFilename(communityId: number | null, now: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  const idPart = communityId !== null ? String(communityId) : "all";
  return `audit-log-${idPart}-${stamp}.csv`;
}
