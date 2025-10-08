/**
 * Agent Orchestrator - Central supervisor for Agent Squad
 * Based on AWS Labs Agent Squad Framework
 */

import AgentManager from './agent-manager'
import { BaseAgent, AgentResponse, AgentState } from './types'
import { MemorySystem } from './memory-system'
import { StreamingService, StreamingMessage } from './streaming-service'
import { v4 as uuidv4 } from 'uuid'

export interface OrchestratorConfig {
  agentManager: AgentManager
  memorySystem: MemorySystem
  streamingService: StreamingService
  enableLogging?: boolean
  logLevel?: string
  classification: {
    model: string
    temperature: number
    cacheEnabled: boolean
    cacheTTL: number
  }
  routing: {
    rules: RoutingRule[]
    fallbackAgent: string
  }
  context: {
    ttl: number
    maxHistory: number
    autoCleanup: boolean
  }
}

export interface RoutingRule {
  intents: string[]
  domains: string[]
  agentType: string
  priority: 'high' | 'normal' | 'low'
  minConfidence: number
  contextRequired?: boolean
  contextConditions?: ContextCondition[]
}

export interface ContextCondition {
  field: string
  operator: 'equals' | 'contains' | 'exists' | 'not_exists'
  value?: any
}

export interface IntentClassification {
  intent: string
  domain: string
  confidence: number
  reasoning: string
  suggestedAgent: string
}

export interface ConversationContext {
  conversationId: string
  userId: string
  agentId: string
  currentIntent: IntentClassification | null
  conversationHistory: ConversationMessage[]
  userPreferences: Record<string, any>
  sessionData: Record<string, any>
  metadata: {
    createdAt: Date
    lastUpdated: Date
    version: number
    updates?: ContextUpdate[]
  }
}

export interface ConversationMessage {
  role: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ContextUpdate {
  field: string
  value: unknown
  timestamp: Date
  source: 'user' | 'agent' | 'system'
  metadata?: Record<string, unknown>
}

export interface OrchestratorResponse {
  agentId: string
  agentType: string
  response: string
  confidence: number
  processingTime: number
  shouldSendToUaz: boolean
  metadata?: Record<string, any>
}

export class AgentOrchestrator {
  private agentManager: AgentManager
  private memorySystem: MemorySystem
  private streamingService: StreamingService
  private config: OrchestratorConfig
  private classificationCache: Map<string, IntentClassification> = new Map()

  constructor(config: OrchestratorConfig) {
    this.agentManager = config.agentManager
    this.memorySystem = config.memorySystem
    this.streamingService = config.streamingService
    this.config = config
  }

  public async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now()

    try {
      // 1. Load conversation context
      const conversationContext = await this.loadConversationContext(
        context.conversationId
      )

      // 2. Classify intent
      const intent = await this.classifyIntent(message, conversationContext)

      // 3. Route to appropriate agent
      const targetAgent = await this.routeToAgent(intent, conversationContext)

      if (!targetAgent) {
        throw new Error('No suitable agent found for this message')
      }

      // 4. Process message with selected agent
      // Find the agent info to get the ID
      const agentInfo = this.agentManager.getAgentsByType(targetAgent.constructor.name).find(
        agent => agent.agent === targetAgent
      )
      
      if (!agentInfo) {
        throw new Error('Agent info not found for selected agent')
      }
      
      const agentResponse = await this.agentManager.processMessage(
        agentInfo.id,
        message,
        {
          conversationId: context.conversationId,
          userId: context.userId,
          intent,
          context: conversationContext
        }
      )

      // 5. Update conversation context
      await this.updateConversationContext(
        context.conversationId,
        {
          currentIntent: intent,
          userPreferences: {
            ...conversationContext.userPreferences,
            lastMessage: message,
            lastIntent: intent.intent,
            lastAgent: agentInfo.type
          },
        conversationHistory: [
          ...conversationContext.conversationHistory.slice(-this.config.context.maxHistory),
          {
            role: 'user',
            content: message,
            timestamp: new Date()
          }
        ]
        }
      )

      // 6. Send streaming update if needed
      await this.sendStreamingUpdate(
        context.conversationId,
        agentInfo.id,
        agentResponse
      )

      const processingTime = Date.now() - startTime

      return {
        agentId: agentInfo.id,
        agentType: agentInfo.type,
        response: agentResponse.response,
        confidence: agentResponse.confidence,
        processingTime,
        shouldSendToUaz: true,
        metadata: {
          intent: intent.intent,
          domain: intent.domain,
          reasoning: intent.reasoning
        }
      }

    } catch (error) {
      console.error('Agent Orchestrator Error:', error)
      
      return {
        agentId: 'error',
        agentType: 'error',
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        confidence: 0,
        processingTime: Date.now() - startTime,
        shouldSendToUaz: true,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async classifyIntent(
    message: string,
    context: ConversationContext
  ): Promise<IntentClassification> {
    const cacheKey = this.generateCacheKey(message, context)
    
    // Check cache first
    if (this.config.classification.cacheEnabled) {
      const cached = this.classificationCache.get(cacheKey)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }
    }

    // Classify using LLM (simplified implementation)
    const classification = await this.performIntentClassification(message, context)

    // Cache result
    if (this.config.classification.cacheEnabled) {
      this.classificationCache.set(cacheKey, classification)
    }

    return classification
  }

  private async performIntentClassification(
    message: string,
    context: ConversationContext
  ): Promise<IntentClassification> {
    // This is a simplified implementation
    // In a real scenario, you would use OpenAI or another LLM service
    
    const lowerMessage = message.toLowerCase()
    
    // Financial intents
    if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('pagamento')) {
      return {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        reasoning: 'Message contains financial expense keywords',
        suggestedAgent: 'financial'
      }
    }
    
    if (lowerMessage.includes('receita') || lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
      return {
        intent: 'add_revenue',
        domain: 'financial',
        confidence: 0.9,
        reasoning: 'Message contains financial revenue keywords',
        suggestedAgent: 'financial'
      }
    }
    
    if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('caixa') || lowerMessage.includes('saldo')) {
      return {
        intent: 'cashflow_analysis',
        domain: 'financial',
        confidence: 0.8,
        reasoning: 'Message contains cash flow analysis keywords',
        suggestedAgent: 'financial'
      }
    }

    // Marketing/Sales intents
    if (lowerMessage.includes('lead') || lowerMessage.includes('prospecto') || lowerMessage.includes('cliente')) {
      return {
        intent: 'lead_management',
        domain: 'marketing',
        confidence: 0.8,
        reasoning: 'Message contains lead management keywords',
        suggestedAgent: 'marketing_sales'
      }
    }

    // Default to general query
    return {
      intent: 'general_query',
      domain: 'general',
      confidence: 0.5,
      reasoning: 'No specific intent detected, defaulting to general query',
      suggestedAgent: 'general'
    }
  }

  private async routeToAgent(
    intent: IntentClassification,
    context: ConversationContext
  ): Promise<BaseAgent | null> {
    console.log('🔍 Routing to agent for intent:', intent)
    console.log('📋 Available routing rules:', this.config.routing.rules.length)
    
    // Apply routing rules
    for (const rule of this.config.routing.rules) {
      console.log(`🔍 Checking rule for agentType: ${rule.agentType}`)
      if (this.matchesRule(intent, context, rule)) {
        console.log(`✅ Rule matched for ${rule.agentType}`)
        const agents = this.agentManager.getAgentsByType(rule.agentType)
        console.log(`📊 Found ${agents.length} agents of type ${rule.agentType}`)
        const availableAgent = agents.find(agent => agent.state === AgentState.ACTIVE)
        
        if (availableAgent) {
          console.log(`✅ Found available agent: ${availableAgent.id}`)
          return availableAgent.agent
        }
      }
    }

    // Fallback to suggested agent
    console.log(`🔄 Trying suggested agent: ${intent.suggestedAgent}`)
    const suggestedAgents = this.agentManager.getAgentsByType(intent.suggestedAgent)
    console.log(`📊 Found ${suggestedAgents.length} suggested agents`)
    const availableSuggested = suggestedAgents.find(agent => agent.state === AgentState.ACTIVE)
    
    if (availableSuggested) {
      console.log(`✅ Found available suggested agent: ${availableSuggested.id}`)
      return availableSuggested.agent
    }

    // Final fallback
    console.log(`🔄 Trying fallback agent: ${this.config.routing.fallbackAgent}`)
    const fallbackAgents = this.agentManager.getAgentsByType(this.config.routing.fallbackAgent)
    console.log(`📊 Found ${fallbackAgents.length} fallback agents`)
    const fallbackAgent = fallbackAgents.find(agent => agent.state === AgentState.ACTIVE)
    return fallbackAgent ? fallbackAgent.agent : null
  }

  private matchesRule(
    intent: IntentClassification,
    context: ConversationContext,
    rule: RoutingRule
  ): boolean {
    // Check intent
    if (rule.intents && !rule.intents.includes(intent.intent)) {
      return false
    }

    // Check domain
    if (rule.domains && !rule.domains.includes(intent.domain)) {
      return false
    }

    // Check confidence
    if (intent.confidence < rule.minConfidence) {
      return false
    }

    // Check context conditions
    if (rule.contextConditions) {
      for (const condition of rule.contextConditions) {
        if (!this.evaluateCondition(context, condition)) {
          return false
        }
      }
    }

    return true
  }

  private evaluateCondition(
    context: ConversationContext,
    condition: ContextCondition
  ): boolean {
    const value = this.getContextValue(context, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value)
      case 'exists':
        return value !== undefined && value !== null
      case 'not_exists':
        return value === undefined || value === null
      default:
        return false
    }
  }

  private getContextValue(context: ConversationContext, field: string): any {
    const fields = field.split('.')
    let value: any = context
    
    for (const f of fields) {
      value = value?.[f]
      if (value === undefined) break
    }
    
    return value
  }

  private async loadConversationContext(conversationId: string): Promise<ConversationContext> {
    // Load from memory system
    const sharedMemories = await this.memorySystem.getSharedMemory(conversationId)
    const individualMemories = await this.memorySystem.getIndividualMemory(conversationId, '*')

    // Build context from memories
    const context: ConversationContext = {
      conversationId,
      userId: '',
      agentId: '',
      currentIntent: null,
      conversationHistory: [],
      userPreferences: {},
      sessionData: {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
    }

    // Merge shared memory data
    for (const memory of sharedMemories) {
      Object.assign(context, memory.memoryData)
    }

    // Merge individual memory data
    for (const memory of individualMemories) {
      // Store individual memory data in sessionData
      context.sessionData[memory.agentType] = memory.memoryData
    }

    return context
  }

  private async updateConversationContext(
    conversationId: string,
    updates: Partial<ConversationContext>
  ): Promise<void> {
    await this.memorySystem.setSharedMemory(conversationId, updates)
  }

  private async sendStreamingUpdate(
    conversationId: string,
    agentId: string,
    response: AgentResponse
  ): Promise<void> {
    const connections = this.streamingService.getConnectionsByConversation(conversationId)
    
    for (const connection of connections) {
      this.streamingService.sendMessage(connection.id, {
        conversationId,
        agentId,
        type: 'message',
        content: response.response,
        metadata: {
          confidence: response.confidence,
          processingTime: response.processingTime
        }
      })
    }
  }

  private generateCacheKey(message: string, context: ConversationContext): string {
    return `${message}_${context.conversationId}_${context.userId}`
  }

  private isCacheValid(classification: IntentClassification): boolean {
    // Simple TTL check - in real implementation, you'd store timestamps
    return true
  }

  public getStats(): Record<string, any> {
    return {
      agentManager: this.agentManager.getAgentStats(),
      memorySystem: this.memorySystem.getMemoryStats(),
      streamingService: this.streamingService.getStats(),
      classificationCache: {
        size: this.classificationCache.size,
        enabled: this.config.classification.cacheEnabled
      }
    }
  }

  public async initialize(): Promise<void> {
    // Initialize orchestrator-specific components
    console.log('Initializing Agent Orchestrator...')
  }

  public async processIncomingMessage(message: any): Promise<any> {
    const context: ConversationContext = {
      conversationId: message.chatId || message.conversationId || 'default',
      userId: message.sender || message.userId || 'unknown',
      agentId: '',
      currentIntent: null,
      conversationHistory: [],
      userPreferences: message.metadata || {},
      sessionData: {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
    }
    // Extract the message content string
    const messageContent = message.content || message.message || message
    return await this.processMessage(messageContent, context)
  }
}

export default AgentOrchestrator
