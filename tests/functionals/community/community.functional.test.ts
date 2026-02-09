import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import {
    expectWithLog,
    mockIAMServiceModule
} from "../../utils/helper.js";
import {
    testCasesCreateCommunity,
    testCasesDeleteCommunity,
    testCasesGetAdmins,
    testCasesGetMyCommunities,
    testCasesGetUsers,
    testCasesKickUser,
    testCasesLeave,
    testCasesPatchRole,
    testCasesUpdateCommunity,
} from "./community.const.js";

const AUTH_COMMUNITY_1 = "1";

describe("(Functional) Community Module", () => {
    useFunctionalTestDb();

    // --- GET MY COMMUNITIES ---
    describe("(Functional) Get My Communities", () => {
        it.each(testCasesGetMyCommunities)(
            "GET /communities/my-communities : $description",
            async ({ query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get("/communities/my-communities")
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
            }
        );
    });

    // --- GET USERS ---
    describe("(Functional) Get Users", () => {
        it.each(testCasesGetUsers)(
            "GET /communities/users : $description",
            async ({ query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get("/communities/users")
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
            }
        );
    });

    // --- GET ADMINS ---
    describe("(Functional) Get Admins", () => {
        it.each(testCasesGetAdmins)(
            "GET /communities/admins : $description",
            async ({ query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get("/communities/admins")
                    .query(query)
                    .set("x-user-id", "auth0|member")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (check_data) {
                        expect(check_data(response.body.data)).toBe(true);
                    }
                });
            }
        );
    });

    // --- CREATE COMMUNITY ---
    describe("(Functional) Create Community", () => {
        it.each(testCasesCreateCommunity)(
            "POST /communities/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/communities/")
                    .send(body)
                    .set("x-user-id", "auth0|member")
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

    // --- UPDATE COMMUNITY ---
    describe("(Functional) Update Community", () => {
        it.each(testCasesUpdateCommunity)(
            "PUT /communities/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .put("/communities/")
                    .send(body)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data) expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

    // --- PATCH ROLE ---
    describe("(Functional) Patch Role", () => {
        it.each(testCasesPatchRole)(
            "PATCH /communities/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .patch("/communities/")
                    .send(body)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data) expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

    // --- KICK USER ---
    describe("(Functional) Kick User", () => {
        it.each(testCasesKickUser)(
            "DELETE /communities/kick/:id : $description",
            async ({ target_id, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/communities/kick/${target_id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data) expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

    // --- LEAVE ---
    describe("(Functional) Leave Community", () => {
        it.each(testCasesLeave)(
            "DELETE /communities/leave/:id : $description",
            async ({ target_comm_id, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/communities/leave/${target_comm_id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data) expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

    // --- DELETE COMMUNITY ---
    describe("(Functional) Delete Community", () => {
        it.each(testCasesDeleteCommunity)(
            "DELETE /communities/delete/:id : $description",
            async ({ target_comm_id, orgs, status_code, expected_error_code, expected_data, external_mocks }) => {
                if (external_mocks?.iamService) await mockIAMServiceModule(external_mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/communities/delete/${target_comm_id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data) expect(response.body.data).toBe(expected_data);
                });
            }
        );
    });

});
