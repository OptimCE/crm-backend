import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import {
  testCasesCancelManager,
  testCasesCancelMember,
  testCasesGetPendingManagers,
  testCasesGetPendingMembers,
  testCasesInviteManager,
  testCasesInviteMember,
  AUTH_COMMUNITY_1,
} from "./invitation.const.js";

describe("(Functional) Invitation Module", () => {
  useFunctionalTestDb();

  // --- GET PENDING MEMBERS ---
  describe("(Functional) Get Pending Members", () => {
    it.each(testCasesGetPendingMembers)("GET /invitations/ : $description", async ({ query, orgs, status_code, expected_error_code, check_data }) => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .get("/invitations/")
        .query(query)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        if (check_data) {
          expect(check_data(response.body.data)).toBe(true);
        }
      });
    });
  });

  // --- GET PENDING MANAGERS ---
  describe("(Functional) Get Pending Managers", () => {
    it.each(testCasesGetPendingManagers)(
      "GET /invitations/managers : $description",
      async ({ query, orgs, status_code, expected_error_code, check_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .get("/invitations/managers")
          .query(query)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (check_data) {
            expect(check_data(response.body.data)).toBe(true);
          }
        });
      },
    );
  });

  // --- INVITE MEMBER ---
  describe("(Functional) Invite Member", () => {
    it.each(testCasesInviteMember)(
      "POST /invitations/member : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .post("/invitations/member")
          .send(body)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data) expect(response.body.data).toBe(expected_data);
        });
      },
    );
  });

  // --- INVITE MANAGER ---
  describe("(Functional) Invite Manager", () => {
    it.each(testCasesInviteManager)(
      "POST /invitations/manager : $description",
      async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .post("/invitations/manager")
          .send(body)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data) expect(response.body.data).toBe(expected_data);
        });
      },
    );
  });

  // --- CANCEL MEMBER INVITATION ---
  describe("(Functional) Cancel Member Invitation", () => {
    it.each(testCasesCancelMember)(
      "DELETE /invitations/:id/member : $description",
      async ({ invitation_id, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .delete(`/invitations/${invitation_id}/member`)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data) expect(response.body.data).toBe(expected_data);
        });
      },
    );
  });

  // --- CANCEL MANAGER INVITATION ---
  describe("(Functional) Cancel Manager Invitation", () => {
    it.each(testCasesCancelManager)(
      "DELETE /invitations/:id/manager : $description",
      async ({ invitation_id, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .delete(`/invitations/${invitation_id}/manager`)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data) expect(response.body.data).toBe(expected_data);
        });
      },
    );
  });
});
