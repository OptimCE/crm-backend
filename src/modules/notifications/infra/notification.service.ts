import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import type { DeepPartial, QueryRunner } from "typeorm";

import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { Notification } from "../domain/notification.models.js";
import { NOTIFICATION_ERRORS } from "../shared/notification.errors.js";
import type { INotificationService } from "../domain/i-notification.service.js";
import type { INotificationRepository } from "../domain/i-notification.repository.js";
import { NotificationDTO, type NotificationPublishInput, type NotificationQueryDTO, UnreadCountDTO } from "../api/notification.dtos.js";

@injectable()
export class NotificationService implements INotificationService {
  constructor(@inject("NotificationRepository") private readonly notification_repository: INotificationRepository) {}

  async publish(input: NotificationPublishInput, query_runner?: QueryRunner): Promise<number> {
    const { target } = input;

    let recipientIds: number[];
    let communityId: number | null;
    if (target.kind === "user") {
      recipientIds = [target.userId];
      communityId = target.communityId ?? null;
    } else if (target.kind === "users") {
      recipientIds = [...new Set(target.userIds)];
      communityId = target.communityId ?? null;
    } else {
      communityId = target.communityId;
      recipientIds = await this.notification_repository.findCommunityRecipientIds(target.communityId, target.roles, query_runner);
    }

    if (recipientIds.length === 0) {
      return 0;
    }

    const rows: DeepPartial<Notification>[] = recipientIds.map((userId) => ({
      id_user: userId,
      id_community: communityId,
      type: input.type,
      data: input.data ?? {},
    }));

    await this.notification_repository.insertMany(rows, query_runner);
    return rows.length;
  }

  async list(query: NotificationQueryDTO): Promise<[NotificationDTO[], Pagination]> {
    const [rows, total] = await this.notification_repository.list(query);
    const data = rows.map((row) => plainToInstance(NotificationDTO, row, { excludeExtraneousValues: true }));
    const total_pages = query.limit > 0 ? Math.ceil(total / query.limit) : 0;
    return [data, new Pagination(query.page, query.limit, total, total_pages)];
  }

  async getUnreadCount(community_id?: number): Promise<UnreadCountDTO> {
    const count = await this.notification_repository.countUnread(community_id);
    return plainToInstance(UnreadCountDTO, { count }, { excludeExtraneousValues: true });
  }

  async markRead(id: number): Promise<void> {
    const found = await this.notification_repository.markOneRead(id);
    if (!found) {
      throw new AppError(NOTIFICATION_ERRORS.NOT_FOUND, 404);
    }
  }

  async markAllRead(community_id?: number): Promise<void> {
    await this.notification_repository.markAllRead(community_id);
  }
}
