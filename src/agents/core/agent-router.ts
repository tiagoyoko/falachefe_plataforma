/**
 * Agent Router - Intelligent routing system for Agent Squad
 * Based on AWS Labs Agent Squad Framework
 */

import { BaseAgent } from './agent-manager'
import { IntentClassification, ConversationContext } from './agent-orchestrator'

export interface AgentRoute {
  agent: BaseAgent
  priority: 'high' | 'normal' | 'low'
  reason: string
  estimatedTime: number
  confidence: number
  fallbackAgent?: BaseAgent
}

export interface RoutingRule {
  id: string
  name: string
  intents: string[]
  domains: string[]
  agentType: string
  priority: 'high' | 'normal' | 'low'
  minConfidence: number
  maxConfidence?: number
  contextRequired: boolean
  contextConditions?: ContextCondition[]
  estimatedTime: number
  enabled: boolean
  description: string
}

export interface ContextCondition {
  field: string
  operator: 'equals' | 'contains' | 'exists' | 'not_exists' | 'greater_than' | 'less_than'
  value?: unknown
  description: string
}

export interface RouterConfig {
  rules: RoutingRule[]
  fallbackAgent: string
  enableLoadBalancing: boolean
  enablePriorityRouting: boolean
  maxRetries: number
  retryDelay: number
  enableMetrics: boolean
}

export interface RoutingMetrics {
  totalRoutes: number
  successfulRoutes: number
  failedRoutes: number
  averageRoutingTime: number
  routesByAgent: Record<string, number>
  routesByPriority: Record<string, number>
  routesByIntent: Record<string, number>
  lastReset: Date
}

export class AgentRouter {
  private rules: Map<string, RoutingRule> = new Map()
  private fallbackAgentType: string
  private config: RouterConfig
  private metrics: RoutingMetrics
  private logger: Console

  constructor(config: RouterConfig) {
    this.config = config
    this.fallbackAgentType = config.fallbackAgent
    this.logger = console
    this.metrics = this.initializeMetrics()
    
    // Indexar regras por ID
    for (const rule of config.rules) {
      this.rules.set(rule.id, rule)
    }
  }

  private initializeMetrics(): RoutingMetrics {
    return {
      totalRoutes: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      averageRoutingTime: 0,
      routesByAgent: {},
      routesByPriority: {},
      routesByIntent: {},
      lastReset: new Date()
    }
  }

  async route(
    intent: IntentClassification,
    context: ConversationContext,
    availableAgents: BaseAgent[]
  ): Promise<AgentRoute | null> {
    const startTime = Date.now()
    
    try {
      this.metrics.totalRoutes++
      
      // 1. Aplicar regras de roteamento em ordem de prioridade
      const matchingRules = this.findMatchingRules(intent, context)
      
      for (const rule of matchingRules) {
        const agent = this.findAgentByType(rule.agentType, availableAgents)
        
        if (agent && agent.isAvailable()) {
          const route = this.createRoute(agent, rule, intent, context)
          
          this.updateMetrics(route, intent, Date.now() - startTime)
          this.logger.log(`Route found: ${agent.type} for intent ${intent.intent} (${rule.name})`)
          
          return route
        }
      }

      // 2. Roteamento baseado em domínio
      const domainAgent = this.findAgentByDomain(intent.domain, availableAgents)
      if (domainAgent && domainAgent.isAvailable()) {
        const route = this.createDomainRoute(domainAgent, intent, context)
        
        this.updateMetrics(route, intent, Date.now() - startTime)
        this.logger.log(`Domain route found: ${domainAgent.type} for domain ${intent.domain}`)
        
        return route
      }

      // 3. Roteamento baseado na sugestão do classificador
      const suggestedAgent = this.findAgentByType(intent.suggestedAgent, availableAgents)
      if (suggestedAgent && suggestedAgent.isAvailable()) {
        const route = this.createSuggestedRoute(suggestedAgent, intent, context)
        
        this.updateMetrics(route, intent, Date.now() - startTime)
        this.logger.log(`Suggested route found: ${suggestedAgent.type} for intent ${intent.intent}`)
        
        return route
      }

      // 4. Fallback para agente geral
      const fallbackAgent = this.findAgentByType(this.fallbackAgentType, availableAgents)
      if (fallbackAgent && fallbackAgent.isAvailable()) {
        const route = this.createFallbackRoute(fallbackAgent, intent, context)
        
        this.updateMetrics(route, intent, Date.now() - startTime)
        this.logger.log(`Fallback route found: ${fallbackAgent.type}`)
        
        return route
      }

      // 5. Nenhum agente disponível
      this.metrics.failedRoutes++
      this.logger.warn(`No available agents found for intent: ${intent.intent}`)
      
      return null

    } catch (error) {
      this.metrics.failedRoutes++
      this.logger.error('Routing error:', error)
      return null
    }
  }

  private findMatchingRules(
    intent: IntentClassification,
    context: ConversationContext
  ): RoutingRule[] {
    const matchingRules: RoutingRule[] = []

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      if (this.matchesRule(intent, context, rule)) {
        matchingRules.push(rule)
      }
    }

    // Ordenar por prioridade (high -> normal -> low)
    return matchingRules.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private matchesRule(
    intent: IntentClassification,
    context: ConversationContext,
    rule: RoutingRule
  ): boolean {
    // Verificar intenção
    if (rule.intents.length > 0 && !rule.intents.includes(intent.intent)) {
      return false
    }

    // Verificar domínio
    if (rule.domains.length > 0 && !rule.domains.includes(intent.domain)) {
      return false
    }

    // Verificar confiança mínima
    if (intent.confidence < rule.minConfidence) {
      return false
    }

    // Verificar confiança máxima
    if (rule.maxConfidence && intent.confidence > rule.maxConfidence) {
      return false
    }

    // Verificar condições de contexto
    if (rule.contextRequired && rule.contextConditions) {
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
        return typeof value === 'string' && typeof condition.value === 'string' && value.includes(condition.value)
      case 'exists':
        return value !== undefined && value !== null
      case 'not_exists':
        return value === undefined || value === null
      case 'greater_than':
        return typeof value === 'number' && typeof condition.value === 'number' && value > condition.value
      case 'less_than':
        return typeof value === 'number' && typeof condition.value === 'number' && value < condition.value
      default:
        return false
    }
  }

  private getContextValue(context: ConversationContext, field: string): unknown {
    const fields = field.split('.')
    let value: unknown = context
    
    for (const f of fields) {
      value = (value as Record<string, unknown>)?.[f]
      if (value === undefined) break
    }
    
    return value
  }

  private findAgentByType(type: string, availableAgents: BaseAgent[]): BaseAgent | null {
    return availableAgents.find(agent => agent.type === type) || null
  }

  private findAgentByDomain(domain: string, availableAgents: BaseAgent[]): BaseAgent | null {
    // Mapear domínios para tipos de agente
    const domainMapping: Record<string, string> = {
      'financial': 'financial',
      'marketing': 'marketing_sales',
      'hr': 'hr',
      'system': 'general',
      'general': 'general'
    }

    const agentType = domainMapping[domain]
    if (!agentType) return null

    return this.findAgentByType(agentType, availableAgents)
  }

  private createRoute(
    agent: BaseAgent,
    rule: RoutingRule,
    intent: IntentClassification,
    context: ConversationContext
  ): AgentRoute {
    return {
      agent,
      priority: rule.priority,
      reason: `${rule.name}: ${rule.description}`,
      estimatedTime: rule.estimatedTime,
      confidence: intent.confidence,
      fallbackAgent: this.findFallbackAgent(agent, context)
    }
  }

  private createDomainRoute(
    agent: BaseAgent,
    intent: IntentClassification,
    context: ConversationContext
  ): AgentRoute {
    return {
      agent,
      priority: 'normal',
      reason: `Domain-based routing: ${intent.domain}`,
      estimatedTime: 2000,
      confidence: intent.confidence * 0.8, // Reduzir confiança para roteamento por domínio
      fallbackAgent: this.findFallbackAgent(agent, context)
    }
  }

  private createSuggestedRoute(
    agent: BaseAgent,
    intent: IntentClassification,
    context: ConversationContext
  ): AgentRoute {
    return {
      agent,
      priority: 'normal',
      reason: `Classifier suggested: ${intent.suggestedAgent}`,
      estimatedTime: 2500,
      confidence: intent.confidence * 0.7, // Reduzir confiança para roteamento sugerido
      fallbackAgent: this.findFallbackAgent(agent, context)
    }
  }

  private createFallbackRoute(
    agent: BaseAgent,
    _intent: IntentClassification,
    _context: ConversationContext
  ): AgentRoute {
    return {
      agent,
      priority: 'low',
      reason: 'Fallback to general agent',
      estimatedTime: 3000,
      confidence: 0.3, // Baixa confiança para fallback
      fallbackAgent: undefined
    }
  }

  private findFallbackAgent(_primaryAgent: BaseAgent, _context: ConversationContext): BaseAgent | undefined {
    // Lógica para encontrar agente de fallback baseado no contexto
    // Por enquanto, retorna undefined (sem fallback)
    return undefined
  }

  private updateMetrics(route: AgentRoute, intent: IntentClassification, routingTime: number): void {
    this.metrics.successfulRoutes++
    
    // Atualizar métricas por agente
    const agentType = route.agent.type
    this.metrics.routesByAgent[agentType] = (this.metrics.routesByAgent[agentType] || 0) + 1
    
    // Atualizar métricas por prioridade
    this.metrics.routesByPriority[route.priority] = (this.metrics.routesByPriority[route.priority] || 0) + 1
    
    // Atualizar métricas por intenção
    this.metrics.routesByIntent[intent.intent] = (this.metrics.routesByIntent[intent.intent] || 0) + 1
    
    // Atualizar tempo médio de roteamento
    const totalTime = this.metrics.averageRoutingTime * (this.metrics.successfulRoutes - 1) + routingTime
    this.metrics.averageRoutingTime = totalTime / this.metrics.successfulRoutes
  }

  // Métodos de gerenciamento de regras
  public addRule(rule: RoutingRule): void {
    this.rules.set(rule.id, rule)
    this.logger.log(`Routing rule added: ${rule.name}`)
  }

  public updateRule(ruleId: string, updates: Partial<RoutingRule>): boolean {
    const rule = this.rules.get(ruleId)
    if (!rule) return false

    const updatedRule = { ...rule, ...updates }
    this.rules.set(ruleId, updatedRule)
    this.logger.log(`Routing rule updated: ${rule.name}`)
    return true
  }

  public removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId)
    if (!rule) return false

    this.rules.delete(ruleId)
    this.logger.log(`Routing rule removed: ${rule.name}`)
    return true
  }

  public getRule(ruleId: string): RoutingRule | undefined {
    return this.rules.get(ruleId)
  }

  public getAllRules(): RoutingRule[] {
    return Array.from(this.rules.values())
  }

  public getEnabledRules(): RoutingRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.enabled)
  }

  // Métodos de métricas
  public getMetrics(): RoutingMetrics {
    return { ...this.metrics }
  }

  public resetMetrics(): void {
    this.metrics = this.initializeMetrics()
    this.logger.log('Routing metrics reset')
  }

  public getSuccessRate(): number {
    if (this.metrics.totalRoutes === 0) return 0
    return this.metrics.successfulRoutes / this.metrics.totalRoutes
  }

  public getAgentLoad(agentType: string): number {
    return this.metrics.routesByAgent[agentType] || 0
  }

  // Métodos de validação
  public validateRule(rule: RoutingRule): string[] {
    const errors: string[] = []

    if (!rule.id || rule.id.trim() === '') {
      errors.push('Rule ID is required')
    }

    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule name is required')
    }

    if (!rule.agentType || rule.agentType.trim() === '') {
      errors.push('Agent type is required')
    }

    if (rule.intents.length === 0 && rule.domains.length === 0) {
      errors.push('Rule must specify at least one intent or domain')
    }

    if (rule.minConfidence < 0 || rule.minConfidence > 1) {
      errors.push('Min confidence must be between 0 and 1')
    }

    if (rule.maxConfidence && (rule.maxConfidence < 0 || rule.maxConfidence > 1)) {
      errors.push('Max confidence must be between 0 and 1')
    }

    if (rule.maxConfidence && rule.minConfidence > rule.maxConfidence) {
      errors.push('Min confidence cannot be greater than max confidence')
    }

    if (rule.estimatedTime < 0) {
      errors.push('Estimated time must be positive')
    }

    return errors
  }

  public validateAllRules(): Record<string, string[]> {
    const results: Record<string, string[]> = {}
    
    for (const [ruleId, rule] of this.rules) {
      results[ruleId] = this.validateRule(rule)
    }
    
    return results
  }

  // Métodos de debug
  public debugRoute(
    intent: IntentClassification,
    context: ConversationContext,
    availableAgents: BaseAgent[]
  ): {
    matchingRules: RoutingRule[]
    domainAgent: BaseAgent | null
    suggestedAgent: BaseAgent | null
    fallbackAgent: BaseAgent | null
    finalRoute: AgentRoute | null
  } {
    const matchingRules = this.findMatchingRules(intent, context)
    const domainAgent = this.findAgentByDomain(intent.domain, availableAgents)
    const suggestedAgent = this.findAgentByType(intent.suggestedAgent, availableAgents)
    const fallbackAgent = this.findAgentByType(this.fallbackAgentType, availableAgents)
    
    let finalRoute: AgentRoute | null = null
    
    // Simular roteamento sem executar
    for (const rule of matchingRules) {
      const agent = this.findAgentByType(rule.agentType, availableAgents)
      if (agent && agent.isAvailable()) {
        finalRoute = this.createRoute(agent, rule, intent, context)
        break
      }
    }

    return {
      matchingRules,
      domainAgent,
      suggestedAgent,
      fallbackAgent,
      finalRoute
    }
  }
}

export default AgentRouter
