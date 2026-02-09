import {beforeEach, afterEach, jest} from '@jest/globals';
import {initalizeDb, initializeExternalServices, resetDb, tearDownDB} from "./helper.js";

/**
 * Registers standard DB setup/teardown hooks for the current describe block.
 * Call this at the top of your describe block.
 * @param {boolean} [initializeExternal] - Optional: Do we initialize external services
 * @param {Object} [hookOverrides] - Optional: { beforeEach, afterEach } overrides
 */
export const useFunctionalTestDb = (initializeExternal: boolean = true, hookOverrides: any = {}) => {
    beforeEach(async () => {
        jest.resetModules();
        if (hookOverrides.beforeEach) {
            await hookOverrides.beforeEach();
        } else {
            await initalizeDb();
            await resetDb();
            if(initializeExternal){
                await initializeExternalServices()
            }
        }
    });

    afterEach(async () => {
        if (hookOverrides.afterEach) {
            await hookOverrides.afterEach();
        } else {
            await tearDownDB();
        }
    });
};