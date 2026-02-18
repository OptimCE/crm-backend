import { jest } from "@jest/globals";
import type { IUserRepository } from "../../src/modules/users/domain/i-user.repository.js";

export function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    updateInvitations: jest.fn(),
  };
}
