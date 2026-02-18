import { jest } from "@jest/globals";
import type { IKeyRepository } from "../../src/modules/keys/domain/i-key.repository.js";

export function createMockKeyRepository(): jest.Mocked<IKeyRepository> {
  return {
    createChildren: jest.fn(),
    createKey: jest.fn(),
    deleteChildren: jest.fn(),
    deleteKey: jest.fn(),
    getKeyById: jest.fn(),
    getPartialKeyList: jest.fn(),
    updateKey: jest.fn(),
  };
}
