import { describe, expect, it } from "@jest/globals";
import {
  compareHouseNumbers,
  foldForCompare,
  formatSuggestionLabel,
  parseAddressQuery,
  scoreStreetName,
} from "../../../src/modules/geocoding/infra/suggest.parsing.js";

describe("(Unit) parseAddressQuery", () => {
  it("pivots on the postcode and drops the city that follows it", () => {
    // "bruxelles" is not part of any street name; leaving it in makes the
    // register's substring search match nothing.
    expect(parseAddressQuery("rue de la loi 1000 bruxelles")).toEqual({
      street: "rue de la loi",
      postcode: "1000",
      number: undefined,
    });
  });

  it("falls back to the segment AFTER the postcode when nothing precedes it", () => {
    expect(parseAddressQuery("1000 rue de la loi 16")).toEqual({
      street: "rue de la loi",
      postcode: "1000",
      number: "16",
    });
  });

  it("takes a trailing house number, including an alphanumeric one", () => {
    expect(parseAddressQuery("place de la station 20A 5000")).toEqual({
      street: "place de la station",
      postcode: "5000",
      number: "20A",
    });
  });

  it("does NOT take a LEADING number as a house number", () => {
    // "4 Bras" and "1er Mai" are real Belgian street names. Stealing the first
    // token would search for the wrong street and confidently return matches.
    expect(parseAddressQuery("4 bras 5100")).toEqual({
      street: "4 bras",
      postcode: "5100",
      number: undefined,
    });
  });

  it("does not strip the only remaining token as a house number", () => {
    // "20A" alone is a house number with no street; the register cannot search
    // on it, and consuming it would leave an empty query.
    expect(parseAddressQuery("20A")).toEqual({ street: "20A", postcode: undefined, number: undefined });
  });

  it("finds a house number written before the postcode, not just at the end", () => {
    // "<street> <number>, <postcode> <city>" is how people actually write an
    // address. An end-anchored rule reads "40" as part of the street name.
    expect(parseAddressQuery("rue neuve 40, 1000 bruxelles")).toEqual({
      street: "rue neuve",
      postcode: "1000",
      number: "40",
    });
  });

  it("keeps a five-digit number out of the postcode slot", () => {
    // A Belgian postcode is exactly four digits.
    expect(parseAddressQuery("rue x 12345").postcode).toBeUndefined();
  });

  it("takes only the first postcode", () => {
    expect(parseAddressQuery("rue 1000 x 5000").postcode).toBe("1000");
  });
});

describe("(Unit) scoreStreetName", () => {
  it("ranks an exact match above a prefix, and a prefix above a word match", () => {
    const exact = scoreStreetName("Rue Neuve", "rue neuve");
    const prefix = scoreStreetName("Rue Neuve-Haute", "rue neuve");
    const word = scoreStreetName("Place de la Station", "station");
    const middle = scoreStreetName("Grande Rue", "ande");

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(middle);
  });

  it("ignores accents and case, because people type Liege for Liège", () => {
    expect(scoreStreetName("Chaussée de Liège", "chaussee de liege")).toBe(100);
  });

  it("does not blow up on regex metacharacters in the query", () => {
    // The score builds a RegExp from user input; `(` unescaped would throw.
    expect(() => scoreStreetName("Rue (Haute)", "rue (")).not.toThrow();
  });
});

describe("(Unit) compareHouseNumbers", () => {
  it("orders numerically, not lexicographically", () => {
    // The one thing the old INT column gave for free: without this, 10 sorts
    // before 2 and the picker looks broken.
    expect(["10", "2", "1", "20"].sort(compareHouseNumbers)).toEqual(["1", "2", "10", "20"]);
  });

  it("keeps a letter suffix next to its number", () => {
    expect(["2B", "2", "2A", "3"].sort(compareHouseNumbers)).toEqual(["2", "2A", "2B", "3"]);
  });

  it("falls back to text order when neither side is numeric", () => {
    expect(compareHouseNumbers("A", "B")).toBeLessThan(0);
  });
});

describe("(Unit) formatSuggestionLabel", () => {
  it("renders an address row", () => {
    expect(formatSuggestionLabel({ street: "Place de la Station", number: "20A", postcode: "5000", city: "Namur" })).toBe(
      "Place de la Station 20A, 5000 Namur",
    );
  });

  it("renders a street row, which has no house number", () => {
    expect(formatSuggestionLabel({ street: "Place de la Station", postcode: "5000", city: "Namur" })).toBe("Place de la Station, 5000 Namur");
  });

  it("omits the trailing comma when neither postcode nor city is known", () => {
    expect(formatSuggestionLabel({ street: "Place de la Station", postcode: "", city: "" })).toBe("Place de la Station");
  });
});

describe("(Unit) foldForCompare", () => {
  it("strips diacritics and case", () => {
    expect(foldForCompare("  Chaussée de LIÈGE ")).toBe("chaussee de liege");
  });

  it("treats null and undefined as empty", () => {
    expect(foldForCompare(null)).toBe("");
    expect(foldForCompare(undefined)).toBe("");
  });
});
