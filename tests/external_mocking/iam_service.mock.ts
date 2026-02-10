import type { IIamService } from "../../src/shared/iam/i-iam.service.js";
import { jest } from "@jest/globals";

export function createMockIamService(): jest.Mocked<IIamService> {
  return {
    addUserToCommunity: jest.fn(),
    createCommunity: jest.fn(),
    deleteCommunity: jest.fn(),
    deleteUserFromCommunity: jest.fn(),
    getUserEmail: jest.fn(),
    updateCommunity: jest.fn(),
    updateUserRole: jest.fn(),
  };
}
