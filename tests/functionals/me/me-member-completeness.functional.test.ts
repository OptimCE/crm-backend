import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { MeMembersPartialDTO } from "../../../src/modules/me/api/me.dtos.js";
import type { CommunityDashboardDTO } from "../../../src/modules/communities/api/community.dtos.js";

const AUTH_USER_MEMBER_1 = "auth0|member";
const AUTH_USER_MANAGER = "auth0|gestionnaire";

async function sql(query: string, params: unknown[] = []): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(query, params);
}

async function linkUserToAllMembersOfCommunity1(auth_user_id: string): Promise<void> {
  await sql(
    `INSERT INTO user_member_link (id_user, id_member) SELECT u.id, m.id FROM app_user u, member m
             WHERE u.auth_user_id = $1 AND m.id_community = 1
             AND NOT EXISTS (SELECT 1 FROM user_member_link l WHERE l.id_user = u.id AND l.id_member = m.id)`,
    [auth_user_id],
  );
}

async function getMyMembers(user: string): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get("/me/members")
    .query({ page: 1, limit: 100 })
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_MEMBER);
}

async function getCommunityDashboard(): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get("/communities/dashboard")
    .set("x-user-id", AUTH_USER_MANAGER)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_GESTIONNAIRE);
}

function members(response: request.Response): MeMembersPartialDTO[] {
  return response.body.data as MeMembersPartialDTO[];
}

function missingFor(response: request.Response, id: number): string[] | undefined {
  return members(response).find((m) => m.id === id)?.missing_fields;
}

describe("(Functional) GET /me/members — missing_fields", () => {
  useFunctionalTestDb();

  it("reports no missing field for a fully-filled record", async () => {
    const response = await getMyMembers(AUTH_USER_MEMBER_1);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(missingFor(response, 1)).toEqual([]);
    });
  });

  it("names the blank field rather than only counting it", async () => {
    await sql(`UPDATE member SET iban = '   ' WHERE id = 1`);

    const response = await getMyMembers(AUTH_USER_MEMBER_1);

    await expectWithLog(response, () => {
      // Whitespace, not NULL: every one of these columns is NOT NULL in the
      // DDL, so "missing" can only ever be an empty or blank string.
      expect(missingFor(response, 1)).toEqual(["iban"]);
    });
  });

  it("reports a blank address component", async () => {
    await sql(`UPDATE address SET postcode = '' WHERE id = (SELECT id_home_address FROM member WHERE id = 1)`);

    const response = await getMyMembers(AUTH_USER_MEMBER_1);

    await expectWithLog(response, () => {
      expect(missingFor(response, 1)).toContain("home_address");
    });
  });

  /**
   * The state that makes `GET /me/members/:id` throw "Data inconsistency" and
   * answer 500. Surfacing it here is the point: the member's own detail page
   * errors out on exactly the record they would be sent to fix.
   */
  it("reports an absent sub-type row instead of pretending the record is fine", async () => {
    await sql(`DELETE FROM individual WHERE id = 1`);

    const response = await getMyMembers(AUTH_USER_MEMBER_1);

    await expectWithLog(response, () => {
      expect(missingFor(response, 1)).toEqual(["sub_type_row"]);
    });
  });

  it("does not report phone_number, which is optional by design", async () => {
    await sql(`UPDATE individual SET phone_number = NULL WHERE id = 1`);

    const response = await getMyMembers(AUTH_USER_MEMBER_1);

    await expectWithLog(response, () => {
      expect(missingFor(response, 1)).toEqual([]);
    });
  });

  it("omits missing_fields where completeness was not evaluated", async () => {
    const appModule = await import("../../../src/app.js");
    const response = await request(appModule.default)
      .get("/me/meters")
      .query({ page: 1, limit: 50 })
      .set("x-user-id", AUTH_USER_MEMBER_1)
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_MEMBER);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      // A meter's `holder` is a reference, and that query does not load the
      // sub-type row or the addresses. Reporting `[]` there would be a clean
      // bill of health nobody checked — so the field must be absent instead.
      for (const meter of response.body.data as { holder?: MeMembersPartialDTO }[]) {
        if (meter.holder) expect(meter.holder.missing_fields).toBeUndefined();
      }
    });
  });

  /**
   * The agreement that matters. `members_incomplete` on the community dashboard
   * is raw SQL; `missing_fields` is TypeScript over loaded entities. They are
   * two implementations of one rule, and a manager told "3 members incomplete"
   * while each of those members is told they are fine is the failure this test
   * exists to catch.
   */
  it("agrees with the manager dashboard's members_incomplete count", async () => {
    await sql(`UPDATE member SET iban = '' WHERE id = 1`);
    await sql(`UPDATE address SET city = '  ' WHERE id = (SELECT id_billing_address FROM member WHERE id = 2)`);
    await linkUserToAllMembersOfCommunity1(AUTH_USER_MEMBER_1);

    const [mine, dashboard] = await Promise.all([getMyMembers(AUTH_USER_MEMBER_1), getCommunityDashboard()]);

    await expectWithLog(mine, () => {
      expect(mine.status).toBe(200);
      expect(dashboard.status).toBe(200);
      const incompleteHere = members(mine).filter((m) => (m.missing_fields ?? []).length > 0).length;
      const incompleteThere = (dashboard.body.data as CommunityDashboardDTO).members.incomplete;
      expect(incompleteHere).toBe(incompleteThere);
      // Guard against the assertion passing because both are zero.
      expect(incompleteHere).toBeGreaterThan(0);
    });
  });
});
