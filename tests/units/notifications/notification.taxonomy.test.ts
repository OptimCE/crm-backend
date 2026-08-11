import { describe, expect, it } from "@jest/globals";
import {
  NOTIFICATION_TYPE_PREFIXES,
  NOTIFICATION_TYPES,
  type NotificationTypeKey,
} from "../../../src/modules/notifications/domain/notification.taxonomy.js";

describe("(Unit) NOTIFICATION_TYPES registry", () => {
  it("registers every type key published across the platform", () => {
    // A full snapshot so adding a key is a conscious diff — and a reminder that
    // it is only half the work: each key also needs a registry entry and four
    // i18n titles in crm-frontend.
    expect(NOTIFICATION_TYPES).toEqual({
      MANAGER_INVITATION_RECEIVED: "manager_invitation.received",
      MEMBER_INVITATION_RECEIVED: "member_invitation.received",
      MEMBER_UPDATED: "member.updated",
      DOCUMENT_UPLOADED: "document.uploaded",
      NEWS_POST_PUBLISHED: "news_post.published",
      NEWS_POLL_PUBLISHED: "news_poll.published",
      INVOICE_ISSUED: "invoice.issued",
      INVOICE_OVERDUE: "invoice.overdue",
      BILLING_RUN_COMPLETED: "billing_run.completed",
      ADMIN_DEADLINE_DUE_SOON: "admin_deadline.due_soon",
      ADMIN_DEADLINE_MISSED: "admin_deadline.missed",
      ADMIN_DOSSIER_ACKNOWLEDGED: "admin_dossier.acknowledged",
    });
  });

  it("derives the preference prefixes from the taxonomy, without the '' wildcard", () => {
    // Served to the frontend so no hardcoded list can drift from this registry.
    // `''` is the catch-all default row, not a prefix, and is surfaced
    // separately by the preferences endpoint.
    expect(NOTIFICATION_TYPE_PREFIXES).toEqual([
      "admin_deadline",
      "admin_dossier",
      "billing_run",
      "document",
      "invoice",
      "manager_invitation",
      "member",
      "member_invitation",
      "news_poll",
      "news_post",
    ]);
    expect(NOTIFICATION_TYPE_PREFIXES).not.toContain("");
  });

  it("uses exactly two dot-separated segments", () => {
    // Load-bearing, not stylistic: the frontend resolves
    // `NOTIFICATIONS.TYPES.<feature>.<event>.title` through ngx-translate, which
    // treats each dot as a nesting level. A three-segment key would silently
    // need a third level in all four locale files.
    for (const key of Object.values(NOTIFICATION_TYPES)) {
      expect(key).toMatch(/^[a-z]+(?:_[a-z]+)*\.[a-z]+(?:_[a-z]+)*$/);
    }
  });

  it("NotificationTypeKey accepts arbitrary strings via the (string & {}) escape hatch", () => {
    // Compile-time check: `notification.type` is a free-form varchar(128) and
    // the functional suite publishes ad-hoc keys, so the union must stay open.
    const example: NotificationTypeKey = "simulation.completed";
    expect(typeof example).toBe("string");
  });
});
