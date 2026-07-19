import { describe, expect, it } from "@jest/globals";
import { toCalendarDateString } from "../../../src/shared/utils/date.utils.js";

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
});
