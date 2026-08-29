import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { addDaysISO, appTodayISO, lastClosedMonthISO, monthBoundsISO, toCalendarDateString } from "../../../src/shared/utils/date.utils.js";

/**
 * Timezones chosen to straddle Brussels from both sides: Kiritimati (UTC+14) is
 * already on the next calendar day while Brussels is still on the previous one,
 * Midway (UTC-11) is still on the previous day, and UTC is what a container with
 * no `TZ` gets — which is what actually broke production.
 */
const HOSTILE_TIMEZONES = ["Pacific/Kiritimati", "Pacific/Midway", "UTC", "Europe/Brussels"];

describe("(Unit) date.utils", () => {
  describe("toCalendarDateString", () => {
    it("extracts YYYY-MM-DD from a UTC-midnight Date (class-transformer query param)", () => {
      const d = new Date("2025-02-01T00:00:00.000Z");
      expect(toCalendarDateString(d)).toBe("2025-02-01");
    });

    it("uses UTC components so host timezone does not shift the calendar day", () => {
      const d = new Date("2025-02-28T00:00:00.000Z");
      expect(toCalendarDateString(d)).toBe("2025-02-28");
    });
  });

  describe("addDaysISO", () => {
    it("rolls over a month boundary", () => {
      expect(addDaysISO("2026-08-31", 1)).toBe("2026-09-01");
    });

    it("steps back a day, which is how a predecessor record is closed", () => {
      expect(addDaysISO("2026-08-21", -1)).toBe("2026-08-20");
    });

    it("handles a leap day", () => {
      expect(addDaysISO("2024-02-28", 1)).toBe("2024-02-29");
    });
  });

  describe("monthBoundsISO", () => {
    it("returns inclusive first and last days", () => {
      expect(monthBoundsISO("2026-07")).toEqual({ start: "2026-07-01", end: "2026-07-31" });
    });

    it("gets February right in a leap year", () => {
      expect(monthBoundsISO("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    });
  });

  describe("appTodayISO", () => {
    const originalTz = process.env.TZ;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      process.env.TZ = originalTz;
    });

    it("returns the Belgian civil day, not the UTC one, inside the midnight window", () => {
      // The exact instant from the production incident: 00:06 in Brussels (CEST,
      // UTC+2) but still the 20th in UTC. Reading UTC here is what filed a record
      // created "today" as a future record.
      jest.setSystemTime(new Date("2026-08-20T22:06:00.000Z"));
      expect(appTodayISO()).toBe("2026-08-21");
    });

    it("handles the narrower winter window, when Brussels is UTC+1", () => {
      jest.setSystemTime(new Date("2026-01-15T23:30:00.000Z"));
      expect(appTodayISO()).toBe("2026-01-16");
    });

    it("agrees with UTC during the rest of the day", () => {
      jest.setSystemTime(new Date("2026-08-21T10:00:00.000Z"));
      expect(appTodayISO()).toBe("2026-08-21");
    });

    it.each(HOSTILE_TIMEZONES)("is unaffected by the host timezone (%s)", (tz) => {
      jest.setSystemTime(new Date("2026-08-20T22:06:00.000Z"));
      process.env.TZ = tz;
      expect(appTodayISO()).toBe("2026-08-21");
    });
  });

  describe("lastClosedMonthISO", () => {
    const originalTz = process.env.TZ;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      process.env.TZ = originalTz;
    });

    it("returns the previous month", () => {
      jest.setSystemTime(new Date("2026-08-21T10:00:00.000Z"));
      expect(lastClosedMonthISO()).toBe("2026-07");
    });

    it("rolls back across a year boundary that is also a timezone boundary", () => {
      // 00:30 on 1 Jan 2027 in Brussels, still 31 Dec 2026 in UTC. The Belgian
      // civil month is January 2027, so the last closed month is December 2026.
      jest.setSystemTime(new Date("2026-12-31T23:30:00.000Z"));
      expect(lastClosedMonthISO()).toBe("2026-12");
    });

    it("rolls back to the previous December from early January", () => {
      jest.setSystemTime(new Date("2026-01-05T12:00:00.000Z"));
      expect(lastClosedMonthISO()).toBe("2025-12");
    });

    it.each(HOSTILE_TIMEZONES)("is unaffected by the host timezone (%s)", (tz) => {
      jest.setSystemTime(new Date("2026-08-31T23:30:00.000Z"));
      process.env.TZ = tz;
      // 01:30 on 1 Sep in Brussels → current month is September → last closed is August.
      expect(lastClosedMonthISO()).toBe("2026-08");
    });
  });
});
