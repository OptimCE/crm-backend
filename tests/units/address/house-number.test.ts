import { describe, expect, it } from "@jest/globals";
import { HOUSE_NUMBER_PATTERN, normaliseHouseNumber } from "../../../src/shared/address/house-number.js";
import { houseNumberToString } from "../../../src/shared/address/numeric.transformer.js";

/**
 * `address.number` was an INT until 2026-08-30, which meant the schema could not
 * store what the federal BeSt Address register actually returns. These are real
 * values from the register, not invented edge cases: `20A` and `2B` both appear
 * on one street in Namur.
 */
describe("(Unit) HOUSE_NUMBER_PATTERN", () => {
  it.each(["1", "12", "20A", "2B", "12-14", "1/3", "2/0001", "12 bis", "+12", "16"])("accepts %s, which the BeSt register returns", (value) => {
    expect(HOUSE_NUMBER_PATTERN.test(value)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["   ", "whitespace only — there is no letter or digit"],
    ["--", "separators only"],
    ["<script>", "angle brackets are not a house number"],
    ["12; DROP TABLE", "a semicolon is not a separator the register uses"],
  ])("rejects %s (%s)", (value) => {
    expect(HOUSE_NUMBER_PATTERN.test(value)).toBe(false);
  });

  it("does not bound length — @MaxLength(32) does that", () => {
    // Kept explicit because the two guards are easy to conflate: without the
    // separate MaxLength an over-long value is a raw Postgres 22001, i.e. an
    // unhandled 500 rather than a 422.
    expect(HOUSE_NUMBER_PATTERN.test("1".repeat(32))).toBe(true);
    expect(HOUSE_NUMBER_PATTERN.test("1".repeat(33))).toBe(false);
  });

  it("is not anchored to Belgium's alphabet only", () => {
    expect(HOUSE_NUMBER_PATTERN.test("12é")).toBe(true);
  });
});

describe("(Unit) normaliseHouseNumber", () => {
  it("trims, so ' 12 ' dedups against '12'", () => {
    // The whole point: as an INT these were the same value. As text they are
    // two different strings, and addAddress dedups on equality — so without
    // this the same address is inserted again on every write.
    expect(normaliseHouseNumber(" 12 ")).toBe("12");
  });

  it("collapses internal whitespace", () => {
    expect(normaliseHouseNumber("12   bis")).toBe("12 bis");
  });

  it("leaves case alone", () => {
    // Upper-casing would rewrite `12 bis` to `12 BIS`, which is not how the
    // register writes it. Storing something the user did not type is worse than
    // the dedup miss it would save.
    expect(normaliseHouseNumber("12 bis")).toBe("12 bis");
    expect(normaliseHouseNumber("20a")).toBe("20a");
  });

  it("leaves an already-clean value untouched", () => {
    expect(normaliseHouseNumber("20A")).toBe("20A");
  });
});

/**
 * The transformer is what let the column change type in a separate deploy from
 * the code: it yields a string whether node-postgres hands back an int (old
 * column) or a string (new one).
 */
describe("(Unit) houseNumberToString transformer", () => {
  it("stringifies the number an INT column still returns", () => {
    expect(houseNumberToString.from(16)).toBe("16");
  });

  it("passes through the string a VARCHAR column returns", () => {
    expect(houseNumberToString.from("20A")).toBe("20A");
  });

  it("keeps null null", () => {
    expect(houseNumberToString.from(null)).toBeNull();
  });

  it("writes back what it was given", () => {
    expect(houseNumberToString.to("20A")).toBe("20A");
    expect(houseNumberToString.to(undefined)).toBeNull();
  });
});
