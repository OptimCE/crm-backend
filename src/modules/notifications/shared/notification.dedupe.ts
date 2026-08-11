import { createHash } from "node:crypto";
import type { NotificationChannel } from "./notification.types.js";

/** Hex characters kept from the payload digest. 128 bits; see `buildDedupeKey`. */
const PAYLOAD_HASH_LENGTH = 32;
/** Hex characters kept from the address digest. */
const ADDRESS_HASH_LENGTH = 16;

/**
 * Deterministic JSON: object keys sorted recursively, no whitespace.
 *
 * This is half of the cross-language contract — the Python annexes produce the
 * same string with `json.dumps(data, sort_keys=True, separators=(",", ":"))`.
 * Arrays are NOT sorted: their order is part of the value.
 *
 * `JSON.stringify` already emits the compact separators and escapes non-ASCII
 * the same way Python's default `ensure_ascii=True` does NOT — so keep payloads
 * to plain values and treat the digest as a per-language stable key rather than
 * a cross-language one. Nothing requires the two languages to agree on a
 * concrete key: each notification type has exactly one producer.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortDeep(source[key]);
    }
    return sorted;
  }
  return value;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * The idempotency key for one queued message.
 *
 *   `<channel>:<type>:u<id_user>:<h>`                        account-ful
 *   `<channel>:<type>:a<sha256(lower(address))[:16]>:<h>`    account-less
 *   `h = sha256(canonicalJson(data))[:32]`
 *
 * The channel prefix is required because the table's grain is
 * (message, channel, recipient), so the same notification delivered over two
 * channels is two rows.
 *
 * **`data` IS the idempotency key, for all time.** There is no time bucket, so
 * two genuinely distinct occurrences of the same type to the same recipient
 * with identical `data` collapse into a single message — permanently. That is
 * the intended behaviour for everything driven by a status transition
 * (`invoice.issued`, `invoice.overdue`, `admin_deadline.missed`, an invitation:
 * each fires once per row and the row id is in `data`). A producer whose sweep
 * can re-emit WITHOUT mutating its source row must pass an explicit key that
 * includes the occurrence date — see `admin_deadline.due_soon`.
 *
 * Worst case length is 128 (type) + 2 + 10 + 1 + 32 = 175, inside
 * `outbound_message.dedupe_key VARCHAR(200)`.
 */
export function buildDedupeKey(params: {
  channel: NotificationChannel;
  type: string;
  data: Record<string, unknown>;
  userId?: number | null;
  recipient?: string | null;
  override?: string | null;
}): string {
  if (params.override) {
    return params.override.slice(0, 200);
  }
  const payloadHash = sha256Hex(canonicalJson(params.data)).slice(0, PAYLOAD_HASH_LENGTH);
  const recipientRef =
    params.userId !== undefined && params.userId !== null
      ? `u${params.userId}`
      : `a${sha256Hex((params.recipient ?? "").trim().toLowerCase()).slice(0, ADDRESS_HASH_LENGTH)}`;
  return `${params.channel}:${params.type}:${recipientRef}:${payloadHash}`;
}

/**
 * The `notification_preference.type_prefix` a type falls under: its first
 * dot-segment. `''` (the default row) is never produced here.
 *
 * The taxonomy guarantees exactly two segments, so this is total; a malformed
 * key degrades to the whole string, which simply matches no preference row.
 */
export function typePrefixOf(type: string): string {
  const dot = type.indexOf(".");
  return dot === -1 ? type : type.slice(0, dot);
}
