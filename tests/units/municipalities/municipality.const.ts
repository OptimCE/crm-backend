import { jest } from "@jest/globals";
import { GLOBAL_ERRORS, SUCCESS } from "../../../src/shared/errors/errors.js";
import type { Municipality, MunicipalityPostalCode } from "../../../src/modules/municipalities/domain/municipality.models.js";

// --- Mock Data ---
const mockDate = new Date("2024-01-01T00:00:00.000Z");

function makePostalCode(postal_code: string, nis_code: number): MunicipalityPostalCode {
  return {
    postal_code,
    nis_code,
    municipality: undefined as unknown as Municipality,
    created_at: mockDate,
  };
}

function makeMunicipality(
  nis_code: number,
  fr_name: string,
  nl_name: string | null,
  postal_codes: string[],
): Municipality {
  return {
    nis_code,
    fr_name,
    nl_name,
    de_name: null,
    region_fr: "Région de Bruxelles-Capitale",
    region_nl: "Brussels Hoofdstedelijk Gewest",
    geo_point: null,
    geo_shape: null,
    created_at: mockDate,
    updated_at: mockDate,
    postal_codes: postal_codes.map((pc) => makePostalCode(pc, nis_code)),
  };
}

export const mockBruxelles = makeMunicipality(21004, "Bruxelles", "Brussel", ["1000", "1020", "1040", "1050", "1120", "1130"]);
export const mockIxelles = makeMunicipality(21009, "Ixelles", "Elsene", ["1050"]);
export const mockAnderlecht = makeMunicipality(21001, "Anderlecht", "Anderlecht", ["1070"]);

export const AUTH_USER = "auth0|tester";

// --- Test Cases ---

export const testCasesSearchMunicipalities = [
  {
    description: "Success - No filters returns first page",
    query: { page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const arr = data as Array<{ nis_code: number }>;
      return Array.isArray(arr) && arr.length === 3 && arr.some((m) => m.nis_code === 21004);
    },
    expected_data: undefined,
    translation_field: undefined,
    expected_pagination: { page: 1, limit: 10, total: 3, total_pages: 1 },
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.resolve([[mockAnderlecht, mockBruxelles, mockIxelles], 3])),
      },
    },
  },
  {
    description: "Success - Filter by name (Brux)",
    query: { name: "Brux", page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const arr = data as Array<{ fr_name: string }>;
      return arr.length === 1 && arr[0].fr_name === "Bruxelles";
    },
    expected_data: undefined,
    translation_field: undefined,
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.resolve([[mockBruxelles], 1])),
      },
    },
  },
  {
    description: "Success - Filter by postal_code (1050)",
    query: { postal_code: "1050", page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => {
      const arr = data as Array<{ nis_code: number }>;
      return arr.length === 2 && arr.some((m) => m.nis_code === 21004) && arr.some((m) => m.nis_code === 21009);
    },
    expected_data: undefined,
    translation_field: undefined,
    expected_pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.resolve([[mockBruxelles, mockIxelles], 2])),
      },
    },
  },
  {
    description: "Success - Empty result returns total_pages 0",
    query: { name: "Atlantis", page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => Array.isArray(data) && data.length === 0,
    expected_data: undefined,
    translation_field: undefined,
    expected_pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.resolve([[], 0])),
      },
    },
  },
  {
    description: "Success - Pagination math (total 25, limit 10, page 2 → 3 pages)",
    query: { page: "2", limit: "10" },
    user_id: AUTH_USER,
    status_code: 200,
    expected_error_code: SUCCESS,
    check_data: (data: unknown): boolean => Array.isArray(data) && data.length === 1,
    expected_data: undefined,
    translation_field: undefined,
    expected_pagination: { page: 2, limit: 10, total: 25, total_pages: 3 },
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.resolve([[mockIxelles], 25])),
      },
    },
  },
  {
    description: "Fail - Invalid postal_code (non-numeric)",
    query: { postal_code: "abcd", page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 422,
    expected_error_code: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING.errorCode,
    check_data: undefined,
    expected_data: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING.message,
    translation_field: { field: "postal_code", value: "abcd" },
    expected_pagination: undefined,
    mocks: undefined,
  },
  {
    description: "Fail - Missing x-user-id header",
    query: { page: "1", limit: "10" },
    user_id: undefined,
    status_code: 400,
    expected_error_code: GLOBAL_ERRORS.UNAUTHENTICATED.errorCode,
    check_data: undefined,
    expected_data: GLOBAL_ERRORS.UNAUTHENTICATED.message,
    translation_field: undefined,
    expected_pagination: undefined,
    mocks: undefined,
  },
  {
    description: "Fail - Repository throws DB error",
    query: { page: "1", limit: "10" },
    user_id: AUTH_USER,
    status_code: 500,
    expected_error_code: GLOBAL_ERRORS.EXCEPTION.errorCode,
    check_data: undefined,
    expected_data: GLOBAL_ERRORS.EXCEPTION.message,
    translation_field: undefined,
    expected_pagination: undefined,
    mocks: {
      municipalityRepo: {
        searchMunicipalities: jest.fn(() => Promise.reject(new Error("DB outage"))),
      },
    },
  },
];
