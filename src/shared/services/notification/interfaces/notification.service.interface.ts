import type { NotificationMessage } from "../../../dtos/NotificationMessage.js";

/**
 * Interface for notification service operations
 */
export interface INotificationService {
  /**
   * Sends a notification through the notification service
   * @param {NotificationMessage<any>} notification - The notification message to send
   * @returns {Promise<void>} Promise that resolves when the notification is sent
   */
  sendNotification(notification: NotificationMessage<unknown>): Promise<void>;
}
