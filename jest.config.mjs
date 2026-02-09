/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  // 1. Use the ESM preset
  preset: 'ts-jest/presets/default-esm',
  // 2. CRITICAL FIX: Tell Jest that .ts files are Modules (ESM)
  extensionsToTreatAsEsm: ['.ts'],
  // Automatically clear mock calls, instances and contexts before every test
  clearMocks: true,
  // Automatically restore mock state between tests
  restoreMocks: true,
  testEnvironment: 'node',

  // 3. Recommended: Increase timeout for database tests
  testTimeout: 30000,

  coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/src/swagger/", "<rootDir>/tests/"],

  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      testMatch: ['**/tests/units/**/*.test.ts'],
      setupFiles: ['reflect-metadata'],

      // 4. Ensure the mapper is here (from previous fix)
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },

      transform: {
        // 5. Ensure ts-jest knows we are using ESM
        '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json'}]
      },
    },
    {
      displayName: 'functional',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      testMatch: ['**/tests/functionals/**/*.test.ts'],
      setupFiles: ['reflect-metadata'],
      maxWorkers: 1,

      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },

      transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }]
      },
    }
  ]
};

export default config;