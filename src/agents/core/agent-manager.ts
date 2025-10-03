/**
 * Agent Manager - Core component for managing Agent Squad agents
 * Based on AWS Labs Agent Squad Framework
 */

import { v4 as uuidv4 } from 'uuid'

export interface AgentConfig {
  id: string
  type: string
  name: string
  description: string
  capabilities: string[]
  isActive: boolean
  config: Record<string, any>
}

export interface AgentResponse {
  agentId: string
  response: string
  confidence: number
  processingTime: number
  metadata?: Record<string, any>
}

export abstract class BaseAgent {
  public readonly id: string
  public readonly type: string
  public readonly name: string
  public readonly description: string
  public readonly capabilities: string[]
  public isActive: boolean
  protected config: Record<string, any>

  constructor(config: AgentConfig) {
    this.id = config.id
    this.type = config.type
    this.name = config.name
    this.description = config.description
    this.capabilities = config.capabilities
    this.isActive = config.isActive
    this.config = config.config
  }

  abstract processMessage(
    message: string,
    context: Record<string, any>
  ): Promise<AgentResponse>

  abstract isAvailable(): boolean

  public updateConfig(newConfig: Partial<Record<string, any>>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getConfig(): Record<string, any> {
    return { ...this.config }
  }
}

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map()
  private agentTypes: Map<string, string[]> = new Map()

  constructor() {
    this.initializeAgentTypes()
  }

  private initializeAgentTypes(): void {
    this.agentTypes.set('financial', [
      'add_expense',
      'add_revenue',
      'cashflow_analysis',
      'budget_planning',
      'financial_query'
    ])
    
    this.agentTypes.set('marketing_sales', [
      'lead_management',
      'campaign_analysis',
      'sales_report',
      'marketing_query'
    ])
    
    this.agentTypes.set('hr', [
      'employee_management',
      'payroll',
      'hr_query'
    ])
    
    this.agentTypes.set('general', [
      'help',
      'settings',
      'general_query'
    ])
  }

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent)
  }

  public unregisterAgent(agentId: string): void {
    this.agents.delete(agentId)
  }

  public getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId)
  }

  public getAgentsByType(type: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type)
  }

  public getAvailableAgents(): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.isActive && agent.isAvailable()
    )
  }

  public getAgentCapabilities(agentId: string): string[] {
    const agent = this.agents.get(agentId)
    return agent ? agent.capabilities : []
  }

  public canHandleIntent(agentId: string, intent: string): boolean {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    return agent.capabilities.includes(intent)
  }

  public async processMessage(
    agentId: string,
    message: string,
    context: Record<string, any>
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`)
    }

    if (!agent.isActive || !agent.isAvailable()) {
      throw new Error(`Agent ${agentId} is not available`)
    }

    const startTime = Date.now()
    const response = await agent.processMessage(message, context)
    const processingTime = Date.now() - startTime

    return {
      ...response,
      processingTime
    }
  }

  public getAgentStats(): Record<string, any> {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: this.getAvailableAgents().length,
      agentsByType: {} as Record<string, number>,
      capabilities: new Set<string>()
    }

    this.agents.forEach(agent => {
      stats.agentsByType[agent.type] = (stats.agentsByType[agent.type] || 0) + 1
      agent.capabilities.forEach(cap => stats.capabilities.add(cap))
    })

    return {
      ...stats,
      capabilities: Array.from(stats.capabilities)
    }
  }

  public getAgentsCount(): number {
    return this.agents.size
  }

  public getActiveAgentsCount(): number {
    return this.getAvailableAgents().length
  }
}

export default AgentManager
