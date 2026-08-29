/** Belgian market timezone for consumption settlement timestamps. */
export const CONSUMPTION_TIMEZONE = "Europe/Brussels";

/**
 * The timezone whose civil calendar defines "today" for this application.
 *
 * Deliberately a constant and not `process.env.TZ`. "Today" is a business fact —
 * a meter joins a sharing operation on a Belgian calendar day — so it must not
 * depend on where the process happens to run. The container sets no `TZ` at all,
 * which makes the host calendar UTC; between 22:00 and 24:00 UTC that is already
 * the *next* Belgian day, and a record the UI created "today" was filed as future.
 *
 * The Python annexes pin the same zone with `ZoneInfo("Europe/Brussels")` and
 * crm-frontend with `Intl`'s `timeZone` option. This is the same decision.
 */
export const APP_TIMEZONE = "Europe/Brussels";

/**
 * Calendar fields of `instant` as observed in `tz`, zero-padded.
 *
 * `formatToParts` rather than `format` so the result never depends on how a
 * locale happens to order or punctuate a date.
 */
function calendarPartsIn(tz: string, instant: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "";

  return { year: get("year"), month: get("month"), day: get("day") };
}

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
 * Today in `APP_TIMEZONE`, formatted as `YYYY-MM-DD`.
 *
 * Never read host-local components (`getFullYear()`…) or `toISOString()` for a
 * calendar comparison: the first is whatever timezone the container was given,
 * the second is always UTC, and both disagree with the Belgian civil date for
 * hours around midnight — which is exactly how a record starting today ends up
 * classified as future.
 */
export function appTodayISO(): string {
  const { year, month, day } = calendarPartsIn(APP_TIMEZONE, new Date());
  return `${year}-${month}-${day}`;
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
 * The last CLOSED calendar month, as `YYYY-MM`, in `APP_TIMEZONE`.
 *
 * "Closed" rather than "current" because a partial month is not comparable to
 * anything: a member opening the app on the 2nd would see two days of readings
 * and conclude their consumption had collapsed.
 *
 * Decrements the month as an integer rather than via `Date.setMonth`, which
 * would reintroduce a host-timezone instant halfway through the calculation.
 */
export function lastClosedMonthISO(): string {
  const { year, month } = calendarPartsIn(APP_TIMEZONE, new Date());
  const y = Number(year);
  const m = Number(month);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return `${prev.y}-${String(prev.m).padStart(2, "0")}`;
}
