/**
 * Testes unitários para AgentOrchestrator
 */

import { AgentOrchestrator } from '../agent-orchestrator'
import { AgentManager } from '../agent-manager'
import { MemorySystem } from '../memory-system'
import { StreamingService } from '../streaming-service'

// Mock das dependências
jest.mock('../agent-manager')
jest.mock('../memory-system')
jest.mock('../streaming-service')

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator
  let mockAgentManager: jest.Mocked<AgentManager>
  let mockMemorySystem: jest.Mocked<MemorySystem>
  let mockStreamingService: jest.Mocked<StreamingService>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock AgentManager
    mockAgentManager = {
      getAgent: jest.fn(),
      getAllAgents: jest.fn(),
      registerAgent: jest.fn(),
      isAgentAvailable: jest.fn().mockReturnValue(true)
    } as any

    // Mock MemorySystem
    mockMemorySystem = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      getSharedMemory: jest.fn().mockResolvedValue([]),
      setSharedMemory: jest.fn().mockResolvedValue(undefined),
      clearConversationMemory: jest.fn().mockResolvedValue(undefined)
    } as any

    // Mock StreamingService
    mockStreamingService = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      broadcast: jest.fn().mockResolvedValue(undefined)
    } as any

    // Criar orchestrator
    orchestrator = new AgentOrchestrator({
      agentManager: mockAgentManager,
      memorySystem: mockMemorySystem,
      streamingService: mockStreamingService,
      classification: {
        model: 'gpt-4',
        temperature: 0.7,
        cacheEnabled: true,
        cacheTTL: 300
      },
      routing: {
        rules: [],
        fallbackAgent: 'general'
      },
      context: {
        ttl: 3600,
        maxHistory: 10,
        autoCleanup: true
      }
    })
  })

  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello, I need help with my finances',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'financial',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'I can help you with your finances',
          confidence: 0.9
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('financial')
      expect(result.agentType).toBe('financial')
      expect(result.response).toBe('I can help you with your finances')
      expect(result.confidence).toBe(0.9)
      expect(mockAgent.processMessage).toHaveBeenCalledWith(message)
    })

    it('should handle message processing failure', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      mockAgentManager.getAgent.mockReturnValue(undefined)

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('error')
      expect(result.response).toContain('No available agent')
    })

    it('should load and update conversation context', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'general',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Hello!',
          confidence: 0.8
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)
      mockMemorySystem.getSharedMemory.mockResolvedValue([{
        key: 'conversation:chat-123',
        value: {
          conversationId: 'chat-123',
          userId: 'user-123',
          lastMessage: 'Hello',
          lastIntent: 'greeting',
          lastAgent: 'general',
          userProfile: { name: 'John Doe' },
          conversationHistory: ['Hello'],
          agentStates: { general: { state: 'active' } },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ttl: 3600
      }])

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('financial')
      expect(mockMemorySystem.getSharedMemory).toHaveBeenCalledWith('chat-123', 'conversation_context')
      expect(mockMemorySystem.setSharedMemory).toHaveBeenCalled()
    })
  })

  describe('intent classification', () => {
    it('should classify financial intent correctly', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'I want to add an expense of $50 for groceries',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'financial',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Expense added successfully',
          confidence: 0.95
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('financial')
      expect(result.agentType).toBe('financial')
      expect(result.confidence).toBe(0.95)
    })

    it('should classify general intent when no specific domain matches', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello, how are you?',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'general',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Hello! I am doing well, thank you!',
          confidence: 0.7
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('financial')
      expect(result.agentType).toBe('general')
    })
  })

  describe('error handling', () => {
    it('should handle agent processing errors gracefully', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'general',
        processMessage: jest.fn().mockRejectedValue(new Error('Agent processing failed'))
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('error')
      expect(result.response).toContain('Agent processing failed')
    })

    it('should handle memory system errors gracefully', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'general',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Hello!',
          confidence: 0.8
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)
      mockMemorySystem.getSharedMemory.mockRejectedValue(new Error('Memory system error'))

      // Act
      const result = await orchestrator.processMessage(message, {})

      // Assert
      expect(result.agentType).toBe('financial') // Should still succeed despite memory error
      expect(result.agentType).toBe('general')
    })
  })

  describe('performance', () => {
    it('should process messages within acceptable time', async () => {
      // Arrange
      const message = {
        id: 'msg-123',
        text: 'Hello',
        type: 'text',
        sender: 'user-123',
        chatId: 'chat-123',
        timestamp: Date.now(),
        isGroup: false,
        fromMe: false,
        metadata: {}
      }

      const mockAgent = {
        type: 'general',
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Hello!',
          confidence: 0.8
        })
      }

      mockAgentManager.getAgent.mockReturnValue(mockAgent as any)

      // Act
      const startTime = Date.now()
      const result = await orchestrator.processMessage(message, {})
      const endTime = Date.now()

      // Assert
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should process within 1 second
    })
  })
})
