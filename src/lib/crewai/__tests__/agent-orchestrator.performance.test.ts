/**
 * Testes de performance para Agent Orchestrator
 */

import { AgentOrchestrator } from '../agent-orchestrator'
import { AgentManager } from '../agent-manager'
import { MemorySystem } from '../memory-system'
import { StreamingService } from '../streaming-service'

// Mock das dependências
jest.mock('@/lib/redis')
jest.mock('@/lib/openai')
jest.mock('@/agents/financial/financial-agent')

describe('Agent Orchestrator Performance Tests', () => {
  let orchestrator: AgentOrchestrator
  let agentManager: AgentManager
  let memorySystem: MemorySystem
  let streamingService: StreamingService

  beforeEach(async () => {
    // Mock Redis
    const mockRedis = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0)
    }
    require('@/lib/redis').redis = mockRedis

    // Mock OpenAI
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'financial',
                  domain: 'expense',
                  confidence: 0.9,
                  urgency: 'normal',
                  systemCommand: null
                })
              }
            }]
          })
        }
      }
    }
    require('@/lib/openai').openai = mockOpenAI

    // Mock Financial Agent
    const mockFinancialAgent = {
      processMessage: jest.fn().mockResolvedValue({
        success: true,
        response: 'Financial response',
        confidence: 0.9,
        processingTime: 100
      })
    }
    require('@/agents/financial/financial-agent').FinancialAgent = jest.fn().mockImplementation(() => mockFinancialAgent)

    // Initialize components
    agentManager = new AgentManager()
    memorySystem = new MemorySystem()
    streamingService = new StreamingService()

    // Register financial agent
    await agentManager.registerAgent('financial', {
      name: 'Financial Agent',
      description: 'Handles financial operations',
      capabilities: ['expense', 'revenue', 'budget'],
      priority: 1
    })

    // Initialize orchestrator
    orchestrator = new AgentOrchestrator({
      agentManager,
      memorySystem,
      streamingService,
      config: {
        enableCaching: true,
        cacheTimeout: 300,
        maxRetries: 3,
        retryDelay: 1000,
        enableStreaming: true,
        enableLogging: true
      }
    })
  })

  afterEach(async () => {
    await memorySystem.disconnect()
  })

  describe('Performance Benchmarks', () => {
    it('should process single message within acceptable time', async () => {
      // Arrange
      const message = {
        id: 'msg-1',
        text: 'I need to add an expense of $50 for lunch',
        type: 'text',
        sender: 'user-1',
        chatId: 'chat-1',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      // Act
      const startTime = Date.now()
      const response = await orchestrator.processMessage(message)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Assert
      expect(response.success).toBe(true)
      expect(processingTime).toBeLessThan(2000) // Should complete within 2 seconds
      console.log(`Single message processing time: ${processingTime}ms`)
    })

    it('should process multiple messages concurrently', async () => {
      // Arrange
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        text: `Message ${i}: I need help with finances`,
        type: 'text',
        sender: `user-${i}`,
        chatId: `chat-${i}`,
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }))

      // Act
      const startTime = Date.now()
      const responses = await Promise.all(
        messages.map(message => orchestrator.processMessage(message))
      )
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Assert
      expect(responses).toHaveLength(10)
      expect(responses.every(r => r.success)).toBe(true)
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
      console.log(`10 concurrent messages processing time: ${totalTime}ms`)
    })

    it('should handle high volume message processing', async () => {
      // Arrange
      const messageCount = 100
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg-${i}`,
        text: `High volume message ${i}`,
        type: 'text',
        sender: `user-${i % 10}`, // 10 different users
        chatId: `chat-${i % 5}`, // 5 different chats
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }))

      // Act
      const startTime = Date.now()
      const responses = await Promise.all(
        messages.map(message => orchestrator.processMessage(message))
      )
      const endTime = Date.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / messageCount

      // Assert
      expect(responses).toHaveLength(messageCount)
      expect(responses.every(r => r.success)).toBe(true)
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(averageTime).toBeLessThan(100) // Average should be under 100ms per message
      console.log(`${messageCount} messages processing time: ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms)`)
    })

    it('should maintain performance with caching enabled', async () => {
      // Arrange
      const message = {
        id: 'msg-cache-test',
        text: 'I need to add an expense of $100',
        type: 'text',
        sender: 'user-1',
        chatId: 'chat-1',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      // Act - First call (cache miss)
      const startTime1 = Date.now()
      const response1 = await orchestrator.processMessage(message)
      const endTime1 = Date.now()
      const firstCallTime = endTime1 - startTime1

      // Second call (cache hit)
      const startTime2 = Date.now()
      const response2 = await orchestrator.processMessage(message)
      const endTime2 = Date.now()
      const secondCallTime = endTime2 - startTime2

      // Assert
      expect(response1.success).toBe(true)
      expect(response2.success).toBe(true)
      expect(secondCallTime).toBeLessThan(firstCallTime) // Second call should be faster
      console.log(`First call (cache miss): ${firstCallTime}ms`)
      console.log(`Second call (cache hit): ${secondCallTime}ms`)
      console.log(`Performance improvement: ${((firstCallTime - secondCallTime) / firstCallTime * 100).toFixed(2)}%`)
    })

    it('should handle memory pressure gracefully', async () => {
      // Arrange
      const messageCount = 50
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg-memory-${i}`,
        text: `Memory pressure test message ${i} with some additional content to simulate real usage`,
        type: 'text',
        sender: `user-${i}`,
        chatId: `chat-${i}`,
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {
          additionalData: 'x'.repeat(1000) // Add some data to increase memory usage
        }
      }))

      // Act
      const startTime = Date.now()
      const responses = await Promise.all(
        messages.map(message => orchestrator.processMessage(message))
      )
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Assert
      expect(responses).toHaveLength(messageCount)
      expect(responses.every(r => r.success)).toBe(true)
      expect(totalTime).toBeLessThan(8000) // Should complete within 8 seconds even under memory pressure
      console.log(`Memory pressure test (${messageCount} messages): ${totalTime}ms`)
    })

    it('should maintain consistent performance across different message types', async () => {
      // Arrange
      const messageTypes = [
        { type: 'text', content: 'Simple text message' },
        { type: 'text', content: 'Complex financial request with multiple requirements and detailed specifications' },
        { type: 'text', content: 'Short message' },
        { type: 'text', content: 'Very long message with lots of details and context that should be processed efficiently by the system' }
      ]

      const results: { type: string, time: number }[] = []

      // Act
      for (const msgType of messageTypes) {
        const message = {
          id: `msg-${msgType.type}`,
          text: msgType.content,
          type: 'text',
          sender: 'user-1',
          chatId: 'chat-1',
          timestamp: Date.now(),
          isGroup: false,
          fromMe: false,
          metadata: {}
        }

        const startTime = Date.now()
        const response = await orchestrator.processMessage(message)
        const endTime = Date.now()
        const processingTime = endTime - startTime

        results.push({ type: msgType.type, time: processingTime })
        expect(response.success).toBe(true)
      }

      // Assert
      const times = results.map(r => r.time)
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      const variance = maxTime - minTime

      expect(variance).toBeLessThan(1000) // Performance should be consistent across message types
      console.log('Performance by message type:', results)
      console.log(`Performance variance: ${variance}ms`)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not leak memory during continuous processing', async () => {
      // Arrange
      const messageCount = 20
      const initialMemory = process.memoryUsage()

      // Act
      for (let i = 0; i < messageCount; i++) {
        const message = {
          id: `msg-leak-${i}`,
          text: `Memory leak test message ${i}`,
          type: 'text',
          sender: `user-${i}`,
          chatId: `chat-${i}`,
          timestamp: Date.now(),
          isGroup: false,
          fromMe: false,
          metadata: {}
        }

        await orchestrator.processMessage(message)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Assert
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Should not increase by more than 50MB
      console.log(`Memory increase after ${messageCount} messages: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors without significant performance impact', async () => {
      // Arrange
      const validMessage = {
        id: 'msg-valid',
        text: 'Valid message',
        type: 'text',
        sender: 'user-1',
        chatId: 'chat-1',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const invalidMessage = {
        id: 'msg-invalid',
        text: '',
        type: 'text',
        sender: 'user-1',
        chatId: 'chat-1',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      // Act
      const startTime = Date.now()
      
      // Process valid message
      const validResponse = await orchestrator.processMessage(validMessage)
      
      // Process invalid message (should handle error gracefully)
      const invalidResponse = await orchestrator.processMessage(invalidMessage)
      
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Assert
      expect(validResponse.success).toBe(true)
      expect(invalidResponse.success).toBe(false)
      expect(totalTime).toBeLessThan(3000) // Should handle both cases within reasonable time
      console.log(`Error handling performance: ${totalTime}ms`)
    })
  })
})
