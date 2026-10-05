/**
 * What an EAN is, and how it is normalised before it is stored or compared.
 *
 * The EAN is the Belgian DSO's connection identifier and the primary key of a
 * meter. It is exactly 18 digits.
 *
 * No `54` prefix requirement, although every real Belgian energy EAN starts
 * `54144x`: that is a convention of the issuing DSOs rather than part of what
 * makes a string an EAN, and this repo's own functional fixtures
 * (`123456789012345678`, `999999999999999999`) are deliberately outside it.
 *
 * No GS1 mod-10 check digit either. `541448200000000001` — the EAN the dev
 * seed, the e2e specs and the RESA test workbooks are all built on — fails
 * mod-10 (its check digit would be 8), so a checksum here would reject the
 * platform's own data.
 */
export const EAN_PATTERN = /^[0-9]{18}$/;

/**
 * Trim, and nothing else. EANs are digits, so there is no case to fold.
 *
 * Applied on the DTO rather than only in the repository, for the same reason
 * `normaliseHouseNumber` is: `meter.repository.ts` builds its Meter with
 * `manager.create()` straight from the DTO, so a repository-only fix would
 * apply to nothing.
 *
 * It is load-bearing for compatibility, not just hygiene. The frontend
 * validator tests `value.trim()` but older builds submit the raw control value,
 * so a pasted EAN with surrounding whitespace is a value the UI called valid.
 * Normalising before `@Matches` accepts it and stores it clean; matching first
 * would 422 it.
 */
export function normaliseEan(value: string): string {
  return value.trim();
}
