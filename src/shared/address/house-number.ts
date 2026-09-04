/**
 * What a Belgian house number is allowed to look like, and how it is normalised
 * before it is stored or compared.
 *
 * The authority is the federal BeSt Address register (FPS BOSA), which is what
 * the address picker searches. Real values it returns include `12`, `12A`,
 * `2B`, `12-14`, `1/3`, `2/0001`, `12 bis` and `+12`.
 */

/**
 * Deliberately permissive.
 *
 * A pattern tighter than the register rejects addresses the register itself
 * returned — which is the exact failure this whole feature exists to remove. So
 * this only rules out what cannot plausibly be a house number: it requires at
 * least one letter or digit (so `"   "` and `"--"` are out) and allows only the
 * separators the register actually uses.
 *
 * It is NOT a length guard — `@MaxLength(32)` is, and it exists separately
 * because an over-long value is otherwise a raw Postgres 22001, i.e. an
 * unhandled 500 rather than a validation error.
 */
export const HOUSE_NUMBER_PATTERN = /^(?=.*[\p{L}\p{N}])[\p{L}\p{N} .,/+_-]{1,32}$/u;

/**
 * Trim, and collapse internal runs of whitespace to one space.
 *
 * Case is deliberately left alone. Upper-casing would "normalise" `12 bis` into
 * `12 BIS`, which is not how the register writes it, and storing something the
 * user did not type is worse than the dedup miss it would save.
 *
 * Applied in TWO places, deliberately. On the DTO, because `meter.repository.ts`
 * builds its `Address` with `manager.create()` and never reaches
 * `AddressRepository.addAddress` — a repository-only fix would apply to members
 * and not to meters. And in `addAddress` itself, because that method is also
 * reached from service code that merges existing entities, which never passes
 * through `plainToInstance`.
 */
export function normaliseHouseNumber(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
