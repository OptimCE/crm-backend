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
