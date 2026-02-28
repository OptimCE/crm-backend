import { jest } from "@jest/globals";
import type { IMemberRepository } from "../../src/modules/members/domain/i-member.repository.js";

export function createMockMemberRepository(): jest.Mocked<IMemberRepository> {
  return {
    saveManager: jest.fn(),
    addInvitationToMember: jest.fn(),
    deleteMember: jest.fn(),
    deleteMemberLink: jest.fn(),
    getFullMember: jest.fn(),
    getMember: jest.fn(),
    getMemberInvitation: jest.fn(),
    getMemberLink: jest.fn(),
    getMembersList: jest.fn(),
    saveCompany: jest.fn(),
    saveIndividual: jest.fn(),
    saveMember: jest.fn(),
  };
}
