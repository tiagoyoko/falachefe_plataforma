#!/usr/bin/env tsx

/**
 * Script de teste básico para verificar se o agente está funcionando
 * sem dependência do banco de dados
 */

import { Agent, tool, run, user, assistant, system } from '@openai/agents'
import { z } from 'zod'

// Mock do UserProfileTool para teste
const mockUserProfileTool = {
  getUserProfile: async (params: { userId: string; includeSummary?: boolean }) => {
    console.log('🔍 Mock: getUserProfile chamado com:', params)
    return {
      success: true,
      profile: {
        personalInfo: {
          name: 'João Silva',
          company: 'TechCorp Ltda',
          position: 'Gerente de Projetos'
        },
        businessContext: {
          goals: ['Aumentar produtividade', 'Reduzir custos'],
          priorities: ['Automação', 'Gestão financeira']
        }
      },
      summary: 'Usuário João Silva da TechCorp, focado em automação e gestão financeira'
    }
  },
  getPersonalInfo: async (params: { userId: string }) => {
    console.log('🔍 Mock: getPersonalInfo chamado com:', params)
    return {
      success: true,
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'Gerente de Projetos'
      }
    }
  },
  getBusinessContext: async (params: { userId: string }) => {
    console.log('🔍 Mock: getBusinessContext chamado com:', params)
    return {
      success: true,
      businessContext: {
        goals: ['Aumentar produtividade', 'Reduzir custos'],
        priorities: ['Automação', 'Gestão financeira']
      }
    }
  }
}

// Definir as tools usando o SDK do OpenAI Agents
const getUserProfileTool = tool({
  name: 'get_user_profile',
  description: 'Consulta o perfil completo do usuário incluindo informações pessoais, preferências e contexto empresarial',
  parameters: z.object({
    includeSummary: z.boolean().nullable().describe('Se deve incluir um resumo do perfil')
  }),
  execute: async (args, runContext?: any): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await mockUserProfileTool.getUserProfile({
        userId: runContext.context.userId,
        includeSummary: args.includeSummary
      })

      if (result.success && result.profile) {
        const profile = result.profile
        let response = `Perfil do usuário encontrado:\n`
        
        if (profile.personalInfo) {
          response += `\n**Informações Pessoais:**\n`
          response += `- Nome: ${profile.personalInfo.name}\n`
          response += `- Empresa: ${profile.personalInfo.company}\n`
          response += `- Cargo: ${profile.personalInfo.position}\n`
        }

        if (profile.businessContext) {
          response += `\n**Contexto Empresarial:**\n`
          response += `- Metas: ${profile.businessContext.goals?.join(', ')}\n`
          response += `- Prioridades: ${profile.businessContext.priorities?.join(', ')}\n`
        }

        if (result.summary) {
          response += `\n**Resumo:** ${result.summary}`
        }

        return response
      } else {
        return 'Perfil do usuário não encontrado ou erro na consulta'
      }
    } catch (error) {
      console.error('Erro ao consultar perfil:', error)
      return 'Erro interno ao consultar perfil do usuário'
    }
  }
})

const getPersonalInfoTool = tool({
  name: 'get_personal_info',
  description: 'Consulta informações pessoais específicas do usuário',
  parameters: z.object({}),
  execute: async (args, runContext?: any): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await mockUserProfileTool.getPersonalInfo({
        userId: runContext.context.userId
      })

      if (result.success && result.personalInfo) {
        return `Informações pessoais: Nome: ${result.personalInfo.name}, Empresa: ${result.personalInfo.company}, Cargo: ${result.personalInfo.position}`
      } else {
        return 'Informações pessoais não encontradas'
      }
    } catch (error) {
      return 'Erro ao consultar informações pessoais'
    }
  }
})

const getBusinessContextTool = tool({
  name: 'get_business_context',
  description: 'Consulta contexto empresarial e metas do usuário',
  parameters: z.object({}),
  execute: async (args, runContext?: any): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await mockUserProfileTool.getBusinessContext({
        userId: runContext.context.userId
      })

      if (result.success && result.businessContext) {
        return `Contexto empresarial: Metas: ${result.businessContext.goals?.join(', ')}, Prioridades: ${result.businessContext.priorities?.join(', ')}`
      } else {
        return 'Contexto empresarial não encontrado'
      }
    } catch (error) {
      return 'Erro ao consultar contexto empresarial'
    }
  }
})

// Interface para o contexto local
interface UserContext {
  userId: string
  conversationId?: string
  userName?: string
  userCompany?: string
  userPosition?: string
}

// Instruções do agente
const getAgentProfile = (): string => {
  return `# Falachefe Secretary Agent

Você é o Falachefe Secretary, um assistente virtual especializado em gestão empresarial e produtividade.

## SUAS CAPACIDADES

Você pode ajudar com:
- Gestão financeira e controle de caixa
- Automação de processos empresariais
- Organização de tarefas e projetos
- Análise de dados e relatórios
- Integração com sistemas empresariais
- Suporte a decisões estratégicas

## PERSONALIZAÇÃO

Você tem acesso às informações pessoais e empresariais do usuário através de ferramentas específicas. Use essas informações para personalizar suas respostas e oferecer sugestões relevantes.

## FERRAMENTAS DISPONÍVEIS

- get_user_profile: Consulta o perfil completo do usuário
- get_personal_info: Consulta informações pessoais específicas
- get_business_context: Consulta contexto empresarial e metas

## INSTRUÇÕES IMPORTANTES

- SEMPRE use as ferramentas de consulta de perfil quando o usuário mencionar informações pessoais ou empresariais
- Se o usuário disser "meu nome é", "trabalho na", "minha empresa é", etc., use get_user_profile para verificar se já temos essas informações
- Use get_business_context para entender melhor os objetivos e prioridades do usuário
- Personalize suas respostas baseado nas informações obtidas através das ferramentas
- Se não tiver informações do usuário, pergunte educadamente sobre nome, empresa e objetivos

## ESTILO DE COMUNICAÇÃO

- Seja profissional mas amigável
- Use linguagem clara e objetiva
- Forneça informações práticas e acionáveis
- Sempre que possível, use dados do perfil do usuário para personalizar as respostas
- Seja proativo em sugerir melhorias baseadas no contexto empresarial do usuário

## EXEMPLOS DE USO DAS FERRAMENTAS

- Quando usuário perguntar sobre seu nome: use get_user_profile
- Quando usuário mencionar empresa: use get_business_context
- Quando usuário falar sobre objetivos: use get_business_context
- Para personalizar qualquer resposta: use get_user_profile primeiro

Lembre-se: suas ferramentas são sua principal forma de entender o usuário e personalizar a experiência!`
}

// Classe do agente
class TestFalachefeSecretaryAgent {
  private agent: Agent<UserContext>

  constructor() {
    this.agent = new Agent<UserContext>({
      name: 'Falachefe Secretary',
      instructions: getAgentProfile(),
      tools: [
        getUserProfileTool,
        getPersonalInfoTool,
        getBusinessContextTool
      ]
    })
    console.log('🤖 Falachefe Secretary Agent inicializado com OpenAI Agents SDK')
  }

  async processMessage(message: string, userId?: string, conversationId?: string): Promise<{
    response: string
    agentId: string
    confidence: number
    processingTime: number
    metadata: any
  }> {
    const startTime = Date.now()

    try {
      // Preparar contexto do usuário
      const userContext: UserContext = {
        userId: userId || 'test-user-123',
        conversationId: conversationId || `conv_${Date.now()}`,
        userName: undefined,
        userCompany: undefined,
        userPosition: undefined
      }

      console.log('📝 Contexto do usuário:', userContext)

      // Executar o agente com contexto
      const result = await run(this.agent, [
        user(message)
      ], {
        context: userContext
      })

      const processingTime = Date.now() - startTime

      return {
        response: result.content || 'Resposta não disponível',
        agentId: 'falachefe-secretary',
        confidence: 0.9,
        processingTime,
        metadata: {
          user_context: userContext,
          tools_used: result.tool_calls?.length || 0,
          tool_calls: result.tool_calls || []
        }
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('Erro ao processar mensagem:', error)
      
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        agentId: 'falachefe-secretary',
        confidence: 0.0,
        processingTime,
        metadata: {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }
  }
}

async function testAgentBasic() {
  console.log('🧪 Testando agente básico sem dependência do banco...\n')

  const agent = new TestFalachefeSecretaryAgent()
  const testUserId = 'test-user-123'
  const testConversationId = 'test-conv-456'

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
      const response = await agent.processMessage(
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

  console.log('\n🎯 Teste básico concluído!')
}

// Executar teste
if (require.main === module) {
  testAgentBasic()
    .then(() => {
      console.log('\n✅ Teste finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error)
      process.exit(1)
    })
}
