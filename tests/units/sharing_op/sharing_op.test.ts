import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import {
    expectWithLog,
    mockKeyRepositoryModule,
    mockMeterRepositoryModule,
    mockSharingOperationRepositoryModule
} from "../../utils/helper.js";
import {
    testCasesAddData,
    testCasesAddKey,
    testCasesAddMeter,
    testCasesCreate,
    testCasesDelete,
    testCasesDeleteMeter,
    testCasesDownload,
    testCasesGetSharingOperation,
    testCasesGetSharingOperationConsumptions,
    testCasesGetSharingOperationList,
    testCasesPatchKey,
    testCasesPatchMeter
} from "./sharing_op.const.js";

describe("(Unit) Sharing Operation Module", () => {
    useUnitTestDb();

    // --- GET LIST ---
    describe("(Unit) Get Sharing Operation List", () => {
        it.each(testCasesGetSharingOperationList)(
            "GET /sharing_operations/ : $description",
            async ({ query, status_code, expected_error_code, expected_data, expected_pagination, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get("/sharing_operations/")
                    .query(query)
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
                    if (expected_pagination) expect(response.body.pagination).toEqual(expected_pagination);
                });
            }
        );
    });

    // --- GET ONE ---
    describe("(Unit) Get Sharing Operation", () => {
        it.each(testCasesGetSharingOperation)(
            "GET /sharing_operations/:id : $description",
            async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/sharing_operations/${id}`)
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

    // --- GET CONSUMPTIONS ---
    describe("(Unit) Get Sharing Operation Consumptions", () => {
        it.each(testCasesGetSharingOperationConsumptions)(
            "GET /sharing_operations/:id/consumptions : $description",
            async ({ id, query, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/sharing_operations/${id}/consumptions`)
                    .query(query)
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

    // --- DOWNLOAD CONSUMPTIONS ---
    describe("(Unit) Download Consumptions", () => {
        it.each(testCasesDownload)(
            "GET /sharing_operations/:id/consumptions/download : $description",
            async ({ id, query, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/sharing_operations/${id}/consumptions/download`)
                    .query(query)
                    .set("x-user-id", "1")
                    .set("x-community-id", "1")
                    .set("x-user-orgs", orgs);

                await expectWithLog(response, () => {
                    expect(response.status).toBe(status_code);
                    if (expected_error_code) {
                        expect(response.body.error_code).toBe(expected_error_code);
                        let result = expected_data;
                        if(response.status !== 200){
                            result = i18next.t(expected_data);
                        }
                        expect(response.body.data).toEqual(result);
                    } else {
                        expect(response.header['content-type']).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    }
                });
            }
        );
    });

    // --- CREATE ---
    describe("(Unit) Create Sharing Operation", () => {
        it.each(testCasesCreate)(
            "POST /sharing_operations/ : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .post("/sharing_operations/")
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

    // --- ADD KEY ---
    describe("(Unit) Add Key to Sharing Operation", () => {
        it.each(testCasesAddKey)(
            "POST /sharing_operations/key : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);
                if (mocks?.keyRepo) await mockKeyRepositoryModule(mocks.keyRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .post("/sharing_operations/key")
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

    // --- ADD METER ---
    describe("(Unit) Add Meter to Sharing Operation", () => {
        it.each(testCasesAddMeter)(
            "POST /sharing_operations/meter : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .post("/sharing_operations/meter")
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

    // --- ADD CONSUMPTION DATA (FILE UPLOAD) ---
    describe("(Unit) Add Consumption Data", () => {
        it.each(testCasesAddData)(
            "POST /sharing_operations/data : $description",
            async ({ body, file, status_code, expected_error_code, expected_data, mocks, orgs, translation_field }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                let req = request(app).post("/sharing_operations/consumptions");

                // Add fields
                for (const [key, value] of Object.entries(body as object)) {
                    req.field(key, value);
                }

                if (file) {
                    req.attach("file", file.buffer, { filename: file.originalname, contentType: file.mimetype });
                }

                req.set("x-user-id", "1")
                    .set("x-community-id", "1")
                    .set("x-user-orgs", orgs);

                const response = await req;

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

    // --- PATCH KEY STATUS ---
    describe("(Unit) Patch Key Status", () => {
        it.each(testCasesPatchKey)(
            "PATCH /sharing_operations/key : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .patch("/sharing_operations/key")
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

    // --- PATCH METER STATUS ---
    describe("(Unit) Patch Meter Status", () => {
        it.each(testCasesPatchMeter)(
            "PATCH /sharing_operations/meter : $description",
            async ({ body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .patch("/sharing_operations/meter")
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

    // --- DELETE OP ---
    describe("(Unit) Delete Sharing Operation", () => {
        it.each(testCasesDelete)(
            "DELETE /sharing_operations/:id : $description",
            async ({ id, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .delete(`/sharing_operations/${id}`)
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

    // --- DELETE METER FROM OP ---
    describe("(Unit) Delete Meter from Sharing Operation", () => {
        it.each(testCasesDeleteMeter)(
            "DELETE /sharing_operations/:id/meter : $description",
            async ({ id, body, status_code, expected_error_code, expected_data, mocks, orgs }) => {
                if (mocks?.sharingOpRepo) await mockSharingOperationRepositoryModule(mocks.sharingOpRepo);
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .delete(`/sharing_operations/${id}/meter`)
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
