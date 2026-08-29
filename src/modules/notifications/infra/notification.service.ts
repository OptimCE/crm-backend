import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import type { DeepPartial, QueryRunner } from "typeorm";

import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import { withSavepoint } from "../../../shared/transactional/savepoint.js";
import { onAfterCommit } from "../../../shared/transactional/after-commit.js";
import { container } from "../../../container/di-container.js";
import type { IRealtimeHub } from "../../../shared/realtime/i-realtime.hub.js";
import { REALTIME_TOPICS } from "../../../shared/realtime/realtime.topics.js";
import { Notification } from "../domain/notification.models.js";
import { NOTIFICATION_TYPE_PREFIXES } from "../domain/notification.taxonomy.js";
// Value import, not `import type`: these are runtime enums, compared below.
// Folding them into a type-only import silently yields `undefined`.
import { NotificationCategory, NotificationChannel, PreferenceMode } from "../shared/notification.types.js";
import { typePrefixOf } from "../shared/notification.dedupe.js";
import { NOTIFICATION_ERRORS } from "../shared/notification.errors.js";
import type { INotificationService } from "../domain/i-notification.service.js";
import type { INotificationRepository, PreferenceRow } from "../domain/i-notification.repository.js";
import type { IOutboundService } from "../domain/i-outbound.service.js";
import {
  NotificationDTO,
  type NotificationPreferenceDTO,
  NotificationPreferencesDTO,
  type NotificationPublishInput,
  type NotificationQueryDTO,
  UnreadCountDTO,
} from "../api/notification.dtos.js";

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject("NotificationRepository") private readonly notification_repository: INotificationRepository,
    @inject("OutboundService") private readonly outbound_service: IOutboundService,
  ) {}

  async publish(input: NotificationPublishInput, query_runner?: QueryRunner): Promise<number> {
    try {
      // The whole body runs in a SAVEPOINT, including the recipient SELECT — a
      // failing SELECT aborts the caller's Postgres transaction just as
      // thoroughly as a failing INSERT, and swallowing the JS error does not
      // un-abort it. See `withSavepoint`.
      return await withSavepoint(query_runner, async () => {
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

        const effective = await this.resolveDelivery(input, recipientIds, query_runner);
        const inappIds = recipientIds.filter((userId) => effective.get(userId)?.has(NotificationChannel.INAPP));
        const emailIds = recipientIds.filter((userId) => effective.get(userId)?.has(NotificationChannel.EMAIL));
        if (inappIds.length === 0 && emailIds.length === 0) {
          return 0;
        }

        const payload = input.data ?? {};
        const rows: DeepPartial<Notification>[] = inappIds.map((userId) => ({
          id_user: userId,
          id_community: communityId,
          type: input.type,
          data: payload,
        }));
        // insertMany flushes, so the ids exist by the time enqueueOutbound needs
        // them. Both writes are inside the one SAVEPOINT above: the in-app rows
        // and the queued email land or vanish together.
        const saved = await this.notification_repository.insertMany(rows, query_runner);
        const notificationIdByUser = new Map<number, string>(saved.map((row) => [row.id_user, row.id]));

        if (emailIds.length > 0) {
          await this.outbound_service.enqueueForRecipients(
            {
              type: input.type,
              category: input.category,
              data: payload,
              id_community: communityId,
              dedupe_key: input.dedupe_key,
            },
            emailIds.map((userId) => ({ id_user: userId, id_notification: notificationIdByUser.get(userId) ?? null })),
            query_runner,
          );
        }

        // Realtime hint for whoever currently has the bell open. REGISTERING
        // rather than emitting keeps this inside the SAVEPOINT-protected block
        // while the actual PUBLISH lands after the caller's real COMMIT — see
        // shared/transactional/after-commit.ts for why that ordering is
        // load-bearing rather than tidy. Silent no-op when the hub is unbound.
        //
        // This one registration gives realtime to EVERY producer that goes
        // through publish() — documents, invitations (both), members — with no
        // edit at any call site, and to the next one automatically.
        const hub = container.isBound("RealtimeHub") ? container.get<IRealtimeHub>("RealtimeHub") : null;
        if (hub && inappIds.length > 0) {
          // Capture by value: the after-commit callback runs in a different
          // async context, where AsyncLocalStorage is gone.
          const recipients = [...inappIds];
          const scope_community_id = communityId;
          onAfterCommit(query_runner, () =>
            hub.publishToUsers(recipients, {
              topic: REALTIME_TOPICS.NOTIFICATION_CREATED,
              // The client refetches /unread-count and the recent slice, so it
              // needs no row id and no count — and the envelope must not carry
              // business data anyway.
              ref: { kind: "notification", id: "0" },
              scope: { community_id: scope_community_id },
              hint: {},
            }),
          );
        }

        return saved.length;
      });
    } catch (err) {
      // Never raises: a notification failure must not abort the business write
      // that triggered it. This mirrors the Python annexes' `publish`, so all
      // four producers have the same failure semantics. Note that the SAVEPOINT
      // above is what actually keeps the caller's transaction committable —
      // swallowing alone would not.
      logger.error({ operation: "notification:publish", type: input.type, error: err }, "Notification publish failed");
      return 0;
    }
  }

  /**
   * Requested channels ∩ each recipient's preference; TRANSACTIONAL overrides.
   *
   * Per-recipient, not per-publish: `notification_preference` is keyed by user,
   * and a community fan-out reaches many of them. A single answer for everyone
   * would mean one manager who muted a reminder mutes it for the whole
   * community.
   *
   * `TRANSACTIONAL` skips the lookup entirely — an invoice, an invitation or a
   * missed regulatory deadline is not opt-out-able, so there is nothing to read
   * and no query to pay for. That is also why every EMAIL producer shipping
   * today never touches this table.
   */
  private async resolveDelivery(
    input: NotificationPublishInput,
    recipientIds: number[],
    query_runner?: QueryRunner,
  ): Promise<Map<number, Set<NotificationChannel>>> {
    const requested = new Set(input.channels);
    const effective = new Map<number, Set<NotificationChannel>>(recipientIds.map((userId) => [userId, new Set(requested)]));
    if (input.category === NotificationCategory.TRANSACTIONAL) {
      return effective;
    }

    const preferences = await this.notification_repository.findPreferences(recipientIds, typePrefixOf(input.type), query_runner);
    for (const preference of preferences) {
      if (preference.mode === PreferenceMode.OFF) {
        effective.get(preference.id_user)?.delete(preference.channel);
      }
    }
    return effective;
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

  async getPreferences(): Promise<NotificationPreferencesDTO> {
    const rows = await this.notification_repository.listPreferences();
    return plainToInstance(
      NotificationPreferencesDTO,
      { type_prefixes: [...NOTIFICATION_TYPE_PREFIXES], preferences: rows },
      { excludeExtraneousValues: true },
    );
  }

  async setPreferences(preferences: NotificationPreferenceDTO[]): Promise<NotificationPreferencesDTO> {
    const allowed = new Set<string>(NOTIFICATION_TYPE_PREFIXES);
    for (const preference of preferences) {
      // `''` is the catch-all default row and is always accepted; anything else
      // must be a prefix the taxonomy actually produces, or the row would be
      // dead weight that silently never matches a notification.
      if (preference.type_prefix !== "" && !allowed.has(preference.type_prefix)) {
        throw new AppError(NOTIFICATION_ERRORS.PREFERENCE_INVALID, 400);
      }
    }
    // De-duplicate on the primary key so a body repeating a pair cannot trip the
    // unique constraint and 500. Last one wins, which is the intuitive reading.
    const byKey = new Map<string, PreferenceRow>(
      preferences.map((preference) => [
        `${preference.type_prefix}:${preference.channel}`,
        { type_prefix: preference.type_prefix, channel: preference.channel, mode: preference.mode },
      ]),
    );
    await this.notification_repository.replacePreferences([...byKey.values()]);
    return this.getPreferences();
  }
}
