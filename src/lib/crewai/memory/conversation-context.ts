/**
 * Gerenciador de Contexto de Conversação
 * Mantém contexto e histórico de conversas para o agente secretário
 */

import { memoryManager } from './memory-manager'
import { MemoryCategory, MemoryImportance } from './types'

export interface ConversationState {
  conversationId: string
  userId: string
  currentTopic?: string
  lastIntent?: string
  userPreferences?: Record<string, any>
  businessContext?: Record<string, any>
  messageHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    metadata?: any
  }>
  contextVariables: Record<string, any>
}

export class ConversationContextManager {
  private readonly MAX_HISTORY_LENGTH = 20
  private readonly CONTEXT_TTL = 3600 // 1 hora

  /**
   * Inicializa ou recupera contexto de conversa
   */
  async initializeConversation(conversationId: string, userId: string): Promise<ConversationState> {
    try {
      // Tentar recuperar contexto existente
      const existingContext = await memoryManager.getConversationContext(conversationId)
      
      if (existingContext) {
        return this.buildConversationState(existingContext)
      }

      // Criar novo contexto
      const newContext = await memoryManager.updateConversationContext(conversationId, {
        userId,
        contextData: {
          currentTopic: null,
          lastIntent: null,
          userPreferences: {},
          businessContext: {},
          messageHistory: [],
          contextVariables: {}
        },
        messageCount: 0
      })

      return this.buildConversationState(newContext)
    } catch (error) {
      console.error('❌ Erro ao inicializar contexto de conversa:', error)
      throw new Error('Falha ao inicializar contexto de conversa')
    }
  }

  /**
   * Adiciona mensagem ao contexto
   */
  async addMessage(
    conversationId: string, 
    userId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: any
  ): Promise<void> {
    try {
      const context = await this.initializeConversation(conversationId, userId)
      
      // Adicionar mensagem ao histórico
      context.messageHistory.push({
        role,
        content,
        timestamp: new Date(),
        metadata
      })

      // Manter apenas as últimas mensagens
      if (context.messageHistory.length > this.MAX_HISTORY_LENGTH) {
        context.messageHistory = context.messageHistory.slice(-this.MAX_HISTORY_LENGTH)
      }

      // Atualizar contexto
      await memoryManager.updateConversationContext(conversationId, {
        contextData: {
          ...context,
          messageHistory: context.messageHistory
        },
        messageCount: context.messageHistory.length
      })

      // Armazenar memória da mensagem se importante
      if (this.isImportantMessage(content, role)) {
        await this.storeMessageMemory(conversationId, userId, role, content, metadata)
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem ao contexto:', error)
    }
  }

  /**
   * Atualiza tópico atual da conversa
   */
  async updateCurrentTopic(conversationId: string, topic: string): Promise<void> {
    try {
      const context = await memoryManager.getConversationContext(conversationId)
      if (!context) return

      const contextData = context.contextData as ConversationState
      contextData.currentTopic = topic

      await memoryManager.updateConversationContext(conversationId, {
        contextData
      })

      // Armazenar como memória se for um tópico importante
      if (this.isImportantTopic(topic)) {
        await memoryManager.store({
          userId: context.userId,
          conversationId,
          category: MemoryCategory.CONVERSATION,
          key: 'current_topic',
          value: topic,
          importance: MemoryImportance.MEDIUM,
          ttl: this.CONTEXT_TTL
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar tópico:', error)
    }
  }

  /**
   * Atualiza última intenção detectada
   */
  async updateLastIntent(conversationId: string, intent: string): Promise<void> {
    try {
      const context = await memoryManager.getConversationContext(conversationId)
      if (!context) return

      const contextData = context.contextData as ConversationState
      contextData.lastIntent = intent

      await memoryManager.updateConversationContext(conversationId, {
        contextData
      })
    } catch (error) {
      console.error('❌ Erro ao atualizar intenção:', error)
    }
  }

  /**
   * Atualiza variáveis de contexto
   */
  async updateContextVariables(conversationId: string, variables: Record<string, any>): Promise<void> {
    try {
      const context = await memoryManager.getConversationContext(conversationId)
      if (!context) return

      const contextData = context.contextData as ConversationState
      contextData.contextVariables = {
        ...contextData.contextVariables,
        ...variables
      }

      await memoryManager.updateConversationContext(conversationId, {
        contextData
      })
    } catch (error) {
      console.error('❌ Erro ao atualizar variáveis de contexto:', error)
    }
  }

  /**
   * Obtém contexto completo da conversa
   */
  async getConversationContext(conversationId: string): Promise<ConversationState | null> {
    try {
      const context = await memoryManager.getConversationContext(conversationId)
      if (!context) return null

      return this.buildConversationState(context)
    } catch (error) {
      console.error('❌ Erro ao obter contexto da conversa:', error)
      return null
    }
  }

  /**
   * Obtém histórico de mensagens formatado para o agente
   */
  async getFormattedHistory(conversationId: string, maxMessages: number = 10): Promise<string> {
    try {
      const context = await this.getConversationContext(conversationId)
      if (!context) return ''

      const recentMessages = context.messageHistory.slice(-maxMessages)
      
      return recentMessages.map(msg => {
        const role = msg.role === 'user' ? 'Usuário' : 'Assistente'
        const time = msg.timestamp.toLocaleTimeString('pt-BR')
        return `[${time}] ${role}: ${msg.content}`
      }).join('\n')
    } catch (error) {
      console.error('❌ Erro ao obter histórico formatado:', error)
      return ''
    }
  }

  /**
   * Obtém resumo do contexto para o agente
   */
  async getContextSummary(conversationId: string): Promise<string> {
    try {
      const context = await this.getConversationContext(conversationId)
      if (!context) return ''

      const summary = []
      
      if (context.currentTopic) {
        summary.push(`Tópico atual: ${context.currentTopic}`)
      }
      
      if (context.lastIntent) {
        summary.push(`Última intenção: ${context.lastIntent}`)
      }

      if (Object.keys(context.contextVariables).length > 0) {
        summary.push(`Variáveis: ${Object.keys(context.contextVariables).join(', ')}`)
      }

      if (context.userPreferences && Object.keys(context.userPreferences).length > 0) {
        summary.push(`Preferências: ${Object.keys(context.userPreferences).join(', ')}`)
      }

      return summary.join(' | ')
    } catch (error) {
      console.error('❌ Erro ao obter resumo do contexto:', error)
      return ''
    }
  }

  /**
   * Limpa contexto de conversa
   */
  async clearConversationContext(conversationId: string): Promise<void> {
    try {
      await memoryManager.updateConversationContext(conversationId, {
        contextData: {
          currentTopic: null,
          lastIntent: null,
          userPreferences: {},
          businessContext: {},
          messageHistory: [],
          contextVariables: {}
        },
        messageCount: 0
      })
    } catch (error) {
      console.error('❌ Erro ao limpar contexto:', error)
    }
  }

  /**
   * Verifica se mensagem é importante para armazenar
   */
  private isImportantMessage(content: string, role: 'user' | 'assistant'): boolean {
    if (role === 'assistant') return false // Não armazenar respostas do agente
    
    const importantKeywords = [
      'meu nome é', 'me chamo', 'sou o', 'sou a',
      'minha empresa', 'meu negócio', 'trabalho com',
      'preciso de', 'quero', 'gostaria',
      'objetivo', 'meta', 'planejamento'
    ]

    const lowerContent = content.toLowerCase()
    return importantKeywords.some(keyword => lowerContent.includes(keyword))
  }

  /**
   * Verifica se tópico é importante
   */
  private isImportantTopic(topic: string): boolean {
    const importantTopics = [
      'gestão financeira', 'fluxo de caixa', 'orçamento',
      'clientes', 'fornecedores', 'vendas',
      'projetos', 'tarefas', 'planejamento',
      'relatórios', 'análises', 'dashboard'
    ]

    const lowerTopic = topic.toLowerCase()
    return importantTopics.some(importantTopic => lowerTopic.includes(importantTopic))
  }

  /**
   * Armazena memória de mensagem importante
   */
  private async storeMessageMemory(
    conversationId: string, 
    userId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: any
  ): Promise<void> {
    try {
      await memoryManager.store({
        userId,
        conversationId,
        category: MemoryCategory.CONVERSATION,
        key: `message_${Date.now()}`,
        value: {
          role,
          content,
          timestamp: new Date().toISOString(),
          metadata
        },
        importance: MemoryImportance.MEDIUM,
        ttl: this.CONTEXT_TTL
      })
    } catch (error) {
      console.error('❌ Erro ao armazenar memória de mensagem:', error)
    }
  }

  /**
   * Constrói estado de conversa a partir do contexto do banco
   */
  private buildConversationState(context: any): ConversationState {
    const contextData = context.contextData as ConversationState
    
    return {
      conversationId: context.conversationId,
      userId: context.userId,
      currentTopic: contextData.currentTopic,
      lastIntent: contextData.lastIntent,
      userPreferences: contextData.userPreferences || {},
      businessContext: contextData.businessContext || {},
      messageHistory: contextData.messageHistory || [],
      contextVariables: contextData.contextVariables || {}
    }
  }
}

// Exportar instância singleton
export const conversationContextManager = new ConversationContextManager()


