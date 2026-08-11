import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { mockStorageServiceModule } from "../../utils/helper.js";
import { contextMiddleware } from "../../../src/shared/middlewares/context.js";
import type { INotificationService } from "../../../src/modules/notifications/domain/i-notification.service.js";
import type { NotificationPublishInput } from "../../../src/modules/notifications/api/notification.dtos.js";
import { NOTIFICATION_TYPES } from "../../../src/modules/notifications/domain/notification.taxonomy.js";
import { NotificationCategory, NotificationChannel } from "../../../src/modules/notifications/shared/notification.types.js";
import type { IInvitationService } from "../../../src/modules/invitations/domain/i-invitation.service.js";
import type { IMemberService } from "../../../src/modules/members/domain/i-member.service.js";
import type { IDocumentService } from "../../../src/modules/documents/domain/i-document.service.js";
import type { InviteUser } from "../../../src/modules/invitations/api/invitation.dtos.js";
import type { UpdateMemberDTO } from "../../../src/modules/members/api/member.dtos.js";
import type { UploadDocumentDTO } from "../../../src/modules/documents/api/document.dtos.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "./notification.const.js";

/**
 * Every producer states a truthful (category, channels) pair.
 *
 * That pair is the whole point of IMPLEMENTATION_PLAN §1.3 — the producer states
 * intent, the notification layer owns policy — and it is what makes step 3's
 * preference/suppression logic a change in one place. These assertions are the
 * only thing that keeps a producer honest, because in steps 1-2 `category` and
 * `channels` are not persisted and have no visible effect.
 *
 * The service is rebound to a spy for the whole file. That is why this lives
 * apart from `notification.wiring.functional.test.ts`, whose tests need the real
 * service to prove rows actually land.
 */

const MEMBER_1_ID = 1;

const ADMIN_CTX = {
  "x-user-id": "auth0|admin",
  "x-community-id": AUTH_COMMUNITY_1,
  "x-user-orgs": ORGS_ADMIN,
};

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

/**
 * Rebind NotificationService to a spy and return the recorded inputs.
 *
 * A `container.get()` + `jest.spyOn` would not work: Inversify's default binding
 * scope here is Transient, so the instance a producer holds is a different
 * object than the one a test fetches.
 */
async function spyOnPublish(): Promise<NotificationPublishInput[]> {
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  const calls: NotificationPublishInput[] = [];
  const spy: Pick<INotificationService, "publish"> = {
    publish: (input: NotificationPublishInput): Promise<number> => {
      calls.push(input);
      return Promise.resolve(1);
    },
  };
  (await container.rebind<Pick<INotificationService, "publish">>("NotificationService")).toConstantValue(spy);
  return calls;
}

async function getService<T>(token: string): Promise<T> {
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  return container.get<T>(token);
}

describe("(Functional) Notification producer contract", () => {
  useFunctionalTestDb();

  it("member invitation is TRANSACTIONAL and asks for in-app + email", async () => {
    const calls = await spyOnPublish();
    const service = await getService<IInvitationService>("InvitationService");
    await runInContext(ADMIN_CTX, () => service.inviteUserToBecomeMember({ user_email: "member@test.com" } as InviteUser));

    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe(NOTIFICATION_TYPES.MEMBER_INVITATION_RECEIVED);
    expect(calls[0].category).toBe(NotificationCategory.TRANSACTIONAL);
    expect(calls[0].channels).toEqual([NotificationChannel.INAPP, NotificationChannel.EMAIL]);
  });

  it("manager invitation is TRANSACTIONAL and asks for in-app + email", async () => {
    const calls = await spyOnPublish();
    const service = await getService<IInvitationService>("InvitationService");
    await runInContext(ADMIN_CTX, () => service.inviteUserToBecomeManager({ user_email: "member@test.com" } as InviteUser));

    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe(NOTIFICATION_TYPES.MANAGER_INVITATION_RECEIVED);
    expect(calls[0].category).toBe(NotificationCategory.TRANSACTIONAL);
    expect(calls[0].channels).toEqual([NotificationChannel.INAPP, NotificationChannel.EMAIL]);
  });

  it("member.updated is INFORMATIONAL and in-app only", async () => {
    // It fires on any of a dozen fields, including a phone-number typo fix, so a
    // recipient must be able to mute it once preferences ship.
    const calls = await spyOnPublish();
    const service = await getService<IMemberService>("MemberService");
    await runInContext(ADMIN_CTX, () =>
      service.updateMember({ id: MEMBER_1_ID, phone_number: "+32470000000" } as UpdateMemberDTO),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe(NOTIFICATION_TYPES.MEMBER_UPDATED);
    expect(calls[0].category).toBe(NotificationCategory.INFORMATIONAL);
    expect(calls[0].channels).toEqual([NotificationChannel.INAPP]);
  });

  it("document.uploaded is INFORMATIONAL and in-app only", async () => {
    const calls = await spyOnPublish();
    const uploadDocument = jest.fn() as jest.Mock;
    uploadDocument.mockResolvedValue({ url: "http://storage/report.pdf", file_type: "application/pdf" });
    await mockStorageServiceModule({ uploadDocument });
    const service = await getService<IDocumentService>("DocumentService");
    await runInContext(ADMIN_CTX, () =>
      service.uploadDocument({ id_member: MEMBER_1_ID, file: { originalname: "report.pdf", size: 1024 } } as unknown as UploadDocumentDTO),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe(NOTIFICATION_TYPES.DOCUMENT_UPLOADED);
    expect(calls[0].category).toBe(NotificationCategory.INFORMATIONAL);
    expect(calls[0].channels).toEqual([NotificationChannel.INAPP]);
  });
});
