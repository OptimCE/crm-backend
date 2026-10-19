import type { DsoCommune } from "../domain/dso.types.js";

/**
 * A place name reduced to what two spellings of it have in common.
 *
 * The `belgian-dso-map` contract's definition, byte for byte, so this side and
 * dso-lookup agree on what "the same name" means: NFKD, drop the combining marks,
 * lower-case, then delete everything outside `[a-z0-9]`. "Sint-Jans-Molenbeek",
 * "sint jans molenbeek" and "SINT-JANS-MOLENBEEK" all become
 * `sintjansmolenbeek`; "Liège" becomes `liege`.
 */
export function normaliseName(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * The one commune among `communes` whose French, Dutch or German name is `city`,
 * or null when none or several are.
 *
 * Several can only happen with two communes sharing a name in different
 * languages; guessing between them would prefill a DSO that is plausible and
 * wrong, so the caller keeps the choice in front of the user instead.
 */
export function communeNamed(communes: DsoCommune[], city: string | null | undefined): DsoCommune | null {
  const wanted = normaliseName(city);
  if (!wanted) {
    return null;
  }
  const matches = communes.filter((commune) => [commune.names.fr, commune.names.nl, commune.names.de].some((name) => normaliseName(name) === wanted));
  return matches.length === 1 ? matches[0] : null;
}

/** The register and the picker carry NIS as an int; dso-lookup keys on the 5-digit string. */
export function toNisString(nis: number): string {
  return String(nis).padStart(5, "0");
}
