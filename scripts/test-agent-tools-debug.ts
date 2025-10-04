#!/usr/bin/env tsx

/**
 * Script de debug para testar as tools do agente diretamente
 */

import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

// Verificar se as variáveis foram carregadas
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!')
  process.exit(1)
}

console.log('✅ Variáveis de ambiente carregadas com sucesso')

// Agora importar os módulos que dependem das variáveis de ambiente
import { userProfileTool } from '../src/agents/core/user-profile-tool'

async function testAgentTools() {
  console.log('🧪 Testando tools do agente diretamente...\n')

  const testUserId = 'test-user-123'

  // Teste 1: getUserProfile
  console.log('1️⃣ Testando getUserProfile...')
  try {
    const result = await userProfileTool.getUserProfile({
      userId: testUserId,
      includeSummary: true
    })
    console.log('✅ getUserProfile funcionando')
    console.log('📊 Sucesso:', result.success)
    if (result.success) {
      console.log('📝 Dados:', JSON.stringify(result.data, null, 2))
      console.log('📋 Resumo:', result.summary)
    } else {
      console.log('❌ Erro:', result.error)
    }
  } catch (error) {
    console.error('❌ Erro no getUserProfile:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 2: getPersonalInfo
  console.log('2️⃣ Testando getPersonalInfo...')
  try {
    const result = await userProfileTool.getPersonalInfo(testUserId)
    console.log('✅ getPersonalInfo funcionando')
    console.log('📊 Sucesso:', result.success)
    if (result.success) {
      console.log('📝 Dados pessoais:', JSON.stringify(result.data, null, 2))
    } else {
      console.log('❌ Erro:', result.error)
    }
  } catch (error) {
    console.error('❌ Erro no getPersonalInfo:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 3: getBusinessContext
  console.log('3️⃣ Testando getBusinessContext...')
  try {
    const result = await userProfileTool.getBusinessContext(testUserId)
    console.log('✅ getBusinessContext funcionando')
    console.log('📊 Sucesso:', result.success)
    if (result.success) {
      console.log('📝 Contexto empresarial:', JSON.stringify(result.data, null, 2))
    } else {
      console.log('❌ Erro:', result.error)
    }
  } catch (error) {
    console.error('❌ Erro no getBusinessContext:', error)
  }

  console.log('\n🎉 Teste de tools concluído!')
}

// Executar teste
testAgentTools().catch(console.error)

