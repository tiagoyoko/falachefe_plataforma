#!/usr/bin/env tsx

/**
 * Script para testar especificamente as tools do OpenAI Agents SDK
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente PRIMEIRO
config({ path: resolve(process.cwd(), '.env.local') })

async function testToolsDirect() {
  console.log('🧪 Testando tools do OpenAI Agents SDK diretamente...\n')

  const testUserId = 'test-user-123'

  try {
    // 1. Verificar configuração
    console.log('🔍 Verificando configuração...')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado')
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY não encontrado')
      return
    }

    // 2. Importar as tools diretamente
    console.log('📦 Importando tools...')
    const { getUserProfileTool, getPersonalInfoTool, getBusinessContextTool } = await import('../src/agents/falachefe-secretary-agent')
    
    console.log('✅ Tools importadas\n')

    // 3. Criar contexto mock
    const mockContext = {
      context: {
        userId: testUserId
      }
    }

    console.log('🧪 Testando getUserProfileTool...')
    console.log('📝 Parâmetros: { includeSummary: true }')
    console.log('🔧 Contexto:', JSON.stringify(mockContext, null, 2))
    
    try {
      const result1 = await getUserProfileTool.execute({ includeSummary: true }, mockContext)
      console.log('✅ Resultado getUserProfileTool:')
      console.log(result1)
    } catch (error) {
      console.log('❌ Erro getUserProfileTool:', error)
    }

    console.log('\n' + '-'.repeat(50) + '\n')

    console.log('🧪 Testando getPersonalInfoTool...')
    console.log('📝 Parâmetros: { fields: null }')
    
    try {
      const result2 = await getPersonalInfoTool.execute({ fields: null }, mockContext)
      console.log('✅ Resultado getPersonalInfoTool:')
      console.log(result2)
    } catch (error) {
      console.log('❌ Erro getPersonalInfoTool:', error)
    }

    console.log('\n' + '-'.repeat(50) + '\n')

    console.log('🧪 Testando getBusinessContextTool...')
    console.log('📝 Parâmetros: {}')
    
    try {
      const result3 = await getBusinessContextTool.execute({}, mockContext)
      console.log('✅ Resultado getBusinessContextTool:')
      console.log(result3)
    } catch (error) {
      console.log('❌ Erro getBusinessContextTool:', error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 4. Testar com Agent diretamente
    console.log('🤖 Testando Agent com tools diretamente...')
    
    const { Agent, tool, run, user } = await import('@openai/agents')
    const { z } = await import('zod')

    // Criar um agente simples apenas com as tools
    const simpleAgent = new Agent({
      name: 'Test Agent',
      instructions: `Você é um assistente de teste. Use as ferramentas disponíveis para consultar informações do usuário quando perguntado sobre nome, empresa ou objetivos.`,
      tools: [getUserProfileTool, getPersonalInfoTool, getBusinessContextTool]
    })

    console.log('✅ Agent simples criado\n')

    // Testar mensagens que deveriam acionar as tools
    const testMessages = [
      'Qual é o meu nome?',
      'Em qual empresa eu trabalho?',
      'Quais são os meus objetivos?'
    ]

    for (const message of testMessages) {
      console.log(`💬 Testando: "${message}"`)
      
      try {
        const response = await run(simpleAgent, [
          user(message)
        ], {
          context: {
            userId: testUserId
          }
        })

        console.log('✅ Resposta do Agent:')
        console.log('📝 Conteúdo:', response.content)
        console.log('🔧 Tool calls:', response.tool_calls?.length || 0)
        
        if (response.tool_calls && response.tool_calls.length > 0) {
          console.log('🎉 Sucesso! Tools foram chamadas:')
          response.tool_calls.forEach((call: any, index: number) => {
            console.log(`  ${index + 1}. ${call.function?.name}: ${call.function?.arguments}`)
          })
        } else {
          console.log('⚠️ Nenhuma tool foi chamada')
        }

      } catch (error) {
        console.log('❌ Erro ao executar Agent:', error)
      }

      console.log('-'.repeat(30))
    }

    console.log('\n🎯 Teste das tools concluído!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar teste
if (require.main === module) {
  testToolsDirect()
    .then(() => {
      console.log('\n✅ Teste finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error)
      process.exit(1)
    })
}
