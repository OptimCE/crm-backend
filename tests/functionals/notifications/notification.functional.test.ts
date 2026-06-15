import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import type { QueryRunner } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { Role } from "../../../src/shared/dtos/role.js";
import { NOTIFICATION_ERRORS } from "../../../src/modules/notifications/shared/notification.errors.js";
import type { NotificationPublishInput } from "../../../src/modules/notifications/api/notification.dtos.js";
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
      await service.publish({ type: "account.welcome", target: { kind: "user", userId: MEMBER_USER_ID } });

      const rows = await allNotifications();
      expect(rows).toHaveLength(1);
      expect(rows[0].id_community).toBeNull();
    });

    it("fans out to every member when targeting a whole community", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "community.announcement",
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
        target: { kind: "community", communityId: INTERNAL_COMMUNITY_1, roles: [Role.GESTIONNAIRE] },
      });
      expect(managers).toBe(1);
      expect((await allNotifications()).map((r) => r.id_user)).toEqual([MANAGER_USER_ID]);
    });

    it("supports targeting several roles at once (managers + admins)", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "t",
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
        target: { kind: "community", communityId: 3, roles: [Role.MEMBER] },
      });

      expect(written).toBe(0);
      expect(await allNotifications()).toHaveLength(0);
    });

    it("fans out to an explicit, de-duplicated set of users", async () => {
      const service = await getNotificationService();
      const written = await service.publish({
        type: "t",
        target: { kind: "users", userIds: [ADMIN_USER_ID, ADMIN_USER_ID, MEMBER_USER_ID], communityId: INTERNAL_COMMUNITY_1 },
      });

      expect(written).toBe(2);
      const rows = await allNotifications();
      expect(rows.map((r) => r.id_user).sort()).toEqual([ADMIN_USER_ID, MEMBER_USER_ID].sort());
      expect(rows.every((r) => r.id_community === INTERNAL_COMMUNITY_1)).toBe(true);
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

    it("exposes the source community (id + name) and null for user-only rows (req #2)", async () => {
      await seedNotifications([
        { id_user: ADMIN_USER_ID, id_community: INTERNAL_COMMUNITY_1, type: "scoped" },
        { id_user: ADMIN_USER_ID, id_community: null, type: "global" },
      ]);

      const app = await getApp();
      const response = await request(app).get("/notifications/").set(ADMIN_NO_COMMUNITY);

      const byType = new Map((response.body.data as { type: string; community: { id: number; name: string } | null }[]).map((r) => [r.type, r.community]));
      expect(byType.get("scoped")).toEqual({ id: INTERNAL_COMMUNITY_1, name: COMMUNITY_1_NAME });
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
