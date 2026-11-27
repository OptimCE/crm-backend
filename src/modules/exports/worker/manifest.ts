import { EXPORT_SCHEMA_VERSION, type OmittedItem, type SummaryItem } from "../../../shared/export/kit/contract.js";
import type { ExportLocale, ExportScopeType } from "../domain/export.types.js";

/** manifest.json (contracts/export/schemas/manifest.schema.json). */
export interface ExportManifest {
  schemaVersion: string;
  platform: { name: "OptimCE"; version: string };
  exportId: string;
  scope: { type: ExportScopeType; id: string; name: string };
  requester: { userId: string };
  generatedAt: string;
  locale: ExportLocale;
  parts: ManifestPart[];
}

export interface ManifestFile {
  path: string;
  size: number;
  sha256: string;
}

export interface ManifestPart {
  service: string;
  status: "done";
  files: ManifestFile[];
  summary: SummaryItem[];
  omitted: OmittedItem[];
}

export function buildManifest(input: {
  exportId: string;
  scope: { type: ExportScopeType; id: string; name: string };
  requesterId: string;
  locale: ExportLocale;
  platformVersion: string;
  generatedAt: Date;
  parts: ManifestPart[];
}): ExportManifest {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    platform: { name: "OptimCE", version: input.platformVersion },
    exportId: input.exportId,
    scope: { type: input.scope.type, id: input.scope.id, name: input.scope.name.slice(0, 512) },
    requester: { userId: input.requesterId },
    generatedAt: input.generatedAt.toISOString(),
    locale: input.locale,
    parts: input.parts,
  };
}

const BRUSSELS_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * `archives/<exportId>/optimce-export-<user|community>-<AAAAMMJJ>.zip`, dated on the day of the
 * request in Brussels. Stable across assembly attempts, so each attempt overwrites the last.
 */
export function archiveKey(exportId: string, scope: ExportScopeType, requestedAt: Date): string {
  return `${archivePrefix(exportId)}optimce-export-${scope}-${BRUSSELS_DATE.format(requestedAt).replaceAll("-", "")}.zip`;
}

export function archivePrefix(exportId: string): string {
  return `archives/${exportId}/`;
}

export function partsPrefix(exportId: string): string {
  return `parts/${exportId}/`;
}

/** Already compressed formats are stored as they are: deflating a PDF again only costs time. */
const STORED_TYPES =
  /^(application\/(pdf|zip|gzip|x-7z-compressed|x-rar-compressed|vnd\.openxmlformats-officedocument\.[a-z.]+)|image\/(png|jpeg|gif|webp)|audio\/|video\/)/u;
const STORED_EXTENSIONS = /\.(pdf|zip|gz|7z|rar|png|jpe?g|gif|webp|docx|xlsx|pptx|odt|ods|mp3|mp4)$/iu;

export function storeWithoutCompression(path: string, contentType?: string): boolean {
  return (contentType !== undefined && STORED_TYPES.test(contentType.toLowerCase())) || STORED_EXTENSIONS.test(path);
}
