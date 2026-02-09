import { expect, it } from "@jest/globals";
import request from "supertest";
import {useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
    mockDocumentBuffer,
    testCasesDelete,
    testCasesDownload,
    testCasesGetDocuments,
    testCasesUpload
} from "./document.const.js";
import {expectWithLog, mockDocumentRepositoryModule, mockStorageServiceModule} from "../../utils/helper.js";

describe("(Unit) Document Module", () => {

    // --- GET DOCUMENTS ---
    describe("(Unit) Get Documents", () => {
        useUnitTestDb();

        it.each(testCasesGetDocuments)(
            "GET /documents/:member_id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       member_id,
                       query,
                       status_code,
                       expected_error_code,
                       expected_data,
                       expected_pagination,
                       mocks
                   }) => {
                // Mock dependencies
                if (mocks?.documentRepo) await mockDocumentRepositoryModule(mocks.documentRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/documents/${member_id}`)
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
                    expect(response.body.pagination).toEqual(expected_pagination);
                });
            }
        );
    });

    // --- DOWNLOAD DOCUMENT ---
    describe("(Unit) Download Document", () => {
        useUnitTestDb();

        it.each(testCasesDownload)(
            "GET /documents/:member_id/:document_id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       document_id,
                       status_code,
                       is_binary,
                       expected_error_code,
                       expected_data, // Ensure we pick this up for error cases
                       mocks
                   }) => {
                if (mocks?.documentRepo) await mockDocumentRepositoryModule(mocks.documentRepo);
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const dummyMemberId = 1;

                const response = await request(app)
                    .get(`/documents/${dummyMemberId}/${document_id}`)
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (is_binary) {
                        expect(response.body).toBeInstanceOf(Buffer);
                        expect(response.body).toEqual(mockDocumentBuffer);
                        expect(response.headers['content-type']).toBeDefined();
                    } else {
                        // Error case
                        expect(response.body.error_code).toBe(expected_error_code);
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data!);
                        }
                        expect(response.body.data).toEqual(result);
                    }
                });
            }
        );
    });

    // --- UPLOAD DOCUMENT ---
    describe("(Unit) Upload Document", () => {
        useUnitTestDb();

        it.each(testCasesUpload)(
            "POST /documents : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       field_member,
                       file_name,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.documentRepo) await mockDocumentRepositoryModule(mocks.documentRepo);
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                let req = request(app)
                    .post("/documents")
                    .set("x-user-id", id_user.toString())
                    .set("x-community-id", id_community.toString())
                    .set("x-user-orgs", orgs);

                if (file_name) {
                    const fileBuffer = Buffer.from("dummy content");
                    req = req.attach("file", fileBuffer, file_name);
                }

                if (field_member) {
                    req = req.field("id_member", field_member);
                }

                const response = await req;

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

    // --- DELETE DOCUMENT ---
    describe("(Unit) Delete Document", () => {
        useUnitTestDb();

        it.each(testCasesDelete)(
            "DELETE /documents/:document_id : $description",
            async ({
                       id_user,
                       id_community,
                       orgs,
                       document_id,
                       status_code,
                       expected_error_code,
                       expected_data,
                       mocks
                   }) => {
                if (mocks?.documentRepo) await mockDocumentRepositoryModule(mocks.documentRepo);
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .delete(`/documents/${document_id}`)
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
