// Setup para testes do Window Control Service

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
Object.assign(process.env, {
  NODE_ENV: 'test',
  UPSTASH_REDIS_REST_URL: 'https://test-redis.com',
  UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
});

// Timeout para testes
jest.setTimeout(10000);
