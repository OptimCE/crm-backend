import { jest } from "@jest/globals";
import type {IMeterRepository} from "../../src/modules/meters/domain/i-meter.repository.js";

export function createMockMeterRepository(): jest.Mocked<IMeterRepository>{
    return {
        addMeterConsumptions: jest.fn(),
        addMeterData: jest.fn(),
        areMetersInCommunity: jest.fn(),
        createMeter: jest.fn(),
        deleteMeter: jest.fn(),
        getLastMeterData: jest.fn(),
        getMeter: jest.fn(),
        getMeterConsumptions: jest.fn(),
        getMetersList: jest.fn()

    }
}