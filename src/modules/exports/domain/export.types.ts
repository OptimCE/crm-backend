/**
 * The data export's coded values. Kept apart from the entities (export.models.ts) so that code
 * which only needs them does not load TypeORM's entity graph.
 */

/** What an export is about: one user's data, or one community's. */
export const EXPORT_SCOPE_TYPES = ["user", "community"] as const;
export type ExportScopeType = (typeof EXPORT_SCOPE_TYPES)[number];

/**
 * pending -> collecting -> assembling -> ready -> expired, or failed from any active state.
 * Only the API creates a job (pending); every later transition is the worker's.
 */
export const EXPORT_STATUSES = ["pending", "collecting", "assembling", "ready", "failed", "expired"] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

/** The statuses uq_export_job_active counts as "an export in progress". */
export const ACTIVE_EXPORT_STATUSES: readonly ExportStatus[] = Object.freeze(["pending", "collecting", "assembling"]);

export const EXPORT_PART_STATUSES = ["pending", "done", "failed"] as const;
export type ExportPartStatus = (typeof EXPORT_PART_STATUSES)[number];

/** The languages index.html is written in (contracts/export/schemas/manifest.schema.json). */
export const EXPORT_LOCALES = ["fr", "en", "nl", "de"] as const;
export type ExportLocale = (typeof EXPORT_LOCALES)[number];
