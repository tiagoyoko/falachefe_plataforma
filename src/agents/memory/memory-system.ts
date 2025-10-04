/**
 * Sistema Integrado de Memória para Agente Secretário
 * Orquestra todos os componentes de memória
 */

import { memoryManager } from './memory-manager'
import { conversationContextManager } from './conversation-context'
import { userProfileManager } from './user-profile'
import { learningSystem } from './learning-system'
import { MemoryCategory, MemoryImportance } from './types'

export interface MemoryContext {
  userId: string
  conversationId?: string
  userProfile?: any
  conversationState?: any
  relevantMemories: any[]
  insights: any[]
  recommendations: any[]
}

export interface MemoryResponse {
  context: MemoryContext
  personalizedPrompt: string
  shouldStore: boolean
  storeData?: any
}

export class FalachefeMemorySystem {
  private readonly MAX_RELEVANT_MEMORIES = 10
  private readonly MEMORY_WINDOW_HOURS = 24

  /**
   * Processa mensagem com contexto de memória completo
   */
  async processMessageWithMemory(
    userId: string, 
    conversationId: string, 
    message: string, 
    role: 'user' | 'assistant'
  ): Promise<MemoryResponse> {
    try {
      console.log(`🧠 Processando mensagem com memória - User: ${userId}, Conversation: ${conversationId}`)

      // 1. Inicializar contexto de conversa
      const conversationState = await conversationContextManager.initializeConversation(conversationId, userId)
      
      // 2. Adicionar mensagem ao contexto
      await conversationContextManager.addMessage(conversationId, userId, role, message)

      // 3. Obter perfil do usuário
      const userProfile = await userProfileManager.getUserProfile(userId)

      // 4. Buscar memórias relevantes
      const relevantMemories = await this.getRelevantMemories(userId, conversationId, message)

      // 5. Obter insights e recomendações
      const insights = await learningSystem.getUserInsights(userId)
      const recommendations = await learningSystem.generateRecommendations(userId)

      // 6. Criar contexto de memória
      const memoryContext: MemoryContext = {
        userId,
        conversationId,
        userProfile,
        conversationState,
        relevantMemories,
        insights,
        recommendations
      }

      // 7. Gerar prompt personalizado
      const personalizedPrompt = await this.generatePersonalizedPrompt(memoryContext, message)

      // 8. Determinar se deve armazenar dados
      const shouldStore = this.shouldStoreMessage(message, role)
      const storeData = shouldStore ? this.prepareStoreData(userId, conversationId, message, role) : undefined

      // 9. Registrar interação para aprendizado
      await userProfileManager.recordInteraction(userId, 'message_exchange', {
        messageLength: message.length,
        hasUserProfile: !!userProfile,
        memoryCount: relevantMemories.length
      })

      console.log(`✅ Contexto de memória processado - Memórias: ${relevantMemories.length}, Insights: ${insights.length}`)

      return {
        context: memoryContext,
        personalizedPrompt,
        shouldStore,
        storeData
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem com memória:', error)
      throw new Error('Falha no sistema de memória')
    }
  }

  /**
   * Obtém memórias relevantes para a mensagem
   */
  private async getRelevantMemories(userId: string, conversationId: string, message: string): Promise<any[]> {
    try {
      const memories: any[] = []

      // 1. Memórias da conversa atual
      const conversationMemories = await memoryManager.retrieve({
        userId,
        conversationId,
        category: MemoryCategory.CONVERSATION,
        limit: 5
      })
      memories.push(...conversationMemories)

      // 2. Memórias do perfil do usuário
      const profileMemories = await memoryManager.retrieve({
        userId,
        category: MemoryCategory.USER_PROFILE,
        limit: 3
      })
      memories.push(...profileMemories)

      // 3. Memórias de contexto empresarial
      const businessMemories = await memoryManager.retrieve({
        userId,
        category: MemoryCategory.BUSINESS_CONTEXT,
        limit: 3
      })
      memories.push(...businessMemories)

      // 4. Memórias de preferências
      const preferenceMemories = await memoryManager.retrieve({
        userId,
        category: MemoryCategory.PREFERENCES,
        limit: 2
      })
      memories.push(...preferenceMemories)

      // 5. Busca semântica por palavras-chave
      const keywords = this.extractKeywords(message)
      for (const keyword of keywords) {
        const semanticMemories = await memoryManager.semanticSearch(keyword, userId)
        memories.push(...semanticMemories.map(s => s.memory))
      }

      // 6. Filtrar e ordenar por relevância
      const relevantMemories = this.rankMemoriesByRelevance(memories, message)
      
      return relevantMemories.slice(0, this.MAX_RELEVANT_MEMORIES)
    } catch (error) {
      console.error('❌ Erro ao obter memórias relevantes:', error)
      return []
    }
  }

  /**
   * Gera prompt personalizado com contexto de memória
   */
  private async generatePersonalizedPrompt(context: MemoryContext, message: string): Promise<string> {
    try {
      let prompt = `Você é a Secretária Virtual do Falachefe, uma assistente pessoal especializada em gestão empresarial.\n\n`

      // Adicionar contexto do usuário
      if (context.userProfile) {
        const profileSummary = await userProfileManager.getProfileSummary(context.userId)
        if (profileSummary) {
          prompt += `CONTEXTO DO USUÁRIO:\n${profileSummary}\n\n`
        }
      }

      // Adicionar contexto da conversa
      if (context.conversationState) {
        const conversationSummary = await conversationContextManager.getContextSummary(context.conversationId!)
        if (conversationSummary) {
          prompt += `CONTEXTO DA CONVERSA:\n${conversationSummary}\n\n`
        }
      }

      // Adicionar memórias relevantes
      if (context.relevantMemories.length > 0) {
        prompt += `INFORMAÇÕES RELEVANTES:\n`
        for (const memory of context.relevantMemories) {
          prompt += `- ${memory.key}: ${JSON.stringify(memory.value)}\n`
        }
        prompt += `\n`
      }

      // Adicionar insights
      if (context.insights.length > 0) {
        prompt += `INSIGHTS DO USUÁRIO:\n`
        for (const insight of context.insights.slice(0, 3)) {
          prompt += `- ${insight.title}: ${insight.description}\n`
        }
        prompt += `\n`
      }

      // Adicionar recomendações
      if (context.recommendations.length > 0) {
        prompt += `RECOMENDAÇÕES PERSONALIZADAS:\n`
        for (const rec of context.recommendations.slice(0, 2)) {
          prompt += `- ${rec.title}: ${rec.description}\n`
        }
        prompt += `\n`
      }

      // Adicionar histórico da conversa
      if (context.conversationState?.messageHistory) {
        const history = await conversationContextManager.getFormattedHistory(context.conversationId!, 5)
        if (history) {
          prompt += `HISTÓRICO DA CONVERSA:\n${history}\n\n`
        }
      }

      // Adicionar instruções finais
      prompt += `INSTRUÇÕES:\n`
      prompt += `- Use o contexto fornecido para personalizar sua resposta\n`
      prompt += `- Mantenha consistência com informações anteriores\n`
      prompt += `- Seja proativa baseada nos insights do usuário\n`
      prompt += `- Foque no valor empresarial e produtividade\n`
      prompt += `- Responda em português brasileiro\n\n`
      prompt += `MENSAGEM DO USUÁRIO: ${message}`

      return prompt
    } catch (error) {
      console.error('❌ Erro ao gerar prompt personalizado:', error)
      return message // Fallback para mensagem original
    }
  }

  /**
   * Extrai palavras-chave da mensagem
   */
  private extractKeywords(message: string): string[] {
    const keywords: string[] = []
    const lowerMessage = message.toLowerCase()

    // Palavras-chave financeiras
    const financialKeywords = ['financeiro', 'dinheiro', 'receita', 'despesa', 'fluxo', 'caixa', 'orçamento', 'lucro']
    financialKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) keywords.push(keyword)
    })

    // Palavras-chave de organização
    const orgKeywords = ['cliente', 'fornecedor', 'tarefa', 'projeto', 'contato', 'agenda']
    orgKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) keywords.push(keyword)
    })

    // Palavras-chave de relatórios
    const reportKeywords = ['relatório', 'análise', 'dashboard', 'gráfico', 'estatística']
    reportKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) keywords.push(keyword)
    })

    return keywords
  }

  /**
   * Classifica memórias por relevância
   */
  private rankMemoriesByRelevance(memories: any[], message: string): any[] {
    const lowerMessage = message.toLowerCase()

    return memories
      .map(memory => {
        let relevanceScore = memory.importance || 0

        // Aumentar score se a chave da memória aparece na mensagem
        if (lowerMessage.includes(memory.key.toLowerCase())) {
          relevanceScore += 0.3
        }

        // Aumentar score se o valor da memória contém palavras da mensagem
        const memoryValue = JSON.stringify(memory.value).toLowerCase()
        const messageWords = lowerMessage.split(' ')
        const matchingWords = messageWords.filter(word => 
          word.length > 3 && memoryValue.includes(word)
        )
        relevanceScore += matchingWords.length * 0.1

        return { ...memory, relevanceScore }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Determina se deve armazenar a mensagem
   */
  private shouldStoreMessage(message: string, role: 'user' | 'assistant'): boolean {
    // Não armazenar respostas do assistente
    if (role === 'assistant') return false

    // Armazenar se contém informações importantes
    const importantPatterns = [
      /meu nome é/i,
      /me chamo/i,
      /minha empresa/i,
      /trabalho com/i,
      /preciso de/i,
      /quero/i,
      /objetivo/i,
      /meta/i
    ]

    return importantPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Prepara dados para armazenamento
   */
  private prepareStoreData(userId: string, conversationId: string, message: string, role: 'user' | 'assistant'): any {
    return {
      userId,
      conversationId,
      category: MemoryCategory.CONVERSATION,
      key: `message_${Date.now()}`,
      value: {
        role,
        content: message,
        timestamp: new Date().toISOString(),
        length: message.length
      },
      importance: this.calculateMessageImportance(message),
      ttl: 3600 // 1 hora
    }
  }

  /**
   * Calcula importância da mensagem
   */
  private calculateMessageImportance(message: string): number {
    let importance = MemoryImportance.LOW

    // Aumentar importância para informações pessoais
    if (message.includes('meu nome') || message.includes('me chamo')) {
      importance = MemoryImportance.HIGH
    }

    // Aumentar importância para contexto empresarial
    if (message.includes('empresa') || message.includes('negócio')) {
      importance = MemoryImportance.MEDIUM
    }

    // Aumentar importância para objetivos e metas
    if (message.includes('objetivo') || message.includes('meta')) {
      importance = MemoryImportance.HIGH
    }

    return importance
  }

  /**
   * Limpa memórias antigas
   */
  async cleanupOldMemories(): Promise<void> {
    try {
      const cleanedCount = await memoryManager.cleanupExpiredMemories()
      console.log(`🧹 Limpeza de memórias concluída: ${cleanedCount} memórias removidas`)
    } catch (error) {
      console.error('❌ Erro na limpeza de memórias:', error)
    }
  }

  /**
   * Obtém estatísticas do sistema de memória
   */
  async getMemoryStats(userId: string): Promise<any> {
    try {
      const stats = await memoryManager.getMemoryStats(userId)
      const profile = await userProfileManager.getUserProfile(userId)
      const insights = await learningSystem.getUserInsights(userId)

      return {
        ...stats,
        hasProfile: !!profile,
        insightsCount: insights.length,
        lastCleanup: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return {}
    }
  }
}

// Exportar instância singleton
export const falachefeMemorySystem = new FalachefeMemorySystem()

