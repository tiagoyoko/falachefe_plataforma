import { RetryLogic, UAZRetryLogic } from '../retry-logic';
import { UAZError } from '../errors';

describe('RetryLogic', () => {
  let retryLogic: RetryLogic;

  beforeEach(() => {
    retryLogic = new RetryLogic({
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false,
    });
  });

  describe('successful execution', () => {
    it('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryLogic.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute function successfully after retries', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retryLogic.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retry behavior', () => {
    it('should retry on retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new UAZError('Retryable error', 500, undefined, true));

      await expect(retryLogic.execute(mockFn)).rejects.toThrow(UAZError);
      expect(mockFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new UAZError('Non-retryable error', 400, undefined, false));

      await expect(retryLogic.execute(mockFn)).rejects.toThrow(UAZError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on timeout errors', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'UAZTimeoutError';
      const mockFn = jest.fn().mockRejectedValue(timeoutError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('timeout');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should retry on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'UAZRateLimitError';
      const mockFn = jest.fn().mockRejectedValue(rateLimitError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('Rate limit exceeded');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('ECONNRESET');
      const mockFn = jest.fn().mockRejectedValue(networkError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('ECONNRESET');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should retry on 5xx status codes', async () => {
      const serverError = new Error('Internal Server Error status 500');
      const mockFn = jest.fn().mockRejectedValue(serverError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('Internal Server Error');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should retry on 429 status code', async () => {
      const rateLimitError = new Error('Too Many Requests status 429');
      const mockFn = jest.fn().mockRejectedValue(rateLimitError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('Too Many Requests');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should retry on 408 status code', async () => {
      const timeoutError = new Error('Request Timeout status 408');
      const mockFn = jest.fn().mockRejectedValue(timeoutError);

      await expect(retryLogic.execute(mockFn)).rejects.toThrow('Request Timeout');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('delay calculation', () => {
    it('should calculate exponential backoff delay', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      const startTime = Date.now();
      await expect(retryLogic.execute(mockFn)).rejects.toThrow('Network error');
      const endTime = Date.now();

      // Should have delays of approximately 100ms, 200ms, 400ms
      const totalDelay = endTime - startTime;
      expect(totalDelay).toBeGreaterThan(600); // At least 100 + 200 + 400
      expect(totalDelay).toBeLessThan(1000); // But not too much more
    });

    it('should respect max delay', async () => {
      const retryLogicWithMaxDelay = new RetryLogic({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 500,
        backoffMultiplier: 2,
        jitter: false,
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      const startTime = Date.now();
      await expect(retryLogicWithMaxDelay.execute(mockFn)).rejects.toThrow('Network error');
      const endTime = Date.now();

      // Should cap at maxDelay of 500ms
      const totalDelay = endTime - startTime;
      expect(totalDelay).toBeLessThan(2000); // 500 + 500 + 500 = 1500ms max
    });
  });

  describe('executeWithProgress', () => {
    it('should call progress callback on each attempt', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));
      const progressCallback = jest.fn();

      await expect(retryLogic.executeWithProgress(mockFn, progressCallback)).rejects.toThrow('Network error');

      expect(progressCallback).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          attempts: 1,
          success: false,
        })
      );
    });

    it('should call progress callback on success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const progressCallback = jest.fn();

      const result = await retryLogic.executeWithProgress(mockFn, progressCallback);

      expect(result).toBe('success');
      expect(progressCallback).toHaveBeenCalledTimes(1);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          attempts: 1,
          success: true,
        })
      );
    });
  });

  describe('executeParallel', () => {
    it('should execute multiple functions in parallel', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('result1');
      const mockFn2 = jest.fn().mockResolvedValue('result2');
      const mockFn3 = jest.fn().mockResolvedValue('result3');

      const results = await retryLogic.executeParallel([mockFn1, mockFn2, mockFn3]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('should retry failed functions in parallel', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('result1');
      const mockFn2 = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('result2');
      const mockFn3 = jest.fn().mockResolvedValue('result3');

      const results = await retryLogic.executeParallel([mockFn1, mockFn2, mockFn3]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeWithTimeout', () => {
    it('should execute function within timeout', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryLogic.executeWithTimeout(mockFn, 1000);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should timeout if function takes too long', async () => {
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 2000))
      );

      await expect(retryLogic.executeWithTimeout(mockFn, 1000)).rejects.toThrow('Operation timeout');
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      retryLogic.updateConfig({
        maxRetries: 5,
        baseDelay: 200,
      });

      const config = retryLogic.getConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(200);
    });

    it('should use custom configuration for specific execution', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(retryLogic.execute(mockFn, { maxRetries: 1 })).rejects.toThrow('Network error');
      expect(mockFn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });
  });
});

describe('UAZRetryLogic', () => {
  it('should return singleton instance', () => {
    const instance1 = UAZRetryLogic.getInstance();
    const instance2 = UAZRetryLogic.getInstance();

    expect(instance1).toBe(instance2);
  });
});
