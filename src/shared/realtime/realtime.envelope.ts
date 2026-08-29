import { randomBytes } from "node:crypto";
import { isKnownTopic } from "./realtime.topics.js";
import type { RealtimeEnvelope, RealtimeEventInput } from "./realtime.types.js";

/**
 * Hard ceiling on a serialized envelope, in BYTES.
 *
 * Measured with `Buffer.byteLength`, never `String.length`: the latter counts
 * UTF-16 code units, so a hostile publisher could push roughly 4x this through
 * a control whose entire job is to bound what a compromised annexe can inject.
 */
export const MAX_ENVELOPE_BYTES = 1024;

/** Only these may appear as `hint` values. Nested objects and arrays are rejected. */
function isScalar(v: unknown): v is string | number | boolean | null {
  return v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

/**
 * Build a valid envelope, or `null` if the input violates the contract.
 *
 * Returning `null` rather than throwing is deliberate: every caller is a
 * fire-and-forget side effect that must never affect a business write, so a
 * malformed hint has to degrade to "no event", not to an exception travelling up
 * through a commit path.
 */
export function buildEnvelope(input: RealtimeEventInput): RealtimeEnvelope | null {
  if (!isKnownTopic(input.topic)) return null;
  if (!input.ref?.kind || !input.ref.id) return null;

  const hint: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(input.hint ?? {})) {
    if (!isScalar(v)) return null;
    hint[k] = v;
  }

  const envelope: RealtimeEnvelope = {
    v: 1,
    id: randomBytes(8).toString("hex"),
    topic: input.topic,
    at: new Date().toISOString(),
    scope: { community_id: input.scope?.community_id ?? null },
    ref: { kind: String(input.ref.kind), id: String(input.ref.id) },
    hint,
  };

  return Buffer.byteLength(JSON.stringify(envelope), "utf8") > MAX_ENVELOPE_BYTES ? null : envelope;
}

/**
 * Parse and validate bytes read off Redis.
 *
 * The payload arrives from ANY process holding the Redis password and is
 * forwarded verbatim into a browser. Checking shape and size here is the only
 * thing between a compromised annexe and every connected SSE client, so this is
 * strict by design and silent on rejection (`null`, plus a counter at the call
 * site) rather than throwing into the Redis message callback.
 */
export function parseEnvelope(payload: string): RealtimeEnvelope | null {
  if (Buffer.byteLength(payload, "utf8") > MAX_ENVELOPE_BYTES) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;

  const e = raw as Partial<RealtimeEnvelope>;
  if (e.v !== 1) return null;
  if (typeof e.id !== "string" || e.id.length === 0 || e.id.length > 64) return null;
  if (!isKnownTopic(e.topic)) return null;
  if (typeof e.at !== "string") return null;
  if (typeof e.ref !== "object" || e.ref === null) return null;
  if (typeof e.ref.kind !== "string" || typeof e.ref.id !== "string") return null;
  if (typeof e.scope !== "object" || e.scope === null) return null;
  if (e.scope.community_id !== null && typeof e.scope.community_id !== "number") return null;
  if (typeof e.hint !== "object" || e.hint === null || Array.isArray(e.hint)) return null;
  for (const v of Object.values(e.hint)) {
    if (!isScalar(v)) return null;
  }

  return e as RealtimeEnvelope;
}
