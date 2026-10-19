import { describe, expect, it, jest } from "@jest/globals";
import type { DeepPartial } from "typeorm";
import { MeterRepository } from "../../../src/modules/meters/infra/meter.repository.js";
import type { MeterData } from "../../../src/modules/meters/domain/meter.models.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { createMockAuthContextRepository } from "../../repository_mocked/authcontext.repository.mock.js";

/**
 * `grd_source` and `grd_data_version` describe the `grd` next to them, so the
 * three must move together through both of addMeterData's paths: a new window
 * (create) and a same-day correction (merge).
 *
 * The manager is a fake, and its `merge` copies exactly what TypeORM's does for
 * a plain column: every key that is not `undefined`, `null` included. A fake
 * more forgiving than that would hide the very bug this guards. The real thing
 * runs in tests/functionals/meter/meter-data-grd-provenance.functional.test.ts.
 */

const LATEST = {
  id: 10,
  start_date: "2026-01-01",
  end_date: null,
  status: MeterDataStatus.ACTIVE,
  grd: "ores",
  grd_source: "auto",
  grd_data_version: "2026.10.0",
} as MeterData;

function fakeManager(latest: MeterData | null): {
  manager: Record<string, jest.Mock>;
  saved: Record<string, unknown>[];
} {
  const saved: Record<string, unknown>[] = [];
  const manager = {
    exists: jest.fn(async () => true),
    findOne: jest.fn(async () => (latest ? { ...latest } : null)),
    merge: jest.fn((_entity: unknown, target: Record<string, unknown>, source: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(source)) {
        if (value !== undefined) target[key] = value;
      }
      return target;
    }),
    create: jest.fn((_entity: unknown, plain: Record<string, unknown>) => ({ ...plain })),
    save: jest.fn(async (entity: Record<string, unknown>) => {
      saved.push(entity);
      return entity;
    }),
  };
  return { manager, saved };
}

async function addMeterData(latest: MeterData | null, new_data: DeepPartial<MeterData>): Promise<Record<string, unknown>> {
  const { manager, saved } = fakeManager(latest);
  const authContext = createMockAuthContextRepository();
  authContext.getInternalCommunityId.mockResolvedValue(1);
  const repository = new MeterRepository({ manager } as never, authContext);

  await repository.addMeterData("541448200000000001", { member: null, ...new_data });

  // The row written last is the configuration the call produced.
  return saved[saved.length - 1];
}

function provenance(row: Record<string, unknown>): unknown[] {
  return [row.grd, row.grd_source, row.grd_data_version];
}

describe("(Unit) MeterRepository.addMeterData - GRD provenance", () => {
  describe("a new window", () => {
    it("takes grd, source and version from the request when grd is sent", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-11-01", grd: "rew", grd_source: "auto", grd_data_version: "2026.11.0" });

      expect(provenance(row)).toEqual(["rew", "auto", "2026.11.0"]);
    });

    it("does NOT inherit the provenance when grd is sent without one", async () => {
      // An older frontend sends a grd alone. Keeping "auto / 2026.10.0" would
      // label a value the prefill never produced.
      const row = await addMeterData(LATEST, { start_date: "2026-11-01", grd: "rew" });

      expect(provenance(row)).toEqual(["rew", null, null]);
    });

    it("inherits all three when grd is omitted", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-11-01" });

      expect(provenance(row)).toEqual(["ores", "auto", "2026.10.0"]);
    });

    it("ignores a provenance sent without a grd, and inherits all three", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-11-01", grd_source: "manual", grd_data_version: "2027.01.0" });

      expect(provenance(row)).toEqual(["ores", "auto", "2026.10.0"]);
    });

    it("inherits all three on an explicit null grd, which keeps its `??` inheritance", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-11-01", grd: null, grd_source: "manual" });

      expect(provenance(row)).toEqual(["ores", "auto", "2026.10.0"]);
    });

    it("stores nulls for a first configuration without a grd", async () => {
      const row = await addMeterData(null, { start_date: "2026-11-01" });

      expect(row.grd_source).toBeNull();
      expect(row.grd_data_version).toBeNull();
    });

    it("stores the provenance of a first configuration", async () => {
      const row = await addMeterData(null, { start_date: "2026-11-01", grd: "sibelga", grd_source: "manual" });

      expect(provenance(row)).toEqual(["sibelga", "manual", null]);
    });
  });

  describe("a same-day correction (merge)", () => {
    it("replaces the provenance with the request's when grd is sent", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-01-01", grd: "resa", grd_source: "manual" });

      expect(provenance(row)).toEqual(["resa", "manual", null]);
    });

    it("clears the stored provenance when grd is sent without one", async () => {
      // merge() would otherwise keep "auto / 2026.10.0" next to a grd it does
      // not describe: the request's absent provenance must become null first.
      const row = await addMeterData(LATEST, { start_date: "2026-01-01", grd: "resa" });

      expect(provenance(row)).toEqual(["resa", null, null]);
    });

    it("keeps all three when grd is omitted, even with a stray provenance", async () => {
      const row = await addMeterData(LATEST, { start_date: "2026-01-01", grd_source: "manual", grd_data_version: "2027.01.0" });

      expect(provenance(row)).toEqual(["ores", "auto", "2026.10.0"]);
    });
  });
});
