import { RateLimiter, UAZRateLimiter } from '../rate-limiter';
import { UAZError } from '../errors';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      requestsPerMinute: 5,
      requestsPerHour: 100,
      burstLimit: 3,
      windowSize: 60000, // 1 minute
    });
  });

  describe('basic rate limiting', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const stats = await rateLimiter.checkLimit();
        expect(stats.requests).toBe(i + 1);
        expect(stats.remaining).toBe(5 - (i + 1));
      }
    });

    it('should reject requests exceeding minute limit', async () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit();
      }

      // Next request should be rejected
      await expect(rateLimiter.checkLimit()).rejects.toThrow(UAZError);
    });

    it('should reject requests exceeding burst limit', async () => {
      // Fill up the burst limit
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkLimit();
      }

      // Next request should be rejected
      await expect(rateLimiter.checkLimit()).rejects.toThrow(UAZError);
    });
  });

  describe('waitForLimit', () => {
    it('should wait and retry when limit is exceeded', async () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit();
      }

      // Mock setTimeout to speed up test
      jest.useFakeTimers();

      const waitPromise = rateLimiter.waitForLimit();

      // Fast-forward time to clear the window
      jest.advanceTimersByTime(60000);

      const stats = await waitPromise;
      expect(stats.requests).toBe(1); // Should be able to make one request

      jest.useRealTimers();
    });
  });

  describe('execute', () => {
    it('should execute function when within limit', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await rateLimiter.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reject function when limit exceeded', async () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit();
      }

      const mockFn = jest.fn().mockResolvedValue('success');

      await expect(rateLimiter.execute(mockFn)).rejects.toThrow(UAZError);
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('executeWithRetry', () => {
    it('should retry after rate limit is cleared', async () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit();
      }

      const mockFn = jest.fn().mockResolvedValue('success');

      // Mock setTimeout to speed up test
      jest.useFakeTimers();

      const executePromise = rateLimiter.executeWithRetry(mockFn);

      // Fast-forward time to clear the window
      jest.advanceTimersByTime(60000);

      const result = await executePromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('statistics', () => {
    it('should track statistics correctly', async () => {
      // Make some requests
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkLimit();
      }

      const stats = rateLimiter.getStats();

      expect(stats.requestsPerMinute).toBe(3);
      expect(stats.remainingPerMinute).toBe(2);
      expect(stats.burstRequests).toBe(3);
      expect(stats.nextReset).toBeGreaterThan(Date.now());
    });

    it('should reset statistics', () => {
      // Make some requests
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();

      let stats = rateLimiter.getStats();
      expect(stats.requestsPerMinute).toBe(2);

      rateLimiter.reset();

      stats = rateLimiter.getStats();
      expect(stats.requestsPerMinute).toBe(0);
      expect(stats.burstRequests).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      rateLimiter.updateConfig({
        requestsPerMinute: 10,
        burstLimit: 5,
      });

      const config = rateLimiter.getConfig();
      expect(config.requestsPerMinute).toBe(10);
      expect(config.burstLimit).toBe(5);
    });
  });

  describe('window cleanup', () => {
    it('should clean old requests from window', async () => {
      // Make requests
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkLimit();
      }

      // Mock time to simulate old requests
      const originalNow = Date.now;
      const mockNow = jest.fn()
        .mockReturnValueOnce(originalNow()) // Initial time
        .mockReturnValueOnce(originalNow()) // Initial time
        .mockReturnValueOnce(originalNow()) // Initial time
        .mockReturnValueOnce(originalNow() + 70000); // After window

      global.Date.now = mockNow;

      // Should be able to make requests again after window
      const stats = await rateLimiter.checkLimit();
      expect(stats.requests).toBe(1);

      global.Date.now = originalNow;
    });
  });
});

describe('UAZRateLimiter', () => {
  it('should return singleton instance', () => {
    const instance1 = UAZRateLimiter.getInstance();
    const instance2 = UAZRateLimiter.getInstance();

    expect(instance1).toBe(instance2);
  });
});
