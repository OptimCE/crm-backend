import { jest } from "@jest/globals";
import type {
    ISharingOperationRepository
} from "../../src/modules/sharing_operations/domain/i-sharing_operation.repository.js";

export function createMockSharingOperationRepository(): jest.Mocked<ISharingOperationRepository>{
    return {
        addConsumptions: jest.fn(),
        addKeyToSharing: jest.fn(),
        addSharingKeyEntry: jest.fn(),
        closeActiveApprovedKey: jest.fn(),
        closeSpecificKeyEntry: jest.fn(),
        createSharingOperation: jest.fn(),
        deleteSharingOperation: jest.fn(),
        getAuthorizedEans: jest.fn(),
        getSharingOperationById: jest.fn(),
        getSharingOperationConsumption: jest.fn(),
        getSharingOperationList: jest.fn()

    }
}