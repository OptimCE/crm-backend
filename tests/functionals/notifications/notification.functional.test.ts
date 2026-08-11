import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import type { EntityManager, QueryRunner } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { Role } from "../../../src/shared/dtos/role.js";
import { NOTIFICATION_ERRORS } from "../../../src/modules/notifications/shared/notification.errors.js";
import type { NotificationPublishInput } from "../../../src/modules/notifications/api/notification.dtos.js";
import {
  NotificationCategory,
  NotificationChannel,
  OutboundStatus,
  PreferenceMode,
} from "../../../src/modules/notifications/shared/notification.types.js";
import {
  ADMIN_AUTH_USER_ID,
  ADMIN_USER_ID,
  AUTH_COMMUNITY_1,
  INTERNAL_COMMUNITY_1,
  INTERNAL_COMMUNITY_2,
  MEMBER_USER_ID,
  ORGS_ADMIN,
} from "./notification.const.js";

// Internal user ids seeded by tests/sql/init.sql (community_user memberships):
//   community 1 -> users 1(ADMIN), 2(ADMIN), 3(MANAGER), 4(MEMBER)
//   community 2 -> users 2(ADMIN), 3(MANAGER), 4(MEMBER)
//   community 3 -> user 2(ADMIN)
const DEMO_USER_ID = 1;
const MANAGER_USER_ID = 3;
const COMMUNITY_1_NAME = "Test Community";
const MEMBER_EMAIL = "member@test.com";

/**
 * The policy pair these targeting tests use. `category` and `channels` are
 * required on every publish (IMPLEMENTATION_PLAN §1.3); neither has a safe
 * default. In-app + informational is the conservative pair: it can never email
 * anyone and it stays opt-out-able once preferences ship.
 */
const INAPP_INFO: Pick<NotificationPublishInput, "category" | "channels"> = {
  category: NotificationCategory.INFORMATIONAL,
  channels: [NotificationChannel.INAPP],
};

interface SeedNotification {
  id_user: number;
  id_community?: number | null;
  type?: string;
  data?: Record<string, unknown>;
  read_at?: Date | null;
}

interface NotificationRow {
  id_user: number;
  id_community: number | null;
  type: string;
  read_at: Date | null;
}

interface OutboundRow {
  id_notification: string | null;
  id_community: number | null;
  channel: NotificationChannel;
  recipient: string;
  recipient_name: string | null;
  locale: string;
  type: string;
  category: NotificationCategory;
  dedupe_key: string;
  status: OutboundStatus;
  attempts: number;
}

interface PublishService {
  publish(input: NotificationPublishInput, qr?: QueryRunner): Promise<number>;
}

const ADMIN_IN_COMMUNITY_1 = {
  "x-user-id": ADMIN_AUTH_USER_ID,
  "x-community-id": AUTH_COMMUNITY_1,
  "x-user-orgs": ORGS_ADMIN,
};
const ADMIN_NO_COMMUNITY = { "x-user-id": ADMIN_AUTH_USER_ID };

async function getNotificationService(): Promise<PublishService> {
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  return container.get("NotificationService");
}

/** Insert notification rows directly via TypeORM. Returns the generated ids. */
async function seedNotifications(entries: SeedNotification[]): Promise<string[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
  const ids: string[] = [];
  for (const entry of entries) {
    const row = AppDataSource.manager.create(Notification, {
      id_user: entry.id_user,
      id_community: entry.id_community ?? null,
      type: entry.type ?? "simulation.completed",
      data: entry.data ?? {},
      read_at: entry.read_at ?? null,
    });
    const saved = await AppDataSource.manager.save(row);
    ids.push(String(saved.id));
  }
  return ids;
}

async function allNotifications(): Promise<NotificationRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
  const rows = await AppDataSource.manager.find(Notification, { order: { id: "ASC" } });
  return rows.map((r) => ({ id_user: r.id_user, id_community: r.id_community, type: r.type, read_at: r.read_at }));
}

async function allOutbound(): Promise<OutboundRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { OutboundMessage } = await import("../../../src/modules/notifications/domain/notification.models.js");
  const rows = await AppDataSource.manager.find(OutboundMessage, { order: { id: "ASC" } });
  return rows.map((r) => ({
    id_notification: r.id_notification,
    id_community: r.id_community,
    channel: r.channel,
    recipient: r.recipient,
    recipient_name: r.recipient_name,
    locale: r.locale,
    type: r.type,
    category: r.category,
    dedupe_key: r.dedupe_key,
    status: r.status,
    attempts: r.attempts,
  }));
}

/**
 * Count queued rows through a specific EntityManager. Used to read the same
 * table from inside and outside an open transaction.
 */
async function countOutboundOn(manager: EntityManager): Promise<number> {
  const { OutboundMessage } = await import("../../../src/modules/notifications/domain/notification.models.js");
  return manager.count(OutboundMessage);
}

/**
 * Preference rows are seeded per test, never in `tests/sql/init.sql`: that file
 * is replayed before EVERY functional test in every project, so a seeded
 * preference would silently mute unrelated suites.
 */
async function seedPreferences(rows: { id_user: number; type_prefix: string; channel: NotificationChannel; mode: PreferenceMode }[]): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { NotificationPreference } = await import("../../../src/modules/notifications/domain/notification.models.js");
  await AppDataSource.manager.insert(NotificationPreference, rows);
}

async function preferenceCountFor(id_user: number): Promise<number> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { NotificationPreference } = await import("../../../src/modules/notifications/domain/notification.models.js");
  return AppDataSource.manager.count(NotificationPreference, { where: { id_user } });
}

async function readAtOf(id: string): Promise<Date | null> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
  const row = await AppDataSource.manager.findOne(Notification, { where: { id } });
  return row ? row.read_at : null;
}

async function getApp(): Promise<unknown> {
  const appModule = await import("../../../src/app.js");
  return appModule.default;
}

describe("(Functional) Notification Module", () => {
  useFunctionalTestDb();

  describe("NotificationService.publish()", () => {
    it("writes a single row for a user target (optionally tagged with a community)", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "simulation.completed",
        ...INAPP_INFO,
        data: { simulationId: 7 },
        target: { kind: "user", userId: MEMBER_USER_ID, communityId: INTERNAL_COMMUNITY_1 },
      });

      expect(written).toBe(1);
      const rows = await allNotifications();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "simulation.completed" });
    });

    it("writes a community-less row for a user target without a community", async () => {
      const service = await getNotificationService();
      await service.publish({ type: "account.welcome", ...INAPP_INFO, target: { kind: "user", userId: MEMBER_USER_ID } });

      const rows = await allNotifications();
      expect(rows).toHaveLength(1);
      expect(rows[0].id_community).toBeNull();
    });

    it("fans out to every member when targeting a whole community", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "community.announcement",
        ...INAPP_INFO,
        target: { kind: "community", communityId: INTERNAL_COMMUNITY_1 },
      });

      expect(written).toBe(4);
      const rows = await allNotifications();
      expect(rows.map((r) => r.id_user).sort()).toEqual([DEMO_USER_ID, ADMIN_USER_ID, MANAGER_USER_ID, MEMBER_USER_ID].sort());
      expect(rows.every((r) => r.id_community === INTERNAL_COMMUNITY_1)).toBe(true);
    });

    it("narrows a community fan-out to the given roles", async () => {
      const service = await getNotificationService();

      const managers = await service.publish({
        type: "t",
        ...INAPP_INFO,
        target: { kind: "community", communityId: INTERNAL_COMMUNITY_1, roles: [Role.GESTIONNAIRE] },
      });
      expect(managers).toBe(1);
      expect((await allNotifications()).map((r) => r.id_user)).toEqual([MANAGER_USER_ID]);
    });

    it("supports targeting several roles at once (managers + admins)", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "t",
        ...INAPP_INFO,
        target: { kind: "community", communityId: INTERNAL_COMMUNITY_1, roles: [Role.GESTIONNAIRE, Role.ADMIN] },
      });

      expect(written).toBe(3);
      expect((await allNotifications()).map((r) => r.id_user).sort()).toEqual([DEMO_USER_ID, ADMIN_USER_ID, MANAGER_USER_ID].sort());
    });

    it("writes nothing when no community member matches the role filter", async () => {
      const service = await getNotificationService();
      // Community 3 has a single ADMIN member, so a MEMBER-only target matches no one.
      const written = await service.publish({
        type: "t",
        ...INAPP_INFO,
        target: { kind: "community", communityId: 3, roles: [Role.MEMBER] },
      });

      expect(written).toBe(0);
      expect(await allNotifications()).toHaveLength(0);
    });

    it("fans out to an explicit, de-duplicated set of users", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "t",
        ...INAPP_INFO,
        target: { kind: "users", userIds: [ADMIN_USER_ID, ADMIN_USER_ID, MEMBER_USER_ID], communityId: INTERNAL_COMMUNITY_1 },
      });

      expect(written).toBe(2);
      const rows = await allNotifications();
      expect(rows.map((r) => r.id_user).sort()).toEqual([ADMIN_USER_ID, MEMBER_USER_ID].sort());
      expect(rows.every((r) => r.id_community === INTERNAL_COMMUNITY_1)).toBe(true);
    });
  });

  describe("NotificationService.publish() — category and channels", () => {
    it("queues an outbound_message alongside the in-app row when EMAIL is requested", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "invoice.issued",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP, NotificationChannel.EMAIL],
        target: { kind: "user", userId: MEMBER_USER_ID, communityId: INTERNAL_COMMUNITY_1 },
      });

      expect(written).toBe(1);
      const notifications = await allNotifications();
      expect(notifications).toHaveLength(1);

      const queued = await allOutbound();
      expect(queued).toHaveLength(1);
      expect(queued[0]).toMatchObject({
        channel: NotificationChannel.EMAIL,
        recipient: MEMBER_EMAIL,
        recipient_name: "Member User",
        id_community: INTERNAL_COMMUNITY_1,
        type: "invoice.issued",
        category: NotificationCategory.TRANSACTIONAL,
        status: OutboundStatus.PENDING,
        attempts: 0,
        // No app_user.locale is seeded: '' means "unknown" and the dispatcher
        // owns the fallback, because it is the only component that knows which
        // locales it has templates for.
        locale: "",
      });
      // The link back to the in-app row is the whole reason insertMany flushes
      // before the enqueue.
      expect(queued[0].id_notification).not.toBeNull();
    });

    it("queues email with a null id_notification when INAPP is not requested", async () => {
      // An email-only publish has no in-app record to point at, which is exactly
      // the case `outbound_message.id_notification BIGINT NULL` exists for. Note
      // `written` is 0 — the return value counts in-app rows, not delivery.
      const service = await getNotificationService();
      const written = await service.publish({
        type: "invoice.issued",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.EMAIL],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });

      expect(written).toBe(0);
      expect(await allNotifications()).toHaveLength(0);

      const queued = await allOutbound();
      expect(queued).toHaveLength(1);
      expect(queued[0].id_notification).toBeNull();
      expect(queued[0].recipient).toBe(MEMBER_EMAIL);
    });

    it("queues one message per publish and collapses a repeat on the dedupe key", async () => {
      // The single likeliest implementation bug is putting `id_notification` in
      // the dedupe key, which makes every key trivially unique and turns the
      // whole idempotency mechanism into a silent no-op. Nothing else notices.
      const service = await getNotificationService();
      const input: NotificationPublishInput = {
        type: "invoice.issued",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP, NotificationChannel.EMAIL],
        data: { invoice_id: 8412, number: "2026-0001" },
        target: { kind: "user", userId: MEMBER_USER_ID, communityId: INTERNAL_COMMUNITY_1 },
      };

      await service.publish(input);
      await service.publish(input);

      expect(await allNotifications()).toHaveLength(2);
      expect(await allOutbound()).toHaveLength(1);
    });

    it("treats `data` as the idempotency key — a different payload is a different message", async () => {
      const service = await getNotificationService();
      const base: NotificationPublishInput = {
        type: "invoice.issued",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.EMAIL],
        data: { invoice_id: 1 },
        target: { kind: "user", userId: MEMBER_USER_ID },
      };

      await service.publish(base);
      await service.publish({ ...base, data: { invoice_id: 2 } });
      // Key order must not matter: the payload is canonicalised before hashing.
      await service.publish({ ...base, data: { number: "x", invoice_id: 1 } });
      await service.publish({ ...base, data: { invoice_id: 1, number: "x" } });

      expect(await allOutbound()).toHaveLength(3);
    });

    it("honours an explicit dedupe_key over the derived one", async () => {
      // What `admin_deadline.due_soon` relies on: a sweep that re-emits the same
      // payload for a genuinely new occurrence needs the occurrence in the key.
      const service = await getNotificationService();
      const base: NotificationPublishInput = {
        type: "admin_deadline.due_soon",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.EMAIL],
        data: { deadline_id: 91 },
        target: { kind: "user", userId: MEMBER_USER_ID },
      };

      await service.publish({ ...base, dedupe_key: "admin_deadline.due_soon:deadline-91:2026-08-14" });
      await service.publish({ ...base, dedupe_key: "admin_deadline.due_soon:deadline-91:2026-08-14" });
      await service.publish({ ...base, dedupe_key: "admin_deadline.due_soon:deadline-91:2026-11-14" });

      const queued = await allOutbound();
      expect(queued).toHaveLength(2);
      expect(queued.map((row) => row.dedupe_key).sort()).toEqual([
        "admin_deadline.due_soon:deadline-91:2026-08-14",
        "admin_deadline.due_soon:deadline-91:2026-11-14",
      ]);
    });

    it("does not persist category — outbound_message will own it (§1.5)", async () => {
      // Guards against someone "helpfully" adding a column: two publishes that
      // differ only in category must produce identical rows.
      const service = await getNotificationService();
      await service.publish({
        type: "t",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID, communityId: INTERNAL_COMMUNITY_1 },
      });
      await service.publish({
        type: "t",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID, communityId: INTERNAL_COMMUNITY_1 },
      });

      const rows = await allNotifications();
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual(rows[1]);
    });

    it("leaves the caller's transaction committable when the write fails", async () => {
      // The regression test for the bug this change fixes. Without the SAVEPOINT
      // in publish(), the failed INSERT aborts the Postgres transaction; the
      // later COMMIT is then silently downgraded to a ROLLBACK, so the caller's
      // business write disappears while the request still returns 200.
      const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
      const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
      const service = await getNotificationService();

      const qr = AppDataSource.createQueryRunner();
      await qr.startTransaction();
      await qr.manager.save(qr.manager.create(Notification, { id_user: ADMIN_USER_ID, id_community: null, type: "business.write", data: {} }));

      const written = await service.publish(
        {
          // varchar(128) overflow: a deterministic failure needing no FK setup.
          type: "x".repeat(200),
          category: NotificationCategory.TRANSACTIONAL,
          channels: [NotificationChannel.INAPP],
          target: { kind: "user", userId: ADMIN_USER_ID },
        },
        qr,
      );
      expect(written).toBe(0);

      await qr.commitTransaction();
      await qr.release();

      expect((await allNotifications()).map((r) => r.type)).toEqual(["business.write"]);
    });

    it("leaves the caller's transaction committable when the ENQUEUE fails", async () => {
      // The mirror of the test above, for the other write publish performs. With
      // EMAIL-only, the outbound INSERT is the first statement to touch the DB
      // inside the SAVEPOINT, so a failure there is what has to be contained.
      const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
      const { Notification } = await import("../../../src/modules/notifications/domain/notification.models.js");
      const service = await getNotificationService();

      const qr = AppDataSource.createQueryRunner();
      await qr.startTransaction();
      await qr.manager.save(qr.manager.create(Notification, { id_user: ADMIN_USER_ID, id_community: null, type: "business.write", data: {} }));

      const written = await service.publish(
        {
          // varchar(128) overflow on outbound_message.type — deterministic, and
          // reached only after the recipient contact SELECT has succeeded.
          type: "x".repeat(200),
          category: NotificationCategory.TRANSACTIONAL,
          channels: [NotificationChannel.EMAIL],
          target: { kind: "user", userId: ADMIN_USER_ID },
        },
        qr,
      );
      expect(written).toBe(0);

      await qr.commitTransaction();
      await qr.release();

      expect((await allNotifications()).map((r) => r.type)).toEqual(["business.write"]);
      expect(await allOutbound()).toHaveLength(0);
    });

    it("enqueues on the caller's transaction, and the queue row dies with it", async () => {
      // The invariant the whole design rests on: "the business write committed ⇒
      // the message is queued". Reading through `AppDataSource.manager` takes a
      // different pooled connection at READ COMMITTED, so the second assertion
      // genuinely proves the insert is not an autonomous commit.
      const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
      const service = await getNotificationService();

      const qr = AppDataSource.createQueryRunner();
      await qr.startTransaction();
      await service.publish(
        {
          type: "invoice.issued",
          category: NotificationCategory.TRANSACTIONAL,
          channels: [NotificationChannel.EMAIL],
          target: { kind: "user", userId: MEMBER_USER_ID },
        },
        qr,
      );

      expect(await countOutboundOn(qr.manager)).toBe(1);
      expect(await countOutboundOn(AppDataSource.manager)).toBe(0);

      await qr.rollbackTransaction();
      await qr.release();

      expect(await allOutbound()).toHaveLength(0);
    });
  });

  describe("NotificationService.publish() — preferences", () => {
    it("honours an OFF preference for INFORMATIONAL and ignores it for TRANSACTIONAL", async () => {
      // The pair is the point. A preference that silenced an invoice or a missed
      // regulatory deadline would be a compliance bug, not a feature.
      const service = await getNotificationService();
      await seedPreferences([{ id_user: MEMBER_USER_ID, type_prefix: "", channel: NotificationChannel.INAPP, mode: PreferenceMode.OFF }]);

      const informational = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });
      expect(informational).toBe(0);
      expect(await allNotifications()).toHaveLength(0);

      const transactional = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });
      expect(transactional).toBe(1);
      expect(await allNotifications()).toHaveLength(1);
    });

    it("defaults to IMMEDIATE when the user has stored no preference", async () => {
      // "does not persist category" above depends on this implicitly; pin it.
      const service = await getNotificationService();
      const written = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP, NotificationChannel.EMAIL],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });

      expect(written).toBe(1);
      expect(await allOutbound()).toHaveLength(1);
    });

    it("mutes one channel without touching the other", async () => {
      const service = await getNotificationService();
      await seedPreferences([{ id_user: MEMBER_USER_ID, type_prefix: "", channel: NotificationChannel.EMAIL, mode: PreferenceMode.OFF }]);

      const written = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP, NotificationChannel.EMAIL],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });

      expect(written).toBe(1);
      expect(await allOutbound()).toHaveLength(0);
    });

    it("applies preferences per recipient, not per publish", async () => {
      // A single answer for the whole audience would let one muted manager mute
      // a community fan-out for everyone. The id assertion also catches a Map
      // keyed by position instead of by user.
      const service = await getNotificationService();
      await seedPreferences([{ id_user: MEMBER_USER_ID, type_prefix: "", channel: NotificationChannel.INAPP, mode: PreferenceMode.OFF }]);

      const written = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "users", userIds: [ADMIN_USER_ID, MEMBER_USER_ID] },
      });

      expect(written).toBe(1);
      expect((await allNotifications()).map((r) => r.id_user)).toEqual([ADMIN_USER_ID]);
    });

    it("resolves most-specific-wins: a type prefix beats the default row", async () => {
      const service = await getNotificationService();
      await seedPreferences([
        { id_user: MEMBER_USER_ID, type_prefix: "", channel: NotificationChannel.INAPP, mode: PreferenceMode.OFF },
        { id_user: MEMBER_USER_ID, type_prefix: "invoice", channel: NotificationChannel.INAPP, mode: PreferenceMode.IMMEDIATE },
      ]);

      const invoice = await service.publish({
        type: "invoice.issued",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });
      const news = await service.publish({
        type: "news_post.published",
        category: NotificationCategory.INFORMATIONAL,
        channels: [NotificationChannel.INAPP],
        target: { kind: "user", userId: MEMBER_USER_ID },
      });

      expect(invoice).toBe(1);
      expect(news).toBe(0);
    });
  });

  describe("GET/PUT /notifications/preferences", () => {
    it("returns the server-owned prefix list and an empty set by default", async () => {
      const app = await getApp();
      const response = await request(app).get("/notifications/preferences").set(ADMIN_NO_COMMUNITY);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data.preferences).toEqual([]);
        // Derived from NOTIFICATION_TYPES so it cannot drift from the taxonomy.
        expect(response.body.data.type_prefixes).toContain("invoice");
        expect(response.body.data.type_prefixes).toContain("admin_deadline");
        expect(response.body.data.type_prefixes).not.toContain("");
      });
    });

    it("replaces the set wholesale, so an omitted row is a reset to default", async () => {
      const app = await getApp();
      const first = await request(app)
        .put("/notifications/preferences")
        .set(ADMIN_NO_COMMUNITY)
        .send({
          preferences: [
            { type_prefix: "", channel: NotificationChannel.EMAIL, mode: PreferenceMode.OFF },
            { type_prefix: "invoice", channel: NotificationChannel.EMAIL, mode: PreferenceMode.IMMEDIATE },
          ],
        });
      expect(first.status).toBe(200);
      expect(first.body.data.preferences).toHaveLength(2);

      const second = await request(app).put("/notifications/preferences").set(ADMIN_NO_COMMUNITY).send({ preferences: [] });
      expect(second.status).toBe(200);
      expect(second.body.data.preferences).toEqual([]);
    });

    it("rejects an unknown type prefix", async () => {
      const app = await getApp();
      const response = await request(app)
        .put("/notifications/preferences")
        .set(ADMIN_NO_COMMUNITY)
        .send({ preferences: [{ type_prefix: "not_a_feature", channel: NotificationChannel.EMAIL, mode: PreferenceMode.OFF }] });

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(NOTIFICATION_ERRORS.PREFERENCE_INVALID.errorCode);
    });

    it("rejects DAILY_DIGEST, which the encoding reserves but nothing implements", async () => {
      // 422, not 400: `PreferenceMode` deliberately does not declare `2`, so the
      // DTO's @IsEnum rejects it before the service is reached. (The unknown
      // type_prefix case above is a service-level check and returns 400.) The DB
      // CHECK (mode IN (1,3)) is the third line of the same defence.
      const app = await getApp();
      const response = await request(app)
        .put("/notifications/preferences")
        .set(ADMIN_NO_COMMUNITY)
        .send({ preferences: [{ type_prefix: "", channel: NotificationChannel.EMAIL, mode: 2 }] });

      expect(response.status).toBe(422);
      expect(await preferenceCountFor(ADMIN_USER_ID)).toBe(0);
    });

    it("never leaks or overwrites another user's preferences", async () => {
      await seedPreferences([{ id_user: MEMBER_USER_ID, type_prefix: "", channel: NotificationChannel.EMAIL, mode: PreferenceMode.OFF }]);

      const app = await getApp();
      const read = await request(app).get("/notifications/preferences").set(ADMIN_NO_COMMUNITY);
      expect(read.body.data.preferences).toEqual([]);

      await request(app).put("/notifications/preferences").set(ADMIN_NO_COMMUNITY).send({ preferences: [] });
      expect(await preferenceCountFor(MEMBER_USER_ID)).toBe(1);
    });
  });

  describe("GET /notifications/", () => {
    it("shows a community notification even when that community is not selected (req #1)", async () => {
      await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "c1" },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_2, type: "c2" },
        { id_user: ADMIN_USER_ID, id_community: null, type: "global" },
        { id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "other.user" },
      ]);

      const app = await getApp();
      // No x-community-id at all — user still sees ALL their notifications.
      const response = await request(app).get("/notifications/").set(ADMIN_NO_COMMUNITY);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        expect(response.body.pagination.total).toBe(3);
        const types = (response.body.data as { type: string }[]).map((r) => r.type).sort();
        expect(types).toEqual(["c1", "c2", "global"]);
      });
    });

    it("exposes the source community (id + name + auth id) and null for user-only rows (req #2)", async () => {
      await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "scoped" },
        { id_user: ADMIN_USER_ID, id_community: null, type: "global" },
      ]);

      const app = await getApp();
      const response = await request(app).get("/notifications/").set(ADMIN_NO_COMMUNITY);

      const byType = new Map(
        (
          response.body.data as {
            type: string;
            community: { id: number; name: string; auth_community_id: string } | null;
          }[]
        ).map((r) => [r.type, r.community]),
      );
      // `auth_community_id` is what the client compares against its active
      // community: `id` is the internal integer and the frontend only ever holds
      // the Keycloak org id, so without it a notification from another community
      // opens the ACTIVE community's page.
      expect(byType.get("scoped")).toEqual({
        id: INTERNAL_COMMUNITY_1,
        name: COMMUNITY_1_NAME,
        auth_community_id: AUTH_COMMUNITY_1,
      });
      expect(byType.get("global")).toBeNull();
    });

    it("filters by ?community_id when provided", async () => {
      await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_2 },
      ]);

      const app = await getApp();
      const response = await request(app).get(`/notifications/?community_id=${INTERNAL_COMMUNITY_1}`).set(ADMIN_NO_COMMUNITY);
      expect(response.status).toBe(200);
      expect(response.body.pagination.total).toBe(2);
    });

    it("orders newest-first and paginates", async () => {
      const [first, second, third] = await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
      ]);

      const app = await getApp();
      const response = await request(app).get("/notifications/?limit=2&page=1").set(ADMIN_IN_COMMUNITY_1);
      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({ page: 1, limit: 2, total: 3, total_pages: 2 });
      expect((response.body.data as { id: string }[]).map((r) => r.id)).toEqual([third, second]);
      expect(first).toBeDefined();
    });

    it("never leaks another user's notifications", async () => {
      await seedNotifications([{ id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "members.only" }]);

      const app = await getApp();
      const response = await request(app).get("/notifications/").set(ADMIN_NO_COMMUNITY);
      expect(response.status).toBe(200);
      expect(response.body.pagination.total).toBe(0);
    });

    it("requires authentication", async () => {
      const app = await getApp();
      const response = await request(app).get("/notifications/");
      expect(response.status).toBe(400);
    });
  });

  describe("GET /notifications/unread-count", () => {
    it("counts all the user's unread across communities, and honors ?community_id", async () => {
      await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 }, // unread
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 }, // unread
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_2 }, // unread
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1, read_at: new Date() }, // read
        { id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1 }, // other user
      ]);

      const app = await getApp();
      const all = await request(app).get("/notifications/unread-count").set(ADMIN_NO_COMMUNITY);
      expect(all.status).toBe(200);
      expect(all.body.data.count).toBe(3);

      const scoped = await request(app).get(`/notifications/unread-count?community_id=${INTERNAL_COMMUNITY_1}`).set(ADMIN_NO_COMMUNITY);
      expect(scoped.body.data.count).toBe(2);
    });
  });

  describe("PATCH /notifications/:id/read", () => {
    it("flips read_at for the owner and is idempotent on re-mark", async () => {
      const [id] = await seedNotifications([{ id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 }]);

      const app = await getApp();
      const first = await request(app).patch(`/notifications/${id}/read`).set(ADMIN_NO_COMMUNITY);
      expect(first.status).toBe(200);
      const afterFirst = await readAtOf(id);
      expect(afterFirst).not.toBeNull();

      const second = await request(app).patch(`/notifications/${id}/read`).set(ADMIN_NO_COMMUNITY);
      expect(second.status).toBe(200);
      expect((await readAtOf(id))?.getTime()).toBe(afterFirst?.getTime());
    });

    it("returns 404 when marking another user's notification", async () => {
      const [id] = await seedNotifications([{ id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1 }]);

      const app = await getApp();
      const response = await request(app).patch(`/notifications/${id}/read`).set(ADMIN_NO_COMMUNITY);
      expect(response.status).toBe(404);
      expect(response.body.error_code).toBe(NOTIFICATION_ERRORS.NOT_FOUND.errorCode);
      expect(await readAtOf(id)).toBeNull();
    });
  });

  describe("PATCH /notifications/read-all", () => {
    it("clears all the user's unread by default", async () => {
      const ids = await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_2 },
        { id_user: ADMIN_USER_ID, id_community: null },
        { id_user: MEMBER_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
      ]);

      const app = await getApp();
      const response = await request(app).patch("/notifications/read-all").set(ADMIN_NO_COMMUNITY);
      expect(response.status).toBe(200);

      expect(await readAtOf(ids[0])).not.toBeNull();
      expect(await readAtOf(ids[1])).not.toBeNull();
      expect(await readAtOf(ids[2])).not.toBeNull();
      // The other user's row is untouched.
      expect(await readAtOf(ids[3])).toBeNull();

      const count = await request(app).get("/notifications/unread-count").set(ADMIN_NO_COMMUNITY);
      expect(count.body.data.count).toBe(0);
    });

    it("clears only the given community when ?community_id is provided", async () => {
      const ids = await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1 },
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_2 },
      ]);

      const app = await getApp();
      const response = await request(app).patch(`/notifications/read-all?community_id=${INTERNAL_COMMUNITY_1}`).set(ADMIN_NO_COMMUNITY);
      expect(response.status).toBe(200);

      expect(await readAtOf(ids[0])).not.toBeNull(); // community 1 cleared
      expect(await readAtOf(ids[1])).toBeNull(); // community 2 untouched
    });
  });
});
