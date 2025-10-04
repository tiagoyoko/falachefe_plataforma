#!/usr/bin/env tsx

/**
 * Script de teste para verificar se o agente consegue recuperar informações do usuário
 * usando o banco de dados real com Drizzle (versão lazy loading)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente PRIMEIRO
config({ path: resolve(process.cwd(), '.env.local') })

async function testAgentWithDatabaseLazy() {
  console.log('🧪 Testando agente com banco de dados real (lazy loading)...\n')

  const testUserId = 'test-user-123'
  const testConversationId = 'test-conv-456'

  try {
    // 1. Verificar se as variáveis de ambiente estão carregadas
    console.log('🔍 Verificando configuração...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado')
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL não encontrado. Verifique o arquivo .env.local')
      return
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY não encontrado. Verifique o arquivo .env.local')
      return
    }

    console.log('\n✅ Configuração OK\n')

    // 2. Importar módulos APÓS carregar as variáveis de ambiente
    console.log('📦 Carregando módulos...')
    
    // Importar dinamicamente para evitar execução no momento da importação
    const { falachefeSecretaryAgent } = await import('../src/agents/falachefe-secretary-agent')
    const { userProfileTool } = await import('../src/agents/core/user-profile-tool')
    
    console.log('✅ Módulos carregados\n')

    // 3. Testar conexão com o banco
    console.log('🗄️ Testando conexão com banco de dados...')
    
    try {
      // Tentar criar um perfil de teste
      const createResult = await userProfileTool.updatePersonalInfo(testUserId, {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'Gerente de Projetos',
        industry: 'Tecnologia'
      })

      if (createResult.success) {
        console.log('✅ Conexão com banco funcionando')
      } else {
        console.log('❌ Erro ao conectar com banco:', createResult.error)
        return
      }
    } catch (error) {
      console.log('❌ Erro na conexão com banco:', error)
      return
    }

    // 4. Criar contexto empresarial
    console.log('📝 Criando contexto empresarial...')
    const businessResult = await userProfileTool.updateBusinessContext(testUserId, {
      goals: ['Aumentar produtividade da equipe', 'Reduzir custos operacionais'],
      priorities: ['Automação de processos', 'Gestão financeira'],
      mainChallenges: ['Falta de visibilidade financeira', 'Processos manuais']
    })

    if (businessResult.success) {
      console.log('✅ Contexto empresarial criado')
    } else {
      console.log('❌ Erro ao criar contexto empresarial:', businessResult.error)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 5. Testar consulta de perfil
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

    // 6. Testar agente com mensagem que deveria consultar perfil
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

        // Mostrar tool calls se houver
        if (response.metadata.tool_calls && response.metadata.tool_calls.length > 0) {
          console.log('🔧 Tool calls executadas:')
          response.metadata.tool_calls.forEach((call: any, index: number) => {
            console.log(`  ${index + 1}. ${call.function?.name || call.tool}: ${call.function?.arguments || 'N/A'}`)
          })
        }

      } catch (error) {
        console.log(`❌ Erro ao processar mensagem: ${error}`)
      }

      console.log('-'.repeat(40))
    }

    console.log('\n🎯 Teste com banco de dados concluído!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar teste
if (require.main === module) {
  testAgentWithDatabaseLazy()
    .then(() => {
      console.log('\n✅ Teste finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error)
      process.exit(1)
    })
}
