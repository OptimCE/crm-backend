import { jest } from "@jest/globals";
import type {IStorageService} from "../../src/shared/storage/i-storage.service.js";

export function createMockStorageService(): jest.Mocked<IStorageService>{
    return {
        deleteDocument: jest.fn(),
        getDocument: jest.fn(),
        uploadDocument: jest.fn()
    }
}