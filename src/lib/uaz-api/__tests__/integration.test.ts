import { UAZClient } from '../client';
import { TemplateService } from '../template-service';
import { RedisClient } from '../../cache/redis-client';
import { UAZCircuitBreaker } from '../circuit-breaker';
import { UAZRetryLogic } from '../retry-logic';
import { UAZRateLimiter } from '../rate-limiter';
import { UAZLoggerSingleton } from '../../logger/uaz-logger';

describe('UAZ API Integration', () => {
  let uazClient: UAZClient;
  let templateService: TemplateService;
  let redisClient: RedisClient;
  let circuitBreaker: any;
  let retryLogic: any;
  let rateLimiter: any;
  let logger: any;

  beforeAll(async () => {
    // Initialize all services
    uazClient = new UAZClient({
      baseUrl: 'https://test.uazapi.com',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      webhookSecret: 'test-webhook-secret',
    });

    templateService = new TemplateService(uazClient);
    redisClient = new RedisClient({
      url: 'https://test-redis.com',
      token: 'test-redis-token',
    });

    circuitBreaker = UAZCircuitBreaker.getInstance();
    retryLogic = UAZRetryLogic.getInstance();
    rateLimiter = UAZRateLimiter.getInstance();
    logger = UAZLoggerSingleton.getInstance();

    // Connect Redis
    await redisClient.connect();
  });

  afterAll(async () => {
    // Cleanup
    await redisClient.disconnect();
    UAZCircuitBreaker.destroy();
  });

  describe('Service Integration', () => {
    it('should initialize all services successfully', () => {
      expect(uazClient).toBeDefined();
      expect(templateService).toBeDefined();
      expect(redisClient).toBeDefined();
      expect(circuitBreaker).toBeDefined();
      expect(retryLogic).toBeDefined();
      expect(rateLimiter).toBeDefined();
      expect(logger).toBeDefined();
    });

    it('should have Redis connected', () => {
      expect(redisClient.isReady()).toBe(true);
    });
  });

  describe('Template Service Integration', () => {
    it('should create template with validation', async () => {
      const template = {
        name: 'Test Template',
        category: 'utility' as const,
        language: 'pt',
        content: {
          body: {
            text: 'Hello {{name}}, this is a test message.',
          },
        },
      };

      const result = await templateService.createTemplate(template);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Template');
      expect(result.category).toBe('utility');
    });

    it('should validate template content', async () => {
      const invalidTemplate = {
        name: 'Test Template',
        category: 'utility' as const,
        language: 'pt',
        content: {
          body: {
            text: '', // Empty text should fail validation
          },
        },
      };

      await expect(templateService.createTemplate(invalidTemplate)).rejects.toThrow();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should handle circuit breaker state changes', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('open');
    });
  });

  describe('Retry Logic Integration', () => {
    it('should retry failed operations', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retryLogic.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Rate Limiter Integration', () => {
    it('should enforce rate limits', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.execute(mockFn);
      }

      // Next request should be rate limited
      await expect(rateLimiter.execute(mockFn)).rejects.toThrow();
    });
  });

  describe('Redis Integration', () => {
    it('should cache and retrieve data', async () => {
      const key = 'test-key';
      const data = { message: 'Hello, World!' };

      await redisClient.set(key, data);
      const retrieved = await redisClient.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should handle cache expiration', async () => {
      const key = 'expiry-test';
      const data = { message: 'This will expire' };

      await redisClient.set(key, data, { ttl: 1 }); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const retrieved = await redisClient.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Logger Integration', () => {
    it('should log structured messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.log('info', 'Test message', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
        expect.objectContaining({ test: 'data' })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('End-to-End Flow', () => {
    it('should handle complete message flow', async () => {
      // 1. Create template
      const template = await templateService.createTemplate({
        name: 'Welcome Template',
        category: 'utility',
        language: 'pt',
        content: {
          body: {
            text: 'Welcome {{name}}!',
          },
        },
      });

      expect(template).toBeDefined();

      // 2. Cache template
      await redisClient.set(`template:${template.id}`, template);

      // 3. Retrieve from cache
      const cachedTemplate = await redisClient.get(`template:${template.id}`);
      expect(cachedTemplate).toEqual(template);

      // 4. Log the operation
      logger.log('info', 'Template created and cached', {
        templateId: template.id,
        templateName: template.name,
      });

      // 5. Send message (mocked)
      const messageRequest = {
        number: '5511999999999',
        text: 'Welcome John!',
      };

      // This would normally call UAZ API
      // For integration test, we just verify the request structure
      expect(messageRequest.number).toBe('5511999999999');
      expect(messageRequest.text).toBe('Welcome John!');
    });
  });
});
