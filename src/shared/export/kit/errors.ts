import type { PartErrorCode } from "./contract.js";

/**
 * A non-recoverable failure of a part: the kit answers `export.part.failed` and acks.
 *
 * Throw it from a handler for a definitive outcome (unknown scope, requester no longer allowed,
 * inconsistent data). `detail` goes to the worker and the logs: identifiers only, never exported
 * content or personal data. Any other error is treated as transient and redelivered.
 */
export class ExportPartError extends Error {
  constructor(
    readonly code: PartErrorCode,
    readonly detail: string,
  ) {
    super(`${code}: ${detail}`);
    this.name = "ExportPartError";
  }
}

/** Raised inside a handler when the consumer is shutting down; the kit naks the request. */
export class ExportAbortedError extends Error {
  constructor() {
    super("export part aborted by shutdown");
    this.name = "ExportAbortedError";
  }
}

/**
 * The part of an unexpected error that may travel to the worker: its class and, when it has one,
 * its code. Never the message, which can quote a value (a driver error can echo a row).
 */
export function describeUnexpected(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" || typeof code === "number" ? `${err.name} (${code})` : err.name;
  }
  return typeof err;
}
