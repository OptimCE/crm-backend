import type { ExportJobDTO } from "../api/export.dtos.js";
import type { ExportJob } from "../domain/export.models.js";
import { EXPORT_LOCALES, type ExportLocale } from "../domain/export.types.js";

/** True while a ready archive can still be downloaded. */
export function isDownloadable(job: ExportJob, now: Date): boolean {
  return job.status === "ready" && job.expires_at !== null && job.expires_at.getTime() > now.getTime();
}

/**
 * A job as the API shows it. `viewer` is the caller's Keycloak id: only the requester gets
 * `can_download`, other admins of the community see the row without it.
 */
export function toExportJobDTO(job: ExportJob, viewer: string, now: Date, withParts = false): ExportJobDTO {
  const is_mine = job.requester_user_id === viewer;
  const dto: ExportJobDTO = {
    id: job.id,
    scope: job.scope_type,
    community: job.community ? { auth_community_id: job.community.auth_community_id, name: job.community.name } : null,
    status: job.status,
    locale: job.locale,
    requester: {
      first_name: job.requester?.firstName ?? null,
      last_name: job.requester?.lastName ?? null,
      email: job.requester?.email ?? "",
    },
    is_mine,
    can_download: is_mine && isDownloadable(job, now),
    created_at: job.created_at.toISOString(),
    started_at: job.started_at?.toISOString() ?? null,
    completed_at: job.completed_at?.toISOString() ?? null,
    expires_at: job.expires_at?.toISOString() ?? null,
    size_bytes: job.size_bytes === null ? null : Number(job.size_bytes),
    error_code: job.error_code,
  };
  if (withParts) {
    dto.parts = (job.parts ?? []).map((part) => ({ service: part.service, status: part.status, updated_at: part.updated_at.toISOString() }));
  }
  return dto;
}

/**
 * The language of the archive's index.html: the account's saved one, else the request's, else
 * French. Takes the primary subtag (`fr-BE` -> `fr`).
 */
export function pickExportLocale(...candidates: (string | null | undefined)[]): ExportLocale {
  for (const candidate of candidates) {
    const primary = candidate?.trim().toLowerCase().split(/[-_]/u)[0];
    if (primary && (EXPORT_LOCALES as readonly string[]).includes(primary)) return primary as ExportLocale;
  }
  return "fr";
}

/** The name the archive is saved under: the last segment of its key. */
export function archiveFileName(object_key: string): string {
  const name = object_key.split("/").pop();
  return name && name !== "" ? name : "optimce-export.zip";
}
