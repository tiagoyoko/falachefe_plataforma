module.exports = {
  displayName: 'Window Control Tests',
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '<rootDir>/src/lib/window-control/__tests__/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'src/lib/window-control/**/*.ts',
    '!src/lib/window-control/**/*.d.ts',
    '!src/lib/window-control/__tests__/**',
  ],
  coverageDirectory: '<rootDir>/coverage/window-control',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 10000,
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/lib/window-control/__tests__/setup.ts'],
};
