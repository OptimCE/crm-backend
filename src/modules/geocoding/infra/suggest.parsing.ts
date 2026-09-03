import type { ParsedAddressQuery } from "../domain/address-suggestion.types.js";

/** Below this, `*text*` matches too much of the register to be useful. */
export const MIN_SUGGEST_QUERY_LENGTH = 3;

/**
 * Strip diacritics and case, for comparison only.
 *
 * Same treatment as `municipality-centroid.geocoder.ts`, and for the same
 * reason: people type "Liege" for "Liège". Never used for what is stored.
 */
export function foldForCompare(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** A Belgian postal code is exactly four digits. */
const POSTCODE = /^\d{4}$/;

/**
 * House-number-shaped, using the forms the register actually returns: `12`,
 * `12A`, `2B`, `12-14`, `1/3`, `2/0001`. Deliberately NOT the full
 * HOUSE_NUMBER_PATTERN — that one accepts `12 bis`, which is two tokens and
 * would be far too eager to swallow a word out of a street name.
 */
const HOUSE_NUMBER_TOKEN = /^\d+[a-zA-Z]?([-/]\d+[a-zA-Z]?)?$/;

/**
 * Split free text into the parts the register can be queried on.
 *
 * The postcode is the pivot. People write an address as
 * "<street> <number>, <postcode> <city>" far more often than they put the house
 * number last, so anchoring on the four-digit token and taking the house number
 * from the segment BEFORE it handles "rue Neuve 40, 1000 Bruxelles" — which the
 * end-anchored rule silently missed, treating "40" as part of the street name.
 *
 * The city segment after the postcode is then dropped rather than searched:
 * "bruxelles" is not part of any street name, and leaving it in makes the
 * substring query match nothing. When there is no postcode at all, the whole
 * string is the candidate and `retryWithCommune` in the suggester recovers the
 * commune case.
 *
 * A house number is never taken when it is the FIRST token of its segment:
 * "4 Bras" and "1er Mai" are real Belgian street names, and stealing the number
 * produces confidently wrong suggestions.
 */
export function parseAddressQuery(raw: string): ParsedAddressQuery {
  const tokens = raw
    .replace(/,/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const postcodeIndex = tokens.findIndex((t) => POSTCODE.test(t));
  const postcode = postcodeIndex >= 0 ? tokens[postcodeIndex] : undefined;

  // Prefer what comes before the postcode. Fall back to what comes after it for
  // "1000 rue de la Loi 16", and to the whole string when there is no postcode.
  const before = postcodeIndex >= 0 ? tokens.slice(0, postcodeIndex) : tokens;
  const candidates = before.length > 0 ? before : tokens.slice(postcodeIndex + 1);

  const kept = [...candidates];
  let number: string | undefined;
  // Never when it is the only token: "20A" alone is a house number with no
  // street, which the register cannot search on.
  if (kept.length > 1 && HOUSE_NUMBER_TOKEN.test(kept[kept.length - 1])) {
    number = kept.pop();
  }

  return { street: kept.join(" "), postcode, number };
}

/**
 * Score a register street name against what was typed. Higher is better.
 *
 * The register has no relevance ordering of its own — `/streets` returns up to
 * 400 rows in whatever order it likes — so ranking has to happen here. Ordering
 * by a score rather than filtering keeps a near-miss visible instead of
 * silently dropping the row someone actually wanted.
 */
export function scoreStreetName(candidate: string, typed: string): number {
  const a = foldForCompare(candidate);
  const b = foldForCompare(typed);
  if (!b) {
    return 0;
  }
  if (a === b) {
    return 100;
  }
  if (a.startsWith(b)) {
    return 80;
  }
  // "station" should rank "Place de la Station" well: a match at a word
  // boundary is much stronger evidence than one in the middle of a word.
  if (new RegExp(`\\b${escapeRegExp(b)}`).test(a)) {
    return 60;
  }
  if (a.includes(b)) {
    return 40;
  }
  return 10;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sort house numbers the way a person reads them: 1, 2, 2B, 10 — not
 * lexicographically, which puts 10 before 2. This is the one place the old INT
 * column gave correct ordering for free.
 */
export function compareHouseNumbers(a: string, b: string): number {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (Number.isNaN(na) || Number.isNaN(nb)) {
    return a.localeCompare(b);
  }
  return na !== nb ? na - nb : a.localeCompare(b);
}

/** "Place de la Station 20A, 5000 Namur" — one place, so every row reads alike. */
export function formatSuggestionLabel(parts: { street: string; number?: string; postcode: string; city: string }): string {
  const head = parts.number ? `${parts.street} ${parts.number}` : parts.street;
  const tail = [parts.postcode, parts.city].filter(Boolean).join(" ");
  return tail ? `${head}, ${tail}` : head;
}
