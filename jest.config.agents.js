/**
 * Configuração Jest para testes dos agentes
 */

module.exports = {
  displayName: 'Agents Tests',
  testMatch: [
    '**/src/agents/**/__tests__/**/*.test.ts',
    '**/src/agents/**/__tests__/**/*.test.js'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.agents.js'],
  collectCoverageFrom: [
    'src/agents/**/*.ts',
    '!src/agents/**/__tests__/**',
    '!src/agents/**/*.d.ts'
  ],
  coverageDirectory: 'coverage/agents',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000, // 30 seconds for performance tests
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  silent: false,
  collectCoverage: false
}
