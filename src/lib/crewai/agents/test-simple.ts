/**
 * Teste simples do Financial Agent (sem dependências externas)
 * Run with: npx tsx src/agents/financial/test-simple.ts
 */

import { FinancialAgent } from './financial-agent'
import { MemorySystem } from '../core/memory-system'
import { AgentConfig } from '../../types'

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
    console.log(`📖 [MOCK] getIndividualMemory(${userId}, ${key})`)
    return null
  }

  async setIndividualMemory(conversationId: string, agentType: string, data: Record<string, any>, ttl?: number): Promise<string> {
    console.log(`💾 [MOCK] setIndividualMemory(${conversationId}, ${agentType}, ${JSON.stringify(data)})`)
    return 'mock-memory-id'
  }

  async updateIndividualMemory(conversationId: string, agentType: string, memoryId: string, data: Record<string, any>): Promise<boolean> {
    console.log(`🔄 [MOCK] updateIndividualMemory(${conversationId}, ${agentType}, ${memoryId}, ${JSON.stringify(data)})`)
    return true
  }

  async getSharedMemory(key: string): Promise<any> {
    console.log(`📖 [MOCK] getSharedMemory(${key})`)
    return null
  }

  async setSharedMemory(conversationId: string, data: Record<string, any>): Promise<string> {
    console.log(`💾 [MOCK] setSharedMemory(${conversationId}, ${JSON.stringify(data)})`)
    return 'mock-shared-memory-id'
  }
}

async function testSimple() {
  console.log('🚀 Teste Simples do Financial Agent\n')

  const config: AgentConfig = {
    id: 'financial-agent-test',
    model: 'gpt-4',
    temperature: 0.1,
    maxTokens: 1000,
    retryAttempts: 3,
    escalationThreshold: 0.8,
    memoryRetentionDays: 30,
    learningEnabled: true
  }

  const memorySystem = new MockMemorySystem()
  const financialAgent = new FinancialAgent(config, memorySystem)

  await financialAgent.initialize(config)

  console.log('✅ Financial Agent inicializado!\n')

  // Teste 1: Classificação de intenção
  console.log('🧪 Teste 1: Classificação de Intenção')
  try {
    const response = await financialAgent.processMessage(
      'Adicione uma despesa de R$ 50,00 para alimentação',
      { userId: 'test-user', conversationId: 'test-conv' }
    )
    console.log(`✅ Resposta: ${response.response}`)
    console.log(`🎯 Intent: ${response.intent}`)
    console.log(`📊 Confiança: ${response.confidence}`)
  } catch (error) {
    console.log(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  console.log('\n' + '─'.repeat(50) + '\n')

  // Teste 2: Análise de fluxo de caixa
  console.log('🧪 Teste 2: Análise de Fluxo de Caixa')
  try {
    const response = await financialAgent.processMessage(
      'Como está meu fluxo de caixa?',
      { userId: 'test-user', conversationId: 'test-conv' }
    )
    console.log(`✅ Resposta: ${response.response}`)
    console.log(`🎯 Intent: ${response.intent}`)
  } catch (error) {
    console.log(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  console.log('\n' + '─'.repeat(50) + '\n')

  // Teste 3: Listar categorias
  console.log('🧪 Teste 3: Listar Categorias')
  try {
    const response = await financialAgent.processMessage(
      'Quais categorias existem?',
      { userId: 'test-user', conversationId: 'test-conv' }
    )
    console.log(`✅ Resposta: ${response.response}`)
    console.log(`🎯 Intent: ${response.intent}`)
  } catch (error) {
    console.log(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  console.log('\n🎉 Teste concluído!')
}

if (require.main === module) {
  testSimple().catch(console.error)
}

export { testSimple }
