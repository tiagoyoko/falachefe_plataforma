import { SharedMemoryManager } from '../shared-memory-manager';

// Mock do Redis e Database
jest.mock('../../cache/redis-client');
jest.mock('../../db');

describe('SharedMemoryManager', () => {
  let manager: SharedMemoryManager;
  const mockConversationId = 'test-conversation-123';

  beforeEach(() => {
    manager = new SharedMemoryManager();
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

      const result = await manager.get(mockConversationId);

      expect(result).toEqual({});
    });

    test('should get memory from Redis cache', async () => {
      const mockData = { sharedKey: 'sharedValue', version: 1 };

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockResolvedValue(mockData);

      const result = await manager.get(mockConversationId);

      expect(result).toEqual(mockData);
    });

    test('should get memory from database when Redis miss', async () => {
      const mockData = { sharedKey: 'sharedValue', version: 1 };
      const mockDbResult = [{
        content: mockData,
        version: 1,
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

      const result = await manager.get(mockConversationId);

      expect(result).toEqual(mockData);
    });

    test('should set memory in both Redis and Database', async () => {
      const mockData = { sharedKey: 'sharedValue', version: 1 };

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'set')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        });

      jest.spyOn(require('../../db').db, 'insert')
        .mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest.fn().mockResolvedValue(undefined)
          })
        });

      await expect(
        manager.set(mockConversationId, mockData)
      ).resolves.not.toThrow();
    });

    test('should update memory with versioning', async () => {
      const updates = { newKey: 'newValue' };
      const existingData = { existingKey: 'existingValue' };

      jest.spyOn(manager, 'get')
        .mockResolvedValue(existingData);

      jest.spyOn(manager, 'set')
        .mockResolvedValue(undefined);

      await manager.update(mockConversationId, updates);

      expect(manager.set).toHaveBeenCalledWith(mockConversationId, {
        ...existingData,
        ...updates,
        _lastUpdated: expect.any(String),
      });
    });

    test('should delete memory with soft delete', async () => {
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'del')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'update')
        .mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined)
          })
        });

      await expect(
        manager.delete(mockConversationId)
      ).resolves.not.toThrow();
    });
  });

  describe('Versioning', () => {
    test('should get memory version', async () => {
      const mockResult = [{ version: 5 }];

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockResult)
            })
          })
        });

      const version = await manager.getVersion(mockConversationId);

      expect(version).toBe(5);
    });

    test('should increment version on update', async () => {
      const mockData = { key: 'value' };
      const existingMemory = [{ version: 3 }];

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'set')
        .mockResolvedValue(undefined);

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(existingMemory)
            })
          })
        });

      jest.spyOn(require('../../db').db, 'insert')
        .mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest.fn().mockResolvedValue(undefined)
          })
        });

      await manager.set(mockConversationId, mockData);

      // Verificar se a versão foi incrementada
      expect(require('../../db').db.insert).toHaveBeenCalled();
    });
  });

  describe('Sync Operations', () => {
    test('should sync memory from database to Redis', async () => {
      const mockData = { syncedKey: 'syncedValue' };
      const mockDbResult = [{
        content: mockData,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

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

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'set')
        .mockResolvedValue(undefined);

      await manager.sync(mockConversationId);

      expect(require('../../cache/redis-client').RedisClient.prototype.set)
        .toHaveBeenCalledWith(
          expect.stringContaining('shared'),
          mockData,
          expect.any(Object)
        );
    });
  });

  describe('Search Operations', () => {
    test('should search memories by pattern', async () => {
      const mockResults = [
        {
          companyId: mockConversationId,
          content: { pattern: 'test' },
          version: 1,
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

      const results = await manager.search('test');

      expect(results).toHaveLength(1);
      expect(results[0].conversationId).toBe(mockConversationId);
      expect(results[0].version).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('should get memory statistics', async () => {
      const mockMemories = [
        { content: { key: 'value1' }, isActive: true },
        { content: { key: 'value2' }, isActive: false },
        { content: { key: 'value3' }, isActive: true },
      ];

      jest.spyOn(require('../../db').db, 'select')
        .mockReturnValue({
          from: jest.fn().mockResolvedValue(mockMemories)
        });

      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'getStats')
        .mockResolvedValue({
          connected: true,
          memory: '2MB',
          keys: 15,
          uptime: 7200,
        });

      const stats = await manager.getStats();

      expect(stats.totalMemories).toBe(3);
      expect(stats.activeMemories).toBe(2);
      expect(stats.redisStats.connected).toBe(true);
      expect(stats.averageSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors', async () => {
      jest.spyOn(require('../../cache/redis-client').RedisClient.prototype, 'get')
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await manager.get(mockConversationId);

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

      const result = await manager.get(mockConversationId);

      expect(result).toEqual({});
    });
  });
});
