import { IndividualMemoryManager } from '../individual-memory-manager';

// Mock do Redis e Database
jest.mock('../../cache/redis-client');
jest.mock('../../db');

describe('IndividualMemoryManager', () => {
  let manager: IndividualMemoryManager;
  const mockConversationId = 'test-conversation-123';
  const mockAgentType = 'test-agent';

  beforeEach(() => {
    manager = new IndividualMemoryManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await manager.disconnect();
  });

  describe('Basic Operations', () => {
    test('should get empty memory when not exists', async () => {
      // Mock Redis retornando null
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockResolvedValue(null);

      // Mock Database retornando array vazio
      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([])
              })
            })
          })
        });

      const result = await manager.get(mockConversationId, mockAgentType);

      expect(result).toEqual({});
    });

    test('should get memory from Redis cache', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockResolvedValue(mockData);

      const result = await manager.get(mockConversationId, mockAgentType);

      expect(result).toEqual(mockData);
    });

    test('should get memory from database when Redis miss', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };
      const mockDbResult = [{
        content: mockData,
        ttl: 86400,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      // Mock Redis retornando null
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockResolvedValue(null);

      // Mock Database retornando dados
      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockDbResult)
              })
            })
          })
        });

      // Mock Redis set para cache
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'set')
        .mockResolvedValue(undefined);

      const result = await manager.get(mockConversationId, mockAgentType);

      expect(result).toEqual(mockData);
    });

    test('should set memory in both Redis and Database', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'set')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'insert')
        .mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest.fn().mockResolvedValue(undefined)
          })
        });

      await expect(
        manager.set(mockConversationId, mockAgentType, mockData)
      ).resolves.not.toThrow();
    });

    test('should delete memory from both Redis and Database', async () => {
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'del')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'delete')
        .mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        });

      await expect(
        manager.delete(mockConversationId, mockAgentType)
      ).resolves.not.toThrow();
    });
  });

  describe('Search Operations', () => {
    test('should search memories by pattern', async () => {
      const mockResults = [
        {
          agentId: 'agent1',
          conversationId: mockConversationId,
          content: { pattern: 'test' },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockResults)
          })
        });

      const results = await manager.search(mockConversationId, 'test');

      expect(results).toHaveLength(1);
      expect(results[0].conversationId).toBe(mockConversationId);
      expect(results[0].agentType).toBe('agent1');
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup expired memories', async () => {
      const mockExpiredMemories = [
        {
          id: '1',
          conversationId: mockConversationId,
          agentId: 'agent1',
        }
      ];

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockExpiredMemories)
          })
        });

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'del')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'delete')
        .mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        });

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'redis')
        .mockReturnValue({
          keys: jest.fn().mockResolvedValue([])
        });

      const cleanedCount = await manager.cleanup();

      expect(cleanedCount).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('should get memory statistics', async () => {
      const mockMemories = [
        { content: { key: 'value1' } },
        { content: { key: 'value2' } },
      ];

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockResolvedValue(mockMemories)
        });

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'getStats')
        .mockResolvedValue({
          connected: true,
          memory: '1MB',
          keys: 10,
          uptime: 3600,
        });

      const stats = await manager.getStats();

      expect(stats.totalMemories).toBe(2);
      expect(stats.redisStats.connected).toBe(true);
      expect(stats.averageSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors', async () => {
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await manager.get(mockConversationId, mockAgentType);

      expect(result).toEqual({});
    });

    test('should handle database errors', async () => {
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockResolvedValue(null);

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockRejectedValue(new Error('Database error'))
              })
            })
          })
        });

      const result = await manager.get(mockConversationId, mockAgentType);

      expect(result).toEqual({});
    });
  });
});
