import type { QueryRunner } from "typeorm";
import type { INotificationService } from "../../notifications/domain/i-notification.service.js";
import { NOTIFICATION_TYPES } from "../../notifications/domain/notification.taxonomy.js";
import { NotificationCategory, NotificationChannel } from "../../notifications/shared/notification.types.js";
import type { WorkerJob } from "./worker.repository.js";

type NotifiedJob = Pick<WorkerJob, "id" | "scope_type" | "id_community" | "id_requester">;

/** dd/mm/yyyy in Brussels: the mail's « jusqu'au 23/11/2026 », like the summary's `*_display` dates. */
const BRUSSELS_DISPLAY_DATE = new Intl.DateTimeFormat("fr-BE", { timeZone: "Europe/Brussels", day: "2-digit", month: "2-digit", year: "numeric" });

export function displayDate(date: Date): string {
  return BRUSSELS_DISPLAY_DATE.format(date);
}

/**
 * Tells the requester that their export is ready or failed: in-app and by email, transactional
 * (it cannot be muted). The mail never carries the file nor a link to it: the front's own export
 * screen is where it is downloaded. `data` names no exported content.
 */
export class ExportWorkerNotifier {
  constructor(
    private readonly notifications: INotificationService,
    /** The community's name for `data`, read in the caller's transaction. */
    private readonly communityName: (id: number, qr: QueryRunner) => Promise<string | null>,
  ) {}

  async ready(job: NotifiedJob, expiresAt: Date, qr: QueryRunner): Promise<void> {
    await this.publish(NOTIFICATION_TYPES.DATA_EXPORT_READY, job, { expires_at: expiresAt.toISOString(), expires_display: displayDate(expiresAt) }, qr);
  }

  async failed(job: NotifiedJob, qr: QueryRunner): Promise<void> {
    await this.publish(NOTIFICATION_TYPES.DATA_EXPORT_FAILED, job, {}, qr);
  }

  private async publish(type: string, job: NotifiedJob, extra: Record<string, unknown>, qr: QueryRunner): Promise<void> {
    const community_name = job.id_community === null ? null : await this.communityName(job.id_community, qr);
    // publish never raises: it runs in a SAVEPOINT on qr and swallows its own failure.
    await this.notifications.publish(
      {
        type,
        data: { export_id: job.id, scope: job.scope_type, community_name, ...extra },
        target: { kind: "user", userId: job.id_requester, communityId: job.id_community ?? undefined },
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP, NotificationChannel.EMAIL],
      },
      qr,
    );
  }
}
