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
    // Defaults to "no audience", which makes the notification fan-out a no-op in
    // tests that do not care about it. Without an entry here the call is
    // `undefined` and throws — previously swallowed by a try/catch at the call
    // site, which is exactly the masking the SAVEPOINT change removed.
    getMemberNotificationAudience: jest.fn(() => Promise.resolve(null)),
  };
}
