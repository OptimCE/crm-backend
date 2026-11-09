import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import type { Response } from "supertest";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import { RegulatoryStatus, RegulatorySubjectType } from "../../../src/modules/regulatory/domain/regulatory-link-status.models.js";

// Seeded (tests/sql/init.sql): community 1 (AUTH_COMMUNITY_1) owns operations 1 and 2.
const EAN = "123456789012345678";
const OTHER_EAN = "123456789012345679";

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

async function subscribe(active: boolean): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO community_subscription (id_community, feature, is_active)
     VALUES (1, 'administrative-document', $1)
     ON CONFLICT (id_community, feature) DO UPDATE SET is_active = EXCLUDED.is_active`,
    [active],
  );
}

/** An episode as the administrative annexe writes it. */
async function episode(e: {
  dossier: number;
  status: RegulatoryStatus;
  from?: string | null;
  to?: string | null;
  ref?: string;
  op?: number;
  type?: RegulatorySubjectType;
}): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO regulatory_link_status
       (id_community, id_sharing_operation, subject_type, subject_ref, id_dossier_origin,
        regulatory_status, valid_from, valid_to, regulatory_ref)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)`,
    [e.op ?? 1, e.type ?? RegulatorySubjectType.METER, e.ref ?? EAN, e.dossier, e.status, e.from ?? null, e.to ?? null, String(e.dossier)],
  );
}

async function status(query: string, orgs: string = ORGS_GESTIONNAIRE): Promise<Response> {
  const app = (await import("../../../src/app.js")).default;
  return request(app)
    .get(`/regulatory/status?${query}`)
    .set("x-user-id", "auth0|manager")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", orgs);
}

interface Row {
  subject_ref: string;
  regulatory_status: number;
  valid_from: string | null;
  valid_to: string | null;
  regulatory_ref: string | null;
}

/**
 * The badges' read (phase 3 of the espace administratif): what the core holds
 * as authorised for an operation's meters and keys, one row per subject.
 */
describe("(Functional) GET /regulatory/status", () => {
  useFunctionalTestDb();

  it("gives a meter in force as active from its effect date", async () => {
    await subscribe(true);
    await episode({ dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-11-02" });

    const response = await status("id_sharing_operation=1");

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const rows = response.body.data as Row[];
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        subject_ref: EAN,
        regulatory_status: RegulatoryStatus.ACTIVE,
        valid_from: "2026-11-02",
        valid_to: null,
        regulatory_ref: "10",
      });
    });
  });

  it("keeps one row per subject: the newest episode", async () => {
    await subscribe(true);
    await episode({ dossier: 10, status: RegulatoryStatus.REFUSED });
    await episode({ dossier: 11, status: RegulatoryStatus.TO_NOTIFY });
    await episode({ dossier: 12, status: RegulatoryStatus.PENDING_GRD, ref: OTHER_EAN });

    const response = await status("id_sharing_operation=1");

    const rows = (response.body.data as Row[]).map((r) => [r.subject_ref, r.regulatory_status]);
    expect(rows).toEqual([
      [EAN, RegulatoryStatus.TO_NOTIFY],
      [OTHER_EAN, RegulatoryStatus.PENDING_GRD],
    ]);
  });

  it("on a date, prefers the episode that covers it", async () => {
    await subscribe(true);
    await episode({ dossier: 10, status: RegulatoryStatus.ENDED, from: "2026-01-01", to: "2026-05-31" });
    await episode({ dossier: 11, status: RegulatoryStatus.TO_NOTIFY });

    const response = await status(`id_sharing_operation=1&subject_ref=${EAN}&date=2026-03-01`);

    const rows = response.body.data as Row[];
    expect(rows.map((r) => r.regulatory_status)).toEqual([RegulatoryStatus.ENDED]);
  });

  it("filters on a subject type", async () => {
    await subscribe(true);
    await episode({ dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01" });
    await episode({ dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01", type: RegulatorySubjectType.KEY, ref: "7" });

    const response = await status(`id_sharing_operation=1&subject_type=${RegulatorySubjectType.KEY}`);

    expect((response.body.data as Row[]).map((r) => r.subject_ref)).toEqual(["7"]);
  });

  it("shows nothing while the module is not active for the community", async () => {
    await subscribe(false);
    await episode({ dossier: 10, status: RegulatoryStatus.ACTIVE, from: "2026-01-01" });

    const response = await status("id_sharing_operation=1");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("is for managers", async () => {
    await subscribe(true);

    const response = await status("id_sharing_operation=1", ORGS_MEMBER);

    expect(response.status).toBe(403);
  });

  it("refuses an operation that is not an id", async () => {
    await subscribe(true);

    const response = await status("id_sharing_operation=abc");

    expect(response.status).toBe(422);
  });
});
