import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog, mockAddressRepositoryModule, mockAuthContextRepositoryModule, mockMemberRepositoryModule } from "../../utils/helper.js";
import {
  testCasesAddMember,
  testCasesDeleteMember,
  testCasesDeleteMemberLink,
  testCasesGetMember,
  testCasesGetMemberLink,
  testCasesGetMembersList,
  testCasesPatchMemberInvite,
  testCasesPatchMemberStatus,
  testCasesUpdateMember,
} from "./member.const.js";

describe("(Unit) Member Module", () => {
  // --- GET MEMBERS LIST ---
  describe("(Unit) Get Members List", () => {
    useUnitTestDb();

    it.each(testCasesGetMembersList)(
      "GET /members/ : $description",
      async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get("/members/").query(query).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
          if (expected_pagination) expect(response.body.pagination).toEqual(expected_pagination);
        });
      },
    );
  });

  // --- GET MEMBER ---
  describe("(Unit) Get Member", () => {
    useUnitTestDb();

    it.each(testCasesGetMember)("GET /members/:id : $description", async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).get(`/members/${id}`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });

  // --- GET MEMBER LINK ---
  describe("(Unit) Get Member Link", () => {
    useUnitTestDb();

    it.each(testCasesGetMemberLink)(
      "GET /members/:id/link : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs, query, translation_field }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .get(`/members/${id}/link`)
          .set("x-user-id", "1")
          .set("x-community-id", "1")
          .set("x-user-orgs", orgs)
          .query(query);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            if (expected_data) {
              if (translation_field) {
                result = i18next.t(expected_data, translation_field);
              } else {
                result = i18next.t(expected_data as string);
              }
            }
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- ADD MEMBER ---
  describe("(Unit) Add Member", () => {
    useUnitTestDb();

    it.each(testCasesAddMember)(
      "POST /members/ : $description",
      async ({ body, status_code, expected_error_code, expected_data, mocks, orgs, translation_field }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);
        if (mocks?.addressRepo) await mockAddressRepositoryModule(mocks.addressRepo);
        if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).post("/members/").send(body).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            if (translation_field) {
              result = i18next.t(expected_data, translation_field);
            } else {
              result = i18next.t(expected_data);
            }
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- UPDATE MEMBER ---
  describe("(Unit) Update Member", () => {
    useUnitTestDb();

    it.each(testCasesUpdateMember)("PUT /members/ : $description", async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
      if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);
      if (mocks?.addressRepo) await mockAddressRepositoryModule(mocks.addressRepo);

      const appModule = await import("../../../src/app.js");
      const app = appModule.default;
      const i18next = appModule.i18next;
      const response = await request(app).put("/members/").send(body).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

      await expectWithLog(response, () => {
        expect(response.status).toBe(status_code);
        expect(response.body.error_code).toBe(expected_error_code);
        let result = expected_data;
        if (response.status !== 200) {
          result = i18next.t(expected_data);
        }
        expect(response.body.data).toEqual(result);
      });
    });
  });

  // --- PATCH MEMBER STATUS ---
  describe("(Unit) Patch Member Status", () => {
    useUnitTestDb();

    it.each(testCasesPatchMemberStatus)(
      "PATCH /members/status : $description",
      async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .patch("/members/status")
          .send(body)
          .set("x-user-id", "1")
          .set("x-community-id", "1")
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- PATCH MEMBER INVITE ---
  describe("(Unit) Patch Member Invite", () => {
    useUnitTestDb();

    it.each(testCasesPatchMemberInvite)(
      "PATCH /members/invite : $description",
      async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .patch("/members/invite")
          .send(body)
          .set("x-user-id", "1")
          .set("x-community-id", "1")
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- DELETE MEMBER ---
  describe("(Unit) Delete Member", () => {
    useUnitTestDb();

    it.each(testCasesDeleteMember)(
      "DELETE /members/:id : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).delete(`/members/${id}`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });

  // --- DELETE MEMBER LINK ---
  describe("(Unit) Delete Member Link", () => {
    useUnitTestDb();

    it.each(testCasesDeleteMemberLink)(
      "DELETE /members/:id/link : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).delete(`/members/${id}/link`).set("x-user-id", "1").set("x-community-id", "1").set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
        });
      },
    );
  });
});
