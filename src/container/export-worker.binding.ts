import { container } from "./di-container.js";
import { AppDataSource } from "../shared/database/database.connector.js";
import type { IAuthContextRepository } from "../shared/context/i-authcontext.repository.js";
import { AuthContextRepository } from "../shared/context/authcontext.repository.js";
import type { IAuditLogRepository } from "../modules/audit_log/domain/i-audit-log.repository.js";
import { AuditLogRepository } from "../modules/audit_log/infra/audit-log.repository.js";
import type { IAuditLogService } from "../modules/audit_log/domain/i-audit-log.service.js";
import { AuditLogService } from "../modules/audit_log/infra/audit-log.service.js";
import type { INotificationRepository } from "../modules/notifications/domain/i-notification.repository.js";
import { NotificationRepository } from "../modules/notifications/infra/notification.repository.js";
import type { INotificationService } from "../modules/notifications/domain/i-notification.service.js";
import { NotificationService } from "../modules/notifications/infra/notification.service.js";
import type { IOutboundRepository } from "../modules/notifications/domain/i-outbound.repository.js";
import { OutboundRepository } from "../modules/notifications/infra/outbound.repository.js";
import type { IOutboundService } from "../modules/notifications/domain/i-outbound.service.js";
import { OutboundService } from "../modules/notifications/infra/outbound.service.js";

/**
 * The export worker's bindings: the audit log and the notifications, nothing else. Not
 * binding.ts, which also creates the Keycloak admin client, the document storage and every API
 * adapter: the worker needs none of them and must not hold their credentials. No RealtimeHub
 * either: the bell picks a worker notification up on its next poll.
 *
 * Each binding is skipped when already there, so a test that loaded binding.ts can call it too.
 */
export function bindExportWorker(): void {
  if (!container.isBound("AppDataSource")) container.bind<typeof AppDataSource>("AppDataSource").toConstantValue(AppDataSource);
  if (!container.isBound("AuthContext")) container.bind<IAuthContextRepository>("AuthContext").to(AuthContextRepository);
  if (!container.isBound("AuditLogRepository")) container.bind<IAuditLogRepository>("AuditLogRepository").to(AuditLogRepository);
  if (!container.isBound("AuditLogService")) container.bind<IAuditLogService>("AuditLogService").to(AuditLogService);
  if (!container.isBound("NotificationRepository")) container.bind<INotificationRepository>("NotificationRepository").to(NotificationRepository);
  if (!container.isBound("NotificationService")) container.bind<INotificationService>("NotificationService").to(NotificationService);
  if (!container.isBound("OutboundRepository")) container.bind<IOutboundRepository>("OutboundRepository").to(OutboundRepository);
  if (!container.isBound("OutboundService")) container.bind<IOutboundService>("OutboundService").to(OutboundService);
}
