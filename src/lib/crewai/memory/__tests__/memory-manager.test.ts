import { MemoryManager, getMemoryManager, initializeMemoryManager } from '../memory-manager';
import { IndividualMemoryManager } from '../individual-memory-manager';
import { SharedMemoryManager } from '../shared-memory-manager';

// Mock do Redis e Database
jest.mock('../cache/redis-client');
jest.mock('../../db');

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  const mockConversationId = 'test-conversation-123';
  const mockAgentType = 'test-agent';

  beforeEach(() => {
    memoryManager = new MemoryManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await memoryManager.disconnect();
  });

  describe('Individual Memory Operations', () => {
    test('should get individual memory', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };
      
      // Mock do IndividualMemoryManager
      jest.spyOn(IndividualMemoryManager.prototype, 'get')
        .mockResolvedValue(mockData);

      const result = await memoryManager.getIndividualMemory(mockConversationId, mockAgentType);

      expect(result).toEqual(mockData);
    });

    test('should set individual memory', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };
      
      jest.spyOn(IndividualMemoryManager.prototype, 'set')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.setIndividualMemory(mockConversationId, mockAgentType, mockData)
      ).resolves.not.toThrow();
    });

    test('should delete individual memory', async () => {
      jest.spyOn(IndividualMemoryManager.prototype, 'delete')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.deleteIndividualMemory(mockConversationId, mockAgentType)
      ).resolves.not.toThrow();
    });

    test('should handle individual memory errors gracefully', async () => {
      jest.spyOn(IndividualMemoryManager.prototype, 'get')
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await memoryManager.getIndividualMemory(mockConversationId, mockAgentType);

      expect(result).toEqual({});
    });
  });

  describe('Shared Memory Operations', () => {
    test('should get shared memory', async () => {
      const mockData = { sharedKey: 'sharedValue', version: 1 };
      
      jest.spyOn(SharedMemoryManager.prototype, 'get')
        .mockResolvedValue(mockData);

      const result = await memoryManager.getSharedMemory(mockConversationId);

      expect(result).toEqual(mockData);
    });

    test('should set shared memory', async () => {
      const mockData = { sharedKey: 'sharedValue', version: 1 };
      
      jest.spyOn(SharedMemoryManager.prototype, 'set')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.setSharedMemory(mockConversationId, mockData)
      ).resolves.not.toThrow();
    });

    test('should update shared memory', async () => {
      const updates = { newKey: 'newValue' };
      
      jest.spyOn(SharedMemoryManager.prototype, 'update')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.updateSharedMemory(mockConversationId, updates)
      ).resolves.not.toThrow();
    });

    test('should handle shared memory errors gracefully', async () => {
      jest.spyOn(SharedMemoryManager.prototype, 'get')
        .mockRejectedValue(new Error('Database connection failed'));

      const result = await memoryManager.getSharedMemory(mockConversationId);

      expect(result).toEqual({});
    });
  });

  describe('Combined Operations', () => {
    test('should sync memories', async () => {
      jest.spyOn(SharedMemoryManager.prototype, 'sync')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.syncMemories(mockConversationId)
      ).resolves.not.toThrow();
    });

    test('should clear all memories', async () => {
      jest.spyOn(SharedMemoryManager.prototype, 'delete')
        .mockResolvedValue(undefined);

      await expect(
        memoryManager.clearAllMemories(mockConversationId)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics', async () => {
      const mockData = { key: 'value' };
      
      jest.spyOn(IndividualMemoryManager.prototype, 'get')
        .mockResolvedValue(mockData);

      await memoryManager.getIndividualMemory(mockConversationId, mockAgentType);
      await memoryManager.getIndividualMemory(mockConversationId, mockAgentType);

      const stats = await memoryManager.getStats();

      expect(stats.performance.totalRequests).toBeGreaterThan(0);
      expect(stats.performance.averageGetTime).toBeGreaterThanOrEqual(0);
    });

    test('should reset performance metrics', () => {
      memoryManager.resetPerformanceMetrics();
      
      // Verificar se as métricas foram resetadas
      const metrics = (memoryManager as any).performanceMetrics;
      expect(metrics.getTimes).toHaveLength(0);
      expect(metrics.setTimes).toHaveLength(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should get comprehensive stats', async () => {
      const mockIndividualStats = {
        totalMemories: 10,
        redisStats: { connected: true },
        averageSize: 100,
      };

      const mockSharedStats = {
        totalMemories: 5,
        activeMemories: 4,
        redisStats: { connected: true },
        averageSize: 200,
      };

      jest.spyOn(IndividualMemoryManager.prototype, 'getStats')
        .mockResolvedValue(mockIndividualStats);

      jest.spyOn(SharedMemoryManager.prototype, 'getStats')
        .mockResolvedValue(mockSharedStats);

      const stats = await memoryManager.getStats();

      expect(stats.individual).toEqual(mockIndividualStats);
      expect(stats.shared).toEqual(mockSharedStats);
      expect(stats.performance).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    test('should perform cleanup', async () => {
      jest.spyOn(IndividualMemoryManager.prototype, 'cleanup')
        .mockResolvedValue(5);

      const result = await memoryManager.cleanup();

      expect(result.individualCleaned).toBe(5);
      expect(result.totalCleaned).toBe(5);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = getMemoryManager();
      const instance2 = getMemoryManager();

      expect(instance1).toBe(instance2);
    });

    test('should initialize singleton', async () => {
      const manager = await initializeMemoryManager();
      
      expect(manager).toBeInstanceOf(MemoryManager);
    });
  });
});
