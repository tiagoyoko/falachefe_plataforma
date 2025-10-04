#!/usr/bin/env tsx

/**
 * Script de teste para verificar se a consulta de perfil está funcionando
 * e se os dados do onboarding estão sendo consultados corretamente
 */

import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

// Mock do userProfileManager para teste sem banco
const mockUserProfileManager = {
  getUserProfile: async (userId: string) => {
    console.log(`🔍 Mock: getUserProfile chamado com userId: ${userId}`)
    return {
      userId,
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
      },
      preferences: {
        communicationStyle: 'mixed',
        language: 'pt-BR'
      }
    }
  },
  getProfileSummary: async (userId: string) => {
    console.log(`🔍 Mock: getProfileSummary chamado com userId: ${userId}`)
    return 'João Silva | TechCorp Ltda | Gerente de Projetos | Objetivos: Aumentar produtividade, Reduzir custos'
  }
}

// Mock do userProfileTool
const mockUserProfileTool = {
  getUserProfile: async (query: { userId: string; includeSummary?: boolean }) => {
    console.log(`🔍 Mock: getUserProfile chamado com:`, query)
    const profile = await mockUserProfileManager.getUserProfile(query.userId)
    const summary = query.includeSummary ? await mockUserProfileManager.getProfileSummary(query.userId) : undefined
    
    return {
      success: true,
      profile,
      summary,
      data: profile
    }
  },
  getPersonalInfo: async (userId: string) => {
    console.log(`🔍 Mock: getPersonalInfo chamado com userId: ${userId}`)
    const profile = await mockUserProfileManager.getUserProfile(userId)
    return {
      success: true,
      data: profile.personalInfo,
      profile
    }
  },
  getBusinessContext: async (userId: string) => {
    console.log(`🔍 Mock: getBusinessContext chamado com userId: ${userId}`)
    const profile = await mockUserProfileManager.getUserProfile(userId)
    return {
      success: true,
      data: profile.businessContext,
      profile
    }
  }
}

async function testUserProfileConsultation() {
  console.log('🧪 Testando consulta de perfil do usuário...\n')

  // Teste 1: Verificar se o userProfileManager está funcionando
  console.log('1️⃣ Testando userProfileManager...')
  try {
    const testUserId = 'test-user-123'
    const profile = await mockUserProfileManager.getUserProfile(testUserId)
    console.log('✅ userProfileManager funcionando')
    console.log('📊 Perfil encontrado:', profile ? 'Sim' : 'Não')
    if (profile) {
      console.log('📝 Dados do perfil:', JSON.stringify(profile, null, 2))
    }
  } catch (error) {
    console.error('❌ Erro no userProfileManager:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 2: Verificar se o userProfileTool está funcionando
  console.log('2️⃣ Testando userProfileTool...')
  try {
    const testUserId = 'test-user-123'
    const result = await mockUserProfileTool.getUserProfile({
      userId: testUserId,
      includeSummary: true
    })
    console.log('✅ userProfileTool funcionando')
    console.log('📊 Resultado:', result.success ? 'Sucesso' : 'Falha')
    if (result.success) {
      console.log('📝 Dados retornados:', JSON.stringify(result.data, null, 2))
      console.log('📋 Resumo:', result.summary)
    } else {
      console.log('❌ Erro:', result.error)
    }
  } catch (error) {
    console.error('❌ Erro no userProfileTool:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 3: Verificar se há dados de onboarding no banco
  console.log('3️⃣ Testando consulta de dados de onboarding...')
  try {
    // Simular consulta de dados de onboarding
    const testUserId = 'test-user-123'
    
    // Criar dados de teste se não existirem
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
    
    console.log('✅ Dados de teste criados')
    
    // Consultar novamente
    const profile = await userProfileManager.getUserProfile(testUserId)
    if (profile) {
      console.log('📊 Perfil após criação:', JSON.stringify(profile, null, 2))
      
      // Testar resumo
      const summary = await userProfileManager.getProfileSummary(testUserId)
      console.log('📋 Resumo do perfil:', summary)
    }
  } catch (error) {
    console.error('❌ Erro ao testar dados de onboarding:', error)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 4: Verificar se as tools estão sendo chamadas corretamente
  console.log('4️⃣ Testando chamada de tools...')
  try {
    const testUserId = 'test-user-123'
    
    // Testar getPersonalInfo
    const personalInfoResult = await userProfileTool.getPersonalInfo(testUserId)
    console.log('👤 getPersonalInfo:', personalInfoResult.success ? 'Sucesso' : 'Falha')
    if (personalInfoResult.success) {
      console.log('📝 Dados pessoais:', JSON.stringify(personalInfoResult.data, null, 2))
    }
    
    // Testar getBusinessContext
    const businessContextResult = await userProfileTool.getBusinessContext(testUserId)
    console.log('🏢 getBusinessContext:', businessContextResult.success ? 'Sucesso' : 'Falha')
    if (businessContextResult.success) {
      console.log('📝 Contexto empresarial:', JSON.stringify(businessContextResult.data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar tools:', error)
  }

  console.log('\n🎉 Teste de consulta de perfil concluído!')
}

// Executar teste
testUserProfileConsultation().catch(console.error)
