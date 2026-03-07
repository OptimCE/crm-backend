import { jest } from "@jest/globals";
import type { IMeRepository } from "../../src/modules/me/domain/i-me.repository.js";

export function createMockMeRepository(): jest.Mocked<IMeRepository> {
  return {
    getMemberById: jest.fn(),
    getMembersList: jest.fn(),
    getDocumentById: jest.fn(),
    getDocuments: jest.fn(),
    getMeterById: jest.fn(),
    getMeters: jest.fn(),
    getOwnManagersPendingInvitation: jest.fn(),
    getOwnMembersPendingInvitation: jest.fn(),
    getOwnMembersPendingInvitationById: jest.fn(),
    getInvitationManagerById: jest.fn(),
    getInvitationMemberById: jest.fn(),
    saveUserMemberLink: jest.fn(),
    deleteUserMemberInvitation: jest.fn(),
    deleteGestionnaireInvitation: jest.fn(),
    refuseManagerInvitation: jest.fn(),
    refuseMemberInvitation: jest.fn(),
  };
}
