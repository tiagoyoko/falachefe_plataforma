#!/usr/bin/env tsx

/**
 * Script de teste para verificar se o agente consegue recuperar informações do usuário
 */

import { falachefeSecretaryAgent } from '../src/agents/falachefe-secretary-agent'
import { userProfileTool } from '../src/agents/core/user-profile-tool'

async function testAgentUserProfileRecovery() {
  console.log('🧪 Testando recuperação de informações do usuário pelo agente...\n')

  const testUserId = 'test-user-123'
  const testConversationId = 'test-conv-456'

  try {
    // 1. Criar perfil de teste do usuário
    console.log('📝 Criando perfil de teste do usuário...')
    await userProfileTool.updatePersonalInfo(testUserId, {
      name: 'João Silva',
      company: 'TechCorp Ltda',
      position: 'Gerente de Projetos',
      industry: 'Tecnologia'
    })

    await userProfileTool.updateBusinessContext(testUserId, {
      goals: ['Aumentar produtividade da equipe', 'Reduzir custos operacionais'],
      priorities: ['Automação de processos', 'Gestão financeira'],
      mainChallenges: ['Falta de visibilidade financeira', 'Processos manuais']
    })

    console.log('✅ Perfil de teste criado com sucesso\n')

    // 2. Testar consulta de perfil
    console.log('🔍 Testando consulta de perfil...')
    const profileResult = await userProfileTool.getUserProfile({
      userId: testUserId,
      includeSummary: true
    })

    if (profileResult.success) {
      console.log('✅ Consulta de perfil funcionando:')
      console.log('📋 Resumo:', profileResult.summary)
      console.log('👤 Nome:', profileResult.profile?.personalInfo?.name)
      console.log('🏢 Empresa:', profileResult.profile?.personalInfo?.company)
      console.log('🎯 Metas:', profileResult.profile?.businessContext?.goals)
    } else {
      console.log('❌ Erro na consulta de perfil:', profileResult.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 3. Testar agente com mensagem que deveria consultar perfil
    console.log('🤖 Testando agente com mensagem sobre perfil...')
    
    const testMessages = [
      'Olá, qual é o meu nome?',
      'Em qual empresa eu trabalho?',
      'Quais são os meus objetivos?',
      'Meu nome é João Silva e trabalho na TechCorp',
      'Preciso de ajuda com gestão financeira'
    ]

    for (const message of testMessages) {
      console.log(`\n💬 Testando mensagem: "${message}"`)
      
      try {
        const response = await falachefeSecretaryAgent.processMessage(
          message,
          testUserId,
          testConversationId
        )

        console.log(`✅ Resposta do agente:`)
        console.log(`📝 Conteúdo: ${response.response}`)
        console.log(`🔧 Tools usadas: ${response.metadata.tools_used || 0}`)
        console.log(`🧠 Contexto: ${JSON.stringify(response.metadata.user_context, null, 2)}`)
        console.log(`⏱️ Tempo: ${response.processingTime}ms`)

        // Verificar se o agente usou as tools
        if (response.metadata.tools_used > 0) {
          console.log('🎉 Sucesso! O agente usou ferramentas para consultar o perfil')
        } else {
          console.log('⚠️ O agente não usou ferramentas de consulta de perfil')
        }

      } catch (error) {
        console.log(`❌ Erro ao processar mensagem: ${error}`)
      }

      console.log('-'.repeat(40))
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 4. Testar consulta direta das tools
    console.log('🔧 Testando tools diretamente...')
    
    // Simular contexto de execução
    const mockContext = {
      userId: testUserId
    }

    try {
      // Testar getUserProfileTool
      console.log('🔍 Testando getUserProfileTool...')
      const profileToolResult = await getUserProfileTool.execute({ includeSummary: true }, { context: mockContext })
      console.log('✅ Resultado:', profileToolResult)

      // Testar getPersonalInfoTool
      console.log('\n🔍 Testando getPersonalInfoTool...')
      const personalInfoResult = await getPersonalInfoTool.execute({}, { context: mockContext })
      console.log('✅ Resultado:', personalInfoResult)

      // Testar getBusinessContextTool
      console.log('\n🔍 Testando getBusinessContextTool...')
      const businessContextResult = await getBusinessContextTool.execute({}, { context: mockContext })
      console.log('✅ Resultado:', businessContextResult)

    } catch (error) {
      console.log('❌ Erro ao testar tools:', error)
    }

    console.log('\n🎯 Teste concluído!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Importar as tools para teste direto
import { getUserProfileTool, getPersonalInfoTool, getBusinessContextTool } from '../src/agents/falachefe-secretary-agent'

// Executar teste
if (require.main === module) {
  testAgentUserProfileRecovery()
    .then(() => {
      console.log('\n✅ Teste finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error)
      process.exit(1)
    })
}
