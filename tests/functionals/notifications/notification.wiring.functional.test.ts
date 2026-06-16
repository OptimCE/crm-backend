import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { mockStorageServiceModule } from "../../utils/helper.js";
import { contextMiddleware } from "../../../src/shared/middlewares/context.js";
import type { IInvitationService } from "../../../src/modules/invitations/domain/i-invitation.service.js";
import type { IMemberService } from "../../../src/modules/members/domain/i-member.service.js";
import type { IDocumentService } from "../../../src/modules/documents/domain/i-document.service.js";
import type { InviteUser } from "../../../src/modules/invitations/api/invitation.dtos.js";
import type { UpdateMemberDTO } from "../../../src/modules/members/api/member.dtos.js";
import type { UploadDocumentDTO } from "../../../src/modules/documents/api/document.dtos.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "./notification.const.js";

// Seeded by tests/sql/init.sql:
//   app_user: 1 demo, 2 admin(auth0|admin), 3 manager(manager@test.com), 4 member(member@test.com)
//   member 1: Individual "Member One" in community 1, guardian = manager 1 (mgr1@test.com),
//             linked to user 4 via user_member_link
const ADMIN_USER_ID = 2;
const MANAGER_USER_ID = 3;
const MEMBER_USER_ID = 4;
const MEMBER_1_ID = 1;
const GUARDIAN_MANAGER_ID = 1;

const ADMIN_CTX = {
  "x-user-id": "auth0|admin",
  "x-community-id": AUTH_COMMUNITY_1,
  "x-user-orgs": ORGS_ADMIN,
};

interface NotifRow {
  id_user: number;
  id_community: number | null;
  type: string;
  data: Record<string, unknown>;
}

/** Run `fn` inside a populated request context (mirrors contextMiddleware on a real call). */
async function runInContext(headers: Record<string, string>, fn: () => Promise<void>): Promise<void> {
  const mw = contextMiddleware();
  const req = { headers } as unknown as Request;
  await new Promise<void>((resolve, reject) => {
    mw(req, {} as Response, ((): NextFunction => {
      return ((): void => {
        fn().then(resolve, reject);
      }) as unknown as NextFunction;
    })());
  });
}

async function getService<T>(token: string): Promise<T> {
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  return container.get<T>(token);
}

async function notificationsFor(userId: number): Promise<NotifRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
  const rows = await AppDataSource.manager.find(Notification, { where: { id_user: userId }, order: { id: "ASC" } });
  return rows.map((r) => ({ id_user: r.id_user, id_community: r.id_community, type: r.type, data: r.data }));
}

async function totalNotifications(): Promise<number> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
  return AppDataSource.manager.count(Notification);
}

async function setGuardianEmail(managerId: number, email: string): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Manager } = await import("../../../src/modules/members/domain/member.models.js");
  await AppDataSource.manager.update(Manager, { id: managerId }, { email });
}

describe("(Functional) Notification wiring", () => {
  useFunctionalTestDb();

  describe("member invitation", () => {
    it("notifies the invitee when they already have an account", async () => {
      const service = await getService<IInvitationService>("InvitationService");
      await runInContext(ADMIN_CTX, () => service.inviteUserToBecomeMember({ user_email: "member@test.com" } as InviteUser));

      const rows = await notificationsFor(MEMBER_USER_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0].type).toBe("member_invitation.received");
      expect(rows[0].id_community).toBe(1);
    });

    it("creates no notification when the invitee is not registered yet", async () => {
      const service = await getService<IInvitationService>("InvitationService");
      await runInContext(ADMIN_CTX, () => service.inviteUserToBecomeMember({ user_email: "nobody@nowhere.test" } as InviteUser));

      expect(await totalNotifications()).toBe(0);
    });
  });

  describe("manager invitation", () => {
    it("notifies the invitee when they already have an account", async () => {
      const service = await getService<IInvitationService>("InvitationService");
      await runInContext(ADMIN_CTX, () => service.inviteUserToBecomeManager({ user_email: "manager@test.com" } as InviteUser));

      const rows = await notificationsFor(MANAGER_USER_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0].type).toBe("manager_invitation.received");
    });
  });

  describe("member updated", () => {
    it("notifies the linked user and the guardian, excluding the actor", async () => {
      // Point member 1's guardian at an account (manager@test.com = user 3).
      await setGuardianEmail(GUARDIAN_MANAGER_ID, "manager@test.com");

      const service = await getService<IMemberService>("MemberService");
      await runInContext(ADMIN_CTX, () => service.updateMember({ id: MEMBER_1_ID, name: "Updated One" } as unknown as UpdateMemberDTO));

      // Linked user 4 and guardian user 3 each get one; actor (user 2) gets none.
      const linked = await notificationsFor(MEMBER_USER_ID);
      const guardian = await notificationsFor(MANAGER_USER_ID);
      const actor = await notificationsFor(ADMIN_USER_ID);

      expect(linked.map((r) => r.type)).toEqual(["member.updated"]);
      expect(guardian.map((r) => r.type)).toEqual(["member.updated"]);
      expect(actor).toHaveLength(0);
      expect(linked[0].id_community).toBe(1);
    });

    it("excludes the actor even when the actor is the linked user", async () => {
      // user 4 (member@test.com) is the linked user of member 1; have user 4 update it.
      const service = await getService<IMemberService>("MemberService");
      await runInContext(
        { "x-user-id": "auth0|member", "x-community-id": AUTH_COMMUNITY_1, "x-user-orgs": ORGS_ADMIN },
        () => service.updateMember({ id: MEMBER_1_ID, name: "Self Update" } as unknown as UpdateMemberDTO),
      );

      // Guardian mgr1@test.com has no account; linked user 4 is the actor → excluded.
      expect(await totalNotifications()).toBe(0);
    });
  });

  describe("document uploaded", () => {
    it("notifies the member's linked user account(s)", async () => {
      const uploadDocument = jest.fn() as jest.Mock;
      uploadDocument.mockResolvedValue({ url: "http://storage/report.pdf", file_type: "application/pdf" });
      await mockStorageServiceModule({ uploadDocument });

      const service = await getService<IDocumentService>("DocumentService");
      await runInContext(ADMIN_CTX, () =>
        service.uploadDocument({ id_member: MEMBER_1_ID, file: { originalname: "report.pdf", size: 1024 } } as unknown as UploadDocumentDTO),
      );

      const linked = await notificationsFor(MEMBER_USER_ID);
      expect(linked).toHaveLength(1);
      expect(linked[0].type).toBe("document.uploaded");
      expect(linked[0].data).toMatchObject({ member_id: MEMBER_1_ID, file_name: "report.pdf" });
      // Actor (user 2) is not notified.
      expect(await notificationsFor(ADMIN_USER_ID)).toHaveLength(0);
    });
  });
});
