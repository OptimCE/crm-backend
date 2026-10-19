/**
 * What `meter_data.grd` holds, and how a submitted value is normalised.
 *
 * The column stores the operator's STABLE ID from the `belgian-dso-map` data
 * release — `ores`, `fluvius-imewo`, `elia` — never a display name. Until this
 * release it stored whatever the form's select carried, which was the display
 * name ("ORES", "Fluvius Imewo"); database_script/2026-10-13_meter_data_grd_provenance.sql
 * rewrites those rows, and this map rewrites them on the way in, so an older
 * frontend build, a seed or an API client sending a name still stores the id.
 *
 * Free text otherwise, by choice: there is no `@IsIn` and no CHECK constraint.
 * A value this map does not know is kept exactly as sent — the catalogue lives
 * in an external data release, and refusing an id it adds next month would
 * block meter creation on a data bump.
 *
 * Elia is the local transmission grid (30-70 kV), not a DSO; the form offers it
 * as a separate last option and the prefill never selects it.
 */

/** Stable ids, keyed by their legacy display name reduced by {@link grdKey}. */
export const LEGACY_GRD_IDS: Readonly<Record<string, string>> = {
  ores: "ores",
  resa: "resa",
  aieg: "aieg",
  aiesh: "aiesh",
  rew: "rew",
  sibelga: "sibelga",
  "fluvius antwerpen": "fluvius-antwerpen",
  "fluvius halle vilvoorde": "fluvius-halle-vilvoorde",
  "fluvius imewo": "fluvius-imewo",
  "fluvius kempen": "fluvius-kempen",
  "fluvius limburg": "fluvius-limburg",
  "fluvius midden vlaanderen": "fluvius-midden-vlaanderen",
  "fluvius west": "fluvius-west",
  "fluvius zenne dijle": "fluvius-zenne-dijle",
  enexis: "enexis",
  elia: "elia",
};

/**
 * Case-insensitive, with spaces and hyphens alike and collapsed, then trimmed:
 * "Fluvius Midden-Vlaanderen", "FLUVIUS MIDDEN VLAANDEREN" and the id
 * "fluvius-midden-vlaanderen" itself all reduce to `fluvius midden vlaanderen`.
 *
 * The SQL twin in the dated script is
 * `btrim(regexp_replace(lower(grd), '[\s-]+', ' ', 'g'))` — keep them in step.
 */
function grdKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s-]+/g, " ")
    .trim();
}

/**
 * The stable id for a legacy display name or an id, or the value unchanged when
 * it is neither. Idempotent: an id maps to itself.
 */
export function normaliseGrd(value: string): string {
  const key = grdKey(value);
  // hasOwn, not `LEGACY_GRD_IDS[key] ?? value`: "constructor" would find
  // Object.prototype's and hand a function to the validator.
  return Object.hasOwn(LEGACY_GRD_IDS, key) ? LEGACY_GRD_IDS[key] : value;
}
