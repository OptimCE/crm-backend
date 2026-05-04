import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
  expectWithLog,
  mockMeRepositoryModule,
  mockStorageServiceModule,
  mockAuthContextRepositoryModule,
  mockCommunityRepositoryModule,
  mockIAMServiceModule,
  mockMemberRepositoryModule,
  mockAddressRepositoryModule,
} from "../../utils/helper.js";
import {
  testCasesGetDocuments,
  testCasesDownloadDocument,
  testCasesGetMembers,
  testCasesGetMemberById,
  testCasesGetMeters,
  testCasesGetMeterById,
  testCaseGetInvitationById,
  testCasesGetPendingOwnMembers,
  testCasesGetPendingOwnManagers,
  testCasesAcceptMember,
  testCasesAcceptManager,
  testCasesAcceptEncoded,
  testCasesRefuseMember,
  testCasesRefuseManager,
} from "./me.const.js";
import {AUTH_COMMUNITY_1} from "../../functionals/key/key.const.js";

describe("(Unit) Me Module", () => {
  // --- GET DOCUMENTS ---
  describe("(Unit) Get Documents", () => {
    useUnitTestDb();

    it.each(testCasesGetDocuments)(
      "GET /me/documents : $description",
      async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .get("/me/documents")
          .query(query)
          .set("x-user-id", "1")
          .set("x-community-id", AUTH_COMMUNITY_1)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- DOWNLOAD DOCUMENT ---
  describe("(Unit) Download Document", () => {
    useUnitTestDb();

    it.each(testCasesDownloadDocument)(
      "GET /me/documents/:id : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);
        if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get(`/me/documents/${id}`).set("x-user-id", "1").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (status_code === 200) {
            expect(response.body.data).toHaveProperty("url");
            expect(response.body.data).toHaveProperty("fileName");
            expect(response.body.data).toHaveProperty("fileType");
          } else {
            expect(response.body.error_code).toBe(expected_error_code);
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data!);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- GET MEMBERS ---
  describe("(Unit) Get Members", () => {
    useUnitTestDb();

    it.each(testCasesGetMembers)(
      "GET /me/members : $description",
      async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get("/me/members").query(query).set("x-user-id", "1").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- GET MEMBER BY ID ---
  describe("(Unit) Get Member By Id", () => {
    useUnitTestDb();

    it.each(testCasesGetMemberById)(
      "GET /me/members/:id : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get(`/me/members/${id}`).set("x-user-id", "1").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);

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

  // --- GET METERS ---
  describe("(Unit) Get Meters", () => {
    useUnitTestDb();

    it.each(testCasesGetMeters)(
      "GET /me/meters : $description",
      async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get("/me/meters").query(query).set("x-user-id", "1").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          let result = expected_data;
          if (response.status !== 200) {
            result = i18next.t(expected_data);
          }
          expect(response.body.data).toEqual(result);
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- GET METER BY ID ---
  describe("(Unit) Get Meter By Id", () => {
    useUnitTestDb();

    it.each(testCasesGetMeterById)(
      "GET /me/meters/:id : $description",
      async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app).get(`/me/meters/${id}`).set("x-user-id", "1").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);

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

  // --- GET OWN INVITATION MEMBER BY ID ---
  describe("(Unit) Get own Invitation Member by Id", () => {
    useUnitTestDb();
    it.each(testCaseGetInvitationById)(
      "$description",
      async ({ endpoint, id_user, id_invitation, status_code, expected_error_code, expected_data, mocks, translation_field }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .get(endpoint + id_invitation.toString())
          .set("x-user-id", id_user.toString());
        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result:unknown = expected_data as string;
            if (response.status !== 200) {
              if (translation_field) {
                result = i18next.t(expected_data as string, translation_field);
              } else {
                result = i18next.t(expected_data as string);
              }
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- GET PENDING INVITATIONS OWN MEMBERS ---
  describe("(Unit) Get Pending Invitations Own Members", () => {
    useUnitTestDb();

    it.each(testCasesGetPendingOwnMembers)(
      "$description",
      async ({
        endpoint,
        id_user,
        id_community,
        orgs,
        query,
        status_code,
        expected_error_code,
        expected_data,
        expected_pagination,
        mocks,
        translation_field,
      }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .get(endpoint)
          .query(query)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              if (translation_field) {
                result = i18next.t(expected_data, translation_field);
              } else {
                result = i18next.t(expected_data);
              }
            }
            expect(response.body.data).toEqual(result);
          }
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- GET PENDING INVITATIONS OWN MANAGERS ---
  describe("(Unit) Get Pending Invitations Own Managers", () => {
    useUnitTestDb();

    it.each(testCasesGetPendingOwnManagers)(
      "$description",
      async ({
        endpoint,
        id_user,
        id_community,
        orgs,
        query,
        status_code,
        expected_error_code,
        expected_data,
        expected_pagination,
        mocks,
        translation_field,
      }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .get(endpoint)
          .query(query)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              if (translation_field) {
                result = i18next.t(expected_data, translation_field);
              } else {
                result = i18next.t(expected_data);
              }
            }
            expect(response.body.data).toEqual(result);
          }
          if (expected_pagination) {
            expect(response.body.pagination).toEqual(expected_pagination);
          }
        });
      },
    );
  });

  // --- ACCEPT INVITATION MEMBER ---
  describe("(Unit) Accept Invitation Member", () => {
    useUnitTestDb();

    it.each(testCasesAcceptMember)(
      "$description",
      async ({ endpoint, id_user, id_community, orgs, query, status_code, expected_error_code, expected_data, mocks }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);
        if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);
        if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
        if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .post(endpoint)
          .send(query)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- ACCEPT INVITATION MANAGER ---
  describe("(Unit) Accept Invitation Manager", () => {
    useUnitTestDb();

    it.each(testCasesAcceptManager)(
      "$description",
      async ({ endpoint, id_user, id_community, orgs, query, status_code, expected_error_code, expected_data, mocks }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);
        if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);
        if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
        if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .post(endpoint)
          .send(query)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- ACCEPT INVITATION ENCODED ---
  describe("(Unit) Accept Invitation Encoded", () => {
    useUnitTestDb();

    it.each(testCasesAcceptEncoded)(
      "$description",
      async ({ endpoint, id_user, id_community, orgs, query, status_code, expected_error_code, expected_data, mocks }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);
        if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);
        if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
        if (mocks?.memberRepo) await mockMemberRepositoryModule(mocks.memberRepo);
        if (mocks?.addressRepo) await mockAddressRepositoryModule(mocks.addressRepo);
        if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const response = await request(app)
          .post(endpoint)
          .send(query)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data as string);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- REFUSE INVITATION MEMBER ---
  describe("(Unit) Refuse Invitation Member", () => {
    useUnitTestDb();

    it.each(testCasesRefuseMember)(
      "$description",
      async ({ endpoint, method, id_user, id_community, orgs, status_code, expected_error_code, expected_data, mocks }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const req = request(app);
        const response = await req[method](endpoint)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });

  // --- REFUSE INVITATION MANAGER ---
  describe("(Unit) Refuse Invitation Manager", () => {
    useUnitTestDb();

    it.each(testCasesRefuseManager)(
      "$description",
      async ({ endpoint, method, id_user, id_community, orgs, status_code, expected_error_code, expected_data, mocks }) => {
        if (mocks?.meRepo) await mockMeRepositoryModule(mocks.meRepo);

        const appModule = await import("../../../src/app.js");
        const app = appModule.default;
        const i18next = appModule.i18next;
        const req = request(app);
        const response = await req[method](endpoint)
          .set("x-user-id", id_user.toString())
          .set("x-community-id", id_community.toString())
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
          else if (expected_data) {
            let result = expected_data;
            if (response.status !== 200) {
              result = i18next.t(expected_data);
            }
            expect(response.body.data).toEqual(result);
          }
        });
      },
    );
  });
});
