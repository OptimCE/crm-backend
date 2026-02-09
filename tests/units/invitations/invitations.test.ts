
import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
    expectWithLog,
    mockInvitationRepositoryModule,
    mockUserRepositoryModule,
    mockAuthContextRepositoryModule,
    mockIAMServiceModule,
    mockMemberRepositoryModule,
    mockAddressRepositoryModule,
    mockCommunityRepositoryModule
} from "../../utils/helper.js";
import {
    testCasesGetPendingMembers,
    testCasesGetPendingManagers,
    testCasesGetPendingOwnMembers,
    testCasesGetPendingOwnManagers,
    testCasesInvite,
    testCasesAcceptMember,
    testCasesAcceptManager,
    testCasesAcceptEncoded,
    testCasesCancelMember,
    testCasesCancelManager,
    testCasesRefuseMember,
    testCasesRefuseManager
} from "./invitations.const.js";

describe("(Unit) Invitation Module", () => {

    // --- GET PENDING INVITATIONS MEMBERS ---
    describe("(Unit) Get Pending Invitations Members", () => {
        useUnitTestDb();

        it.each(testCasesGetPendingMembers)(
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
                translation_field
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

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
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            if(translation_field){
                                result = i18next.t(expected_data, translation_field);
                            }else{
                                result = i18next.t(expected_data);
                            }
                        }
                        expect(response.body.data).toEqual(result);
                    }
                    if (expected_pagination) {
                        expect(response.body.pagination).toEqual(expected_pagination);
                    }
                });
            }
        );
    });

    // --- GET PENDING INVITATIONS MANAGERS ---
    describe("(Unit) Get Pending Invitations Managers", () => {
        useUnitTestDb();

        it.each(testCasesGetPendingManagers)(
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
                translation_field
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

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
                    else if(expected_data){
                        let result: any = expected_data;
                        if(response.status !== 200){
                            if(translation_field){
                                result = i18next.t(expected_data, translation_field);
                            }else{
                                result = i18next.t(expected_data);
                            }
                        }
                        expect(response.body.data).toEqual(result);
                    }
                    if (expected_pagination) {
                        expect(response.body.pagination).toEqual(expected_pagination);
                    }
                });
            }
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
                translation_field
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

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
                    else if(expected_data){
                        let result: any = expected_data;
                        if(response.status !== 200){
                            if(translation_field){
                                result = i18next.t(expected_data, translation_field);
                            }else{
                                result = i18next.t(expected_data);
                            }
                        }
                        expect(response.body.data).toEqual(result);
                    }
                    if (expected_pagination) {
                        expect(response.body.pagination).toEqual(expected_pagination);
                    }
                });
            }
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
                translation_field
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

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
                    else if(expected_data){
                        let result:any = expected_data;
                        if(response.status !== 200){
                            if(translation_field){
                                result = i18next.t(expected_data, translation_field);
                            }else{
                                result = i18next.t(expected_data);
                            }
                        }
                        expect(response.body.data).toEqual(result);
                    }
                    if (expected_pagination) {
                        expect(response.body.pagination).toEqual(expected_pagination);
                    }
                });
            }
        );
    });

    // --- INVITE USER ---
    describe("(Unit) Invite User", () => {
        useUnitTestDb();

        it.each(testCasesInvite)(
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
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);
                if (mocks?.userRepo) await mockUserRepositoryModule(mocks.userRepo);

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
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- ACCEPT INVITATION MEMBER ---
    describe("(Unit) Accept Invitation Member", () => {
        useUnitTestDb();

        it.each(testCasesAcceptMember)(
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
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);
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
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- ACCEPT INVITATION MANAGER ---
    describe("(Unit) Accept Invitation Manager", () => {
        useUnitTestDb();

        it.each(testCasesAcceptManager)(
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
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);
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
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- ACCEPT INVITATION ENCODED ---
    describe("(Unit) Accept Invitation Encoded", () => {
        useUnitTestDb();

        it.each(testCasesAcceptEncoded)(
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
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);
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
                    else if(expected_data){
                        let result: any = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data as string);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- CANCEL INVITATION MEMBER ---
    describe("(Unit) Cancel Invitation Member", () => {
        useUnitTestDb();

        it.each(testCasesCancelMember)(
            "$description",
            async ({
                endpoint,
                method,
                id_user,
                id_community,
                orgs,
                status_code,
                expected_error_code,
                expected_data,
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                // @ts-ignore
                const response = await request(app)[method](endpoint)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- CANCEL INVITATION MANAGER ---
    describe("(Unit) Cancel Invitation Manager", () => {
        useUnitTestDb();

        it.each(testCasesCancelManager)(
            "$description",
            async ({
                endpoint,
                method,
                id_user,
                id_community,
                orgs,
                status_code,
                expected_error_code,
                expected_data,
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                // @ts-ignore
                const response = await request(app)[method](endpoint)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- REFUSE INVITATION MEMBER ---
    describe("(Unit) Refuse Invitation Member", () => {
        useUnitTestDb();

        it.each(testCasesRefuseMember)(
            "$description",
            async ({
                endpoint,
                method,
                id_user,
                id_community,
                orgs,
                status_code,
                expected_error_code,
                expected_data,
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                // @ts-ignore
                const response = await request(app)[method](endpoint)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- REFUSE INVITATION MANAGER ---
    describe("(Unit) Refuse Invitation Manager", () => {
        useUnitTestDb();

        it.each(testCasesRefuseManager)(
            "$description",
            async ({
                endpoint,
                method,
                id_user,
                id_community,
                orgs,
                status_code,
                expected_error_code,
                expected_data,
                mocks
            }) => {
                if (mocks?.invitationRepo) await mockInvitationRepositoryModule(mocks.invitationRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                // @ts-ignore
                const response = await request(app)[method](endpoint)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (expected_error_code) expect(response.body.error_code).toBe(expected_error_code);
                    if (expected_data && status_code === 200) expect(response.body.data).toEqual(expected_data);
                    else if(expected_data){
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

});
