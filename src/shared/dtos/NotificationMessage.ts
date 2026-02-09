/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationScope:
 *       type: integer
 *       enum: [0, 1]
 *       description: Defines the scope of a notification
 *       example: 1
 */
/**
 * Defines the scope of a notification
 * @enum {number}
 */
export enum NotificationScope {
  /** Send to all users */
  ALL = 0,
  /** Send to a single user */
  SINGLE = 1,
}

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationType:
 *       type: integer
 *       enum: [0, 1, 2]
 *       description: Defines the type of notification to send
 *       example: 0
 */
/**
 * Defines the type of notification to send
 * @enum {number}
 */
export enum NotificationType {
  /** Send as email */
  EMAIL = 0,
  /** Send as in-app notification */
  NOTIFICATION = 1,
  /** Send as in-app notification, fallback to email if user is offline */
  NOTIFICATION_EMAIL_IF_OFFLINE = 2,
}

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationMessage:
 *       type: object
 *       properties:
 *         idClient:
 *           type: integer
 *           nullable: true
 *           description: Optional ID of the client/user to receive the notification
 *           example: 123
 *         data:
 *           type: object
 *           description: Data payload of the notification
 *         scope:
 *           $ref: "#/components/schemas/NotificationScope"
 *         type:
 *           $ref: "#/components/schemas/NotificationType"
 */
/**
 * Represents a notification message to be sent to users
 * @template T - Type of data contained in the notification
 */
export class NotificationMessage<T> {
  /** Optional ID of the client/user to receive the notification */
  public idClient?: number;
  /** Data payload of the notification */
  public data: T;
  /** Scope of the notification (ALL or SINGLE) */
  public scope: NotificationScope;
  /** Type of notification to send */
  public type: NotificationType;

  /**
   * Creates a new notification message
   * @param {T} data - The data payload to send
   * @param {NotificationScope} scope - The scope of the notification
   * @param {NotificationType} type - The type of notification
   * @param {number} [idClient] - Optional client/user ID for targeted notifications
   */
  constructor(data: T, scope: NotificationScope, type: NotificationType, idClient?: number) {
    this.idClient = idClient;
    this.data = data;
    this.scope = scope;
    this.type = type;
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     MailMessage:
 *       type: object
 *       properties:
 *         to:
 *           type: string
 *           nullable: true
 *           description: Email recipient address, or null for system-wide notifications
 *           example: "user@example.com"
 *         subject:
 *           type: string
 *           description: Email subject line
 *           example: "Password Reset Request"
 *         text:
 *           type: string
 *           description: Email body text or URL for template-based emails
 *           example: "Click the link to reset your password: https://example.com/reset?token=abc123"
 *         template:
 *           type: string
 *           nullable: true
 *           description: Optional template name to use for formatting the email, or null for plain text
 *           example: "password-reset"
 */
/**
 * Represents an email message to be sent
 */
export class MailMessage {
  /** Email recipient address, or null for system-wide notifications */
  to: string | null;
  /** Email subject line */
  subject: string;
  /** Email body text or URL for template-based emails */
  text: string;
  /** Optional template name to use for formatting the email, or null for plain text */
  template?: string | null;

  /**
   * Creates a new email message
   * @param {string|null} to - Recipient email address or null
   * @param {string} subject - Email subject line
   * @param {string} text - Email body text or URL
   * @param {string|null} [template] - Optional template name for formatting
   */
  constructor(to: string | null, subject: string, text: string, template?: string | null) {
    this.to = to;
    this.subject = subject;
    this.text = text;
    this.template = template;
  }
}
