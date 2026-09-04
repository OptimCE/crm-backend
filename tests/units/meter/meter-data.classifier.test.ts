import { describe, expect, it } from "@jest/globals";
import { classifyMeterDataByDate } from "../../../src/modules/meters/shared/meter-data.classifier.js";
import type { MeterData } from "../../../src/modules/meters/domain/meter.models.js";
import type { MetersDataDTO } from "../../../src/modules/meters/api/meter.dtos.js";

const TODAY = "2026-08-21";
const YESTERDAY = "2026-08-20";
const TOMORROW = "2026-08-22";

/** The classifier only reads `start_date` and `end_date`; the rest is irrelevant here. */
const record = (id: number, start_date: string, end_date: string | null = null): MeterData => ({ id, start_date, end_date }) as unknown as MeterData;

/** Identity-ish mapper so buckets can be asserted by id. */
const toDto = (data: MeterData): MetersDataDTO => ({ id: data.id }) as unknown as MetersDataDTO;

const ids = (rows: MetersDataDTO[]): number[] => rows.map((r) => r.id);

describe("(Unit) classifyMeterDataByDate", () => {
  it("treats a record starting TODAY as active, not future", () => {
    // The production bug: the UI creates a record dated today and the backend,
    // reading a UTC calendar day, files it under `future`.
    const { active, future, history } = classifyMeterDataByDate([record(1, TODAY)], toDto, TODAY);

    expect(active?.id).toBe(1);
    expect(ids(future)).toEqual([]);
    expect(ids(history)).toEqual([]);
  });

  it("treats a record whose end_date IS today as active, not history", () => {
    // `end_date` is the last day the record is in force — `addMeterData` closes a
    // predecessor with `end_date = newStart - 1 day` — so today is still inside it.
    const { active, history } = classifyMeterDataByDate([record(1, "2026-01-01", TODAY)], toDto, TODAY);

    expect(active?.id).toBe(1);
    expect(ids(history)).toEqual([]);
  });

  it("files a record that ended yesterday as history", () => {
    const { active, history } = classifyMeterDataByDate([record(1, "2026-01-01", YESTERDAY)], toDto, TODAY);

    expect(active).toBeUndefined();
    expect(ids(history)).toEqual([1]);
  });

  it("files a record starting tomorrow as future", () => {
    const { active, future } = classifyMeterDataByDate([record(1, TOMORROW)], toDto, TODAY);

    expect(active).toBeUndefined();
    expect(ids(future)).toEqual([1]);
  });

  it("splits a full history across the three buckets", () => {
    const { active, history, future } = classifyMeterDataByDate(
      [record(1, "2025-01-01", "2026-06-30"), record(2, "2026-07-01"), record(3, TOMORROW)],
      toDto,
      TODAY,
    );

    expect(active?.id).toBe(2);
    expect(ids(history)).toEqual([1]);
    expect(ids(future)).toEqual([3]);
  });

  it("handles a handover pair: predecessor closed yesterday, successor starts today", () => {
    const { active, history, future } = classifyMeterDataByDate([record(1, "2026-01-01", YESTERDAY), record(2, TODAY)], toDto, TODAY);

    expect(active?.id).toBe(2);
    expect(ids(history)).toEqual([1]);
    expect(ids(future)).toEqual([]);
  });

  it("keeps the first of overlapping active records and does not drop the rest", () => {
    const { active, history } = classifyMeterDataByDate([record(1, "2026-07-01"), record(2, "2026-07-15")], toDto, TODAY);

    expect(active?.id).toBe(1);
    expect(ids(history)).toEqual([2]);
  });

  it("returns empty buckets for a meter with no configuration records", () => {
    for (const input of [undefined, null, []]) {
      const { active, history, future } = classifyMeterDataByDate(input, toDto, TODAY);

      expect(active).toBeUndefined();
      expect(history).toEqual([]);
      expect(future).toEqual([]);
    }
  });
});
