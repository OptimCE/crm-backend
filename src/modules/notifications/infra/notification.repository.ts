import { inject, injectable } from "inversify";
import type { DeepPartial, QueryRunner } from "typeorm";

import { AppDataSource } from "../../../shared/database/database.connector.js";
import { withUserScope } from "../../../shared/database/withUser.js";
import type { Role } from "../../../shared/dtos/role.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { CommunityUser } from "../../communities/domain/community.models.js";
import { Notification, NotificationPreference } from "../domain/notification.models.js";
import type { INotificationRepository, PreferenceRow, ResolvedPreference } from "../domain/i-notification.repository.js";
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

  async insertMany(rows: DeepPartial<Notification>[], query_runner?: QueryRunner): Promise<Notification[]> {
    if (rows.length === 0) {
      return [];
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const entities = rows.map((row) => manager.create(Notification, row));
    // `save` returns the very array it was given, with generated ids written
    // back onto the same instances, and `chunk` only partitions the executors —
    // so index correlation with `rows` is structurally guaranteed, not merely
    // preserved. That is what lets the caller pair each recipient with its
    // `id_notification` without a second read.
    await manager.save(entities, { chunk: INSERT_CHUNK_SIZE });
    return entities;
  }

  async findPreferences(user_ids: number[], type_prefix: string, query_runner?: QueryRunner): Promise<ResolvedPreference[]> {
    if (user_ids.length === 0) {
      return [];
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    // DISTINCT ON collapses the (default, specific) pair to one row per
    // (user, channel) in a single round trip. The ordering expression is the
    // resolution rule: a non-empty `type_prefix` sorts first, so the specific
    // row wins whenever both exist.
    return manager
      .createQueryBuilder(NotificationPreference, "pref")
      .select("pref.id_user", "id_user")
      .addSelect("pref.channel", "channel")
      .addSelect("pref.mode", "mode")
      .distinctOn(["pref.id_user", "pref.channel"])
      .where("pref.id_user IN (:...user_ids)", { user_ids })
      .andWhere("pref.type_prefix IN (:...prefixes)", { prefixes: ["", type_prefix] })
      .orderBy("pref.id_user", "ASC")
      .addOrderBy("pref.channel", "ASC")
      .addOrderBy("(pref.type_prefix <> '')", "DESC")
      .getRawMany<ResolvedPreference>();
  }

  async listPreferences(query_runner?: QueryRunner): Promise<PreferenceRow[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const userId = await this.authContext.getInternalUserId(query_runner);
    return manager
      .createQueryBuilder(NotificationPreference, "pref")
      .select("pref.type_prefix", "type_prefix")
      .addSelect("pref.channel", "channel")
      .addSelect("pref.mode", "mode")
      .where("pref.id_user = :userId", { userId })
      .orderBy("pref.type_prefix", "ASC")
      .addOrderBy("pref.channel", "ASC")
      .getRawMany<PreferenceRow>();
  }

  async replacePreferences(rows: PreferenceRow[], query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const userId = await this.authContext.getInternalUserId(query_runner);

    // Delete-then-insert rather than upsert: an absent row IS the "no preference,
    // use the default" state, so a partial update could never express a reset.
    await manager.createQueryBuilder().delete().from(NotificationPreference).where("id_user = :userId", { userId }).execute();
    if (rows.length === 0) {
      return;
    }
    await manager
      .createQueryBuilder()
      .insert()
      .into(NotificationPreference)
      .values(rows.map((row) => ({ id_user: userId, type_prefix: row.type_prefix, channel: row.channel, mode: row.mode })))
      .execute();
  }
}
