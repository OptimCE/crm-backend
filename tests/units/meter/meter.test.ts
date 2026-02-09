import { expect, it } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog, mockMeterRepositoryModule } from "../../utils/helper.js";
import {
    testCasesAddMeter,
    testCasesDeleteMeter,
    testCasesDownloadMeterConsumptions,
    testCasesGetMeter,
    testCasesGetMeterConsumptions,
    testCasesGetMetersList,
    testCasesPatchMeterData
} from "./meter.const.js";

describe("(Unit) Meter Module", () => {

    // --- GET METERS LIST ---
    describe("(Unit) Get Meters List", () => {
        useUnitTestDb();

        it.each(testCasesGetMetersList)(
            "GET /meters/ : $description",
            async ({
                query,
                status_code,
                expected_error_code,
                expected_data,
                expected_pagination,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get("/meters/")
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
                    if (expected_pagination) {
                        expect(response.body.pagination).toEqual(expected_pagination);
                    }
                });
            }
        );
    });

    // --- GET METER ---
    describe("(Unit) Get Meter", () => {
        useUnitTestDb();

        it.each(testCasesGetMeter)(
            "GET /meters/:id : $description",
            async ({
                id,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/meters/${id}`)
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

    // --- GET METER CONSUMPTIONS ---
    describe("(Unit) Get Meter Consumptions", () => {
        useUnitTestDb();

        it.each(testCasesGetMeterConsumptions)(
            "GET /meters/:id/consumptions : $description",
            async ({
                id,
                query,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/meters/${id}/consumptions`)
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

    // --- DOWNLOAD METER CONSUMPTIONS ---
    describe("(Unit) Download Meter Consumptions", () => {
        useUnitTestDb();

        it.each(testCasesDownloadMeterConsumptions)(
            "GET /meters/:id/consumptions/download : $description",
            async ({
                id,
                query,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .get(`/meters/${id}/consumptions/download`)
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
                        // Binary check can be tricky, check headers and non-error
                        expect(response.header['content-type']).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    }
                });
            }
        );
    });

    // --- ADD METER ---
    describe("(Unit) Add Meter", () => {
        useUnitTestDb();

        it.each(testCasesAddMeter)(
            "POST /meters/ : $description",
            async ({
                body,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .post("/meters/")
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

    // --- PATCH METER DATA ---
    describe("(Unit) Patch Meter Data", () => {
        useUnitTestDb();

        it.each(testCasesPatchMeterData)(
            "PATCH /meters/data : $description",
            async ({
                body,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .patch("/meters/data")
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

    // --- DELETE METER ---
    describe("(Unit) Delete Meter", () => {
        useUnitTestDb();

        it.each(testCasesDeleteMeter)(
            "DELETE /meters/:id : $description",
            async ({
                id,
                status_code,
                expected_error_code,
                expected_data,
                mocks,
                orgs
            }) => {
                if (mocks?.meterRepo) await mockMeterRepositoryModule(mocks.meterRepo);

                const appModule = await import("../../../src/app.js");
                const app = appModule.default;
                const i18next = appModule.i18next;
                const response = await request(app)
                    .delete(`/meters/${id}`)
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
