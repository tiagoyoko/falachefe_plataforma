/**
 * Setup global para testes dos agentes
 */

// Mock global do Node.js para testes
global.console = {
  ...console,
  // Silenciar logs durante os testes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Mock do process.env para testes
process.env.NODE_ENV = 'test'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.OPENAI_API_KEY = 'test-key'
process.env.UAZ_API_BASE_URL = 'https://test.uazapi.com'
process.env.UAZ_API_TOKEN = 'test-token'

// EventEmitter não precisa de mock

// Mock do Redis
jest.mock('@/lib/cache/redis-client', () => ({
  RedisClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    flushdb: jest.fn().mockResolvedValue('OK')
  }))
}))

// Mock do OpenAI (@ai-sdk/openai)
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn().mockReturnValue({})
}))

// Mock do UAZ Client
jest.mock('@/lib/uaz-api/client', () => ({
  UAZClient: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      status: 'sent'
    }),
    getChat: jest.fn().mockResolvedValue({
      id: 'test-chat-id',
      name: 'Test Chat'
    })
  }))
}))

// Mock do Message Service
jest.mock('@/services/message-service', () => ({
  MessageService: jest.fn().mockImplementation(() => ({
    processIncomingMessage: jest.fn().mockResolvedValue({
      message: { id: 'test-message-id' },
      conversation: { id: 'test-conversation-id' },
      user: { id: 'test-user-id', name: 'Test User' }
    })
  }))
}))

// Mock dos agentes especializados
jest.mock('@/agents/financial/financial-agent', () => ({
  FinancialAgent: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn().mockResolvedValue({
      success: true,
      response: 'Financial response',
      confidence: 0.9,
      processingTime: 100
    }),
    classifyIntent: jest.fn().mockResolvedValue({
      intent: 'financial',
      domain: 'expense',
      confidence: 0.9
    })
  }))
}))

// Mock do Agent Squad Setup
jest.mock('@/agents/core/agent-squad-setup', () => ({
  FalachefeAgentSquad: jest.fn().mockImplementation(() => ({
    agentManager: {
      registerAgent: jest.fn().mockResolvedValue(undefined),
      getAgent: jest.fn().mockReturnValue({
        processMessage: jest.fn().mockResolvedValue({
          success: true,
          response: 'Test response',
          confidence: 0.9,
          processingTime: 100
        })
      }),
      listAgents: jest.fn().mockReturnValue(['financial'])
    },
    memorySystem: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      setIndividualMemory: jest.fn().mockResolvedValue(undefined),
      getIndividualMemory: jest.fn().mockResolvedValue(null),
      setSharedMemory: jest.fn().mockResolvedValue(undefined),
      getSharedMemory: jest.fn().mockResolvedValue(null)
    },
    streamingService: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      broadcast: jest.fn().mockResolvedValue(undefined)
    }
  }))
}))

// Configuração de timeout para testes
jest.setTimeout(30000)

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks()
})

// Cleanup global
afterAll(() => {
  jest.restoreAllMocks()
})
