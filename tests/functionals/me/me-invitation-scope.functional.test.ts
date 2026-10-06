import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { ME_ERRORS } from "../../../src/modules/me/shared/me.errors.js";

// Seeded member invitation 1 invites member 2 (a company, with its manager's national number,
// email and phone). It is attached below to user 3 (auth0|manager).
const INVITATION_ID = 1;
const INVITEE = "auth0|manager";
const OTHER_USER = "auth0|member";

async function attachInvitationToInvitee(): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(`UPDATE user_member_invitation SET id_user = 3 WHERE id = $1`, [INVITATION_ID]);
}

async function getInvitation(auth_user_id: string): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default).get(`/me/invitations/member/${INVITATION_ID}`).set("x-user-id", auth_user_id);
}

describe("(Functional) GET /me/invitations/member/:id only serves the invitee", () => {
  useFunctionalTestDb();

  it("returns the invited member to the invitee", async () => {
    await attachInvitationToInvitee();

    const response = await getInvitation(INVITEE);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(2);
    });
  });

  it("does not return someone else's invitation", async () => {
    await attachInvitationToInvitee();

    const response = await getInvitation(OTHER_USER);

    await expectWithLog(response, () => {
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(ME_ERRORS.GET_OWN_MEMBER_INVITATION_BY_ID.NOT_FOUND.errorCode);
    });
  });
});
