import { jest } from "@jest/globals";
import type { IAuthContextRepository } from "../../src/shared/context/i-authcontext.repository.js";

export function createMockAuthContextRepository(): jest.Mocked<IAuthContextRepository> {
  return {
    getInternalCommunityId: jest.fn(),
    getInternalUserId: jest.fn(),
  };
}
