import type { MeterData } from "../domain/meter.models.js";
import type { MetersDataDTO } from "../api/meter.dtos.js";

/** A meter's configuration history split into the three buckets the detail views render. */
export interface ClassifiedMeterData {
  /** The record in force on the reference day, if any. */
  active?: MetersDataDTO;
  /** Records that ended before the reference day, plus any overlapping extras. */
  history: MetersDataDTO[];
  /** Records that only start after the reference day. */
  future: MetersDataDTO[];
}

/**
 * Split a meter's configuration records into history / active / future.
 *
 * Comparisons are lexicographic on `YYYY-MM-DD` strings, which is exactly a
 * calendar comparison for that format and — unlike anything built on `Date` —
 * cannot be shifted by the process timezone. Pass `today` from `appTodayISO()`
 * so the boundary is the Belgian civil day.
 *
 * Both bounds are INCLUSIVE, matching the repository queries and the writer:
 * `addMeterData` closes a predecessor with `end_date = newStart - 1 day`, so
 * `end_date` is the last day the record is in force and a record whose
 * `end_date` *is* `today` is still active.
 *
 * Overlaps should not occur in valid data; when they do, the first match wins
 * and the rest fall into `history` rather than being dropped.
 */
export function classifyMeterDataByDate(
  meter_data: MeterData[] | null | undefined,
  toDto: (data: MeterData) => MetersDataDTO,
  today: string,
): ClassifiedMeterData {
  const history: MetersDataDTO[] = [];
  const future: MetersDataDTO[] = [];
  let active: MetersDataDTO | undefined;

  for (const data of meter_data ?? []) {
    const dataDto = toDto(data);

    if (data.start_date > today) {
      future.push(dataDto);
    } else if (data.end_date && data.end_date < today) {
      history.push(dataDto);
    } else if (!active) {
      active = dataDto;
    } else {
      history.push(dataDto);
    }
  }

  return { active, history, future };
}
