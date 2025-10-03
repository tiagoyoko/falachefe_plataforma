// Setup file for memory system tests
import 'dotenv/config';

// Mock environment variables for testing
process.env.UPSTASH_REDIS_REST_URL = 'redis://localhost:6379';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
