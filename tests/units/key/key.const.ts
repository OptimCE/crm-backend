import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import type { AllocationKey, Consumer, Iteration } from "../../../src/modules/keys/domain/key.models.js";
import { toKeyDTO, toKeyPartialDTO } from "../../../src/modules/keys/shared/to_dto.js";
import { KEY_ERRORS } from "../../../src/modules/keys/shared/key.errors.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";

// --- Mock Data ---

export const mockDate = new Date("2024-01-01T12:00:00.000Z");

export const mockAllocKeyEntity: AllocationKey = {
  id: 1,
  name: "Test Key",
  description: "Test Description",
  created_at: mockDate,
  updated_at: mockDate,
  community: {} as Community,
  iterations: [
    {
      id: 1,
      number: 1,
      energy_allocated_percentage: 1,
      created_at: mockDate,
      updated_at: mockDate,
      allocation_key: {} as AllocationKey,
      community: {} as Community,
      consumers: [
        {
          id: 1,
          name: "Consumer 1",
          energy_allocated_percentage: 1,
          iteration: {} as Iteration,
          community: {} as Community,
          created_at: mockDate,
          updated_at: mockDate,
        },
      ],
    },
  ],
};

const mockConsumer = (id: number, name: string, energy_allocated_percentage: number): Consumer => ({
  id,
  name,
  energy_allocated_percentage,
  iteration: {} as Iteration,
  community: {} as Community,
  created_at: mockDate,
  updated_at: mockDate,
});

// Shares whose `* 100` carries floating-point noise (0.29 * 100 = 28.999999999999996),
// a PRORATA consumer (-1) and shares that need the 4-decimal cap (1/7, 6/7).
export const mockAllocKeyEntityFractionalShares: AllocationKey = {
  ...mockAllocKeyEntity,
  iterations: [
    {
      ...mockAllocKeyEntity.iterations[0],
      id: 1,
      number: 1,
      energy_allocated_percentage: 0.29,
      consumers: [mockConsumer(1, "Consumer A", 0.07), mockConsumer(2, "Consumer B", 0.57), mockConsumer(3, "Consumer C", -1)],
    },
    {
      ...mockAllocKeyEntity.iterations[0],
      id: 2,
      number: 2,
      energy_allocated_percentage: 0.71,
      consumers: [mockConsumer(4, "Consumer D", 1 / 7), mockConsumer(5, "Consumer E", 6 / 7)],
    },
  ],
};

export const mockKeyDTO = toKeyDTO(mockAllocKeyEntity);
export const mockKeyPartialDTO = toKeyPartialDTO(mockAllocKeyEntity);

// JSON compatible
export const mockKeyDTOJSON = JSON.parse(JSON.stringify(mockKeyDTO));
export const mockKeyPartialDTOJSON = JSON.parse(JSON.stringify(mockKeyPartialDTO));

export const mockWorkbook = {
  addWorksheet: jest.fn().mockReturnThis(),
  columns: [],
  addRow: jest.fn(),
  getCell: jest.fn().mockReturnValue({ font: {}, value: "", alignment: {} }),
  mergeCells: jest.fn(),
  duplicateRow: jest.fn(),
  addImage: jest.fn(),
  xlsx: {
    writeBuffer: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from("excel-content")),
  },
};

// --- Test Cases ---

// 1. Get Keys List
export const testCasesGetKeysList = [
  {
    description: "Success",
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: [mockKeyPartialDTOJSON],
    expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    mocks: {
      keyRepo: {
        getPartialKeyList: jest.fn(() => Promise.resolve([[mockAllocKeyEntity], 1])),
      },
    },
  },
  {
    description: "Success (Empty)",
    query: {},
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: [],
    expected_pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    mocks: {
      keyRepo: {
        getPartialKeyList: jest.fn(() => Promise.resolve([[], 0])),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    query: {},
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.EXCEPTION.errorCode,
    expected_data: KEY_ERRORS.EXCEPTION.message,
    mocks: {
      keyRepo: {
        getPartialKeyList: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// 2. Get Key
export const testCasesGetKey = [
  {
    description: "Success",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockKeyDTOJSON,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: 999,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.GET_KEY.KEY_NOT_FOUND.errorCode,
    expected_data: KEY_ERRORS.GET_KEY.KEY_NOT_FOUND.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: 1,
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.EXCEPTION.errorCode,
    expected_data: KEY_ERRORS.EXCEPTION.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.reject(new Error("DB Fail"))),
      },
    },
  },
];

// 3. Download Key
export const testCasesDownloadKey = [
  {
    description: "Success Download",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: mockKeyDTOJSON,
    // Rows of the "Clef de répartition" sheet: [iteration n°, iteration %, consumer, consumer %]
    expected_rows: [["1", "100%", "Consumer 1", "100%"]],
    // Note: Controller calls service.getKey(id) -> same as getKey logic currently
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
      },
    },
  },
  {
    description: "Success (share labels without floating-point noise)",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_rows: [
      ["1", "29%", "Consumer A", "7%"],
      ["1", "29%", "Consumer B", "57%"],
      ["1", "29%", "Consumer C", "PRORATA"],
      ["2", "71%", "Consumer D", "14.2857%"],
      ["2", "71%", "Consumer E", "85.7143%"],
    ],
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntityFractionalShares)),
      },
    },
  },
  {
    description: "Fail (Not Found)",
    id: 999,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.GET_KEY.KEY_NOT_FOUND.errorCode,
    expected_data: KEY_ERRORS.GET_KEY.KEY_NOT_FOUND.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: 1,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.DOWNLOAD_KEY.DOWNLOAD_KEY.errorCode,
    expected_data: KEY_ERRORS.DOWNLOAD_KEY.DOWNLOAD_KEY.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.reject(new Error("DB Error"))),
      },
    },
  },
];

// Iterations are numbered from 1, as the frontend and allocation-key-generation number them: a
// 3-iteration key ends on number 3.
const threeIterations = [
  { number: 1, energy_allocated_percentage: 0.5, consumers: [{ name: "C1", energy_allocated_percentage: 1 }] },
  { number: 2, energy_allocated_percentage: 0.3, consumers: [{ name: "C1", energy_allocated_percentage: 1 }] },
  { number: 3, energy_allocated_percentage: 0.2, consumers: [{ name: "C1", energy_allocated_percentage: 1 }] },
];

// 4. Add Key
export const testCasesAddKey = [
  {
    description: "Success (3 iterations, numbered 1 to 3)",
    body: {
      name: "New Key",
      description: "Desc",
      iterations: threeIterations,
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      keyRepo: {
        createKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        createChildren: jest.fn(() => Promise.resolve(true)),
      },
    },
  },
  {
    description: "Success",
    body: {
      name: "New Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      keyRepo: {
        createKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        createChildren: jest.fn(() => Promise.resolve(true)),
      },
    },
  },
  {
    description: "Fail (Validation Error - Iteration number 0, numbering starts at 1)",
    body: {
      name: "Fail Key",
      description: "Desc",
      iterations: [{ number: 0, energy_allocated_percentage: 1, consumers: [{ name: "C1", energy_allocated_percentage: 1 }] }],
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MIN_1.errorCode,
    expected_data: KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MIN_1.message,
    mocks: {},
  },
  {
    description: "Fail (Validation Error - Iteration number 4, at most 3 iterations)",
    body: {
      name: "Fail Key",
      description: "Desc",
      iterations: [...threeIterations.slice(0, 2), { ...threeIterations[2], number: 4 }],
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MAX_3.errorCode,
    expected_data: KEY_ERRORS.VALIDATION.CREATE_ITERATION.NUMBER_WRONG_MAX_3.message,
    mocks: {},
  },
  {
    description: "Fail (Validation Error - Invalid Sum)",
    body: {
      name: "Fail Key",
      description: "Desc",
      iterations: [], // Sum 0 != 1
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.VALIDATION.CREATE_KEY.ITERATION_SUM_1.errorCode,
    expected_data: KEY_ERRORS.VALIDATION.CREATE_KEY.ITERATION_SUM_1.message, // Validator defaults to this
    mocks: {}, // No service call
  },
  {
    description: "Fail (Repo createKey Error)",
    body: {
      name: "Fail Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.ADD_KEY.ADD_KEY_DATABASE.errorCode,
    expected_data: KEY_ERRORS.ADD_KEY.ADD_KEY_DATABASE.message,
    mocks: {
      keyRepo: {
        createKey: jest.fn(() => Promise.reject(new Error("Create Fail"))),
      },
    },
  },
  {
    description: "Fail (Repo createChildren Error)",
    body: {
      name: "Fail Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.ADD_KEY.ADD_CHILDREN_DATABASE.errorCode,
    expected_data: KEY_ERRORS.ADD_KEY.ADD_CHILDREN_DATABASE.message,
    mocks: {
      keyRepo: {
        createKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        createChildren: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
];

// 5. Update Key
export const testCasesUpdateKey = [
  {
    description: "Success (3 iterations, numbered 1 to 3)",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Updated Desc",
      iterations: threeIterations,
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        updateKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        deleteChildren: jest.fn(() => Promise.resolve(true)),
        createChildren: jest.fn(() => Promise.resolve(true)),
      },
    },
  },
  {
    description: "Success",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Updated Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        updateKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        deleteChildren: jest.fn(() => Promise.resolve(true)),
        createChildren: jest.fn(() => Promise.resolve(true)),
      },
    },
  },
  {
    description: "Fail (Validation Error - Invalid Sum)",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Desc",
      iterations: {
        number: 1,
        energy_allocated_percentage: 0.7,
        consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
      }, // Sum 0
    },
    status_code: 422,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.VALIDATION.UPDATE_KEY.ITERATION_SUM_1.errorCode,
    expected_data: KEY_ERRORS.VALIDATION.UPDATE_KEY.ITERATION_SUM_1.message,
    mocks: {},
  },
  {
    description: "Fail (Key Not Found)",
    body: {
      id: 999,
      name: "Updated Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.UPDATE_KEY.KEY_NOT_FOUND.errorCode,
    expected_data: KEY_ERRORS.UPDATE_KEY.KEY_NOT_FOUND.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(null)),
      },
    },
  },
  {
    description: "Fail (Repo updateKey Error)",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.UPDATE_KEY.UPDATE_KEY_DATABASE.errorCode,
    expected_data: KEY_ERRORS.UPDATE_KEY.UPDATE_KEY_DATABASE.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        updateKey: jest.fn(() => Promise.reject(new Error("Update Fail"))),
      },
    },
  },
  {
    description: "Fail (Repo deleteChildren Error)",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.UPDATE_KEY.DELETE_CHILDREN_DATABASE.errorCode,
    expected_data: KEY_ERRORS.UPDATE_KEY.DELETE_CHILDREN_DATABASE.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        updateKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        deleteChildren: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
  {
    description: "Fail (Repo createChildren Error)",
    body: {
      id: 1,
      name: "Updated Key",
      description: "Desc",
      iterations: [
        {
          number: 1,
          energy_allocated_percentage: 1,
          consumers: [{ name: "C1", energy_allocated_percentage: 1 }],
        },
      ],
    },
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.UPDATE_KEY.ADD_CHILDREN_DATABASE.errorCode,
    expected_data: KEY_ERRORS.UPDATE_KEY.ADD_CHILDREN_DATABASE.message,
    mocks: {
      keyRepo: {
        getKeyById: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        updateKey: jest.fn(() => Promise.resolve(mockAllocKeyEntity)),
        deleteChildren: jest.fn(() => Promise.resolve(true)),
        createChildren: jest.fn(() => Promise.resolve(false)),
      },
    },
  },
];

// 6. Delete Key
export const testCasesDeleteKey = [
  {
    description: "Success",
    id: 1,
    status_code: 200,
    orgs: ORGS_ADMIN,
    expected_error_code: SUCCESS,
    expected_data: "success",
    mocks: {
      keyRepo: {
        deleteKey: jest.fn(() => Promise.resolve({ affected: 1 })),
      },
    },
  },
  {
    description: "Fail (Key Not Found / Affected != 1)",
    id: 999,
    status_code: 400,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.DELETE_KEY.DATABASE_DELETE.errorCode,
    expected_data: KEY_ERRORS.DELETE_KEY.DATABASE_DELETE.message,
    mocks: {
      keyRepo: {
        deleteKey: jest.fn(() => Promise.resolve({ affected: 0 })),
      },
    },
  },
  {
    description: "Fail (DB Error)",
    id: 1,
    status_code: 500,
    orgs: ORGS_ADMIN,
    expected_error_code: KEY_ERRORS.EXCEPTION.errorCode,
    expected_data: KEY_ERRORS.EXCEPTION.message,
    mocks: {
      keyRepo: {
        deleteKey: jest.fn(() => Promise.reject(new Error("Delete Fail"))),
      },
    },
  },
];
