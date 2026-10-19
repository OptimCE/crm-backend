/** Why dso-lookup could not answer. */
export type DsoUnavailableReason = "timeout" | "network" | "status" | "body";

/**
 * dso-lookup gave no usable answer.
 *
 * Deliberately carries no URL, no query and no upstream error object. The query
 * holds a postcode, an EAN and an address name, and an axios error serialises its
 * whole request config — logging one would put all three in the logs.
 */
export class DsoUnavailableError extends Error {
  constructor(
    readonly reason: DsoUnavailableReason,
    readonly status?: number,
  ) {
    super(status === undefined ? `dso-lookup unavailable (${reason})` : `dso-lookup unavailable (${reason} ${status})`);
    this.name = "DsoUnavailableError";
  }
}
