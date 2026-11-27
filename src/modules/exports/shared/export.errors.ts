import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";

// Errors range: 35000 - 35999
export const EXPORT_ERRORS = {
  ...GLOBAL_ERRORS,
  /**
   * 401: the last interactive login is older than export.step_up_max_age_seconds. The front
   * answers it by sending the user through Keycloak with max_age and replaying the request.
   * The spec's `reauth_required`.
   */
  REAUTH_REQUIRED: new LocalError(35000, "export:reauth_required"),
  /** 403: a community export by someone who is not an ADMIN of that community. */
  FORBIDDEN: new LocalError(35001, "export:forbidden"),
  /** 409: the requester already has an export of this scope in progress. */
  ALREADY_ACTIVE: new LocalError(35002, "export:already_active"),
  /** 429: export.max_requests_per_day requests for this scope over the last 24 hours. */
  RATE_LIMITED: new LocalError(35003, "export:rate_limited"),
  /** 404: no such export, or one the caller may not see. */
  NOT_FOUND: new LocalError(35004, "export:not_found"),
  /** 403: only the requester downloads an export, even another admin of the community. */
  DOWNLOAD_FORBIDDEN: new LocalError(35005, "export:download_forbidden"),
  /** 409: the export is not ready (still in progress, or failed). */
  NOT_READY: new LocalError(35006, "export:not_ready"),
  /** 410: the archive expired and was deleted. */
  EXPIRED: new LocalError(35007, "export:expired"),
  /** 503: the download URL could not be signed. */
  DOWNLOAD_UNAVAILABLE: new LocalError(35008, "export:download_unavailable"),
  /** 404: the caller has no account row yet (the gateway knows them, the CRM does not). */
  USER_NOT_FOUND: new LocalError(35009, "export:user_not_found"),
  VALIDATION: {
    SCOPE: new LocalError(35100, "export:validation.scope"),
    COMMUNITY_ID: new LocalError(35101, "export:validation.community_id"),
    VIEW: new LocalError(35102, "export:validation.view"),
    ID: new LocalError(35103, "export:validation.id"),
  },
};
