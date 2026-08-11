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
  type UnreadCountDTO,
} from "./notification.dtos.js";

const notificationTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class NotificationController {
  constructor(@inject("NotificationService") private readonly notification_service: INotificationService) {}

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
