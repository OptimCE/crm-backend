import { jest } from "@jest/globals";
import type { IMunicipalityRepository } from "../../src/modules/municipalities/domain/i-municipality.repository.js";

export function createMockMunicipalityRepository(): jest.Mocked<IMunicipalityRepository> {
  return {
    searchMunicipalities: jest.fn(),
    findManyByNisCodes: jest.fn(),
  };
}
