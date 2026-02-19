import type { INotificationService } from "../interfaces/notification.service.interface.js";
import type { NotificationMessage } from "../../../dtos/NotificationMessage.js";
import config from "config";
import { callWithTracingHeaders } from "../../api_call.js";

/**
 * Service for sending notifications through the notification microservice
 * @implements {INotificationService}
 */
export class NotificationService implements INotificationService {
  /** URL of the notification microservice */
  _notification_url: string;

  /**
   * Creates a new NotificationService instance
   * Initializes the notification URL from configuration
   */
  constructor() {
    this._notification_url = config.get("notification.target");
  }

  /**
   * Sends a notification through the notification microservice
   * @param {NotificationMessage<any>} notification - The notification message to send
   * @returns {Promise<void>} Promise that resolves when the notification is sent
   */
  async sendNotification(notification: NotificationMessage<any>): Promise<void> {
    await callWithTracingHeaders({
      method: "POST",
      url: this._notification_url + "/post",
      data: notification,
    });
  }
}
