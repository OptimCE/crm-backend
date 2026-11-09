import { jest } from "@jest/globals";
import type { IRegulatoryRepository } from "../../src/modules/regulatory/domain/i-regulatory.repository.js";

/** The module off, or nothing tracked: no badge, no procedure driving any status. */
export function createMockRegulatoryRepository(): jest.Mocked<IRegulatoryRepository> {
  return {
    latestBySubject: jest.fn(async () => []),
    drivesMeter: jest.fn(async () => false),
    countLiveInOperation: jest.fn(async () => 0),
  };
}
