/**
 * Testes unitários para IntentClassifier
 */

import { IntentClassifier } from '../intent-classifier'
import { ConversationContext } from '../agent-orchestrator'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  }
})

describe('IntentClassifier', () => {
  let classifier: IntentClassifier
  let mockOpenAI: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }

    // Create classifier
    classifier = new IntentClassifier({
      openaiApiKey: 'test-key',
      enableCache: true,
      cacheSize: 100,
      cacheTimeout: 300000
    })
  })

  describe('classify', () => {
    it('should classify financial intent correctly', async () => {
      // Arrange
      const message = 'I want to add an expense of $50 for groceries'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'add_expense',
              domain: 'financial',
              confidence: 0.95,
              suggestedAgent: 'financial',
              urgency: 'normal',
              entities: ['$50', 'groceries'],
              reasoning: 'User wants to add a financial expense'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const result = await classifier.classify(message, context)

      // Assert
      expect(result.intent).toBe('add_expense')
      expect(result.domain).toBe('financial')
      expect(result.confidence).toBe(0.95)
      expect(result.suggestedAgent).toBe('financial')
      expect(result.urgency).toBe('normal')
      expect(result.entities).toEqual(['$50', 'groceries'])
    })

    it('should classify general intent for non-specific messages', async () => {
      // Arrange
      const message = 'Hello, how are you?'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              domain: 'general',
              confidence: 0.8,
              suggestedAgent: 'general',
              urgency: 'low',
              entities: [],
              reasoning: 'Simple greeting message'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const result = await classifier.classify(message, context)

      // Assert
      expect(result.intent).toBe('greeting')
      expect(result.domain).toBe('general')
      expect(result.confidence).toBe(0.8)
      expect(result.suggestedAgent).toBe('general')
    })

    it('should detect urgent messages', async () => {
      // Arrange
      const message = 'URGENT: I need help with my account immediately!'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'urgent_help',
              domain: 'general',
              confidence: 0.9,
              suggestedAgent: 'general',
              urgency: 'high',
              entities: ['account'],
              reasoning: 'Message contains urgent keywords'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const result = await classifier.classify(message, context)

      // Assert
      expect(result.urgency).toBe('high')
      expect(result.intent).toBe('urgent_help')
    })

    it('should use cache for repeated messages', async () => {
      // Arrange
      const message = 'I want to add an expense'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'add_expense',
              domain: 'financial',
              confidence: 0.95,
              suggestedAgent: 'financial',
              urgency: 'normal',
              entities: [],
              reasoning: 'User wants to add expense'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const result1 = await classifier.classify(message, context)
      const result2 = await classifier.classify(message, context)

      // Assert
      expect(result1).toEqual(result2)
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1) // Should only call once due to cache
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Arrange
      const message = 'Hello'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'))

      // Act
      const result = await classifier.classify(message, context)

      // Assert
      expect(result.intent).toBe('general')
      expect(result.domain).toBe('general')
      expect(result.confidence).toBe(0.5) // Default confidence for fallback
      expect(result.suggestedAgent).toBe('general')
    })

    it('should handle malformed JSON responses', async () => {
      // Arrange
      const message = 'Hello'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const result = await classifier.classify(message, context)

      // Assert
      expect(result.intent).toBe('general')
      expect(result.domain).toBe('general')
      expect(result.confidence).toBe(0.5) // Default confidence for fallback
    })
  })

  describe('cache management', () => {
    it('should clear cache when requested', async () => {
      // Arrange
      const message = 'Hello'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              domain: 'general',
              confidence: 0.8,
              suggestedAgent: 'general',
              urgency: 'low',
              entities: [],
              reasoning: 'Greeting message'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      await classifier.classify(message, context)
      classifier.clearCache()
      await classifier.classify(message, context)

      // Assert
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2) // Should call twice after cache clear
    })

    it('should respect cache timeout', async () => {
      // Arrange
      const message = 'Hello'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              domain: 'general',
              confidence: 0.8,
              suggestedAgent: 'general',
              urgency: 'low',
              entities: [],
              reasoning: 'Greeting message'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      await classifier.classify(message, context)
      
      // Simulate cache timeout by manually expiring the cache entry
      const cacheKey = classifier['buildCacheKey'](message, context)
      const cacheEntry = classifier['cache'].get(cacheKey)
      if (cacheEntry) {
        cacheEntry.timestamp = Date.now() - 400000 // 400 seconds ago (expired)
      }

      await classifier.classify(message, context)

      // Assert
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2) // Should call twice after cache timeout
    })
  })

  describe('performance', () => {
    it('should classify messages within acceptable time', async () => {
      // Arrange
      const message = 'I want to add an expense'
      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'add_expense',
              domain: 'financial',
              confidence: 0.95,
              suggestedAgent: 'financial',
              urgency: 'normal',
              entities: [],
              reasoning: 'User wants to add expense'
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      // Act
      const startTime = Date.now()
      const result = await classifier.classify(message, context)
      const endTime = Date.now()

      // Assert
      expect(result.intent).toBe('add_expense')
      expect(endTime - startTime).toBeLessThan(2000) // Should classify within 2 seconds
    })
  })
})
