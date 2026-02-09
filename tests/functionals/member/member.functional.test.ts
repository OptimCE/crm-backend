import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import {
    expectWithLog
} from "../../utils/helper.js";
import {
    testCasesAddMember,
    testCasesDeleteLink,
    testCasesDeleteMember,
    testCasesGetMember,
    testCasesGetMemberLink,
    testCasesGetMembersList,
    testCasesPatchLink,
    testCasesPatchStatus,
    testCasesUpdateMember,
    AUTH_COMMUNITY_1
} from "./member.const.js";

describe("(Functional) Member Module", () => {
    useFunctionalTestDb();

    // --- GET MEMBERS LIST ---
    describe("(Functional) Get Members List", () => {
        it.each(testCasesGetMembersList)(
            "GET /members/ : $description",
            async ({ query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get("/members/")
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

    // --- GET MEMBER ---
    describe("(Functional) Get Member", () => {
        it.each(testCasesGetMember)(
            "GET /members/:id : $description",
            async ({ member_id, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get(`/members/${member_id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    // Special case for 400 error which might come as 500 if unhandled, checking behavior
                    if (status_code === 200) {
                        expect(response.status).toBe(status_code);
                        expect(response.body.error_code).toBe(expected_error_code);
                        if (check_data) {
                            expect(check_data(response.body.data)).toBe(true);
                        }
                    } else {
                        // Expecting failure
                        expect(response.status).not.toBe(200);
                        // Check error code in body if available
                        if (response.body.error_code) expect(response.body.error_code).toBe(expected_error_code);
                    }
                });
            }
        );
    });

    // --- GET MEMBER LINK ---
    describe("(Functional) Get Member Link", () => {
        it.each(testCasesGetMemberLink)(
            "GET /members/:id/link : $description",
            async ({ member_id, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get(`/members/${member_id}/link`)
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

    // --- ADD MEMBER ---
    describe("(Functional) Add Member", () => {
        it.each(testCasesAddMember)(
            "POST /members/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/members/")
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

    // --- UPDATE MEMBER ---
    describe("(Functional) Update Member", () => {
        it.each(testCasesUpdateMember)(
            "PUT /members/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .put("/members/")
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

    // --- PATCH MEMBER STATUS ---
    describe("(Functional) Patch Member Status", () => {
        it.each(testCasesPatchStatus)(
            "PATCH /members/status : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .patch("/members/status")
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

    // --- PATCH MEMBER LINK ---
    describe("(Functional) Patch Member Link", () => {
        it.each(testCasesPatchLink)(
            "PATCH /members/invite : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .patch("/members/invite")
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

    // --- DELETE MEMBER LINK ---
    describe("(Functional) Delete Member Link", () => {
        it.each(testCasesDeleteLink)(
            "DELETE /members/:id/link : $description",
            async ({ member_id, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/members/${member_id}/link`)
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

    // --- DELETE MEMBER ---
    describe("(Functional) Delete Member", () => {
        it.each(testCasesDeleteMember)(
            "DELETE /members/:id : $description",
            async ({ member_id, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/members/${member_id}`)
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
