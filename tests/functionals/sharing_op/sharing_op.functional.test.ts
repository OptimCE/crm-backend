import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import {
    expectWithLog
} from "../../utils/helper.js";
import {
    testCasesAddKey,
    testCasesAddMeter,
    testCasesCreate,
    testCasesDelete,
    testCasesGetDetail,
    testCasesGetList,
    testCasesPatchKey,
    testCasesPatchMeter,
    AUTH_COMMUNITY_1
} from "./sharing_op.const.js";

describe("(Functional) Sharing Operation Module", () => {
    useFunctionalTestDb();

    // --- GET LIST ---
    describe("(Functional) Get List", () => {
        it.each(testCasesGetList)(
            "GET /sharing_operations/ : $description",
            async ({ query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get("/sharing_operations/")
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

    // --- GET DETAIL ---
    describe("(Functional) Get Detail", () => {
        it.each(testCasesGetDetail)(
            "GET /sharing_operations/:id : $description",
            async ({ id, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get(`/sharing_operations/${id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    if (status_code === 200) {
                        expect(response.status).toBe(status_code);
                        expect(response.body.error_code).toBe(expected_error_code);
                        if (check_data) expect(check_data(response.body.data)).toBe(true);
                    } else {
                        expect(response.status).not.toBe(200);
                    }
                });
            }
        );
    });

    // --- CREATE ---
    describe("(Functional) Create", () => {
        it.each(testCasesCreate)(
            "POST /sharing_operations/ : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/sharing_operations/")
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

    // --- ADD KEY ---
    describe("(Functional) Add Key", () => {
        it.each(testCasesAddKey)(
            "POST /sharing_operations/key : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/sharing_operations/key")
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

    // --- ADD METER ---
    describe("(Functional) Add Meter", () => {
        it.each(testCasesAddMeter)(
            "POST /sharing_operations/meter : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/sharing_operations/meter")
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

    // --- PATCH KEY ---
    describe("(Functional) Patch Key", () => {
        it.each(testCasesPatchKey)(
            "PATCH /sharing_operations/key : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .patch("/sharing_operations/key")
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

    // --- PATCH METER ---
    describe("(Functional) Patch Meter", () => {
        it.each(testCasesPatchMeter)(
            "PATCH /sharing_operations/meter : $description",
            async ({ body, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .patch("/sharing_operations/meter")
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

    // --- DELETE ---
    describe("(Functional) Delete", () => {
        it.each(testCasesDelete)(
            "DELETE /sharing_operations/:id : $description",
            async ({ id, orgs, status_code, expected_error_code, expected_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/sharing_operations/${id}`)
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
