import { describe, expect, it } from "@jest/globals";
import { numericToNumber } from "../../../src/shared/address/numeric.transformer.js";

/**
 * Guards the one failure mode in this file that produces NO error anywhere:
 * node-postgres hands back `numeric` as a string, TypeORM does not coerce it,
 * the JSON response carries `"50.8467"` instead of `50.8467`, and MapLibre
 * silently refuses to plot the point.
 */
describe("(Unit) numericToNumber transformer", () => {
  describe("from (database -> entity)", () => {
    it("converts the string node-postgres returns into a real number", () => {
      const value = numericToNumber.from("50.846700");

      expect(typeof value).toBe("number");
      expect(value).toBeCloseTo(50.8467, 6);
    });

    it("keeps a negative longitude negative", () => {
      expect(numericToNumber.from("-4.352500")).toBeCloseTo(-4.3525, 6);
    });

    it("passes a number straight through", () => {
      expect(numericToNumber.from(4.3525)).toBe(4.3525);
    });

    it("maps null to null rather than 0", () => {
      // Number(null) is 0, which would place every un-geocoded address off the
      // coast of Africa. This is the whole reason the null branch is explicit.
      expect(numericToNumber.from(null)).toBeNull();
    });
  });

  describe("to (entity -> database)", () => {
    it("passes a number through unchanged", () => {
      expect(numericToNumber.to(50.8467)).toBe(50.8467);
    });

    it("normalises undefined to null so the column is cleared, not skipped", () => {
      expect(numericToNumber.to(undefined)).toBeNull();
      expect(numericToNumber.to(null)).toBeNull();
    });

    it("preserves 0, which is a valid coordinate on the prime meridian", () => {
      expect(numericToNumber.to(0)).toBe(0);
    });
  });
});
