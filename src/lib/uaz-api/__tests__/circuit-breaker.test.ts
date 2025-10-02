import { CircuitBreaker, UAZCircuitBreaker } from '../circuit-breaker';
import { UAZError } from '../errors';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringPeriod: 5000,
      successThreshold: 2,
    });
  });

  afterEach(() => {
    circuitBreaker.destroy();
  });

  describe('closed state', () => {
    it('should execute function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after failure threshold', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      // Execute until circuit opens
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
      }

      // Next execution should fail with circuit open error
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');

      expect(circuitBreaker.getState()).toBe('open');
    });

    it('should reset failure count on success', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Test error'));

      // First failure
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
      
      // Success should reset failure count
      await circuitBreaker.execute(mockFn);
      
      // Second failure should not open circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
      
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('open state', () => {
    beforeEach(async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
      }
    });

    it('should reject all requests when open', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should transition to half-open after recovery timeout', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('half-open');
    });
  });

  describe('half-open state', () => {
    beforeEach(async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
      }

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('should close circuit after success threshold', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      // Execute success threshold times
      for (let i = 0; i < 2; i++) {
        await circuitBreaker.execute(mockFn);
      }

      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should open circuit on failure', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');

      expect(circuitBreaker.getState()).toBe('open');
    });
  });

  describe('statistics', () => {
    it('should track statistics correctly', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const failureFn = jest.fn().mockRejectedValue(new Error('Test error'));

      // Execute some successes and failures
      await circuitBreaker.execute(successFn);
      await circuitBreaker.execute(successFn);
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow('Test error');

      const stats = circuitBreaker.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.totalSuccesses).toBe(2);
      expect(stats.totalFailures).toBe(1);
      expect(stats.state).toBe('closed');
    });

    it('should calculate success rate correctly', () => {
      // Mock some statistics
      (circuitBreaker as any).totalRequests = 10;
      (circuitBreaker as any).totalSuccesses = 7;

      const successRate = circuitBreaker.getSuccessRate();

      expect(successRate).toBe(0.7);
    });

    it('should calculate failure rate correctly', () => {
      // Mock some statistics
      (circuitBreaker as any).totalRequests = 10;
      (circuitBreaker as any).totalFailures = 3;

      const failureRate = circuitBreaker.getFailureRate();

      expect(failureRate).toBe(0.3);
    });
  });

  describe('manual control', () => {
    it('should manually open circuit', () => {
      circuitBreaker.open();

      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should manually close circuit', () => {
      circuitBreaker.open();
      circuitBreaker.close();

      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should reset statistics', () => {
      // Mock some statistics
      (circuitBreaker as any).totalRequests = 10;
      (circuitBreaker as any).totalSuccesses = 7;
      (circuitBreaker as any).totalFailures = 3;

      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.state).toBe('closed');
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      circuitBreaker.updateConfig({
        failureThreshold: 5,
        recoveryTimeout: 2000,
      });

      const config = circuitBreaker.getConfig();
      expect(config.failureThreshold).toBe(5);
      expect(config.recoveryTimeout).toBe(2000);
    });
  });
});

describe('UAZCircuitBreaker', () => {
  afterEach(() => {
    UAZCircuitBreaker.destroy();
  });

  it('should return singleton instance', () => {
    const instance1 = UAZCircuitBreaker.getInstance();
    const instance2 = UAZCircuitBreaker.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should destroy instance', () => {
    const instance1 = UAZCircuitBreaker.getInstance();
    UAZCircuitBreaker.destroy();
    const instance2 = UAZCircuitBreaker.getInstance();

    expect(instance1).not.toBe(instance2);
  });
});
