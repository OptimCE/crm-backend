import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { CommunityDashboardDTO } from "../../../src/modules/communities/api/community.dtos.js";

const AUTH_USER_MANAGER = "auth0|manager";
const AUTH_COMMUNITY_2 = "2";
/** Seeded manager of both communities; the orgs claim decides which one is active. */
const ORGS_GESTIONNAIRE_C2 = `[orgId:${AUTH_COMMUNITY_2} orgPath:/org2 roles:[MANAGER]]`;

async function sql(query: string, params: unknown[] = []): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(query, params);
}

async function getDashboard(
  orgs: string = ORGS_GESTIONNAIRE,
  community: string = AUTH_COMMUNITY_1,
  query: Record<string, string> = {},
): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const app = appModule.default;
  return request(app)
    .get("/communities/dashboard")
    .query(query)
    .set("x-user-id", AUTH_USER_MANAGER)
    .set("x-community-id", community)
    .set("x-user-orgs", orgs);
}

function body(response: request.Response): CommunityDashboardDTO {
  return response.body.data as CommunityDashboardDTO;
}

describe("(Functional) GET /communities/dashboard", () => {
  useFunctionalTestDb();

  describe("tenant scoping", () => {
    it("counts only the active community's rows", async () => {
      const response = await getDashboard();

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        const data = body(response);
        // Community 1 seeds members 1, 2 and 4-7. Member 3 lives in community 2
        // and must not appear here; likewise operation 3.
        expect(data.members.total).toBe(6);
        expect(data.sharing_operations.total).toBe(2);
        expect(data.meters.total).toBe(6);
      });
    });

    it("counts only the second community's rows when it is the active one", async () => {
      const response = await getDashboard(ORGS_GESTIONNAIRE_C2, AUTH_COMMUNITY_2);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        const data = body(response);
        expect(data.members.total).toBe(1);
        expect(data.sharing_operations.total).toBe(1);
        // Every seeded meter belongs to community 1.
        expect(data.meters.total).toBe(0);
      });
    });

    it("cannot be widened from the query string", async () => {
      // The endpoint takes no parameters at all; this pins that a hand-crafted
      // request cannot make it report another tenant.
      const scoped = await getDashboard();
      const attacked = await getDashboard(ORGS_GESTIONNAIRE, AUTH_COMMUNITY_1, {
        id_community: "2",
        community_id: "2",
        community: "2",
      });

      await expectWithLog(attacked, () => {
        expect(attacked.status).toBe(200);
        expect(attacked.body.data).toEqual(scoped.body.data);
      });
    });
  });

  describe("gating", () => {
    it("refuses a plain member", async () => {
      const response = await getDashboard(ORGS_MEMBER);
      await expectWithLog(response, () => expect(response.status).toBe(403));
    });

    it("refuses a request with no active community", async () => {
      const appModule = await import("../../../src/app.js");
      const response = await request(appModule.default)
        .get("/communities/dashboard")
        .set("x-user-id", AUTH_USER_MANAGER)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => expect(response.status).toBe(400));
    });
  });

  describe("members", () => {
    it("reports the seeded status split and the unlinked-account count", async () => {
      const response = await getDashboard();

      await expectWithLog(response, () => {
        const data = body(response);
        expect(data.members.active).toBe(6);
        expect(data.members.inactive).toBe(0);
        expect(data.members.pending).toBe(0);
        // Only member 1 has a user_member_link row.
        expect(data.members.without_user_account).toBe(5);
        expect(data.members.incomplete).toBe(0);
      });
    });

    it("counts a blank required column and a missing sub-type row, but not an optional field", async () => {
      await sql(`UPDATE member SET iban = '' WHERE id = 1`);
      const afterBlankIban = body(await getDashboard());
      expect(afterBlankIban.members.incomplete).toBe(1);

      // An individual with no `individual` row is the state that makes the member
      // detail endpoint throw "Data inconsistency".
      await sql(`DELETE FROM individual WHERE id = 4`);
      const afterMissingSubtype = body(await getDashboard());
      expect(afterMissingSubtype.members.incomplete).toBe(2);

      // phone_number is @IsOptional by design. This assertion is the one that
      // pins the rule — without it, "incomplete" could quietly widen to any null.
      await sql(`UPDATE individual SET phone_number = NULL WHERE id = 5`);
      const afterOptionalNull = body(await getDashboard());
      expect(afterOptionalNull.members.incomplete).toBe(2);
    });

    it("counts a blank address component", async () => {
      await sql(`UPDATE address SET city = '   ' WHERE id = 5`);
      const data = body(await getDashboard());
      // Address 5 is member 4's home AND billing address.
      expect(data.members.incomplete).toBe(1);
    });

    it("does not count PENDING as a defect", async () => {
      await sql(`UPDATE member SET status = 3 WHERE id = 1`);
      const data = body(await getDashboard());

      expect(data.members.pending).toBe(1);
      expect(data.members.active).toBe(5);
      expect(data.members.incomplete).toBe(0);
    });
  });

  describe("meters", () => {
    it("buckets by the status of the row in force", async () => {
      await sql(`UPDATE meter_data SET status = 3 WHERE ean = '987654321098765432'`);
      await sql(`UPDATE meter_data SET status = 4 WHERE ean = '541448200000000001'`);

      const data = body(await getDashboard());
      expect(data.meters.active).toBe(4);
      expect(data.meters.waiting_grd).toBe(1);
      expect(data.meters.waiting_manager).toBe(1);
    });

    it("distinguishes 'no operation' from 'no data row at all'", async () => {
      await sql(`UPDATE meter_data SET id_sharing_operation = NULL WHERE ean = '541448200000000004'`);
      const detached = body(await getDashboard());
      expect(detached.meters.not_in_sharing_operation).toBe(1);
      // The two counters are different failures with different fixes; a meter
      // that merely left its operation still has a data row.
      expect(detached.meters.without_active_data).toBe(0);

      await sql(`DELETE FROM meter_data WHERE ean = '541448200000000004'`);
      const orphaned = body(await getDashboard());
      expect(orphaned.meters.without_active_data).toBe(1);
      expect(orphaned.meters.not_in_sharing_operation).toBe(0);
    });

    it("treats end_date as the last day held, not as already expired", async () => {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await sql(`UPDATE meter_data SET end_date = $1 WHERE ean = '123456789012345678'`, [iso]);

      const data = body(await getDashboard());
      // `end_date > today` would drop it a day early — addMeterData closes a
      // holding with `next_start - 1 day`, so today is still held.
      expect(data.meters.active).toBe(6);
      expect(data.meters.without_active_data).toBe(0);
    });
  });

  describe("sharing operations", () => {
    it("reports every operation covered when the seeded keys are in force", async () => {
      const data = body(await getDashboard());
      expect(data.sharing_operations.without_valid_key).toBe(0);
      expect(data.sharing_operations.operations_without_valid_key).toEqual([]);
      expect(data.sharing_operations.with_pending_key).toBe(0);
    });

    it("names the operations whose key window has closed", async () => {
      await sql(`UPDATE sharing_operation_key SET end_date = '2024-06-30' WHERE id_sharing_operation = 2`);

      const data = body(await getDashboard());
      expect(data.sharing_operations.without_valid_key).toBe(1);
      expect(data.sharing_operations.operations_without_valid_key).toEqual([{ id: 2, name: "Public Wind Sharing" }]);
    });

    it("ignores a PENDING key that was already superseded by an approval", async () => {
      // This is exactly what patchKeyStatus leaves behind: approving a key INSERTS
      // a new APPROVED row and only closes the PENDING one — its status stays 2
      // forever. Without the `end_date IS NULL` predicate, every historically
      // approved key would be reported as still awaiting approval.
      await sql(
        `INSERT INTO sharing_operation_key (id_sharing_operation, id_key, start_date, end_date, status, id_community)
         VALUES (1, 2, '2023-01-01', '2023-12-31', 2, 1)`,
      );
      const closed = body(await getDashboard());
      expect(closed.sharing_operations.with_pending_key).toBe(0);

      await sql(
        `INSERT INTO sharing_operation_key (id_sharing_operation, id_key, start_date, status, id_community)
         VALUES (1, 2, '2026-01-01', 2, 1)`,
      );
      const open = body(await getDashboard());
      expect(open.sharing_operations.with_pending_key).toBe(1);
    });
  });

  describe("invitations and legal info", () => {
    it("reports the seeded pending invitations", async () => {
      const data = body(await getDashboard());
      expect(data.invitations.member_pending).toBe(1);
      expect(data.invitations.member_to_be_encoded).toBe(0);
      expect(data.invitations.manager_pending).toBe(1);
    });

    it("splits out invitations still awaiting encoding", async () => {
      await sql(`UPDATE user_member_invitation SET to_be_encoded = TRUE WHERE id_community = 1`);
      const data = body(await getDashboard());
      expect(data.invitations.member_to_be_encoded).toBe(1);
    });

    it("lists the community fields still unset", async () => {
      const data = body(await getDashboard());
      // The seed fills everything except account_holder_name, and `regulator`
      // defaults to an active code — so it must NOT be reported.
      expect(data.legal_info.missing_fields).toEqual(["account_holder_name"]);
      expect(data.legal_info.complete).toBe(false);
    });

    it("treats a blank string as missing and reports completeness", async () => {
      await sql(`UPDATE community SET account_holder_name = 'Test Community ASBL' WHERE id = 1`);
      expect(body(await getDashboard()).legal_info).toEqual({ missing_fields: [], complete: true });

      await sql(`UPDATE community SET vat_number = '   ' WHERE id = 1`);
      expect(body(await getDashboard()).legal_info.missing_fields).toEqual(["vat_number"]);
    });

    it("reports a regulator that is known but not assignable", async () => {
      // A DB CHECK keeps `regulator` inside the three coded values, so it can
      // never be junk — but two of them are `active: false` in the shared
      // registry during the Wallonia-only phase. A community notified to one of
      // those cannot operate, which is exactly what the tile has to surface.
      await sql(`UPDATE community SET regulator = 'BE-BRU-BRUGEL' WHERE id = 1`);
      const data = body(await getDashboard());
      expect(data.legal_info.missing_fields).toContain("regulator");
    });
  });

  it("echoes the evaluation date it used", async () => {
    const data = body(await getDashboard());
    expect(data.as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns numbers, not the strings node-postgres hands back for COUNT()", async () => {
    const data = body(await getDashboard());
    expect(typeof data.members.total).toBe("number");
    expect(typeof data.meters.total).toBe("number");
    expect(typeof data.sharing_operations.total).toBe("number");
    expect(typeof data.invitations.member_pending).toBe("number");
  });
});
