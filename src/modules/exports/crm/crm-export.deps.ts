import type { DataSource } from "typeorm";
import type { Container } from "inversify";
import type { IIamService } from "../../../shared/iam/i-iam.service.js";
import type { IStorageService } from "../../../shared/storage/i-storage.service.js";
import type { IMeRepository } from "../../me/domain/i-me.repository.js";
import type { IMeService } from "../../me/domain/i-me.service.js";
import type { IUserRepository } from "../../users/domain/i-user.repository.js";
import type { INotificationRepository } from "../../notifications/domain/i-notification.repository.js";
import type { IOnboardingRepository } from "../../onboarding/domain/i-onboarding.repository.js";
import type { ICommunityRepository } from "../../communities/domain/i-community.repository.js";
import type { IAnnexesServicesRepository } from "../../annexes_services/domain/i-annexes-services.repository.js";
import type { IMemberRepository } from "../../members/domain/i-member.repository.js";
import type { IMeterRepository } from "../../meters/domain/i-meter.repository.js";
import type { IDocumentRepository } from "../../documents/domain/i-document.repository.js";
import type { ISharingOperationRepository } from "../../sharing_operations/domain/i-sharing_operation.repository.js";
import type { IKeyRepository } from "../../keys/domain/i-key.repository.js";
import type { IInvitationRepository } from "../../invitations/domain/i-invitation.repository.js";
import type { IAuditLogRepository } from "../../audit_log/domain/i-audit-log.repository.js";
import { CrmExportReads } from "./crm-export.reads.js";

/** The API's own reads the `crm` part replays, resolved from the DI container for each part. */
export interface CrmExportDeps {
  dataSource: DataSource;
  iam: IIamService;
  storage: IStorageService;
  reads: CrmExportReads;
  me: IMeRepository;
  meService: IMeService;
  users: IUserRepository;
  notifications: INotificationRepository;
  onboarding: IOnboardingRepository;
  communities: ICommunityRepository;
  annexes: IAnnexesServicesRepository;
  members: IMemberRepository;
  meters: IMeterRepository;
  documents: IDocumentRepository;
  sharing: ISharingOperationRepository;
  keys: IKeyRepository;
  invitations: IInvitationRepository;
  auditLog: IAuditLogRepository;
}

export function resolveCrmExportDeps(container: Container): CrmExportDeps {
  const dataSource = container.get<DataSource>("AppDataSource");
  return {
    dataSource,
    iam: container.get<IIamService>("IAMService"),
    storage: container.get<IStorageService>("StorageService"),
    reads: new CrmExportReads(dataSource),
    me: container.get<IMeRepository>("MeRepository"),
    meService: container.get<IMeService>("MeService"),
    users: container.get<IUserRepository>("UserRepository"),
    notifications: container.get<INotificationRepository>("NotificationRepository"),
    onboarding: container.get<IOnboardingRepository>("OnboardingRepository"),
    communities: container.get<ICommunityRepository>("CommunityRepository"),
    annexes: container.get<IAnnexesServicesRepository>("AnnexesServicesRepository"),
    members: container.get<IMemberRepository>("MemberRepository"),
    meters: container.get<IMeterRepository>("MeterRepository"),
    documents: container.get<IDocumentRepository>("DocumentRepository"),
    sharing: container.get<ISharingOperationRepository>("SharingOperationRepository"),
    keys: container.get<IKeyRepository>("KeyRepository"),
    invitations: container.get<IInvitationRepository>("InvitationRepository"),
    auditLog: container.get<IAuditLogRepository>("AuditLogRepository"),
  };
}

/** Every page of a paginated read, in order. The reads cap nothing, so the page size is ours. */
export async function* pages<T>(fetch: (page: number, limit: number) => Promise<[T[], number]>, limit = 200): AsyncGenerator<T> {
  for (let page = 1; ; page++) {
    const [rows, total] = await fetch(page, limit);
    yield* rows;
    if (rows.length < limit || page * limit >= total) return;
  }
}
