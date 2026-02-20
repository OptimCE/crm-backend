/* eslint-disable no-console */
import { readFile } from "node:fs/promises";
import { jest } from "@jest/globals";
import type { ICommunityRepository } from "../../src/modules/communities/domain/i-community.repository.js";
import { createMockCommunityRepository } from "../repository_mocked/community.repository.mock.js";
import { createMockAddressRepository } from "../repository_mocked/address.repository.mock.js";
import type { IAddressRepository } from "../../src/shared/address/i-address.repository.js";
import { createMockDocumentRepository } from "../repository_mocked/document.repository.mock.js";
import type { IDocumentRepository } from "../../src/modules/documents/domain/i-document.repository.js";
import { createMockInvitationRepository } from "../repository_mocked/invitation.repository.mock.js";
import type { IInvitationRepository } from "../../src/modules/invitations/domain/i-invitation.repository.js";
import { createMockKeyRepository } from "../repository_mocked/key.repository.mock.js";
import type { IKeyRepository } from "../../src/modules/keys/domain/i-key.repository.js";
import { createMockMemberRepository } from "../repository_mocked/member.repository.mock.js";
import type { IMemberRepository } from "../../src/modules/members/domain/i-member.repository.js";
import { createMockMeterRepository } from "../repository_mocked/meter.repository.mock.js";
import type { IMeterRepository } from "../../src/modules/meters/domain/i-meter.repository.js";
import { createMockSharingOperationRepository } from "../repository_mocked/sharing_operation.repository.mock.js";
import type { ISharingOperationRepository } from "../../src/modules/sharing_operations/domain/i-sharing_operation.repository.js";
import { createMockUserRepository } from "../repository_mocked/user.repository.mock.js";
import type { IUserRepository } from "../../src/modules/users/domain/i-user.repository.js";
import { createMockIamService } from "../external_mocking/iam_service.mock.js";
import type { IIamService } from "../../src/shared/iam/i-iam.service.js";
import { createMockStorageService } from "../external_mocking/storage_service.mock.js";
import type { IStorageService } from "../../src/shared/storage/i-storage.service.js";
import { createMockAuthContextRepository } from "../repository_mocked/authcontext.repository.mock.js";
import type { IAuthContextRepository } from "../../src/shared/context/i-authcontext.repository.js";
import type { QueryRunner } from "typeorm";
import type { Response } from "supertest";

export const expectWithLog = async (response: Response, assertionCallback: () => void | Promise<void>): Promise<void> => {
  try {
    await assertionCallback();
  } catch (error) {
    console.error("\nTEST FAILED. API RESPONSE BODY:");
    console.dir(response.body, { depth: null, colors: true });
    console.error("\n----------------------------------\n");
    throw error;
  }
};

export async function getWorkingFakeRepository(): Promise<QueryRunner> {
  const { AppDataSource } = await import("../../src/shared/database/database.connector.js");
  const realQueryRunner = AppDataSource.createQueryRunner();

  realQueryRunner.commitTransaction = jest.fn(() => Promise.resolve());
  realQueryRunner.rollbackTransaction = jest.fn(() => Promise.resolve());

  return realQueryRunner;
}

export async function initalizeDb(): Promise<void> {
  const { AppDataSource } = await import("../../src/shared/database/database.connector.js");
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    (await import("../../src/container/di-container.js")).container.bind<typeof AppDataSource>("AppDataSource").toConstantValue(AppDataSource);
  }
}

export async function resetDb(): Promise<void> {
  const sql = await readFile("tests/sql/init.sql", "utf8");
  const { AppDataSource } = await import("../../src/shared/database/database.connector.js");
  const qr = AppDataSource.createQueryRunner(); // single connection
  await qr.connect();
  await qr.startTransaction();
  try {
    await qr.query(sql);
    await qr.commitTransaction();
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }
}

export async function tearDownDB(): Promise<void> {
  const { AppDataSource } = await import("../../src/shared/database/database.connector.js");
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  jest.clearAllMocks();
}
type ApiCallMocks = {
  call: jest.Mock;
  callWithTracingHeaders: jest.Mock;
  callWithTracingHeadersCertificate: jest.Mock;
};

export function mockApiCall(overrides: Partial<Record<string, jest.Mock>> = {}): ApiCallMocks {
  const defaultMocks = {
    call: jest.fn(),
    callWithTracingHeaders: jest.fn(),
    callWithTracingHeadersCertificate: jest.fn(),
  };

  const mocks = { ...defaultMocks, ...overrides };
  jest.unstable_mockModule("../src/shared/services/api_call.js", () => mocks);

  return mocks;
}

export async function setupCommonTestEnvironment(): Promise<void> {
  await initalizeDb();
  const { AppDataSource } = await import("../../src/shared/database/database.connector.js");
  const fakeQueryRunner = await getWorkingFakeRepository();

  jest.spyOn(AppDataSource, "createQueryRunner").mockImplementation(() => fakeQueryRunner);
}

async function mockModule<T extends object>(mock: jest.Mocked<T>, container_name: string): Promise<jest.Mocked<T>> {
  const container = (await import("../../src/container/di-container.js")).container;

  if (container.isBound(container_name)) {
    (await container.rebind<T>(container_name)).toConstantValue(mock);
  } else {
    container.bind<T>(container_name).toConstantValue(mock);
  }
  return mock;
}

export async function mockAddressRepositoryModule(overrides: { [K in keyof IAddressRepository]?: jest.Mock }): Promise<
  jest.Mocked<IAddressRepository>
> {
  const mock = createMockAddressRepository();
  Object.assign(mock, overrides);
  return await mockModule<IAddressRepository>(mock, "AddressRepository");
}

export async function mockCommunityRepositoryModule(overrides: { [K in keyof ICommunityRepository]?: jest.Mock }): Promise<
  jest.Mocked<ICommunityRepository>
> {
  const mock = createMockCommunityRepository();
  Object.assign(mock, overrides);
  return await mockModule<ICommunityRepository>(mock, "CommunityRepository");
}

export async function mockDocumentRepositoryModule(overrides: { [K in keyof IDocumentRepository]?: jest.Mock }): Promise<
  jest.Mocked<IDocumentRepository>
> {
  const mock = createMockDocumentRepository();
  Object.assign(mock, overrides);
  return await mockModule<IDocumentRepository>(mock, "DocumentRepository");
}

export async function mockInvitationRepositoryModule(overrides: { [K in keyof IInvitationRepository]?: jest.Mock }): Promise<
  jest.Mocked<IInvitationRepository>
> {
  const mock = createMockInvitationRepository();
  Object.assign(mock, overrides);
  return await mockModule<IInvitationRepository>(mock, "InvitationRepository");
}

export async function mockKeyRepositoryModule(overrides: { [K in keyof IKeyRepository]?: jest.Mock }): Promise<jest.Mocked<IKeyRepository>> {
  const mock = createMockKeyRepository();
  Object.assign(mock, overrides);
  return await mockModule<IKeyRepository>(mock, "KeyRepository");
}

export async function mockMemberRepositoryModule(overrides: { [K in keyof IMemberRepository]?: jest.Mock }): Promise<jest.Mocked<IMemberRepository>> {
  const mock = createMockMemberRepository();
  Object.assign(mock, overrides);
  return await mockModule<IMemberRepository>(mock, "MemberRepository");
}

export async function mockMeterRepositoryModule(overrides: { [K in keyof IMeterRepository]?: jest.Mock }): Promise<jest.Mocked<IMeterRepository>> {
  const mock = createMockMeterRepository();
  Object.assign(mock, overrides);
  return await mockModule<IMeterRepository>(mock, "MeterRepository");
}

export async function mockSharingOperationRepositoryModule(overrides: { [K in keyof ISharingOperationRepository]?: jest.Mock }): Promise<
  jest.Mocked<ISharingOperationRepository>
> {
  const mock = createMockSharingOperationRepository();
  Object.assign(mock, overrides);
  return await mockModule<ISharingOperationRepository>(mock, "SharingOperationRepository");
}

export async function mockUserRepositoryModule(overrides: { [K in keyof IUserRepository]?: jest.Mock }): Promise<jest.Mocked<IUserRepository>> {
  const mock = createMockUserRepository();
  Object.assign(mock, overrides);
  return await mockModule<IUserRepository>(mock, "UserRepository");
}

export async function mockIAMServiceModule(overrides: { [K in keyof IIamService]?: jest.Mock }): Promise<jest.Mocked<IIamService>> {
  const mock = createMockIamService();
  Object.assign(mock, overrides);
  return await mockModule<IIamService>(mock, "IAMService");
}
export async function mockStorageServiceModule(overrides: { [K in keyof IStorageService]?: jest.Mock }): Promise<jest.Mocked<IStorageService>> {
  const mock = createMockStorageService();
  Object.assign(mock, overrides);
  return await mockModule<IStorageService>(mock, "StorageService");
}
export async function mockAuthContextRepositoryModule(overrides: { [K in keyof IAuthContextRepository]?: jest.Mock }): Promise<
  jest.Mocked<IAuthContextRepository>
> {
  const mock = createMockAuthContextRepository();
  Object.assign(mock, overrides);
  return await mockModule<IAuthContextRepository>(mock, "AuthContext");
}

export async function initializeExternalServices(): Promise<void> {
  await mockIAMServiceModule({});
  await mockStorageServiceModule({});
}
