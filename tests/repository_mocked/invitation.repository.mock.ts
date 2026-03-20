import { jest } from "@jest/globals";
import type { IInvitationRepository } from "../../src/modules/invitations/domain/i-invitation.repository.js";

export function createMockInvitationRepository(): jest.Mocked<IInvitationRepository> {
  return {
    cancelManagerInvitation: jest.fn(),
    cancelMemberInvitation: jest.fn(),
    getManagersPendingInvitation: jest.fn(),
    getMembersPendingInvitation: jest.fn(),
    inviteUserToBecomeManager: jest.fn(),
    inviteUserToBecomeMember: jest.fn(),
  };
}
