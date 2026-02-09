import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
    expectWithLog,
    mockAddressRepositoryModule,
    mockIAMServiceModule,
    mockUserRepositoryModule
} from "../../utils/helper.js";
import {
    testCasesGetProfile,
    testCasesUpdateProfile
} from "./user.const.js";

describe("(Unit) User Module", () => {
    useUnitTestDb();

    // --- GET PROFILE ---
    describe("(Unit) Get Profile", () => {
        it.each(testCasesGetProfile)(
            "GET /users/ : $description",
            async ({ id_user, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.userRepo) await mockUserRepositoryModule(mocks.userRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get("/users/")
                    .set("x-user-id", id_user) // Simulating auth user
                    .set("x-community-id", "1")
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    let result = expected_data;
                    if(response.status !== 200){
                        result = i18next.t(expected_data);
                    }
                    expect(response.body.data).toEqual(result);
                });
            }
        );
    });

    // --- UPDATE PROFILE ---
    describe("(Unit) Update Profile", () => {
        it.each(testCasesUpdateProfile)(
            "PUT /users/ : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.userRepo) await mockUserRepositoryModule(mocks.userRepo);
                if (mocks?.addressRepo) await mockAddressRepositoryModule(mocks.addressRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .put("/users/")
                    .send(body)
                    .set("x-user-id", "1")
                    .set("x-community-id", "1")
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    let result = expected_data;
                    if(response.status !== 200){
                        result = i18next.t(expected_data);
                    }
                    expect(response.body.data).toEqual(result);
                });
            }
        );
    });

});
