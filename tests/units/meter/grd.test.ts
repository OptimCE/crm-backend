import { describe, expect, it } from "@jest/globals";
import { LEGACY_GRD_IDS, normaliseGrd } from "../../../src/modules/meters/shared/grd.js";
import { CreateMeterDataDTO, PatchMeterDataDTO } from "../../../src/modules/meters/api/meter.dtos.js";
import { validateDto } from "../../../src/shared/utils/dto.validator.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { ClientType, MeterDataStatus, MeterRate } from "../../../src/modules/meters/shared/meter.types.js";

/** The 16 ids of the belgian-dso-map release that `meter_data.grd` stores. */
const IDS = [
  "ores",
  "resa",
  "aieg",
  "aiesh",
  "rew",
  "sibelga",
  "fluvius-antwerpen",
  "fluvius-halle-vilvoorde",
  "fluvius-imewo",
  "fluvius-kempen",
  "fluvius-limburg",
  "fluvius-midden-vlaanderen",
  "fluvius-west",
  "fluvius-zenne-dijle",
  "enexis",
  "elia",
];

describe("(Unit) normaliseGrd", () => {
  it.each([
    // The frontend's former display names (GRD_OPTIONS), as stored until now.
    ["ORES", "ores"],
    ["RESA", "resa"],
    ["AIEG", "aieg"],
    ["AIESH", "aiesh"],
    ["REW", "rew"],
    ["Sibelga", "sibelga"],
    ["Fluvius Antwerpen", "fluvius-antwerpen"],
    ["Fluvius Halle-Vilvoorde", "fluvius-halle-vilvoorde"],
    ["Fluvius Imewo", "fluvius-imewo"],
    ["Fluvius Kempen", "fluvius-kempen"],
    ["Fluvius Limburg", "fluvius-limburg"],
    ["Fluvius Midden-Vlaanderen", "fluvius-midden-vlaanderen"],
    ["Fluvius West", "fluvius-west"],
    ["Fluvius Zenne-Dijle", "fluvius-zenne-dijle"],
    ["ELIA", "elia"],
    ["Enexis", "enexis"],
  ])("maps the legacy name %j to %j", (legacy, id) => {
    expect(normaliseGrd(legacy)).toBe(id);
  });

  it.each([
    ["  ores  ", "ores"],
    ["Ores", "ores"],
    ["FLUVIUS MIDDEN VLAANDEREN", "fluvius-midden-vlaanderen"],
    ["fluvius  -  midden--vlaanderen", "fluvius-midden-vlaanderen"],
    ["Fluvius_Imewo", "Fluvius_Imewo"],
  ])("trims, ignores case, and treats spaces and hyphens alike: %j -> %j", (raw, expected) => {
    expect(normaliseGrd(raw)).toBe(expected);
  });

  it.each(IDS)("is idempotent on the id %j", (id) => {
    expect(normaliseGrd(id)).toBe(id);
    expect(normaliseGrd(normaliseGrd(id))).toBe(id);
  });

  it("knows exactly the release's 16 ids", () => {
    expect([...new Set(Object.values(LEGACY_GRD_IDS))].sort()).toEqual([...IDS].sort());
  });

  it.each([
    // A bare "Fluvius" names eight DSOs: guessing one would be plausible and wrong.
    "Fluvius",
    "Some Future DSO",
    "",
    // An inherited property of every object, which a plain `map[key]` would find.
    "constructor",
    "__proto__",
  ])("keeps an unknown value exactly as sent: %j", (value) => {
    expect(normaliseGrd(value)).toBe(value);
  });
});

describe("(Unit) CreateMeterDataDTO / PatchMeterDataDTO grd fields", () => {
  const base = {
    start_date: "2026-10-01",
    status: MeterDataStatus.ACTIVE,
    rate: MeterRate.SIMPLE,
    client_type: ClientType.RESIDENTIAL,
  };

  async function rejectionOf(body: Record<string, unknown>): Promise<number | undefined> {
    try {
      await validateDto(CreateMeterDataDTO, { ...base, ...body });
    } catch (err) {
      return (err as { errorCode?: number }).errorCode;
    }
    return undefined;
  }

  it("rewrites a legacy name to its id before validating", async () => {
    const dto = await validateDto(CreateMeterDataDTO, { ...base, grd: "Fluvius Midden-Vlaanderen" });

    expect(dto.grd).toBe("fluvius-midden-vlaanderen");
  });

  it("keeps an unknown value — free text, no @IsIn", async () => {
    const dto = await validateDto(CreateMeterDataDTO, { ...base, grd: "Some Future DSO" });

    expect(dto.grd).toBe("Some Future DSO");
  });

  it("accepts the provenance of a prefilled value, draft data included", async () => {
    const released = await validateDto(CreateMeterDataDTO, { ...base, grd: "ores", grd_source: "auto", grd_data_version: "2026.10.0" });
    const draft = await validateDto(PatchMeterDataDTO, {
      ...base,
      EAN: "541448200000000001",
      grd: "ores",
      grd_source: "auto",
      grd_data_version: "2026.10.12-draft",
    });

    expect(released).toMatchObject({ grd: "ores", grd_source: "auto", grd_data_version: "2026.10.0" });
    expect(draft).toMatchObject({ grd_source: "auto", grd_data_version: "2026.10.12-draft" });
  });

  it("accepts a manual value without a data version, and explicit nulls", async () => {
    expect(await rejectionOf({ grd: "resa", grd_source: "manual" })).toBeUndefined();
    expect(await rejectionOf({ grd: "resa", grd_source: null, grd_data_version: null })).toBeUndefined();
  });

  it.each([
    { label: "a grd over 64 characters", body: { grd: "x".repeat(65) } },
    { label: "a non-string grd", body: { grd: 12 } },
    { label: "an unknown grd_source", body: { grd: "ores", grd_source: "guessed" } },
    { label: "a data version without its patch number", body: { grd: "ores", grd_data_version: "2026.10" } },
    { label: "a data version with another suffix", body: { grd: "ores", grd_data_version: "2026.10.0-rc1" } },
    { label: "a data version over 32 characters", body: { grd: "ores", grd_data_version: `2026.10.${"9".repeat(30)}` } },
  ])("rejects $label with a 422", async ({ body }) => {
    expect(await rejectionOf(body)).toBe(METER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING.errorCode);
  });
});
