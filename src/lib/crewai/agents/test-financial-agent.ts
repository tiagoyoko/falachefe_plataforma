/**
 * Test script for Financial Agent
 * Run with: npx tsx src/agents/financial/test-financial-agent.ts
 */

import { FinancialAgent } from './financial-agent'
import { MemorySystem } from '../core/memory-system'
import { AgentConfig } from '../../types'

async function testFinancialAgent() {
  console.log('🚀 Iniciando teste do Financial Agent...\n')

  // Configuração do agente
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

  // Inicializar sistema de memória (mock para teste)
  const memorySystem = new MemorySystem({
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

  // Criar instância do Financial Agent
  const financialAgent = new FinancialAgent(config, memorySystem)

  // Inicializar o agente
  await financialAgent.initialize(config)

  console.log('✅ Financial Agent inicializado com sucesso!\n')

  // Casos de teste
  const testCases = [
    {
      name: 'Adicionar Despesa',
      message: 'Adicione uma despesa de R$ 50,00 para alimentação hoje',
      expectedIntent: 'add_expense'
    },
    {
      name: 'Adicionar Receita',
      message: 'Registre uma receita de R$ 1000,00 de salário',
      expectedIntent: 'add_revenue'
    },
    {
      name: 'Análise de Fluxo de Caixa',
      message: 'Como está meu fluxo de caixa este mês?',
      expectedIntent: 'cashflow_analysis'
    },
    {
      name: 'Listar Categorias',
      message: 'Quais categorias de despesas existem?',
      expectedIntent: 'category_list'
    },
    {
      name: 'Consulta Financeira',
      message: 'Qual foi meu gasto total em dezembro?',
      expectedIntent: 'financial_query'
    }
  ]

  console.log('📋 Executando casos de teste...\n')

  for (const testCase of testCases) {
    console.log(`🧪 Teste: ${testCase.name}`)
    console.log(`📝 Mensagem: "${testCase.message}"`)
    console.log(`🎯 Intent esperado: ${testCase.expectedIntent}`)

    try {
      const startTime = Date.now()
      
      const response = await financialAgent.processMessage(testCase.message, {
        userId: 'test-user-123',
        conversationId: 'test-conversation-456'
      })

      const processingTime = Date.now() - startTime

      console.log(`✅ Resposta: ${response.response}`)
      console.log(`⏱️  Tempo de processamento: ${processingTime}ms`)
      console.log(`🎯 Intent detectado: ${response.intent || 'N/A'}`)
      console.log(`📊 Confiança: ${response.confidence || 'N/A'}`)
      
    } catch (error) {
      console.log(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }

    console.log('─'.repeat(80))
    console.log()
  }

  // Teste de saúde do agente
  console.log('🏥 Testando saúde do agente...')
  const isHealthy = await financialAgent.isHealthy()
  console.log(`Status: ${isHealthy ? '✅ Saudável' : '❌ Com problemas'}`)

  // Teste de capacidades
  console.log('\n🔧 Capacidades do agente:')
  const capabilities = financialAgent.getCapabilities()
  capabilities.forEach(cap => console.log(`  - ${cap}`))

  // Teste de carga e memória
  console.log('\n📊 Métricas do agente:')
  console.log(`  - Carga atual: ${financialAgent.getCurrentLoad()}`)
  console.log(`  - Uso de memória: ${financialAgent.getMemoryUsage().toFixed(2)} MB`)

  console.log('\n🎉 Teste concluído!')
}

// Executar teste
if (require.main === module) {
  testFinancialAgent().catch(console.error)
}

export { testFinancialAgent }
