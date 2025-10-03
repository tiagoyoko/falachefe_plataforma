/**
 * Test setup file
 */

// Mock console methods to reduce noise in tests
const originalConsole = console

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
})

afterAll(() => {
  global.console = originalConsole
})

// Mock timers for tests that use setTimeout/setInterval
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

// Global test utilities
global.createMockAgent = (id: string, type: string, overrides: any = {}) => {
  return {
    id,
    type,
    async initialize() {},
    async process() { return { response: 'mock response' } },
    async shutdown() {},
    async isHealthy() { return true },
    getCapabilities() { return ['test_capability'] },
    getCurrentLoad() { return 0.5 },
    getMemoryUsage() { return 100 * 1024 * 1024 },
    ...overrides
  }
}

// Mock EventEmitter for tests
global.createMockEventEmitter = () => {
  const listeners = new Map()
  
  return {
    on: jest.fn((event, listener) => {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event).push(listener)
    }),
    emit: jest.fn((event, ...args) => {
      if (listeners.has(event)) {
        listeners.get(event).forEach(listener => listener(...args))
      }
    }),
    removeAllListeners: jest.fn(() => {
      listeners.clear()
    }),
    removeListener: jest.fn((event, listener) => {
      if (listeners.has(event)) {
        const eventListeners = listeners.get(event)
        const index = eventListeners.indexOf(listener)
        if (index > -1) {
          eventListeners.splice(index, 1)
        }
      }
    })
  }
}
