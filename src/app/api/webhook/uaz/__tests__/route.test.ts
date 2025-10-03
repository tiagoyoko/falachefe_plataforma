/**
 * Testes de integração para webhook UazAPI
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// Mock das dependências
jest.mock('@/lib/uaz-api/client')
jest.mock('@/services/message-service')
jest.mock('@/agents/core/agent-squad-setup')
jest.mock('@/agents/core/agent-orchestrator')

describe('UazAPI Webhook', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  describe('GET /api/webhook/uaz', () => {
    it('should return health check status', async () => {
      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
      expect(data.service).toBe('UAZ Webhook Handler')
      expect(data.timestamp).toBeDefined()
    })
  })

  describe('POST /api/webhook/uaz', () => {
    it('should process message event successfully', async () => {
      // Arrange
      const payload = {
        EventType: 'messages',
        message: {
          id: 'msg-123',
          messageid: 'msg-123-alt',
          sender: '5511999999999',
          chatid: 'chat-123',
          type: 'text',
          messageType: 'text',
          content: 'Hello, I need help with my finances',
          text: 'Hello, I need help with my finances',
          isGroup: false,
          fromMe: false,
          messageTimestamp: Date.now(),
          senderName: 'John Doe'
        },
        chat: {
          id: 'chat-123',
          name: 'John Doe',
          wa_chatid: '5511999999999',
          wa_name: 'John Doe',
          wa_isGroup: false,
          wa_unreadCount: 0
        },
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Mock MessageService
      const mockMessageService = {
        processIncomingMessage: jest.fn().mockResolvedValue({
          message: { id: 'msg-123' },
          conversation: { id: 'conv-123' },
          user: { id: 'user-123', name: 'John Doe' }
        })
      }
      require('@/services/message-service').MessageService = mockMessageService

      // Mock Agent Orchestrator
      const mockOrchestrator = {
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          agentType: 'financial',
          response: 'I can help you with your finances',
          confidence: 0.9,
          processingTime: 500
        })
      }
      require('@/agents/core/agent-orchestrator').AgentOrchestrator = jest.fn().mockImplementation(() => mockOrchestrator)

      // Mock UAZClient
      const mockUazClient = {
        sendMessage: jest.fn().mockResolvedValue({
          messageId: 'response-123',
          status: 'sent'
        })
      }
      require('@/lib/uaz-api/client').UAZClient = jest.fn().mockImplementation(() => mockUazClient)

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Webhook processed successfully')
      expect(mockMessageService.processIncomingMessage).toHaveBeenCalled()
    })

    it('should handle invalid JSON payload', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON payload')
    })

    it('should handle invalid payload structure', async () => {
      // Arrange
      const payload = {
        // Missing required fields
        EventType: 'messages'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid webhook payload structure')
    })

    it('should handle message update event', async () => {
      // Arrange
      const payload = {
        EventType: 'messages_update',
        message: {
          id: 'msg-123',
          messageid: 'msg-123-alt',
          sender: '5511999999999',
          chatid: 'chat-123',
          type: 'text',
          messageType: 'text',
          content: 'Hello',
          text: 'Hello',
          isGroup: false,
          fromMe: false,
          messageTimestamp: Date.now(),
          senderName: 'John Doe',
          status: 'delivered'
        },
        chat: {
          id: 'chat-123',
          name: 'John Doe',
          wa_chatid: '5511999999999',
          wa_name: 'John Doe',
          wa_isGroup: false,
          wa_unreadCount: 0
        },
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle connection event', async () => {
      // Arrange
      const payload = {
        EventType: 'connection',
        owner: 'owner-123',
        token: 'token-123',
        BaseUrl: 'https://falachefe.uazapi.com'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle presence event', async () => {
      // Arrange
      const payload = {
        EventType: 'presence',
        event: {
          Chat: 'chat-123',
          Sender: '5511999999999',
          IsFromMe: false,
          IsGroup: false,
          State: 'composing',
          Media: 'text',
          AddressingMode: 'single',
          SenderAlt: '5511999999999',
          RecipientAlt: '5511888888888',
          BroadcastListOwner: null,
          BroadcastRecipients: []
        },
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle contacts event', async () => {
      // Arrange
      const payload = {
        EventType: 'contacts',
        owner: 'owner-123',
        token: 'token-123',
        BaseUrl: 'https://falachefe.uazapi.com'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle groups event', async () => {
      // Arrange
      const payload = {
        EventType: 'groups',
        owner: 'owner-123',
        token: 'token-123',
        BaseUrl: 'https://falachefe.uazapi.com',
        chat: {
          id: 'group-123',
          name: 'Test Group',
          wa_chatid: 'group-123',
          wa_name: 'Test Group',
          wa_isGroup: true,
          wa_unreadCount: 0
        }
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle unknown event types', async () => {
      // Arrange
      const payload = {
        EventType: 'unknown_event',
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle agent orchestrator errors gracefully', async () => {
      // Arrange
      const payload = {
        EventType: 'messages',
        message: {
          id: 'msg-123',
          messageid: 'msg-123-alt',
          sender: '5511999999999',
          chatid: 'chat-123',
          type: 'text',
          messageType: 'text',
          content: 'Hello',
          text: 'Hello',
          isGroup: false,
          fromMe: false,
          messageTimestamp: Date.now(),
          senderName: 'John Doe'
        },
        chat: {
          id: 'chat-123',
          name: 'John Doe',
          wa_chatid: '5511999999999',
          wa_name: 'John Doe',
          wa_isGroup: false,
          wa_unreadCount: 0
        },
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Mock MessageService
      const mockMessageService = {
        processIncomingMessage: jest.fn().mockResolvedValue({
          message: { id: 'msg-123' },
          conversation: { id: 'conv-123' },
          user: { id: 'user-123', name: 'John Doe' }
        })
      }
      require('@/services/message-service').MessageService = mockMessageService

      // Mock Agent Orchestrator with error
      const mockOrchestrator = {
        processMessage: jest.fn().mockRejectedValue(new Error('Orchestrator error'))
      }
      require('@/agents/core/agent-orchestrator').AgentOrchestrator = jest.fn().mockImplementation(() => mockOrchestrator)

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockMessageService.processIncomingMessage).toHaveBeenCalled()
    })

    it('should handle message service errors gracefully', async () => {
      // Arrange
      const payload = {
        EventType: 'messages',
        message: {
          id: 'msg-123',
          messageid: 'msg-123-alt',
          sender: '5511999999999',
          chatid: 'chat-123',
          type: 'text',
          messageType: 'text',
          content: 'Hello',
          text: 'Hello',
          isGroup: false,
          fromMe: false,
          messageTimestamp: Date.now(),
          senderName: 'John Doe'
        },
        chat: {
          id: 'chat-123',
          name: 'John Doe',
          wa_chatid: '5511999999999',
          wa_name: 'John Doe',
          wa_isGroup: false,
          wa_unreadCount: 0
        },
        owner: 'owner-123',
        token: 'token-123'
      }

      const request = new NextRequest('http://localhost:3000/api/webhook/uaz', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Mock MessageService with error
      const mockMessageService = {
        processIncomingMessage: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      require('@/services/message-service').MessageService = mockMessageService

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
