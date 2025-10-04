/**
 * Falachefe Secretary Agent - Enhanced with Memory System
 * 
 * This agent provides business management assistance using OpenAI Agents SDK
 * with integrated memory system for personalized and contextual responses.
 */

import { Agent, tool, run, RunContext, user, assistant, system } from '@openai/agents'
import { falachefeMemorySystem } from './memory/memory-system'
import { memoryManager } from './memory/memory-manager'
import { userProfileTool } from './core/user-profile-tool'
import { z } from 'zod'

/**
 * Load agent profile from markdown file
 */
function getAgentProfile(): string {
  return `Você é a Secretária Virtual do Falachefe, uma assistente pessoal especializada em gestão empresarial.

IDENTIDADE:
- Nome: Secretária Virtual do Falachefe
- Papel: Assistente pessoal especializada em gestão empresarial
- Tom: Profissional, amigável, prestativa e eficiente
- Linguagem: Português brasileiro (formal mas acessível)

CONTEXTO DA EMPRESA:
O Falachefe é uma plataforma SaaS completa de gestão empresarial que oferece:
- Gestão financeira integrada
- Controle de clientes e fornecedores
- Organização de tarefas e projetos
- Relatórios e análises detalhadas
- Dashboard em tempo real
- Integração com múltiplos sistemas

ESPECIALIZAÇÕES:
💰 Gestão Financeira: Controle de despesas/receitas, análise de fluxo de caixa, planejamento orçamentário, relatórios financeiros
📋 Organização de Negócios: Gestão de contatos, agendamento, organização de tarefas, relatórios de atividade
🏢 Suporte e Informações: Informações sobre o Falachefe, suporte técnico, treinamento, configurações

COMPORTAMENTO:
- Seja proativa e ofereça ajuda
- Use emojis moderadamente
- Estruture respostas com títulos e listas
- Sempre ofereça próximos passos
- Mantenha tom positivo e encorajador
- Foque no valor empresarial
- Use memória para personalizar respostas

DIRETRIZES:
- Confirme o entendimento da pergunta
- Ofereça opções quando apropriado
- Sugira próximos passos concretos
- Seja didática com exemplos práticos
- Não invente funcionalidades inexistentes
- Mantenha foco na produtividade empresarial
- Use informações do contexto para respostas mais relevantes

FERRAMENTAS DISPONÍVEIS:
- get_user_profile: Consulta o perfil completo do usuário
- get_personal_info: Consulta informações pessoais específicas
- get_business_context: Consulta contexto empresarial e metas

DADOS DO USUÁRIO DISPONÍVEIS:
- Nome: {userName} (se disponível)
- Empresa: {userCompany} (se disponível)  
- Cargo: {userPosition} (se disponível)
- Perfil completo: {userProfileData} (se disponível)

INSTRUÇÕES DE PERSONALIZAÇÃO:
- SEMPRE use os dados do usuário disponíveis no contexto
- Se o usuário perguntar "qual é o meu nome?" e você tiver o nome, responda diretamente
- Se o usuário perguntar sobre sua empresa e você tiver os dados, use essas informações
- Personalize TODAS as respostas baseado nos dados disponíveis
- Se não tiver dados específicos, pergunte educadamente

EXEMPLOS DE PERSONALIZAÇÃO:
Usuário: "Oi, qual é o meu nome?"
Se você tiver o nome: "Olá {nome}! Como posso ajudá-lo hoje?"
Se não tiver: "Olá! Não tenho seu nome registrado. Poderia me informar?"

Usuário: "Como posso aumentar a produtividade?"
Se você tiver contexto empresarial: "Baseado no seu perfil de {cargo} na {empresa}, posso sugerir..."
Se não tiver: "Posso ajudar com dicas de produtividade. Qual é sua área de atuação?"

Responda sempre de forma útil, prática e focada em ajudar o usuário a maximizar a eficiência dos seus negócios através do Falachefe.`
}

/**
 * Tool para consultar perfil completo do usuário
 */
const getUserProfileTool = tool({
  name: 'get_user_profile',
  description: 'Consulta o perfil completo do usuário incluindo informações pessoais, preferências e contexto empresarial',
  parameters: z.object({
    includeSummary: z.boolean().nullable().describe('Se deve incluir um resumo do perfil')
  }),
  execute: async (args, runContext?: RunContext<{ userId: string }>): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await userProfileTool.getUserProfile({
        userId: runContext.context.userId,
        includeSummary: args.includeSummary || true
      })

      if (!result.success) {
        return `Erro ao consultar perfil: ${result.error}`
      }

      if (args.includeSummary && result.summary) {
        return `Perfil do usuário: ${result.summary}`
      }

      const profile = result.profile
      if (!profile) {
        return 'Perfil do usuário não encontrado'
      }

      let response = '**Perfil do Usuário:**\n\n'
      
      if (profile.personalInfo?.name) {
        response += `👤 **Nome:** ${profile.personalInfo.name}\n`
      }
      if (profile.personalInfo?.company) {
        response += `🏢 **Empresa:** ${profile.personalInfo.company}\n`
      }
      if (profile.personalInfo?.position) {
        response += `💼 **Cargo:** ${profile.personalInfo.position}\n`
      }
      if (profile.businessContext?.goals && profile.businessContext.goals.length > 0) {
        response += `🎯 **Objetivos:** ${profile.businessContext.goals.join(', ')}\n`
      }
      if (profile.businessContext?.priorities && profile.businessContext.priorities.length > 0) {
        response += `⚡ **Prioridades:** ${profile.businessContext.priorities.join(', ')}\n`
      }

      return response
    } catch (error) {
      console.error('❌ Erro na tool getUserProfile:', error)
      return 'Erro ao consultar perfil do usuário'
    }
  }
})

/**
 * Tool para consultar informações pessoais específicas
 */
const getPersonalInfoTool = tool({
  name: 'get_personal_info',
  description: 'Consulta informações pessoais específicas do usuário (nome, empresa, cargo, etc.)',
  parameters: z.object({
    fields: z.array(z.string()).nullable().describe('Campos específicos para consultar')
  }),
  execute: async (args, runContext?: RunContext<{ userId: string }>): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await userProfileTool.getPersonalInfo(runContext.context.userId)
      
      if (!result.success) {
        return `Erro ao consultar informações pessoais: ${result.error}`
      }

      const personalInfo = result.data
      if (!personalInfo) {
        return 'Informações pessoais não encontradas'
      }

      let response = '**Informações Pessoais:**\n\n'
      
      if (personalInfo.name) response += `👤 Nome: ${personalInfo.name}\n`
      if (personalInfo.company) response += `🏢 Empresa: ${personalInfo.company}\n`
      if (personalInfo.position) response += `💼 Cargo: ${personalInfo.position}\n`
      if (personalInfo.industry) response += `🏭 Setor: ${personalInfo.industry}\n`

      return response
    } catch (error) {
      console.error('❌ Erro na tool getPersonalInfo:', error)
      return 'Erro ao consultar informações pessoais'
    }
  }
})

/**
 * Tool para consultar contexto empresarial
 */
const getBusinessContextTool = tool({
  name: 'get_business_context',
  description: 'Consulta o contexto empresarial do usuário incluindo metas, prioridades e desafios',
  parameters: z.object({}),
  execute: async (args, runContext?: RunContext<{ userId: string }>): Promise<string> => {
    if (!runContext?.context?.userId) {
      return 'Erro: ID do usuário não disponível no contexto'
    }

    try {
      const result = await userProfileTool.getBusinessContext(runContext.context.userId)
      
      if (!result.success) {
        return `Erro ao consultar contexto empresarial: ${result.error}`
      }

      const businessContext = result.data
      if (!businessContext) {
        return 'Contexto empresarial não encontrado'
      }

      let response = '**Contexto Empresarial:**\n\n'
      
      if (businessContext.goals?.length > 0) {
        response += `🎯 **Metas:**\n${businessContext.goals.map((goal: any) => `• ${goal}`).join('\n')}\n\n`
      }
      if (businessContext.priorities?.length > 0) {
        response += `⚡ **Prioridades:**\n${businessContext.priorities.map((priority: any) => `• ${priority}`).join('\n')}\n\n`
      }
      if (businessContext.mainChallenges?.length > 0) {
        response += `🔧 **Principais Desafios:**\n${businessContext.mainChallenges.map((challenge: any) => `• ${challenge}`).join('\n')}\n\n`
      }

      return response
    } catch (error) {
      console.error('❌ Erro na tool getBusinessContext:', error)
      return 'Erro ao consultar contexto empresarial'
    }
  }
})

/**
 * Classify message intent based on content
 */
function classifyMessageIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('financeiro') || lowerMessage.includes('dinheiro') || lowerMessage.includes('receita') || lowerMessage.includes('despesa') || lowerMessage.includes('fluxo') || lowerMessage.includes('caixa')) {
    return 'financial'
  } else if (lowerMessage.includes('contato') || lowerMessage.includes('cliente') || lowerMessage.includes('fornecedor') || lowerMessage.includes('tarefa') || lowerMessage.includes('projeto')) {
    return 'organization'
  } else if (lowerMessage.includes('falachefe') || lowerMessage.includes('empresa') || lowerMessage.includes('suporte') || lowerMessage.includes('ajuda') || lowerMessage.includes('como usar')) {
    return 'information'
  } else if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite') || lowerMessage.includes('tudo bem')) {
    return 'greeting'
  } else if (lowerMessage.includes('meu nome é') || lowerMessage.includes('me chamo') || lowerMessage.includes('sou o') || lowerMessage.includes('sou a')) {
    return 'introduction'
  }
  
  return 'general'
}

/**
 * Extract name from message
 */
function extractName(message: string): string {
  const patterns = [
    /meu nome é (\w+)/i,
    /me chamo (\w+)/i,
    /sou o (\w+)/i,
    /sou a (\w+)/i,
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /nome é (\w+)/i,
    /chamo (\w+)/i
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1)
    }
  }
  
  // Fallback: try to find capitalized words
  const words = message.split(' ')
  for (const word of words) {
    if (word.length > 2 && /^[A-Z]/.test(word) && /^[a-zA-Z]+$/.test(word)) {
      return word
    }
  }
  
  return 'Usuário'
}

/**
 * Interface para o contexto do usuário
 */
interface UserContext {
  userId: string
  conversationId?: string
  userName?: string
  userCompany?: string
  userPosition?: string
}

/**
 * Falachefe Secretary Agent Class usando OpenAI Agents SDK
 */
export class FalachefeSecretaryAgent {
  private agent: Agent<UserContext>

  constructor() {
    // Criar agente com tools para consulta de perfil
    this.agent = new Agent<UserContext>({
      name: 'Falachefe Secretary',
      instructions: getAgentProfile(),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      modelSettings: {
        temperature: 0.7,
        maxTokens: 2000
      },
      toolUseBehavior: 'run_llm_again', // Permite múltiplas chamadas de tools
      tools: [
        getUserProfileTool,
        getPersonalInfoTool,
        getBusinessContextTool
      ]
    })
    console.log('🤖 Falachefe Secretary Agent initialized with OpenAI Agents SDK')
  }

  /**
   * Process a message using OpenAI Agents SDK with memory system
   */
  async processMessage(message: string, userId?: string, conversationId?: string): Promise<{
    response: string
    agentId: string
    confidence: number
    processingTime: number
    metadata: any
  }> {
    const startTime = Date.now()
    
    console.log('🚀 Processing message with OpenAI Agents SDK and Memory System:', message.substring(0, 50) + '...')
    console.log('🔧 Agent configuration:')
    console.log('  - Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini')
    console.log('  - Tool Choice:', 'required')
    console.log('  - Tools available:', this.agent.tools?.length || 0)
    console.log('  - User ID:', userId)
    console.log('  - Conversation ID:', conversationId)
    
    try {
      // Criar contexto do usuário
      const userContext: UserContext = {
        userId: userId || 'anonymous',
        conversationId: conversationId || `conv_${Date.now()}`,
        userName: undefined,
        userCompany: undefined,
        userPosition: undefined
      }

      // Se temos userId, tentar obter informações básicas do perfil
      if (userId) {
        try {
          const profileResult = await userProfileTool.getPersonalInfo(userId)
          if (profileResult.success && profileResult.data) {
            userContext.userName = profileResult.data.name
            userContext.userCompany = profileResult.data.company
            userContext.userPosition = profileResult.data.position
          }
        } catch (error) {
          console.warn('⚠️ Erro ao obter perfil básico:', error)
        }

        // Extrair e armazenar informações do usuário da mensagem
        try {
          await userProfileTool.extractAndStoreUserInfo(userId, message)
          
          // Registrar interação
          await userProfileTool.recordInteraction(userId, classifyMessageIntent(message), {
            conversationId,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.warn('⚠️ Erro ao processar informações da mensagem:', error)
        }
      }

      // FORÇA MANUAL: Sempre consultar perfil antes de processar
      console.log('🔍 Forçando consulta de perfil...')
      let userProfileData = null
      try {
        const profileResult = await userProfileTool.getUserProfile({
          userId: userContext.userId,
          includeSummary: true
        })
        
        if (profileResult.success && profileResult.data) {
          userProfileData = profileResult.data
          console.log('✅ Perfil consultado com sucesso:', profileResult.summary)
          
          // Atualizar contexto com dados do perfil
          userContext.userName = profileResult.data.personalInfo?.name
          userContext.userCompany = profileResult.data.personalInfo?.company
          userContext.userPosition = profileResult.data.personalInfo?.position
        } else {
          console.log('⚠️ Perfil não encontrado ou erro:', profileResult.error)
        }
      } catch (error) {
        console.error('❌ Erro ao consultar perfil:', error)
      }

      // Criar instruções personalizadas com dados do perfil
      let personalizedInstructions = getAgentProfile()
      if (userProfileData) {
        personalizedInstructions += `\n\nDADOS ATUAIS DO USUÁRIO:\n`
        if (userProfileData.personalInfo?.name) {
          personalizedInstructions += `- Nome: ${userProfileData.personalInfo.name}\n`
        }
        if (userProfileData.personalInfo?.company) {
          personalizedInstructions += `- Empresa: ${userProfileData.personalInfo.company}\n`
        }
        if (userProfileData.personalInfo?.position) {
          personalizedInstructions += `- Cargo: ${userProfileData.personalInfo.position}\n`
        }
        if (userProfileData.businessContext?.goals?.length > 0) {
          personalizedInstructions += `- Objetivos: ${userProfileData.businessContext.goals.join(', ')}\n`
        }
        if (userProfileData.businessContext?.priorities?.length > 0) {
          personalizedInstructions += `- Prioridades: ${userProfileData.businessContext.priorities.join(', ')}\n`
        }
      }

      // Criar agente personalizado com dados do perfil
      const personalizedAgent = new Agent<UserContext>({
        name: 'Falachefe Secretary Personalized',
        instructions: personalizedInstructions,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        modelSettings: {
          temperature: 0.7,
          maxTokens: 2000
        },
        toolUseBehavior: 'run_llm_again',
        tools: [
          getUserProfileTool,
          getPersonalInfoTool,
          getBusinessContextTool
        ]
      })

      // Usar agente personalizado para processar a mensagem
      const result = await run(personalizedAgent, message, {
        context: userContext
      })

      let responseContent = result.finalOutput || 'Desculpe, não consegui processar sua mensagem.'
      
      // FORÇA PERSONALIZAÇÃO: Se temos dados do perfil, personalizar a resposta
      if (userProfileData && userProfileData.personalInfo?.name) {
        const userName = userProfileData.personalInfo.name
        const userCompany = userProfileData.personalInfo.company
        const userPosition = userProfileData.personalInfo.position
        
        // Personalizar resposta baseada nos dados do perfil
        if (message.toLowerCase().includes('nome') || message.toLowerCase().includes('chamo')) {
          responseContent = `Olá ${userName}! 😊\n\nComo posso ajudá-lo hoje? Vejo que você é ${userPosition} na ${userCompany}. Posso auxiliar com questões de produtividade, gestão financeira ou qualquer outra necessidade empresarial!`
        } else if (message.toLowerCase().includes('empresa') || message.toLowerCase().includes('trabalho')) {
          responseContent = `Vejo que você trabalha na ${userCompany} como ${userPosition}. ${responseContent}`
        } else {
          // Personalizar resposta geral
          responseContent = `Olá ${userName}! ${responseContent}`
        }
        
        console.log('✅ Resposta personalizada com dados do perfil')
      }
      
      const processingTime = Date.now() - startTime
      const intent = classifyMessageIntent(message)
      
      console.log('✅ OpenAI Agents SDK Response generated successfully:', {
        processingTime: `${processingTime}ms`,
        intent,
        hasContext: !!(userId && conversationId),
        toolsUsed: 0 // toolCalls não disponível no RunResult
      })
      
      return {
        response: responseContent,
        agentId: 'falachefe-secretary-agents-sdk',
        confidence: 0.95, // High confidence as it's LLM-generated
        processingTime,
        metadata: {
          type: intent,
          capabilities: ['financial', 'organization', 'support', 'information', 'general', 'memory', 'user-profile'],
          api: 'openai-agents-sdk',
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          tools_used: 0, // toolCalls não disponível no RunResult
          extracted_name: extractName(message),
          memory_enhanced: !!(userId && conversationId),
          user_context: {
            hasUserId: !!userId,
            hasConversationId: !!conversationId,
            hasUserName: !!userContext.userName,
            hasUserCompany: !!userContext.userCompany
          }
        }
      }
      
    } catch (error) {
      console.error('❌ OpenAI Agents SDK Error:', error)
      
      // Fallback para resposta básica
      const processingTime = Date.now() - startTime
      const intent = classifyMessageIntent(message)
      
      return {
        response: `🤖 **Secretária Virtual do Falachefe**\n\nEstou enfrentando algumas dificuldades técnicas, mas estou aqui para ajudá-lo com o Falachefe.\n\n**Principais áreas:**\n💰 Gestão Financeira\n📋 Organização de Negócios\n🏢 Suporte e Informações\n\nPode reformular sua pergunta?`,
        agentId: 'falachefe-secretary-fallback',
        confidence: 0.3,
        processingTime,
        metadata: {
          type: intent,
          capabilities: ['financial', 'organization', 'support', 'information'],
          api: 'fallback',
          error: true,
          reason: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
}

// Export tools for testing
export { getUserProfileTool, getPersonalInfoTool, getBusinessContextTool }

// Export singleton instance
export const falachefeSecretaryAgent = new FalachefeSecretaryAgent()