/** Belgian market timezone for consumption settlement timestamps. */
export const CONSUMPTION_TIMEZONE = "Europe/Brussels";

/**
 * Extract `YYYY-MM-DD` from a `Date` produced by class-transformer on query params.
 * Uses UTC components so `2025-02-01` round-trips regardless of host timezone.
 */
export function toCalendarDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Add `n` days to a `YYYY-MM-DD` calendar date string.
 *
 * Performs UTC arithmetic so the result is independent of the host timezone
 * and DST transitions; `setUTCDate` handles month/year overflow.
 */
export function addDaysISO(yyyymmdd: string, n: number): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Today in the host's local timezone, formatted as `YYYY-MM-DD`.
 *
 * Avoid `new Date().toISOString().slice(0,10)` for calendar comparisons:
 * it returns the UTC date, which can disagree with the local civil date for hours
 * around midnight and produces TZ-dependent NOW/FUTURE classification.
 */
export function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * First and last calendar day of a `YYYY-MM` month, both inclusive.
 *
 * UTC arithmetic, like `addDaysISO`: `setUTCMonth(m + 1, 0)` rolls to the last
 * day of the requested month and handles February and leap years without a
 * table. The result is a pair of plain calendar strings, never an instant.
 */
export function monthBoundsISO(yyyymm: string): { start: string; end: string } {
  const start = `${yyyymm}-01`;
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return { start, end: d.toISOString().slice(0, 10) };
}

/**
 * The last CLOSED calendar month, as `YYYY-MM`, in the host's local timezone.
 *
 * "Closed" rather than "current" because a partial month is not comparable to
 * anything: a member opening the app on the 2nd would see two days of readings
 * and conclude their consumption had collapsed. Local components for the same
 * reason as `localTodayISO`.
 */
export function lastClosedMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
