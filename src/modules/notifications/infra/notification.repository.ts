import { inject, injectable } from "inversify";
import type { DeepPartial, QueryRunner } from "typeorm";

import { AppDataSource } from "../../../shared/database/database.connector.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import type { Role } from "../../../shared/dtos/role.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { CommunityUser } from "../../communities/domain/community.models.js";
import { Notification } from "../domain/notification.models.js";
import type { INotificationRepository } from "../domain/i-notification.repository.js";
import type { NotificationQueryDTO } from "../api/notification.dtos.js";

/** Chunk size for bulk fan-out inserts (mirrors the meter/sharing repos). */
const INSERT_CHUNK_SIZE = 1000;

@injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
  ) {}

  async list(query: NotificationQueryDTO, query_runner?: QueryRunner): Promise<[Notification[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager.createQueryBuilder(Notification, "notification");

    withUserScope(qb, "notification");
    // Load the source community (id + name) for display. leftJoin because
    // community-less notifications are valid.
    qb.leftJoinAndSelect("notification.community", "community");

    if (query.community_id !== undefined) {
      qb.andWhere("notification.id_community = :community_id", { community_id: query.community_id });
    }

    qb.orderBy("notification.id", "DESC");

    const take = query.limit;
    const skip = (query.page - 1) * take;
    return qb.skip(skip).take(take).getManyAndCount();
  }

  async countUnread(community_id?: number, query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager.createQueryBuilder(Notification, "notification");

    withUserScope(qb, "notification");
    qb.andWhere("notification.read_at IS NULL");
    if (community_id !== undefined) {
      qb.andWhere("notification.id_community = :community_id", { community_id });
    }

    return qb.getCount();
  }

  async markOneRead(id: number, query_runner?: QueryRunner): Promise<boolean> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const userId = await this.authContext.getInternalUserId(query_runner);

    // Ownership check first so we can distinguish "not the user's" (404) from
    // "already read" (idempotent no-op). Scoped by recipient only — a user may
    // mark their own notification regardless of the active community.
    const exists =
      (await manager
        .createQueryBuilder(Notification, "notification")
        .where("notification.id = :id", { id })
        .andWhere("notification.id_user = :userId", { userId })
        .getCount()) > 0;
    if (!exists) {
      return false;
    }

    await manager
      .createQueryBuilder()
      .update(Notification)
      .set({ read_at: () => "NOW()" })
      .where("id = :id", { id })
      .andWhere("id_user = :userId", { userId })
      .andWhere("read_at IS NULL")
      .execute();
    return true;
  }

  async markAllRead(community_id?: number, query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const userId = await this.authContext.getInternalUserId(query_runner);

    const updateQb = manager
      .createQueryBuilder()
      .update(Notification)
      .set({ read_at: () => "NOW()" })
      .where("id_user = :userId", { userId })
      .andWhere("read_at IS NULL");
    if (community_id !== undefined) {
      updateQb.andWhere("id_community = :community_id", { community_id });
    }
    const result = await updateQb.execute();
    return result.affected ?? 0;
  }

  async findCommunityRecipientIds(community_id: number, roles?: Role[], query_runner?: QueryRunner): Promise<number[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const qb = manager
      .createQueryBuilder(CommunityUser, "community_user")
      .select("community_user.id_user", "id_user")
      .where("community_user.id_community = :community_id", { community_id });
    if (roles && roles.length > 0) {
      qb.andWhere("community_user.role IN (:...roles)", { roles });
    }
    const rows = await qb.getRawMany<{ id_user: number }>();
    return rows.map((r) => r.id_user);
  }

  async insertMany(rows: DeepPartial<Notification>[], query_runner?: QueryRunner): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const entities = rows.map((row) => manager.create(Notification, row));
    await manager.save(entities, { chunk: INSERT_CHUNK_SIZE });
  }
}
