import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { exportableAttributes } from "../../../src/shared/iam/implementations/keycloak.iam.service.js";
import { consumptionRow, iso, yearsCovered } from "../../../src/modules/exports/crm/crm-export.mappers.js";

describe("(Unit) crm export: identity", () => {
  it("keeps the user's attributes as lists of strings", () => {
    expect(exportableAttributes({ locale: ["fr"], phone: "0471", consent: [true, null] })).toEqual({
      locale: ["fr"],
      phone: ["0471"],
      consent: ["true"],
    });
    expect(exportableAttributes(undefined)).toEqual({});
  });

  it("drops any attribute whose name could hold a secret", () => {
    const attributes = {
      locale: ["fr"],
      password: ["x"],
      totp_secret: ["x"],
      api_token: ["x"],
      otpCredential: ["x"],
      password_hash: ["x"],
      salt: ["x"],
      privateKey: ["x"],
    };
    expect(Object.keys(exportableAttributes(attributes))).toEqual(["locale"]);
  });
});

describe("(Unit) crm export: readings", () => {
  it("lists the calendar years the holding periods cover, an open one until today", () => {
    const today = new Date("2026-03-01T00:00:00Z");
    expect(yearsCovered([{ start: "2024-11-15", end: "2025-02-01" }], today)).toEqual([2024, 2025]);
    expect(yearsCovered([{ start: "2025-06-01", end: null }], today)).toEqual([2025, 2026]);
    expect(yearsCovered([{ start: "2027-01-01", end: null }], today)).toEqual([]);
    expect(
      yearsCovered(
        [
          { start: null, end: null },
          { start: "2026-01-01", end: "2030-01-01" },
        ],
        today,
      ),
    ).toEqual([2026]);
  });

  it("writes a reading as stored, nulls empty", () => {
    expect(
      consumptionRow({ timestamp: new Date("2024-01-01T12:00:00Z"), gross: 1, net: 0.8, shared: 0.2, inj_gross: null, inj_shared: null, inj_net: 0 }),
    ).toEqual(["2024-01-01T12:00:00.000Z", 1, 0.8, 0.2, null, null, 0]);
    expect([iso("2024-01-01"), iso(null), iso(undefined)]).toEqual(["2024-01-01", null, null]);
  });
});

describe("(Unit) crm export: index.html labels", () => {
  it("has a label in the four languages for every counter the part emits", () => {
    const sources = ["src/modules/exports/crm/crm-export.user.ts", "src/modules/exports/crm/crm-export.community.ts"]
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    const counters = [...new Set([...sources.matchAll(/ctx\.count\(\s*"([a-z_]+)"/gu)].map((m) => m[1]))].sort();
    expect(counters.length).toBeGreaterThan(10);
    for (const lang of ["fr", "en", "nl", "de"]) {
      const labels = JSON.parse(readFileSync(`assets/export/i18n/${lang}.json`, "utf8")).labels as Record<string, string>;
      expect([lang, counters.filter((c) => !labels[`export.crm.${c}`])]).toEqual([lang, []]);
    }
  });
});
