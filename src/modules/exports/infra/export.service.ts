import { randomUUID } from "node:crypto";
import { inject, injectable } from "inversify";
import { QueryFailedError, type QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Role } from "../../../shared/dtos/role.js";
import { EXPORT_SCHEMA_VERSION } from "../../../shared/export/kit/contract.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import { onAfterCommit } from "../../../shared/transactional/after-commit.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import type { INotificationService } from "../../notifications/domain/i-notification.service.js";
import { NOTIFICATION_TYPES } from "../../notifications/domain/notification.taxonomy.js";
import { NotificationCategory, NotificationChannel } from "../../notifications/shared/notification.types.js";
import type { CreateExportDTO, ExportCreatedDTO, ExportDownloadUrlDTO, ExportJobDTO, ExportListQueryDTO } from "../api/export.dtos.js";
import type { ExportJob } from "../domain/export.models.js";
import type { IExportDownloadSigner, IExportJobPublisher } from "../domain/i-export.ports.js";
import type { IExportRepository } from "../domain/i-export.repository.js";
import type { IExportService } from "../domain/i-export.service.js";
import { EXPORT_ERRORS } from "../shared/export.errors.js";
import type { ExportSettings } from "../shared/export.settings.js";
import { archiveFileName, isDownloadable, pickExportLocale, toExportJobDTO } from "../shared/to_dto.js";

const DAY_MS = 24 * 3600 * 1000;

@injectable()
export class ExportService implements IExportService {
  constructor(
    @inject("ExportRepository") private readonly repository: IExportRepository,
    @inject("ExportSettings") private readonly settings: ExportSettings,
    @inject("ExportJobPublisher") private readonly publisher: IExportJobPublisher,
    @inject("ExportDownloadSigner") private readonly signer: IExportDownloadSigner,
    @inject("AuditLogService") private readonly auditLogService: IAuditLogService,
    @inject("NotificationService") private readonly notificationService: INotificationService,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
  ) {}

  private now(): Date {
    return new Date();
  }

  @Transactional()
  async request(input: CreateExportDTO, locale_hint: string | undefined, query_runner?: QueryRunner): Promise<ExportCreatedDTO> {
    const qr = query_runner!;
    const ctx = getContext();
    const user_id = ctx.user_id!;

    let scope_id: string;
    let community: { id: number; name: string } | null = null;
    if (input.scope === "community") {
      // The role the token gives in the ACTIVE community: an export of another one is refused,
      // even by someone who is ADMIN there, so the check never relies on a second source.
      if (input.community_id !== ctx.community_id || ctx.role !== Role.ADMIN) {
        logger.warn({ operation: "export:request", scope: "community" }, "Community export refused: not an ADMIN of the active community");
        throw new AppError(EXPORT_ERRORS.FORBIDDEN, 403);
      }
      community = await this.repository.findCommunity(input.community_id!, qr);
      if (!community) throw new AppError(EXPORT_ERRORS.FORBIDDEN, 403);
      scope_id = input.community_id!;
    } else {
      scope_id = user_id;
    }

    const requester = await this.repository.findRequester(user_id, qr);
    if (!requester) throw new AppError(EXPORT_ERRORS.USER_NOT_FOUND, 404);

    await this.repository.lockScope(input.scope, scope_id, qr);
    if (await this.repository.findActive(user_id, input.scope, scope_id, qr)) {
      throw new AppError(EXPORT_ERRORS.ALREADY_ACTIVE, 409);
    }
    const since = new Date(this.now().getTime() - DAY_MS);
    const recent = await this.repository.countRequestsSince(input.scope, scope_id, since, qr);
    if (recent >= this.settings.max_requests_per_day) {
      logger.warn({ operation: "export:request", scope: input.scope, recent }, "Export refused: too many requests for this scope");
      throw new AppError(EXPORT_ERRORS.RATE_LIMITED, 429);
    }

    const id = randomUUID();
    try {
      await this.repository.create(
        {
          id,
          scope_type: input.scope,
          scope_id,
          id_community: community?.id ?? null,
          requester_user_id: user_id,
          id_requester: requester.id,
          schema_version: EXPORT_SCHEMA_VERSION,
          locale: pickExportLocale(requester.locale, locale_hint),
          parts: this.settings.services.map((service) => ({ id: randomUUID(), service })),
        },
        qr,
      );
    } catch (err) {
      if (isUniqueViolation(err, "uq_export_job_active")) throw new AppError(EXPORT_ERRORS.ALREADY_ACTIVE, 409);
      throw err;
    }

    await this.auditLogService.log(
      {
        action: AUDIT_ACTIONS.EXPORT_JOB_REQUESTED,
        entity_type: "export_job",
        entity_id: id,
        payload: { scope: input.scope, services: this.settings.services.length, ip: ctx.source_ip ?? null },
        id_community: community?.id ?? null,
      },
      qr,
    );

    if (community) await this.notifyOtherAdmins(id, community, requester, qr);

    // After the COMMIT, or the worker could read a job that is not there yet. Never rejects.
    onAfterCommit(qr, () => void this.publisher.requested(id));

    logger.info({ operation: "export:request", export_id: id, scope: input.scope, parts: this.settings.services.length }, "Export requested");
    return { export_id: id, status: "pending" };
  }

  async list(query: ExportListQueryDTO): Promise<[ExportJobDTO[], Pagination]> {
    const ctx = getContext();
    const viewer = ctx.user_id!;
    let rows: ExportJob[];
    let total: number;
    if (query.view === "community") {
      if (!ctx.community_id || ctx.role !== Role.ADMIN) throw new AppError(EXPORT_ERRORS.FORBIDDEN, 403);
      const community = await this.repository.findCommunity(ctx.community_id);
      if (!community) throw new AppError(EXPORT_ERRORS.FORBIDDEN, 403);
      [rows, total] = await this.repository.listByCommunity(community.id, query.page, query.limit);
    } else {
      const requester = await this.repository.findRequester(viewer);
      [rows, total] = requester ? await this.repository.listByRequester(requester.id, query.page, query.limit) : [[], 0];
    }
    const now = this.now();
    const total_pages = query.limit > 0 ? Math.ceil(total / query.limit) : 0;
    return [rows.map((job) => toExportJobDTO(job, viewer, now)), new Pagination(query.page, query.limit, total, total_pages)];
  }

  async get(id: string): Promise<ExportJobDTO> {
    const job = await this.visibleJob(id);
    return toExportJobDTO(job, getContext().user_id!, this.now(), true);
  }

  async downloadUrl(id: string): Promise<ExportDownloadUrlDTO> {
    const ctx = getContext();
    const job = await this.visibleJob(id);
    if (job.requester_user_id !== ctx.user_id) {
      logger.warn({ operation: "export:download_url", export_id: id }, "Download refused: not the requester");
      throw new AppError(EXPORT_ERRORS.DOWNLOAD_FORBIDDEN, 403);
    }
    const now = this.now();
    if (job.status === "expired" || (job.status === "ready" && !isDownloadable(job, now))) {
      throw new AppError(EXPORT_ERRORS.EXPIRED, 410);
    }
    if (job.status !== "ready" || !job.object_key) throw new AppError(EXPORT_ERRORS.NOT_READY, 409);

    const ttl = this.settings.download_url_ttl_seconds;
    let url: string;
    try {
      url = await this.signer.sign(job.object_key, archiveFileName(job.object_key), ttl);
    } catch (err) {
      logger.error({ operation: "export:download_url", export_id: id, error: (err as Error).message }, "Download URL not signed");
      throw new AppError(EXPORT_ERRORS.DOWNLOAD_UNAVAILABLE, 503);
    }
    await this.auditLogService.log({
      action: AUDIT_ACTIONS.EXPORT_JOB_DOWNLOAD_URL_ISSUED,
      entity_type: "export_job",
      entity_id: id,
      payload: { ip: ctx.source_ip ?? null, expires_in: ttl },
      id_community: job.id_community,
    });
    logger.info({ operation: "export:download_url", export_id: id }, "Download URL issued");
    return { url, expires_in: ttl };
  }

  /**
   * The job, if the caller may see it: theirs, or one of the active community's when they are
   * an ADMIN there. Anything else is a 404, so an id says nothing about exports one cannot see.
   */
  private async visibleJob(id: string): Promise<ExportJob> {
    const ctx = getContext();
    const job = await this.repository.findById(id);
    const visible =
      job !== null &&
      (job.requester_user_id === ctx.user_id || (job.community && ctx.role === Role.ADMIN && ctx.community_id === job.community.auth_community_id));
    if (!job || !visible) throw new AppError(EXPORT_ERRORS.NOT_FOUND, 404);
    return job;
  }

  /** "X asked for an export of the community": the other ADMINs, in-app, unmutable. */
  private async notifyOtherAdmins(
    export_id: string,
    community: { id: number; name: string },
    requester: { id: number; first_name: string | null; last_name: string | null; email: string },
    qr: QueryRunner,
  ): Promise<void> {
    const admins = await this.repository.otherAdminIds(community.id, requester.id, qr);
    if (admins.length === 0) return;
    const requester_name = [requester.first_name, requester.last_name].filter((part) => part && part.trim() !== "").join(" ") || requester.email;
    // publish never raises: it runs in a SAVEPOINT on qr and swallows its own failure.
    await this.notificationService.publish(
      {
        type: NOTIFICATION_TYPES.DATA_EXPORT_REQUESTED,
        data: { export_id, community_name: community.name, requester_name, requested_at: this.now().toISOString() },
        target: { kind: "users", userIds: admins, communityId: community.id },
        category: NotificationCategory.TRANSACTIONAL,
        channels: [NotificationChannel.INAPP],
      },
      qr,
    );
  }
}

function isUniqueViolation(err: unknown, constraint: string): boolean {
  if (!(err instanceof QueryFailedError)) return false;
  const driver = (err as QueryFailedError & { driverError?: { code?: string; constraint?: string } }).driverError;
  return driver?.code === "23505" && driver.constraint === constraint;
}
