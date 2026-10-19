import { describe, expect, it } from "@jest/globals";
import { computeWarnings } from "../../../src/modules/dso/shared/dso-warnings.js";
import { communeNamed, normaliseName, toNisString } from "../../../src/modules/dso/shared/dso-names.js";
import type { DsoCommune, DsoEanCheck, DsoResult } from "../../../src/modules/dso/domain/dso.types.js";

function result(region: DsoResult["region"], regulator: string): DsoResult {
  return {
    ins: "00000",
    commune: { fr: "X", nl: "X", de: "X" },
    section: null,
    region,
    regulator,
    elec: { operator: "ores", designated: "ores" },
    gas: { status: "none", operator: null },
    flags: [],
    note: null,
    source_ids: [],
    valid_from: null,
    data_version: "2026.10.0",
  };
}

const SIBELGA: DsoEanCheck = { format: true, belgian_prefix: true, gs1_check: true, known_operator: "sibelga" };
const PLAIN: DsoEanCheck = { format: true, belgian_prefix: true, gs1_check: true, known_operator: null };

describe("(Unit) computeWarnings", () => {
  it("is empty when the address matches the community's regulator", () => {
    expect(computeWarnings(result("WAL", "BE-WAL-CWAPE"), PLAIN, "BE-WAL-CWAPE")).toEqual([]);
  });

  it("flags an address under another regulator, naming both", () => {
    expect(computeWarnings(result("BRU", "BE-BRU-BRUGEL"), null, "BE-WAL-CWAPE")).toEqual([
      { code: "REGION_OUTSIDE_COMMUNITY_REGULATOR", params: { address_regulator: "BE-BRU-BRUGEL", community_regulator: "BE-WAL-CWAPE" } },
    ]);
  });

  it("says nothing about the regulator when the community's is unknown", () => {
    expect(computeWarnings(result("VLA", "BE-VLA-VREG"), null, null)).toEqual([]);
  });

  it("flags a Sibelga EAN outside Brussels", () => {
    expect(computeWarnings(result("WAL", "BE-WAL-CWAPE"), SIBELGA, "BE-WAL-CWAPE")).toEqual([
      { code: "EAN_SIBELGA_OUTSIDE_BRUSSELS", params: { region: "WAL" } },
    ]);
  });

  it("accepts a Sibelga EAN in Brussels", () => {
    expect(computeWarnings(result("BRU", "BE-BRU-BRUGEL"), SIBELGA, "BE-BRU-BRUGEL")).toEqual([]);
  });

  it("can raise both, regulator first", () => {
    expect(computeWarnings(result("VLA", "BE-VLA-VREG"), SIBELGA, "BE-WAL-CWAPE").map((w) => w.code)).toEqual([
      "REGION_OUTSIDE_COMMUNITY_REGULATOR",
      "EAN_SIBELGA_OUTSIDE_BRUSSELS",
    ]);
  });

  it("is empty without a resolved result — a choice is still pending", () => {
    expect(computeWarnings(null, SIBELGA, "BE-WAL-CWAPE")).toEqual([]);
    expect(computeWarnings(undefined, SIBELGA, "BE-WAL-CWAPE")).toEqual([]);
  });
});

describe("(Unit) normaliseName", () => {
  it.each([
    ["Liège", "liege"],
    ["Sint-Jans-Molenbeek", "sintjansmolenbeek"],
    ["SINT JANS MOLENBEEK", "sintjansmolenbeek"],
    ["Écaussinnes-d'Enghien", "ecaussinnesdenghien"],
    ["Brüssel", "brussel"],
    ["  Namur ", "namur"],
    ["", ""],
  ])("%j -> %j", (raw, expected) => {
    expect(normaliseName(raw)).toBe(expected);
  });

  it("treats null and undefined as empty", () => {
    expect(normaliseName(null)).toBe("");
    expect(normaliseName(undefined)).toBe("");
  });
});

describe("(Unit) communeNamed", () => {
  const ETTERBEEK: DsoCommune = { ins: "21005", names: { fr: "Etterbeek", nl: "Etterbeek", de: "Etterbeek" }, region: "BRU", province: "" };
  const BRUXELLES: DsoCommune = { ins: "21004", names: { fr: "Bruxelles", nl: "Brussel", de: "Brüssel" }, region: "BRU", province: "" };

  it("finds the commune by any of its three names", () => {
    expect(communeNamed([ETTERBEEK, BRUXELLES], "brussel")?.ins).toBe("21004");
    expect(communeNamed([ETTERBEEK, BRUXELLES], "Brüssel")?.ins).toBe("21004");
  });

  it("is null for no match, an empty city, or a name two candidates share", () => {
    expect(communeNamed([ETTERBEEK, BRUXELLES], "Ixelles")).toBeNull();
    expect(communeNamed([ETTERBEEK, BRUXELLES], "")).toBeNull();
    expect(communeNamed([ETTERBEEK, { ...BRUXELLES, names: { fr: "Etterbeek", nl: "", de: "" } }], "Etterbeek")).toBeNull();
  });
});

describe("(Unit) toNisString", () => {
  it("zero-pads to five digits, as dso-lookup keys on", () => {
    expect(toNisString(1000)).toBe("01000");
    expect(toNisString(92094)).toBe("92094");
  });
});
