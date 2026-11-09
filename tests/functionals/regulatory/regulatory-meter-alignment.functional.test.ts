import { describe, expect, it } from "@jest/globals";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { RegulatoryStatus, RegulatorySubjectType } from "../../../src/modules/regulatory/domain/regulatory-link-status.models.js";

// Seeded (tests/sql/init.sql): meter 123456789012345678 is in operation 1 of
// community 1 from 2024-01-01 (one meter_data row: simple rate, residential,
// member 1, producer owner, PV 5 kVA); 987654321098765432 is in operation 2.
const EAN = "123456789012345678";

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

interface Row {
  start_date: string;
  end_date: string | null;
  status: number;
  id_sharing_operation: number | null;
  rate: number;
  client_type: number;
  id_member: number | null;
  injection_status: number | null;
  total_generating_capacity: number | null;
}

async function rows(ean = EAN): Promise<Row[]> {
  return (await db()).query(
    `SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date, status,
            id_sharing_operation, rate, client_type, id_member, injection_status, total_generating_capacity
       FROM meter_data WHERE ean = $1 ORDER BY start_date`,
    [ean],
  );
}

async function setStatus(status: MeterDataStatus, ean = EAN): Promise<void> {
  await (await db()).query("UPDATE meter_data SET status = $1 WHERE ean = $2", [status, ean]);
}

/** The annexe's write, as its effects port issues it. */
async function episode(op: number, dossier: number, status: RegulatoryStatus, from: string | null, to: string | null = null): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO regulatory_link_status
       (id_community, id_sharing_operation, subject_type, subject_ref, id_dossier_origin, regulatory_status, valid_from, valid_to)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)`,
    [op, RegulatorySubjectType.METER, EAN, dossier, status, from, to],
  );
}

/**
 * One status for a meter in an operation (2026-11-01): the procedure's ACTIVE
 * drives the CRM's own status, in the database, whoever writes the episode.
 */
describe("(Functional) regulatory_link_status -> meter_data alignment", () => {
  useFunctionalTestDb();

  it("turns a waiting meter active from the effect date, cutting its row there", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(1, 10, RegulatoryStatus.ACTIVE, "2026-06-01");

    const [before, after] = await rows();
    expect(before).toMatchObject({ start_date: "2024-01-01", end_date: "2026-05-31", status: MeterDataStatus.WAITING_GRD });
    expect(after).toMatchObject({ start_date: "2026-06-01", end_date: null, status: MeterDataStatus.ACTIVE });
    // The cut copies the whole configuration, like addMeterData does.
    expect({ ...after, start_date: before.start_date, end_date: null, status: before.status }).toEqual({ ...before, end_date: null });
  });

  it("an update into ACTIVE aligns too (the effect job moves an authorised row)", async () => {
    await setStatus(MeterDataStatus.WAITING_MANAGER);
    await episode(1, 10, RegulatoryStatus.AUTHORIZED, "2026-06-01");
    expect((await rows()).map((r) => r.status)).toEqual([MeterDataStatus.WAITING_MANAGER]);

    await (await db()).query("UPDATE regulatory_link_status SET regulatory_status = $1 WHERE id_dossier_origin = 10", [RegulatoryStatus.ACTIVE]);

    expect((await rows()).map((r) => [r.start_date, r.status])).toEqual([
      ["2024-01-01", MeterDataStatus.WAITING_MANAGER],
      ["2026-06-01", MeterDataStatus.ACTIVE],
    ]);
  });

  it("does not cut a row that starts on or after the effect date", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(1, 10, RegulatoryStatus.ACTIVE, "2023-06-01");

    expect(await rows()).toEqual([expect.objectContaining({ start_date: "2024-01-01", end_date: null, status: MeterDataStatus.ACTIVE })]);
  });

  it("stops at valid_to: the rest keeps its status", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(1, 10, RegulatoryStatus.ACTIVE, "2026-06-01", "2026-08-31");

    expect((await rows()).map((r) => [r.start_date, r.end_date, r.status])).toEqual([
      ["2024-01-01", "2026-05-31", MeterDataStatus.WAITING_GRD],
      ["2026-06-01", "2026-08-31", MeterDataStatus.ACTIVE],
      ["2026-09-01", null, MeterDataStatus.WAITING_GRD],
    ]);
  });

  it("leaves an already active meter alone (the baseline confirms what the CRM had)", async () => {
    await episode(1, 10, RegulatoryStatus.ACTIVE, "2026-06-01");

    expect(await rows()).toEqual([expect.objectContaining({ start_date: "2024-01-01", end_date: null, status: MeterDataStatus.ACTIVE })]);
  });

  it.each([
    RegulatoryStatus.TO_NOTIFY,
    RegulatoryStatus.PENDING_GRD,
    RegulatoryStatus.PENDING_REGULATOR,
    RegulatoryStatus.AUTHORIZED,
    RegulatoryStatus.LEAVING,
    RegulatoryStatus.REFUSED,
    RegulatoryStatus.WITHDRAWN,
  ])("a status %s leaves meter_data alone", async (status) => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(1, 10, status, status === RegulatoryStatus.AUTHORIZED ? "2026-06-01" : null);

    expect((await rows()).map((r) => r.status)).toEqual([MeterDataStatus.WAITING_GRD]);
  });

  it("touches only the episode's operation", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(2, 10, RegulatoryStatus.ACTIVE, "2026-06-01");

    expect((await rows()).map((r) => r.status)).toEqual([MeterDataStatus.WAITING_GRD]);
  });

  it("is idempotent: rewriting the active episode cuts nothing more", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);
    await episode(1, 10, RegulatoryStatus.ACTIVE, "2026-06-01");

    await (await db()).query("UPDATE regulatory_link_status SET valid_from = valid_from, regulatory_status = 5 WHERE id_dossier_origin = 10");

    expect(await rows()).toHaveLength(2);
  });

  it("emits no outbox event: the operation does not change", async () => {
    await setStatus(MeterDataStatus.WAITING_GRD);

    await episode(1, 10, RegulatoryStatus.ACTIVE, "2026-06-01");

    const [{ count }] = (await (await db()).query("SELECT count(*)::int AS count FROM outbox_event")) as { count: number }[];
    expect(count).toBe(0);
  });
});
