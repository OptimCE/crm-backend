import { jest } from "@jest/globals";
import type {IAddressRepository} from "../../src/shared/address/i-address.repository.js";

export function createMockAddressRepository(): jest.Mocked<IAddressRepository>{
    return {
        addAddress: jest.fn(),
        deleteAddress: jest.fn(),
        getAddress: jest.fn()
    }
}