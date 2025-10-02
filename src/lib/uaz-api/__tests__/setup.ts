// Setup para testes da UAZ API
import { jest } from '@jest/globals';

// Mock do console para evitar output durante testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock do process.env
(process.env as any).NODE_ENV = 'test';
process.env.UAZ_BASE_URL = 'https://test.uazapi.com';
process.env.UAZ_API_KEY = 'test-api-key';
process.env.UAZ_API_SECRET = 'test-api-secret';
process.env.UAZ_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.com';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';

// Mock do crypto para validação de webhook
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature'),
  }),
}));

// Mock do axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock do Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    incrBy: jest.fn().mockResolvedValue(1),
    decrBy: jest.fn().mockResolvedValue(1),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
    })),
    keys: jest.fn().mockResolvedValue([]),
    dbSize: jest.fn().mockResolvedValue(0),
    info: jest.fn().mockResolvedValue('used_memory_human:1M\nuptime_in_seconds:3600'),
    flushAll: jest.fn().mockResolvedValue('OK'),
    isReady: true,
    on: jest.fn(),
  })),
}));

// Timeout para testes
jest.setTimeout(10000);
