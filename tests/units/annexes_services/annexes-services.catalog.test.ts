import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { plainToInstance } from "class-transformer";
import { CommunityAnnexDTO } from "../../../src/modules/annexes_services/api/annexes-services.dtos.js";
import type { AnnexCatalogEntry, AnnexCatalogFile } from "../../../src/modules/annexes_services/domain/annexes-services.types.js";

/**
 * Reads the real `config/annexes-services.json`, the same path the service loads.
 * The catalog is baked into the image and drives the Annex services page, so a
 * wrong key ships silently: the confirm dialog would show the raw i18n key.
 */
const CATALOG_PATH = resolve(process.cwd(), "config", "annexes-services.json");
const catalog = (JSON.parse(readFileSync(CATALOG_PATH, "utf-8")) as AnnexCatalogFile).modules;

const LIVE_DATA_WARNING = "ANNEXES_SERVICES.LIVE_DATA.UNSUBSCRIBE_WARNING";

function entryFor(feature: string): AnnexCatalogEntry {
  const entry = catalog.find((m) => m.feature === feature);
  if (!entry) throw new Error(`catalog has no "${feature}" entry`);
  return entry;
}

describe("(Unit) annexes-services catalog", () => {
  // live-data D-14 (2026-10-04): members see their own sharing operation(s) in
  // the Live Data annex. The catalogue is FILTERED BY ROLE before it reaches the
  // SPA, so a MANAGER minRole here would hide the annex from every member
  // entirely - the member view would exist and be unreachable. The live-data
  // service itself decides what a member may read; this only lets them reach it.
  it("lets members reach live-data", () => {
    expect(entryFor("live-data").minRole).toBe("MEMBER");
  });

  describe("unsubscribeWarningKey", () => {
    it("declares the live-data unsubscribe warning", () => {
      expect(entryFor("live-data").unsubscribeWarningKey).toBe(LIVE_DATA_WARNING);
    });

    it("uses an ANNEXES_SERVICES.*.UNSUBSCRIBE_WARNING key whenever one is declared", () => {
      const declared = catalog.filter((m) => m.unsubscribeWarningKey !== undefined);
      expect(declared.length).toBeGreaterThan(0);
      for (const entry of declared) {
        expect(entry.unsubscribeWarningKey).toMatch(/^ANNEXES_SERVICES\.[A-Z_]+\.UNSUBSCRIBE_WARNING$/);
        // Same namespace as the module's own name, so an entry copied from
        // another one cannot show that other module's warning.
        expect(entry.unsubscribeWarningKey).toBe(`${entry.displayKey.replace(/\.NAME$/, "")}.UNSUBSCRIBE_WARNING`);
      }
    });

    // The service maps with `excludeExtraneousValues: true`: a DTO field
    // without `@Expose()` is dropped with no error, and the warning never shows.
    it("survives excludeExtraneousValues", () => {
      const dto = plainToInstance(CommunityAnnexDTO, { ...entryFor("live-data"), subscribed: true }, { excludeExtraneousValues: true });
      expect(dto.unsubscribeWarningKey).toBe(LIVE_DATA_WARNING);
    });

    it("is absent from the JSON of a module that declares none", () => {
      const dto = plainToInstance(CommunityAnnexDTO, { ...entryFor("algorithm"), subscribed: false }, { excludeExtraneousValues: true });
      const wire = JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
      expect(wire).not.toHaveProperty("unsubscribeWarningKey");
      expect(wire.feature).toBe("algorithm");
    });
  });
});
