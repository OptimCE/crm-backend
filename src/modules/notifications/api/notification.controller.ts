import { inject, injectable } from "inversify";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, ApiResponsePaginated, type Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import { NOTIFICATION_ERRORS } from "../shared/notification.errors.js";
import type { INotificationService } from "../domain/i-notification.service.js";
import {
  NotificationDTO,
  NotificationFilterDTO,
  type NotificationPreferencesDTO,
  NotificationPreferenceUpdateDTO,
  NotificationQueryDTO,
  type RealtimeTicketDTO,
  type UnreadCountDTO,
} from "./notification.dtos.js";
import { container } from "../../../container/di-container.js";
import { getContext } from "../../../shared/middlewares/context.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import type { IRealtimeHub } from "../../../shared/realtime/i-realtime.hub.js";
import { communityChannel, tiersForRole, userChannel } from "../../../shared/realtime/realtime.channels.js";
import { REALTIME_ERRORS } from "../../realtime/shared/realtime.errors.js";

const notificationTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class NotificationController {
  constructor(
    @inject("NotificationService") private readonly notification_service: INotificationService,
    @inject("AuthContext") private readonly auth_context: IAuthContextRepository,
  ) {}

  /**
   * Mint a single-use ticket for the realtime SSE stream.
   *
   * This runs BEHIND KrakenD, so `x-user-id` and `x-user-orgs` are gateway-
   * verified JWT claims. That is the whole point: this is where authority is
   * established, and the SSE leg — which is reachable without the gateway — only
   * ever spends it. Everything the stream needs is resolved here and stored
   * server-side against the token, so the stream handler performs no
   * authorization of its own.
   *
   * It lives under `/notifications/` rather than `/realtime/` deliberately. The
   * nginx bypass is an EXACT match on the stream path, so nothing else is
   * exposed today — but if a maintainer ever loosened that `=` to a prefix, a
   * ticket route under `/realtime/` would become an unauthenticated
   * ticket-minting oracle for any `x-user-id`. Here, it leaks nothing.
   */
  @notificationTraceDecorator.traceSpan("mintRealtimeTicket", { url: "/notifications/realtime/ticket", method: "post" })
  async mintRealtimeTicket(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const hub = container.isBound("RealtimeHub") ? container.get<IRealtimeHub>("RealtimeHub") : null;
    if (!hub) {
      // The feature is off. A distinct code from UNAVAILABLE so the client knows
      // to stop retrying quickly and just stay on polling.
      throw new AppError(REALTIME_ERRORS.DISABLED, 503);
    }

    const uid = await this.auth_context.getInternalUserId();

    if (!(await hub.allowMint(uid))) {
      // Without this, a bug in the client's reconnect loop is a self-inflicted
      // DoS on Postgres: every mint costs a user lookup plus a community lookup.
      throw new AppError(REALTIME_ERRORS.TOO_MANY_TICKETS, 429);
    }

    // Every community the user belongs to, not just the active one:
    // notifications are global and /notifications sends no X-Community-ID.
    const orgs = getContext().orgs ?? [];
    const channels = new Set<string>([userChannel(uid)]);
    if (orgs.length > 0) {
      const internal_ids = await this.auth_context.getInternalCommunityIds(orgs.map((o) => o.orgId));
      for (const org of orgs) {
        const community_id = internal_ids.get(org.orgId);
        if (community_id === undefined) continue; // claimed org, no community row
        for (const tier of tiersForRole(org.role)) {
          channels.add(communityChannel(community_id, tier));
        }
      }
    }

    let ticket: string;
    try {
      // No client fingerprint is stored alongside the channel set. The stream leg
      // bypasses KrakenD while this one goes through it, so the two never agree
      // on any request attribute — see IRealtimeHub.redeemTicket.
      ticket = await hub.mintTicket({ uid, ch: [...channels] });
    } catch (err) {
      // Broker unreachable or hung (the client has a hard commandTimeout).
      // Answer, do not hang: the SPA falls back to polling on a 503.
      logger.warn({ operation: "notification:realtime_ticket", err }, "Realtime ticket mint failed");
      throw new AppError(REALTIME_ERRORS.UNAVAILABLE, 503);
    }

    const data: RealtimeTicketDTO = { ticket, expires_in: config.get("realtime.ticket_ttl_seconds") };
    logger.info({ operation: "notification:realtime_ticket", channels: channels.size }, "Realtime ticket minted");
    res.status(200).json(new ApiResponse<RealtimeTicketDTO>(data, SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("listNotifications", { url: "/notifications/", method: "get" })
  async list(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: NotificationQueryDTO = await validateDto(NotificationQueryDTO, req.query);
    const [data, pagination]: [NotificationDTO[], Pagination] = await this.notification_service.list(query);
    logger.info({ operation: "notification:list", count: data.length }, "Notification list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<NotificationDTO[]>(data, pagination, SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("unreadNotificationCount", { url: "/notifications/unread-count", method: "get" })
  async unreadCount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const filter: NotificationFilterDTO = await validateDto(NotificationFilterDTO, req.query);
    const data: UnreadCountDTO = await this.notification_service.getUnreadCount(filter.community_id);
    logger.info({ operation: "notification:unread_count", count: data.count }, "Notification unread count retrieved");
    res.status(200).json(new ApiResponse<UnreadCountDTO>(data, SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("markAllNotificationsRead", { url: "/notifications/read-all", method: "patch" })
  async markAllRead(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const filter: NotificationFilterDTO = await validateDto(NotificationFilterDTO, req.query);
    await this.notification_service.markAllRead(filter.community_id);
    logger.info({ operation: "notification:mark_all_read", community_id: filter.community_id }, "All notifications marked read");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("markNotificationRead", { url: "/notifications/:id/read", method: "patch" })
  async markRead(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(NOTIFICATION_ERRORS.NOT_FOUND, 404);
    }
    await this.notification_service.markRead(id);
    logger.info({ operation: "notification:mark_read", id }, "Notification marked read");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("getNotificationPreferences", { url: "/notifications/preferences", method: "get" })
  async getPreferences(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data: NotificationPreferencesDTO = await this.notification_service.getPreferences();
    logger.info({ operation: "notification:get_preferences", count: data.preferences.length }, "Notification preferences retrieved");
    res.status(200).json(new ApiResponse<NotificationPreferencesDTO>(data, SUCCESS));
  }

  @notificationTraceDecorator.traceSpan("setNotificationPreferences", { url: "/notifications/preferences", method: "put" })
  async setPreferences(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const body: NotificationPreferenceUpdateDTO = await validateDto(NotificationPreferenceUpdateDTO, req.body);
    const data: NotificationPreferencesDTO = await this.notification_service.setPreferences(body.preferences);
    logger.info({ operation: "notification:set_preferences", count: data.preferences.length }, "Notification preferences updated");
    res.status(200).json(new ApiResponse<NotificationPreferencesDTO>(data, SUCCESS));
  }
}
