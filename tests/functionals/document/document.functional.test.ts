import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import {
    expectWithLog,
    mockStorageServiceModule
} from "../../utils/helper.js";
import {
    testCasesDelete,
    testCasesDownload,
    testCasesGetDocuments,
    testCasesUpload,
    existingDocumentId,
    existingMemberId
} from "./document.const.js";

const AUTH_COMMUNITY_1 = "1";

describe("(Functional) Document Module", () => {
    useFunctionalTestDb();

    // --- GET DOCUMENTS ---
    describe("(Functional) Get Documents", () => {
        it.each(testCasesGetDocuments)(
            "GET /documents/:member_id : $description",
            async ({ member_id, query, orgs, status_code, expected_error_code, check_data }) => {
                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .get(`/documents/${member_id}`)
                    .query(query)
                    .set("x-user-id", "1")
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

    // --- DOWNLOAD DOCUMENT ---
    describe("(Functional) Download Document", () => {
        it.each(testCasesDownload)(
            "GET /documents/:member_id/:document_id : $description",
            async ({ document_id, document_member_id, orgs, status_code, is_binary, mocks, expected_error_code }) => {
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                // Note: The route is /documents/:member_id/:document_id 
                // The member_id in URL is theoretically redundant if SERVICE only uses ID, but we must respect route param.
                const url = `/documents/${document_member_id}/${document_id}`;

                const response = await request(app)
                    .get(url)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                if (is_binary && status_code === 200) {
                    expect(response.status).toBe(200);
                    expect(response.body).toBeInstanceOf(Buffer);
                    // Optionally check content length or headers
                } else {
                    await expectWithLog(response, () => {
                        expect(response.status).toBe(status_code);
                        if (expected_error_code) {
                            // AppError usually returns JSON with error_code
                            // But verify if response is JSON
                            if (response.headers["content-type"]?.includes("application/json")) {
                                expect(response.body.error_code).toBe(expected_error_code);
                            }
                        }
                    });
                }
            }
        );
    });

    // --- UPLOAD DOCUMENT ---
    describe("(Functional) Upload Document", () => {
        it.each(testCasesUpload)(
            "POST /documents/ : $description",
            async ({ field_member, file_name, orgs, status_code, expected_error_code, expected_data, mocks }) => {
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .post("/documents/")
                    // Multer expects multipart/form-data
                    .field("id_member", field_member) // The DTO property
                    .attach("file", Buffer.from("dummy content"), file_name)
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

    // --- DELETE DOCUMENT ---
    describe("(Functional) Delete Document", () => {
        it.each(testCasesDelete)(
            "DELETE /documents/:document_id : $description",
            async ({ document_id, orgs, status_code, expected_error_code, expected_data, mocks }) => {
                if (mocks?.storageService) await mockStorageServiceModule(mocks.storageService);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;

                const response = await request(app)
                    .delete(`/documents/${document_id}`)
                    .set("x-user-id", "auth0|admin")
                    .set("x-community-id", AUTH_COMMUNITY_1)
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    // If 200, check body. If 400+, check error code
                    if (response.status === 200) {
                        expect(response.body.error_code).toBe(expected_error_code);
                        if (expected_data) expect(response.body.data).toBe(expected_data);
                    } else if (expected_error_code) {
                        expect(response.body.error_code).toBe(expected_error_code);
                    }
                });
            }
        );
    });

});
