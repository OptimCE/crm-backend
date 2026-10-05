import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { GLOBAL_ERRORS, SUCCESS } from "../../../src/shared/errors/errors.js";
import { Role } from "../../../src/shared/dtos/role.js";

// Seeded roles in community 1: users 1 and 2 are ADMIN, user 3 (auth0|manager) is MANAGER,
// user 4 is MEMBER. Community 2 ("Other Community") holds bank and legal details.
const DEMO_USER = "f298d22b-4e19-4150-a4d4-f852c60163b3"; // ADMIN of community 1 only
const OTHER_COMMUNITY = 2;

async function roleInCommunity1(id_user: number): Promise<string> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const rows: { role: string }[] = await AppDataSource.manager.query(`SELECT role FROM community_user WHERE id_community = 1 AND id_user = $1`, [
    id_user,
  ]);
  return rows[0].role;
}

async function getCommunity(user: string, orgs: string, id: number): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default).get(`/communities/${id}`).set("x-user-id", user).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);
}

async function patchRole(user: string, orgs: string, body: Record<string, unknown>): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .patch("/communities/")
    .send(body)
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", orgs);
}

describe("(Functional) GET /communities/:id only serves members of that community", () => {
  useFunctionalTestDb();

  it("does not return another community's details to a non-member", async () => {
    const response = await getCommunity(DEMO_USER, `[orgId:${AUTH_COMMUNITY_1} orgPath:/org1 roles:[ADMIN]]`, OTHER_COMMUNITY);

    await expectWithLog(response, () => {
      expect(response.status).toBe(404);
      expect(response.body.error_code).toBe(COMMUNITY_ERRORS.GET_COMMUNITY.COMMUNITY_NOT_FOUND.errorCode);
    });
  });

  it("returns them to a member of that community", async () => {
    const response = await getCommunity("auth0|admin", `${ORGS_ADMIN},map[orgId:2 orgPath:/org2 roles:[MEMBER]]`, OTHER_COMMUNITY);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data.iban).toBe("BE68539007547034");
    });
  });
});

describe("(Functional) PATCH /communities: only an admin manages the admin role", () => {
  useFunctionalTestDb();

  it("forbids a manager from making someone an admin", async () => {
    const response = await patchRole("auth0|manager", ORGS_GESTIONNAIRE, { id_user: 4, new_role: Role.ADMIN });

    await expectWithLog(response, () => {
      expect(response.status).toBe(403);
      expect(response.body.error_code).toBe(GLOBAL_ERRORS.UNAUTHORIZED.errorCode);
    });
    expect(await roleInCommunity1(4)).toBe(Role.MEMBER);
  });

  it("forbids a manager from changing an admin's role", async () => {
    const response = await patchRole("auth0|manager", ORGS_GESTIONNAIRE, { id_user: 2, new_role: Role.MEMBER });

    await expectWithLog(response, () => {
      expect(response.status).toBe(403);
      expect(response.body.error_code).toBe(GLOBAL_ERRORS.UNAUTHORIZED.errorCode);
    });
    expect(await roleInCommunity1(2)).toBe(Role.ADMIN);
  });

  it("still lets a manager change a member's role", async () => {
    const response = await patchRole("auth0|manager", ORGS_GESTIONNAIRE, { id_user: 4, new_role: Role.GESTIONNAIRE });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
    });
    expect(await roleInCommunity1(4)).toBe(Role.GESTIONNAIRE);
  });

  it("still lets an admin change a manager's role", async () => {
    const response = await patchRole("auth0|admin", ORGS_ADMIN, { id_user: 3, new_role: Role.MEMBER });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
    });
    expect(await roleInCommunity1(3)).toBe(Role.MEMBER);
  });
});
