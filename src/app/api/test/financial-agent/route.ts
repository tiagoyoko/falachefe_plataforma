/**
 * API endpoint para testar o Financial Agent
 * GET /api/test/financial-agent?message=sua_mensagem
 */

import { NextRequest, NextResponse } from 'next/server'
import { FinancialAgent } from '@/agents/financial/financial-agent'
import { MemorySystem } from '@/agents/core/memory-system'
import { AgentConfig } from '@/types'

// Mock do MemorySystem para teste
class MockMemorySystem extends MemorySystem {
  constructor() {
    super({
      redis: {
        host: 'localhost',
        port: 6379,
        password: undefined
      },
      postgres: {
        connectionString: 'postgresql://test:test@localhost:5432/test'
      },
      defaultTTL: 3600,
      maxMemorySize: 100
    })
  }

  async getIndividualMemory(userId: string, key: string): Promise<any> {
    return null
  }

  async setIndividualMemory(conversationId: string, agentType: string, data: Record<string, any>, ttl?: number): Promise<string> {
    return 'mock-memory-id'
  }

  async updateIndividualMemory(conversationId: string, agentType: string, memoryId: string, data: Record<string, any>): Promise<boolean> {
    return true
  }

  async getSharedMemory(key: string): Promise<any> {
    return null
  }

  async setSharedMemory(conversationId: string, data: Record<string, any>): Promise<string> {
    return 'mock-shared-memory-id'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const message = searchParams.get('message') || 'Como está meu fluxo de caixa?'
    const userId = searchParams.get('userId') || 'test-user-123'
    const conversationId = searchParams.get('conversationId') || 'test-conversation-456'

    console.log(`🧪 Testando Financial Agent com mensagem: "${message}"`)

    // Configuração do agente
    const config: AgentConfig = {
      id: 'financial-agent-api-test',
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 1000,
      retryAttempts: 3,
      escalationThreshold: 0.8,
      memoryRetentionDays: 30,
      learningEnabled: true
    }

    // Inicializar sistema de memória mock
    const memorySystem = new MockMemorySystem()
    const financialAgent = new FinancialAgent(config, memorySystem)

    // Inicializar o agente
    await financialAgent.initialize(config)

    // Processar mensagem
    const startTime = Date.now()
    const response = await financialAgent.processMessage(message, {
      userId,
      conversationId
    })
    const processingTime = Date.now() - startTime

    // Verificar saúde do agente
    const isHealthy = await financialAgent.isHealthy()
    const capabilities = financialAgent.getCapabilities()
    const currentLoad = financialAgent.getCurrentLoad()
    const memoryUsage = financialAgent.getMemoryUsage()

    return NextResponse.json({
      success: true,
      data: {
        message,
        response: response.response,
        intent: response.intent,
        confidence: response.confidence,
        processingTime: `${processingTime}ms`,
        agentHealth: {
          isHealthy,
          capabilities,
          currentLoad,
          memoryUsage: `${memoryUsage.toFixed(2)} MB`
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao testar Financial Agent:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId = 'test-user-123', conversationId = 'test-conversation-456' } = body

    if (!message) {
      return NextResponse.json({
        success: false,
        error: { message: 'Mensagem é obrigatória' }
      }, { status: 400 })
    }

    console.log(`🧪 Testando Financial Agent via POST com mensagem: "${message}"`)

    // Configuração do agente
    const config: AgentConfig = {
      id: 'financial-agent-api-test',
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 1000,
      retryAttempts: 3,
      escalationThreshold: 0.8,
      memoryRetentionDays: 30,
      learningEnabled: true
    }

    // Inicializar sistema de memória mock
    const memorySystem = new MockMemorySystem()
    const financialAgent = new FinancialAgent(config, memorySystem)

    // Inicializar o agente
    await financialAgent.initialize(config)

    // Processar mensagem
    const startTime = Date.now()
    const response = await financialAgent.processMessage(message, {
      userId,
      conversationId
    })
    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        message,
        response: response.response,
        intent: response.intent,
        confidence: response.confidence,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao testar Financial Agent:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
