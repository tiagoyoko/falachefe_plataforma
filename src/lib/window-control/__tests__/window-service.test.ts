/**
 * Testes unitários para WindowControlService
 */

import { WindowControlService } from '../window-service';
import { RedisClient } from '../../cache/redis-client';
import { WindowState } from '../types';

// Mock do RedisClient
jest.mock('../../cache/redis-client');

describe('WindowControlService', () => {
  let windowService: WindowControlService;
  let mockRedis: jest.Mocked<RedisClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Redis client
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      isReady: jest.fn(() => true),
    } as jest.Mocked<RedisClient>;

    windowService = new WindowControlService(mockRedis);
  });

  afterEach(async () => {
    await windowService.destroy();
  });

  describe('startWindow', () => {
    it('should start a new window for user', async () => {
      const userId = 'user123';
      
      const result = await windowService.startWindow(userId);

      expect(result).toMatchObject({
        userId,
        isActive: true,
        messageCount: 0
      });
      expect(result.windowStart).toBeInstanceOf(Date);
      expect(result.windowEnd).toBeInstanceOf(Date);
      expect(result.windowEnd.getTime()).toBeGreaterThan(result.windowStart.getTime());

      expect(mockRedis.set).toHaveBeenCalledWith(
        `window:${userId}`,
        expect.objectContaining({
          userId,
          isActive: true,
          messageCount: 0
        }),
        expect.objectContaining({
          ttl: expect.any(Number)
        })
      );
    });
  });

  describe('renewWindow', () => {
    it('should create new window if none exists', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.renewWindow(userId);

      expect(result).toMatchObject({
        userId,
        isActive: true,
        messageCount: 0
      });
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should renew existing active window', async () => {
      const userId = 'user123';
      const existingWindow: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 5
      };

      mockRedis.get.mockResolvedValue(existingWindow);

      const result = await windowService.renewWindow(userId);

      expect(result).toMatchObject({
        userId,
        isActive: true,
        messageCount: 6 // Incrementado
      });
      expect(result?.windowEnd.getTime()).toBeGreaterThan(existingWindow.windowEnd.getTime());
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should create new window if existing is inactive', async () => {
      const userId = 'user123';
      const inactiveWindow: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() - 500), // Expired
        isActive: false,
        lastActivity: new Date(Date.now() - 1000),
        messageCount: 5
      };

      mockRedis.get.mockResolvedValue(inactiveWindow);

      const result = await windowService.renewWindow(userId);

      expect(result).toMatchObject({
        userId,
        isActive: true,
        messageCount: 0 // Reset
      });
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('getWindowState', () => {
    it('should return null if no window exists', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.getWindowState(userId);

      expect(result).toBeUndefined();
    });

    it('should return window state if exists and active', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(windowState);

      const result = await windowService.getWindowState(userId);

      expect(result).toEqual(windowState);
    });

    it('should return null if window is expired', async () => {
      const userId = 'user123';
      const expiredWindow: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() - 500), // Expired
        isActive: true,
        lastActivity: new Date(Date.now() - 1000),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(expiredWindow);

      const result = await windowService.getWindowState(userId);

      expect(result).toBeUndefined();
      expect(mockRedis.del).toHaveBeenCalledWith(`window:${userId}`);
    });
  });

  describe('isWindowActive', () => {
    it('should return true if window is active', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(windowState);

      const result = await windowService.isWindowActive(userId);

      expect(result).toBe(true);
    });

    it('should return false if no window exists', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.isWindowActive(userId);

      expect(result).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should allow any message when window is active', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(windowState);

      const result = await windowService.validateMessage(userId, 'text');

      expect(result.isAllowed).toBe(true);
      expect(result.requiresTemplate).toBe(false);
      expect(result.windowState).toEqual(windowState);
    });

    it('should allow approved template when window is inactive', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.validateMessage(userId, 'template', 'welcome');

      expect(result.isAllowed).toBe(true);
      expect(result.requiresTemplate).toBe(true);
    });

    it('should reject non-template message when window is inactive', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.validateMessage(userId, 'text');

      expect(result.isAllowed).toBe(false);
      expect(result.requiresTemplate).toBe(true);
      expect(result.reason).toContain('Window is not active');
    });

    it('should reject unapproved template when window is inactive', async () => {
      const userId = 'user123';
      mockRedis.get.mockResolvedValue(null);

      const result = await windowService.validateMessage(userId, 'template', 'unapproved-template');

      expect(result.isAllowed).toBe(false);
      expect(result.requiresTemplate).toBe(true);
    });
  });

  describe('processUserMessage', () => {
    it('should renew window when auto-renew is enabled', async () => {
      const userId = 'user123';
      const existingWindow: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(existingWindow);

      const result = await windowService.processUserMessage(userId);

      expect(result).toMatchObject({
        userId,
        isActive: true,
        messageCount: 4 // Incrementado
      });
    });
  });

  describe('processSystemMessage', () => {
    it('should validate system message correctly', async () => {
      const userId = 'user123';
      const windowState: WindowState = {
        userId,
        windowStart: new Date(Date.now() - 1000),
        windowEnd: new Date(Date.now() + 1000),
        isActive: true,
        lastActivity: new Date(Date.now() - 500),
        messageCount: 3
      };

      mockRedis.get.mockResolvedValue(windowState);

      const result = await windowService.processSystemMessage(userId, 'text');

      expect(result.isAllowed).toBe(true);
      expect(result.windowState).toEqual(windowState);
    });
  });

  describe('template management', () => {
    it('should return approved templates', () => {
      const templates = windowService.getApprovedTemplates();

      expect(templates).toHaveLength(3); // Basic templates
      expect(templates.some(t => t.id === 'welcome')).toBe(true);
      expect(templates.some(t => t.id === 'confirmation')).toBe(true);
      expect(templates.some(t => t.id === 'out_of_hours')).toBe(true);
    });

    it('should add new approved template', () => {
      const newTemplate = {
        id: 'custom',
        name: 'Custom Template',
        category: 'marketing',
        approved: true,
        content: 'Custom message'
      };

      windowService.addApprovedTemplate(newTemplate);

      const templates = windowService.getApprovedTemplates();
      expect(templates.some(t => t.id === 'custom')).toBe(true);
    });

    it('should remove approved template', () => {
      const removed = windowService.removeApprovedTemplate('welcome');

      expect(removed).toBe(true);

      const templates = windowService.getApprovedTemplates();
      expect(templates.some(t => t.id === 'welcome')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should close window correctly', async () => {
      const userId = 'user123';

      await windowService.closeWindow(userId);

      expect(mockRedis.del).toHaveBeenCalledWith(`window:${userId}`);
    });

    it('should destroy service and clear interval', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await windowService.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
