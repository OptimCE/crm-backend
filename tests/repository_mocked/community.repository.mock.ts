import { jest } from "@jest/globals";
import type { ICommunityRepository } from "../../src/modules/communities/domain/i-community.repository.js";

export function createMockCommunityRepository(): jest.Mocked<ICommunityRepository> {
  return {
    addCommunity: jest.fn(),
    addUserCommunity: jest.fn(),
    deleteCommunity: jest.fn(),
    deleteUserCommunity: jest.fn(),
    getAdmins: jest.fn(),
    getAllPublicCommunities: jest.fn(),
    getCommunityById: jest.fn(),
    getCommunityUser: jest.fn(),
    getMyCommunities: jest.fn(),
    getUsers: jest.fn(),
    patchRoleUser: jest.fn(),
    updateCommunity: jest.fn(),
  };
}
