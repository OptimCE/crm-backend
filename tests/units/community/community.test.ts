import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
    expectWithLog,
    mockCommunityRepositoryModule,
    mockIAMServiceModule,
    mockAuthContextRepositoryModule,
} from "../../utils/helper.js";
import {
    testCasesCreateCommunity,
    testCasesDeleteCommunity,
    testCasesGetAdmins,
    testCasesGetMyCommunities,
    testCasesGetUsers,
    testCasesKick,
    testCasesLeave,
    testCasesPatchRole,
    testCasesUpdateCommunity
} from "./community.const.js";
describe("(Unit) Community Module", () => {

    // --- GET MY COMMUNITIES ---
    describe("(Unit) Get My Communities", () => {
        useUnitTestDb();

        it.each(testCasesGetMyCommunities)(
            "GET /communities/my-communities : $description",
            async ({
                       id_user,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       expected_pagination,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get("/communities/my-communities")
                    .query(query)
                    .set("x-user-id", id_user.toString());

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    let result = expected_data;
                    if(response.status !== 200){
                        result = i18next.t(expected_data);
                    }
                    expect(response.body.data).toEqual(result);
                    expect(response.body.pagination).toEqual(expected_pagination);
                });
            }
        );
    });

    // --- GET USERS ---
    describe("(Unit) Get Users", () => {
        useUnitTestDb();

        it.each(testCasesGetUsers)(
            "GET /communities/users : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .get("/communities/users")
                    .query(query)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
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

    // --- GET ADMINS ---
    describe("(Unit) Get Admins", () => {
        useUnitTestDb();

        it.each(testCasesGetAdmins)(
            "GET /communities/admins : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .get("/communities/admins")
                    .query(query)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
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

    // --- CREATE COMMUNITY ---
    describe("(Unit) Create Community", () => {
        useUnitTestDb();

        it.each(testCasesCreateCommunity)(
            "POST /communities : $description",
            async ({
                       id_user,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks,
                        translation_field
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                // Controller code provided uses req.query for validation in createCommunity,
                // matching the provided structure, though POST usually uses body.
                const response = await request(app)
                    .post("/communities")
                    .send(query)
                    .set("x-user-id", id_user.toString());

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    let result = expected_data;
                    if(response.status !== 200){
                        if(translation_field){
                            result = i18next.t(expected_data, translation_field);
                        }else{
                            result = i18next.t(expected_data);
                        }
                    }
                    expect(response.body.data).toEqual(result);
                });
            }
        );
    });

    // --- UPDATE COMMUNITY ---
    describe("(Unit) Update Community", () => {
        useUnitTestDb();

        it.each(testCasesUpdateCommunity)(
            "PUT /communities : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks,
                       translation_field
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .put("/communities")
                    .send(query)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    expect(response.body.error_code).toBe(expected_error_code);
                    let result = expected_data;
                    if(response.status !== 200){
                        if(translation_field){
                            result = i18next.t(expected_data, translation_field);
                        }else{
                            result = i18next.t(expected_data);
                        }
                    }
                    expect(response.body.data).toEqual(result);
                });
            }
        );
    });

    // --- PATCH ROLE ---
    describe("(Unit) Patch Role", () => {
        useUnitTestDb();

        it.each(testCasesPatchRole)(
            "PATCH /communities : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .patch("/communities")
                    .send(query)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
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

    // --- LEAVE COMMUNITY ---
    describe("(Unit) Leave Community", () => {
        useUnitTestDb();

        it.each(testCasesLeave)(
            "DELETE /communities/leave/:id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .delete(`/communities/leave/${id_community}`)
                    .set("x-user-id", id_user.toString())
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

    // --- KICK USER ---
    describe("(Unit) Kick User", () => {
        useUnitTestDb();

        it.each(testCasesKick)(
            "DELETE /communities/kick/:id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       target_user_id,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .delete(`/communities/kick/${target_user_id}`)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
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

    // --- DELETE COMMUNITY ---
    describe("(Unit) Delete Community", () => {
        useUnitTestDb();

        it.each(testCasesDeleteCommunity)(
            "DELETE /communities/delete/:id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.communityRepo) await mockCommunityRepositoryModule(mocks.communityRepo);
                if (mocks?.iamService) await mockIAMServiceModule(mocks.iamService);
                if (mocks?.authContext) await mockAuthContextRepositoryModule(mocks.authContext);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;

                const response = await request(app)
                    .delete(`/communities/delete/${id_community}`)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
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