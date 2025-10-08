#!/usr/bin/env tsx

/**
 * Script de teste para verificar se a conexão com o banco está funcionando
 * e se os dados do onboarding estão sendo consultados corretamente
 */

import { config } from 'dotenv'

// Carregar variáveis de ambiente ANTES de importar outros módulos
config({ path: '.env.local' })

// Verificar se as variáveis foram carregadas
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!')
  process.exit(1)
}

console.log('✅ Variáveis de ambiente carregadas com sucesso')

// Agora importar os módulos que dependem das variáveis de ambiente
import { userProfileTool } from '../src/agents/core/user-profile-tool'
import { userProfileManager } from '../src/agents/memory/user-profile'

async function testRealDatabaseConnection() {
  console.log('🧪 Testando conexão real com o banco de dados...\n')

  // Teste 1: Verificar se a conexão com o banco está funcionando
  console.log('1️⃣ Testando conexão com o banco...')
  try {
    const testUserId = 'test-user-123'
    const profile = await userProfileManager.getUserProfile(testUserId)
    console.log('✅ Conexão com banco funcionando')
    console.log('📊 Perfil encontrado:', profile ? 'Sim' : 'Não')
    if (profile) {
      console.log('📝 Dados do perfil:', JSON.stringify(profile, null, 2))
    } else {
      console.log('ℹ️ Nenhum perfil encontrado para o usuário de teste')
    }
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error)
    return
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 2: Criar dados de teste no banco
  console.log('2️⃣ Criando dados de teste no banco...')
  try {
    const testUserId = 'test-user-123'
    
    // Criar perfil de teste
    await userProfileManager.updateUserProfile(testUserId, {
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'Gerente de Projetos',
        industry: 'Tecnologia',
        companySize: '11-50'
      },
      businessContext: {
        goals: ['Aumentar produtividade', 'Reduzir custos'],
        priorities: ['Automação', 'Gestão financeira']
      }
    })
    
    console.log('✅ Dados de teste criados no banco')
    
    // Consultar novamente para verificar
    const profile = await userProfileManager.getUserProfile(testUserId)
    if (profile) {
      console.log('📊 Perfil após criação:', JSON.stringify(profile, null, 2))
    }
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 3: Testar userProfileTool com dados reais
  console.log('3️⃣ Testando userProfileTool com dados reais...')
  try {
    const testUserId = 'test-user-123'
    
    // Testar getUserProfile
    const profileResult = await userProfileTool.getUserProfile({
      userId: testUserId,
      includeSummary: true
    })
    console.log('✅ getUserProfile funcionando')
    console.log('📊 Resultado:', profileResult.success ? 'Sucesso' : 'Falha')
    if (profileResult.success) {
      console.log('📝 Dados retornados:', JSON.stringify(profileResult.data, null, 2))
      console.log('📋 Resumo:', profileResult.summary)
    } else {
      console.log('❌ Erro:', profileResult.error)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar userProfileTool:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 4: Testar tools individuais
  console.log('4️⃣ Testando tools individuais...')
  try {
    const testUserId = 'test-user-123'
    
    // Testar getPersonalInfo
    const personalInfoResult = await userProfileTool.getPersonalInfo(testUserId)
    console.log('👤 getPersonalInfo:', personalInfoResult.success ? 'Sucesso' : 'Falha')
    if (personalInfoResult.success) {
      console.log('📝 Dados pessoais:', JSON.stringify(personalInfoResult.data, null, 2))
    } else {
      console.log('❌ Erro:', personalInfoResult.error)
    }
    
    // Testar getBusinessContext
    const businessContextResult = await userProfileTool.getBusinessContext(testUserId)
    console.log('🏢 getBusinessContext:', businessContextResult.success ? 'Sucesso' : 'Falha')
    if (businessContextResult.success) {
      console.log('📝 Contexto empresarial:', JSON.stringify(businessContextResult.data, null, 2))
    } else {
      console.log('❌ Erro:', businessContextResult.error)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar tools individuais:', error)
  }

  console.log('\n🎉 Teste de conexão com banco concluído!')
}

// Executar teste
testRealDatabaseConnection().catch(console.error)
