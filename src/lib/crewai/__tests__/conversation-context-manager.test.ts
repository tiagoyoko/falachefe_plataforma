/**
 * Testes unitários para ConversationContextManager
 */

import { ConversationContextManager } from '../conversation-context-manager'
import { MemorySystem } from '../memory-system'
import { ConversationContext } from '../agent-orchestrator'

// Mock MemorySystem
jest.mock('../memory-system')

describe('ConversationContextManager', () => {
  let contextManager: ConversationContextManager
  let mockMemorySystem: jest.Mocked<MemorySystem>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock MemorySystem
    mockMemorySystem = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      getSharedMemory: jest.fn().mockResolvedValue(null),
      setSharedMemory: jest.fn().mockResolvedValue(undefined),
      clearConversationMemory: jest.fn().mockResolvedValue(undefined)
    } as any

    // Create context manager
    contextManager = new ConversationContextManager(mockMemorySystem, {
      maxContextSize: 10000,
      maxHistorySize: 10,
      contextTimeout: 300000,
      enableCompression: false,
      enableVersioning: true,
      enableChecksums: true,
      compressionThreshold: 5000
    })
  })

  describe('loadContext', () => {
    it('should load context from memory system', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const contextData = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      mockMemorySystem.getSharedMemory.mockResolvedValue(JSON.stringify(contextData))

      // Act
      const result = await contextManager.loadContext(conversationId)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.conversationId).toBe('chat-123')
      expect(result!.userId).toBe('user-123')
      expect(mockMemorySystem.getSharedMemory).toHaveBeenCalledWith(conversationId, 'conversation_context')
    })

    it('should return null when no context exists', async () => {
      // Arrange
      const conversationId = 'chat-123'
      mockMemorySystem.getSharedMemory.mockResolvedValue(null)

      // Act
      const result = await contextManager.loadContext(conversationId)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle memory system errors gracefully', async () => {
      // Arrange
      const conversationId = 'chat-123'
      mockMemorySystem.getSharedMemory.mockRejectedValue(new Error('Memory system error'))

      // Act
      const result = await contextManager.loadContext(conversationId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateContext', () => {
    it('should update context with new data', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userPreferences.language',
          value: 'pt-BR',
          timestamp: new Date(),
          source: 'user' as const,
          metadata: { source: 'settings' }
        },
        {
          field: 'sessionData.lastActivity',
          value: Date.now(),
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Act
      const result = await contextManager.updateContext(conversationId, updates)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.userPreferences.language).toBe('pt-BR')
      expect(result!.sessionData.lastActivity).toBeDefined()
      expect(result!.metadata.version).toBe(2) // Should increment version
      expect(mockMemorySystem.setSharedMemory).toHaveBeenCalled()
    })

    it('should create new context when none exists', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Act
      const result = await contextManager.updateContext(conversationId, updates)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.conversationId).toBe(conversationId)
      expect(result!.userId).toBe('user-123')
      expect(result!.metadata.version).toBe(2)
    })

    it('should validate context before saving', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'conversationId',
          value: '', // Invalid empty ID
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Act
      const result = await contextManager.updateContext(conversationId, updates)

      // Assert
      expect(result).toBeNull() // Should return null for invalid context
    })

    it('should handle memory system errors during update', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      mockMemorySystem.setSharedMemory.mockRejectedValue(new Error('Memory system error'))

      // Act
      const result = await contextManager.updateContext(conversationId, updates)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('clearContext', () => {
    it('should clear context from memory and active contexts', async () => {
      // Arrange
      const conversationId = 'chat-123'

      // Act
      const result = await contextManager.clearContext(conversationId)

      // Assert
      expect(result).toBe(true)
      expect(mockMemorySystem.clearConversationMemory).toHaveBeenCalledWith(conversationId)
    })

    it('should handle memory system errors during clear', async () => {
      // Arrange
      const conversationId = 'chat-123'
      mockMemorySystem.clearConversationMemory.mockRejectedValue(new Error('Memory system error'))

      // Act
      const result = await contextManager.clearContext(conversationId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('context history', () => {
    it('should save context snapshots when versioning is enabled', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Act
      await contextManager.updateContext(conversationId, updates)
      const history = await contextManager.getContextHistory(conversationId)

      // Assert
      expect(history).toHaveLength(1)
      expect(history[0].conversationId).toBe(conversationId)
      expect(history[0].version).toBe(2)
    })

    it('should restore context from snapshot', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Create initial context and snapshot
      await contextManager.updateContext(conversationId, updates)
      const history = await contextManager.getContextHistory(conversationId)
      const snapshotVersion = history[0].version

      // Act
      const result = await contextManager.restoreContextSnapshot(conversationId, snapshotVersion)

      // Assert
      expect(result).toBe(true)
      expect(mockMemorySystem.setSharedMemory).toHaveBeenCalled()
    })

    it('should return empty history when versioning is disabled', async () => {
      // Arrange
      const conversationId = 'chat-123'
      contextManager.updateConfig({ enableVersioning: false })

      // Act
      const history = await contextManager.getContextHistory(conversationId)

      // Assert
      expect(history).toHaveLength(0)
    })
  })

  describe('context management methods', () => {
    it('should add message to history', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const message = {
        role: 'user' as const,
        content: 'Hello, how are you?',
        timestamp: new Date()
      }

      // Act
      const result = await contextManager.addMessageToHistory(conversationId, message)

      // Assert
      expect(result).toBe(true)
      const context = await contextManager.loadContext(conversationId)
      expect(context!.conversationHistory).toHaveLength(1)
      expect(context!.conversationHistory[0].content).toBe('Hello, how are you?')
    })

    it('should update current intent', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const intent = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal' as const,
        entities: [],
        reasoning: 'User wants to add expense'
      }

      // Act
      const result = await contextManager.updateCurrentIntent(conversationId, intent)

      // Assert
      expect(result).toBe(true)
      const context = await contextManager.loadContext(conversationId)
      expect(context!.currentIntent).toEqual(intent)
    })

    it('should update user preferences', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const preferences = {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: true
      }

      // Act
      const result = await contextManager.updateUserPreferences(conversationId, preferences)

      // Assert
      expect(result).toBe(true)
      const context = await contextManager.loadContext(conversationId)
      expect(context!.userPreferences).toEqual(preferences)
    })

    it('should update session data', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const sessionData = {
        lastActivity: Date.now(),
        sessionId: 'session-123',
        ipAddress: '192.168.1.1'
      }

      // Act
      const result = await contextManager.updateSessionData(conversationId, sessionData)

      // Assert
      expect(result).toBe(true)
      const context = await contextManager.loadContext(conversationId)
      expect(context!.sessionData).toEqual(sessionData)
    })
  })

  describe('cleanup and maintenance', () => {
    it('should cleanup inactive contexts', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      await contextManager.updateContext(conversationId, updates)

      // Mock old timestamp
      const context = await contextManager.loadContext(conversationId)
      if (context) {
        context.metadata.lastUpdated = new Date(Date.now() - 400000) // 400 seconds ago
      }

      // Act
      const cleanedCount = await contextManager.cleanupInactiveContexts()

      // Assert
      expect(cleanedCount).toBe(1)
    })

    it('should compress context when enabled and threshold exceeded', async () => {
      // Arrange
      const conversationId = 'chat-123'
      contextManager.updateConfig({ enableCompression: true, compressionThreshold: 1000 })

      // Act
      const result = await contextManager.compressContext(conversationId)

      // Assert
      expect(result).toBe(false) // Should return false for non-existent context
    })
  })

  describe('metrics and monitoring', () => {
    it('should track context metrics', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      // Act
      await contextManager.updateContext(conversationId, updates)
      const metrics = contextManager.getMetrics()

      // Assert
      expect(metrics.totalConversations).toBe(1)
      expect(metrics.activeConversations).toBe(1)
      expect(metrics.totalUpdates).toBe(1)
      expect(metrics.averageContextSize).toBeGreaterThan(0)
    })

    it('should provide debug information', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      await contextManager.updateContext(conversationId, updates)

      // Act
      const debugInfo = contextManager.debugContext(conversationId)

      // Assert
      expect(debugInfo.exists).toBe(true)
      expect(debugInfo.size).toBeGreaterThan(0)
      expect(debugInfo.version).toBe(2)
      expect(debugInfo.lastUpdated).toBeDefined()
      expect(debugInfo.historyLength).toBe(1)
    })

    it('should get active conversations', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      await contextManager.updateContext(conversationId, updates)

      // Act
      const activeConversations = contextManager.getActiveConversations()

      // Assert
      expect(activeConversations).toContain(conversationId)
    })

    it('should get context size', async () => {
      // Arrange
      const conversationId = 'chat-123'
      const updates = [
        {
          field: 'userId',
          value: 'user-123',
          timestamp: new Date(),
          source: 'system' as const
        }
      ]

      await contextManager.updateContext(conversationId, updates)

      // Act
      const size = contextManager.getContextSize(conversationId)

      // Assert
      expect(size).toBeGreaterThan(0)
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      // Arrange
      const newConfig = {
        maxContextSize: 20000,
        enableCompression: true
      }

      // Act
      contextManager.updateConfig(newConfig)
      const config = contextManager.getConfig()

      // Assert
      expect(config.maxContextSize).toBe(20000)
      expect(config.enableCompression).toBe(true)
    })
  })
})
