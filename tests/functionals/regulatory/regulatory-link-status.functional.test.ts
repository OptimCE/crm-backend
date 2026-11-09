import { describe, expect, it } from "@jest/globals";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { RegulatoryStatus, RegulatorySubjectType } from "../../../src/modules/regulatory/domain/regulatory-link-status.models.js";

// Seeded (tests/sql/init.sql): community 1 owns operations 1 and 2.
const EAN = "123456789012345678";

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

interface Episode {
  op: number;
  dossier: number;
  status: RegulatoryStatus;
  from: string | null;
  to: string | null;
  subject_type?: RegulatorySubjectType;
  subject_ref?: string;
}

/** The annexe's write: an episode insert, exactly as its effects port issues it. */
async function insert(e: Episode): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO regulatory_link_status
       (id_community, id_sharing_operation, subject_type, subject_ref, id_dossier_origin, regulatory_status, valid_from, valid_to)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)`,
    [e.op, e.subject_type ?? RegulatorySubjectType.METER, e.subject_ref ?? EAN, e.dossier, e.status, e.from, e.to],
  );
}

/**
 * The invariant of phase 0: an EAN cannot be pending, authorised or active in two operations on
 * the same date. It lives in the core's database (EXCLUDE USING gist), so it holds for every
 * writer — the annexe writes these rows itself, the core never does.
 */
describe("(Functional) regulatory_link_status", () => {
  useFunctionalTestDb();

  it("refuses an EAN active in two operations on the same date", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", to: null });

    await expect(insert({ op: 2, dossier: 11, status: RegulatoryStatus.ACTIVE, from: "2026-06-01", to: null })).rejects.toThrow(
      /ex_regulatory_link_one_operation/,
    );
  });

  it.each([RegulatoryStatus.PENDING_GRD, RegulatoryStatus.PENDING_REGULATOR, RegulatoryStatus.AUTHORIZED])(
    "refuses a status %s in a second operation while the EAN is active in the first",
    async (status) => {
      await insert({ op: 1, dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", to: null });

      await expect(insert({ op: 2, dossier: 11, status, from: "2026-06-01", to: null })).rejects.toThrow(/ex_regulatory_link_one_operation/);
    },
  );

  it("refuses the overlap when an update closes the gap", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", to: "2026-05-31" });
    await insert({ op: 2, dossier: 11, status: RegulatoryStatus.ACTIVE, from: "2026-06-01", to: null });

    await expect((await db()).query("UPDATE regulatory_link_status SET valid_to = '2026-06-15' WHERE id_dossier_origin = 10")).rejects.toThrow(
      /ex_regulatory_link_one_operation/,
    );
  });

  it("accepts a move: the exit and the entry on consecutive dates", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.ENDED, from: "2026-01-01", to: "2026-05-31" });
    await insert({ op: 1, dossier: 12, status: RegulatoryStatus.ACTIVE, from: "2025-01-01", to: "2025-12-31" });

    await expect(insert({ op: 2, dossier: 11, status: RegulatoryStatus.ACTIVE, from: "2026-06-01", to: null })).resolves.toBeUndefined();
  });

  it.each([RegulatoryStatus.TO_NOTIFY, RegulatoryStatus.LEAVING, RegulatoryStatus.ENDED, RegulatoryStatus.REFUSED, RegulatoryStatus.WITHDRAWN])(
    "a status %s does not occupy the EAN",
    async (status) => {
      await insert({ op: 1, dossier: 10, status, from: null, to: null });

      await expect(insert({ op: 2, dossier: 11, status: RegulatoryStatus.ACTIVE, from: "2026-06-01", to: null })).resolves.toBeUndefined();
    },
  );

  it("keys are not EANs: the same key may be active in two operations", async () => {
    const key = { subject_type: RegulatorySubjectType.KEY, subject_ref: "2" };
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", to: null, ...key });

    await expect(insert({ op: 2, dossier: 11, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", to: null, ...key })).resolves.toBeUndefined();
  });

  it("refuses a status outside 1-9", async () => {
    await expect(insert({ op: 1, dossier: 10, status: 10 as RegulatoryStatus, from: null, to: null })).rejects.toThrow(
      /ck_regulatory_link_status_code/,
    );
  });

  it("refuses a validity that ends before it starts", async () => {
    await expect(insert({ op: 1, dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-06-01", to: "2026-05-01" })).rejects.toThrow(
      /ck_regulatory_link_validity/,
    );
  });

  it("is idempotent per dossier and subject: a replayed episode insert is refused, not doubled", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.TO_NOTIFY, from: null, to: null });

    await expect(insert({ op: 1, dossier: 10, status: RegulatoryStatus.TO_NOTIFY, from: null, to: null })).rejects.toThrow(
      /uq_regulatory_link_episode/,
    );
  });

  it("writing an effect emits no outbox event (no core -> annexe -> core loop)", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.PENDING_GRD, from: "2026-06-01", to: null });
    await (await db()).query("UPDATE regulatory_link_status SET regulatory_status = $1 WHERE id_dossier_origin = 10", [RegulatoryStatus.ACTIVE]);

    const [{ count }] = (await (await db()).query("SELECT count(*)::int AS count FROM outbox_event")) as { count: number }[];
    expect(count).toBe(0);
  });

  it("stamps updated_at on an effect write", async () => {
    await insert({ op: 1, dossier: 10, status: RegulatoryStatus.PENDING_GRD, from: null, to: null });
    await (
      await db()
    ).query("UPDATE regulatory_link_status SET created_at = created_at - interval '1 day', updated_at = updated_at - interval '1 day'");

    await (await db()).query("UPDATE regulatory_link_status SET regulatory_status = $1", [RegulatoryStatus.ACTIVE]);

    const [row] = (await (await db()).query("SELECT updated_at > created_at + interval '12 hours' AS fresh FROM regulatory_link_status")) as {
      fresh: boolean;
    }[];
    expect(row.fresh).toBe(true);
  });
});
