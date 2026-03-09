/**
 * Dependency Injection bindings.
 * Registers repositories, services, controllers, and external adapters in the Inversify container.
 *
 * Notes:
 * - Infrastructure adapters are skipped during tests to avoid network/database side effects.
 * - Several bindings are guarded with `isBound` to keep this module safe for repeated imports.
 */

import { container } from "./di-container.js";
import { AppDataSource } from "../shared/database/database.connector.js";
import type { IKeyRepository } from "../modules/keys/domain/i-key.repository.js";
import { KeyRepository } from "../modules/keys/infra/key.repository.js";
import type { ICommunityRepository } from "../modules/communities/domain/i-community.repository.js";
import { CommunityRepository } from "../modules/communities/infra/community.repository.js";
import type { IDocumentRepository } from "../modules/documents/domain/i-document.repository.js";
import { DocumentRepository } from "../modules/documents/infra/document.repository.js";
import type { IInvitationRepository } from "../modules/invitations/domain/i-invitation.repository.js";
import { InvitationRepository } from "../modules/invitations/infra/invitation.repository.js";
import type { IMemberRepository } from "../modules/members/domain/i-member.repository.js";
import { MemberRepository } from "../modules/members/infra/member.repository.js";
import type { IMeterRepository } from "../modules/meters/domain/i-meter.repository.js";
import { MeterRepository } from "../modules/meters/infra/meter.repository.js";
import type { ISharingOperationRepository } from "../modules/sharing_operations/domain/i-sharing_operation.repository.js";
import { SharingOperationRepository } from "../modules/sharing_operations/infra/sharing_operation.repository.js";
import type { IUserRepository } from "../modules/users/domain/i-user.repository.js";
import { UserRepository } from "../modules/users/infra/user.repository.js";
import type { IAddressRepository } from "../shared/address/i-address.repository.js";
import { AddressRepository } from "../shared/address/address.repository.js";
import type { ICommunityService } from "../modules/communities/domain/i-community.service.js";
import { CommunityService } from "../modules/communities/infra/community.service.js";
import { DocumentService } from "../modules/documents/infra/document.service.js";
import type { IDocumentService } from "../modules/documents/domain/i-document.service.js";
import type { IInvitationService } from "../modules/invitations/domain/i-invitation.service.js";
import { InvitationService } from "../modules/invitations/infra/invitation.service.js";
import { KeyService } from "../modules/keys/infra/key.service.js";
import type { IKeyService } from "../modules/keys/domain/i-key.service.js";
import type { IMemberService } from "../modules/members/domain/i-member.service.js";
import { MemberService } from "../modules/members/infra/member.service.js";
import { MeterService } from "../modules/meters/infra/meter.service.js";
import type { IMeterService } from "../modules/meters/domain/i-meter.service.js";
import type { ISharingOperationService } from "../modules/sharing_operations/domain/i-sharing_operation.service.js";
import { SharingOperationService } from "../modules/sharing_operations/infra/sharing_operation.service.js";
import { UserService } from "../modules/users/infra/user.service.js";
import type { IUserService } from "../modules/users/domain/i-user.service.js";
import { CommunityController } from "../modules/communities/api/community.controller.js";
import { DocumentController } from "../modules/documents/api/document.controller.js";
import { InvitationController } from "../modules/invitations/api/invitation.controller.js";
import { KeyController } from "../modules/keys/api/key.controller.js";
import { MemberController } from "../modules/members/api/member.controller.js";
import { MeterController } from "../modules/meters/api/meter.controller.js";
import { SharingOperationController } from "../modules/sharing_operations/api/sharing_operation.controller.js";
import { UserController } from "../modules/users/api/user.controller.js";
import { intializeIAMService } from "./factory/iam.factory.js";
import { initializeStorageService } from "./factory/storage.factory.js";
import type { IAuthContextRepository } from "../shared/context/i-authcontext.repository.js";
import { AuthContextRepository } from "../shared/context/authcontext.repository.js";
import type { IHealthService } from "../modules/health/domain/i-health.service.js";
import { HealthService } from "../modules/health/infra/health.service.js";
import { HealthController } from "../modules/health/api/health.controller.js";

if (process.env.NODE_ENV !== "test") {
  // Runtime-only adapters. Tests inject mocks and should not initialize external resources here.
  container.bind<typeof AppDataSource>("AppDataSource").toConstantValue(AppDataSource);
  // Register IAM adapter.
  intializeIAMService();

  // Register storage adapter.
  initializeStorageService();
}

// Repository and shared-context bindings are idempotent to avoid duplicate binding errors.
if (!container.isBound("AuthContext")) {
  container.bind<IAuthContextRepository>("AuthContext").to(AuthContextRepository);
}
if (!container.isBound("AddressRepository")) {
  container.bind<IAddressRepository>("AddressRepository").to(AddressRepository);
}
if (!container.isBound("CommunityRepository")) {
  container.bind<ICommunityRepository>("CommunityRepository").to(CommunityRepository);
}
if (!container.isBound("DocumentRepository")) {
  container.bind<IDocumentRepository>("DocumentRepository").to(DocumentRepository);
}
if (!container.isBound("InvitationRepository")) {
  container.bind<IInvitationRepository>("InvitationRepository").to(InvitationRepository);
}
if (!container.isBound("KeyRepository")) {
  container.bind<IKeyRepository>("KeyRepository").to(KeyRepository);
}
if (!container.isBound("MemberRepository")) {
  container.bind<IMemberRepository>("MemberRepository").to(MemberRepository);
}
if (!container.isBound("MeterRepository")) {
  container.bind<IMeterRepository>("MeterRepository").to(MeterRepository);
}
if (!container.isBound("SharingOperationRepository")) {
  container.bind<ISharingOperationRepository>("SharingOperationRepository").to(SharingOperationRepository);
}
if (!container.isBound("UserRepository")) {
  container.bind<IUserRepository>("UserRepository").to(UserRepository);
}
if (!container.isBound("HealthService")) {
  container.bind<IHealthService>("HealthService").to(HealthService);
}

// Domain service bindings.
container.bind<ICommunityService>("CommunityService").to(CommunityService);
container.bind<IDocumentService>("DocumentService").to(DocumentService);
container.bind<IInvitationService>("InvitationService").to(InvitationService);
container.bind<IKeyService>("KeyService").to(KeyService);
container.bind<IMemberService>("MemberService").to(MemberService);
container.bind<IMeterService>("MeterService").to(MeterService);
container.bind<ISharingOperationService>("SharingOperationService").to(SharingOperationService);
container.bind<IUserService>("UserService").to(UserService);

// API controller bindings.
container.bind<CommunityController>(CommunityController).toSelf();
container.bind<DocumentController>(DocumentController).toSelf();
container.bind<InvitationController>(InvitationController).toSelf();
container.bind<KeyController>(KeyController).toSelf();
container.bind<MemberController>(MemberController).toSelf();
container.bind<MeterController>(MeterController).toSelf();
container.bind<SharingOperationController>(SharingOperationController).toSelf();
container.bind<UserController>(UserController).toSelf();

// Health module bindings.
container.bind<IHealthService>(HealthService).to(HealthService);
container.bind<HealthController>(HealthController).toSelf();
