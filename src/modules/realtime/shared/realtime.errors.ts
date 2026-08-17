import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";

/**
 * Realtime error codes, in the 34xxx range (notifications own 33xxx).
 *
 * These are NUMBERS, matching every other error in this codebase:
 * `error.middleware.ts` declares `error_code?: number` and the frontend's
 * `ApiResponse` mirrors it. The Angular client compares against the exported
 * integers, never a string token.
 */
export const REALTIME_ERRORS = {
  ...GLOBAL_ERRORS,
  /**
   * The feature is switched off (`realtime.enabled=false`, or no redis url), so
   * nothing is bound. The client treats this as "do not retry quickly" and stays
   * on polling — distinct from UNAVAILABLE, which is worth backing off against.
   */
  DISABLED: new LocalError(34000, "global_error:exception"),
  /** Configured but the broker could not be reached. Transient; back off. */
  UNAVAILABLE: new LocalError(34001, "global_error:exception"),
  /** Mint rate limit exceeded for this user (see `realtime.mint_per_minute`). */
  TOO_MANY_TICKETS: new LocalError(34002, "global_error:exception"),
};

/** Mirrored in crm-frontend `core/services/realtime/realtime.types.ts`. */
export const REALTIME_ERROR_CODE_DISABLED = 34000;
export const REALTIME_ERROR_CODE_UNAVAILABLE = 34001;
