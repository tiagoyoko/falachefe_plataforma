module.exports = {
  displayName: 'Memory System Tests',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/lib/memory/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/lib/memory/__tests__/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/lib/memory/**/*.ts',
    '!src/lib/memory/**/*.d.ts',
    '!src/lib/memory/__tests__/**/*'
  ],
  coverageDirectory: 'coverage/memory',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true
};
