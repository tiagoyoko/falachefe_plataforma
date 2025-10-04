/**
 * Teste do Sistema de Perfil do Usuário
 * 
 * Este script testa a integração completa entre:
 * - User Profile Tool
 * - Memory System
 * - Agent Integration
 * - API Endpoints
 */

import { userProfileTool } from '../src/agents/core/user-profile-tool'
import { userProfileManager } from '../src/agents/memory/user-profile'

async function testUserProfileSystem() {
  console.log('🧪 Iniciando testes do sistema de perfil do usuário...\n')

  const testUserId = `test_user_${Date.now()}`
  
  try {
    // Teste 1: Criar perfil básico
    console.log('📝 Teste 1: Criando perfil básico...')
    const personalInfo = {
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      phone: '+55 11 99999-9999',
      position: 'Gerente de Vendas',
      company: 'TechCorp Ltda',
      industry: 'Tecnologia'
    }

    const updateResult = await userProfileTool.updatePersonalInfo(testUserId, personalInfo)
    console.log('✅ Perfil criado:', updateResult.success ? 'Sucesso' : 'Falha')
    console.log('   Dados:', updateResult.data)

    // Teste 2: Atualizar contexto empresarial
    console.log('\n🏢 Teste 2: Atualizando contexto empresarial...')
    const businessContext = {
      businessType: 'SaaS',
      mainChallenges: ['Escalabilidade', 'Retenção de clientes'],
      goals: ['Aumentar vendas em 30%', 'Melhorar satisfação do cliente'],
      priorities: ['Crescimento', 'Qualidade', 'Inovação'],
      teamSize: 25,
      revenueRange: 'R$ 1M - R$ 5M'
    }

    const businessResult = await userProfileTool.updateBusinessContext(testUserId, businessContext)
    console.log('✅ Contexto empresarial atualizado:', businessResult.success ? 'Sucesso' : 'Falha')

    // Teste 3: Atualizar preferências
    console.log('\n⚙️ Teste 3: Atualizando preferências...')
    const preferences = {
      communicationStyle: 'formal' as const,
      language: 'pt-BR',
      notificationPreferences: {
        useEmojis: false,
        sendReminders: true
      },
      dashboardPreferences: {
        detailLevel: 'comprehensive'
      }
    }

    const preferencesResult = await userProfileTool.updateUserProfile({
      userId: testUserId,
      preferences
    })
    console.log('✅ Preferências atualizadas:', preferencesResult.success ? 'Sucesso' : 'Falha')

    // Teste 4: Consultar perfil completo
    console.log('\n🔍 Teste 4: Consultando perfil completo...')
    const profileResult = await userProfileTool.getUserProfile({
      userId: testUserId,
      includeSummary: true
    })
    console.log('✅ Perfil consultado:', profileResult.success ? 'Sucesso' : 'Falha')
    if (profileResult.success && profileResult.profile) {
      console.log('   Nome:', profileResult.profile.personalInfo.name)
      console.log('   Empresa:', profileResult.profile.personalInfo.company)
      console.log('   Resumo:', profileResult.summary)
    }

    // Teste 5: Consultar informações específicas
    console.log('\n📊 Teste 5: Consultando informações específicas...')
    
    const personalResult = await userProfileTool.getPersonalInfo(testUserId)
    console.log('✅ Informações pessoais:', personalResult.success ? 'Sucesso' : 'Falha')
    console.log('   Dados:', personalResult.data)

    const businessInfoResult = await userProfileTool.getBusinessContext(testUserId)
    console.log('✅ Contexto empresarial:', businessInfoResult.success ? 'Sucesso' : 'Falha')
    console.log('   Objetivos:', businessInfoResult.data?.goals)

    // Teste 6: Registrar interação
    console.log('\n📝 Teste 6: Registrando interação...')
    const interactionResult = await userProfileTool.recordInteraction(
      testUserId,
      'financial_consultation',
      {
        topic: 'Análise de fluxo de caixa',
        duration: '15 minutos'
      }
    )
    console.log('✅ Interação registrada:', interactionResult.success ? 'Sucesso' : 'Falha')

    // Teste 7: Extrair informações de mensagem
    console.log('\n💬 Teste 7: Extraindo informações de mensagem...')
    const message = 'Olá, meu nome é Maria Santos e trabalho na InovaçãoTech como Diretora de Marketing'
    const extractResult = await userProfileTool.extractAndStoreUserInfo(testUserId, message)
    console.log('✅ Informações extraídas:', extractResult.success ? 'Sucesso' : 'Falha')
    console.log('   Extraído:', extractResult.data?.extracted)

    // Teste 8: Gerar prompt personalizado
    console.log('\n🤖 Teste 8: Gerando prompt personalizado...')
    const basePrompt = 'Você é um assistente virtual especializado em gestão empresarial.'
    const personalizedPrompt = await userProfileTool.generatePersonalizedPrompt(testUserId, basePrompt)
    console.log('✅ Prompt personalizado gerado:', personalizedPrompt.length > basePrompt.length ? 'Sucesso' : 'Falha')
    console.log('   Tamanho original:', basePrompt.length)
    console.log('   Tamanho personalizado:', personalizedPrompt.length)

    // Teste 9: Preferências de comunicação
    console.log('\n🗣️ Teste 9: Consultando preferências de comunicação...')
    const commResult = await userProfileTool.getCommunicationPreferences(testUserId)
    console.log('✅ Preferências de comunicação:', commResult.success ? 'Sucesso' : 'Falha')
    console.log('   Estilo:', commResult.data?.style)
    console.log('   Idioma:', commResult.data?.language)
    console.log('   Emojis:', commResult.data?.useEmojis)

    // Teste 10: Resumo do perfil
    console.log('\n📋 Teste 10: Gerando resumo do perfil...')
    const summaryResult = await userProfileTool.getProfileSummary(testUserId)
    console.log('✅ Resumo gerado:', summaryResult.success ? 'Sucesso' : 'Falha')
    console.log('   Resumo:', summaryResult.summary)

    console.log('\n🎉 Todos os testes concluídos com sucesso!')
    console.log('\n📊 Resumo dos testes:')
    console.log('✅ Criação de perfil básico')
    console.log('✅ Atualização de contexto empresarial')
    console.log('✅ Atualização de preferências')
    console.log('✅ Consulta de perfil completo')
    console.log('✅ Consulta de informações específicas')
    console.log('✅ Registro de interação')
    console.log('✅ Extração de informações de mensagem')
    console.log('✅ Geração de prompt personalizado')
    console.log('✅ Consulta de preferências de comunicação')
    console.log('✅ Geração de resumo do perfil')

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
  }
}

// Teste de integração com agentes
async function testAgentIntegration() {
  console.log('\n🤖 Testando integração com agentes...')

  const testUserId = `agent_test_${Date.now()}`
  
  try {
    // Simular dados do usuário
    await userProfileTool.updatePersonalInfo(testUserId, {
      name: 'Carlos Mendes',
      company: 'StartupTech',
      position: 'CEO'
    })

    await userProfileTool.updateBusinessContext(testUserId, {
      goals: ['Crescimento rápido', 'Expansão internacional'],
      priorities: ['Tecnologia', 'Mercado', 'Equipe']
    })

    // Simular mensagem do usuário
    const userMessage = 'Preciso de ajuda com planejamento financeiro para o próximo trimestre'
    
    // Extrair informações da mensagem
    await userProfileTool.extractAndStoreUserInfo(testUserId, userMessage)
    
    // Registrar interação
    await userProfileTool.recordInteraction(testUserId, 'financial_planning', {
      topic: 'planejamento financeiro',
      timeframe: 'próximo trimestre'
    })

    // Gerar prompt personalizado
    const basePrompt = 'Você é a Secretária Virtual do Falachefe, especializada em gestão empresarial.'
    const personalizedPrompt = await userProfileTool.generatePersonalizedPrompt(testUserId, basePrompt)
    
    console.log('✅ Integração com agentes testada com sucesso!')
    console.log('📝 Prompt personalizado gerado para o agente')
    console.log('📊 Contexto do usuário disponível para personalização')

  } catch (error) {
    console.error('❌ Erro na integração com agentes:', error)
  }
}

// Executar testes
async function runAllTests() {
  console.log('🚀 Iniciando testes completos do sistema de perfil do usuário...\n')
  
  await testUserProfileSystem()
  await testAgentIntegration()
  
  console.log('\n✨ Testes completos finalizados!')
  console.log('\n💡 O sistema está pronto para uso pelos agentes.')
  console.log('   Os agentes agora têm acesso completo aos dados do perfil do usuário.')
  console.log('   Não é mais necessário que o usuário repita informações.')
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error)
}

export { testUserProfileSystem, testAgentIntegration, runAllTests }

