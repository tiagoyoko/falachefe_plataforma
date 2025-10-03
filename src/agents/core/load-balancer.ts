/**
 * Load Balancer for Agent Manager
 * Implements multiple load balancing strategies
 */

import { EventEmitter } from 'events'
import { 
  AgentInfo, 
  LoadBalancingStrategy, 
  LoadBalancerConfig, 
  LoadBalancerSelection,
  LoadBalancerError 
} from './types'

export class LoadBalancer extends EventEmitter {
  private strategies: Map<string, LoadBalancingStrategy>
  private agentWeights: Map<string, number>
  private roundRobinCounters: Map<string, number>
  private circuitBreakerStates: Map<string, CircuitBreakerState>
  private config: LoadBalancerConfig

  constructor(config: LoadBalancerConfig) {
    super()
    this.config = config
    this.strategies = new Map()
    this.agentWeights = new Map()
    this.roundRobinCounters = new Map()
    this.circuitBreakerStates = new Map()
    
    this.initializeStrategies()
  }

  private initializeStrategies(): void {
    // Set default strategies for each agent type
    this.strategies.set('financial', LoadBalancingStrategy.LEAST_LOAD)
    this.strategies.set('marketing_sales', LoadBalancingStrategy.ROUND_ROBIN)
    this.strategies.set('hr', LoadBalancingStrategy.WEIGHTED)
    this.strategies.set('general', LoadBalancingStrategy.LEAST_CONNECTIONS)
    this.strategies.set('orchestrator', LoadBalancingStrategy.LEAST_LOAD)

    // Override with custom strategies from config
    for (const [agentType, strategy] of this.config.strategies) {
      this.strategies.set(agentType, strategy)
    }
  }

  addAgent(agentInfo: AgentInfo): void {
    const weight = agentInfo.metadata.weight || 1
    this.agentWeights.set(agentInfo.id, weight)
    this.roundRobinCounters.set(agentInfo.id, 0)
    
    // Initialize circuit breaker state
    this.circuitBreakerStates.set(agentInfo.id, {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    })
  }

  removeAgent(agentId: string): void {
    this.agentWeights.delete(agentId)
    this.roundRobinCounters.delete(agentId)
    this.circuitBreakerStates.delete(agentId)
  }

  getAgents(agentType?: string): AgentInfo[] {
    // This is a simplified implementation since we don't have direct access to agent registry
    // In a real implementation, this would need access to the agent registry
    return []
  }

  selectAgent(agents: AgentInfo[], agentType: string): AgentInfo | null {
    if (agents.length === 0) {
      return null
    }

    // Filter out agents with open circuit breakers
    const availableAgents = agents.filter(agent => 
      this.isCircuitBreakerClosed(agent.id)
    )

    if (availableAgents.length === 0) {
      this.emit('circuitBreakerOpened', agentType, 'All agents have open circuit breakers')
      return null
    }

    const strategy = this.strategies.get(agentType) || this.config.defaultStrategy
    let selectedAgent: AgentInfo

    try {
      switch (strategy) {
        case LoadBalancingStrategy.ROUND_ROBIN:
          selectedAgent = this.roundRobinSelection(availableAgents, agentType)
          break
        
        case LoadBalancingStrategy.LEAST_CONNECTIONS:
          selectedAgent = this.leastConnectionsSelection(availableAgents)
          break
        
        case LoadBalancingStrategy.WEIGHTED:
          selectedAgent = this.weightedSelection(availableAgents)
          break
        
        case LoadBalancingStrategy.LEAST_LOAD:
          selectedAgent = this.leastLoadSelection(availableAgents)
          break
        
        default:
          selectedAgent = this.roundRobinSelection(availableAgents, agentType)
      }

      // Record selection
      const selection: LoadBalancerSelection = {
        agentId: selectedAgent.id,
        strategy,
        reason: `Selected using ${strategy} strategy`,
        timestamp: new Date()
      }

      this.emit('loadBalancerSelection', selection)
      return selectedAgent

    } catch (error) {
      throw new LoadBalancerError(`Failed to select agent using ${strategy} strategy: ${error}`)
    }
  }

  private roundRobinSelection(agents: AgentInfo[], agentType: string): AgentInfo {
    const counter = this.roundRobinCounters.get(agentType) || 0
    const selectedIndex = counter % agents.length
    const selectedAgent = agents[selectedIndex]
    
    this.roundRobinCounters.set(agentType, counter + 1)
    
    return selectedAgent
  }

  private leastConnectionsSelection(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) => 
      current.metrics.activeConnections < least.metrics.activeConnections 
        ? current 
        : least
    )
  }

  private weightedSelection(agents: AgentInfo[]): AgentInfo {
    const totalWeight = agents.reduce((sum, agent) => 
      sum + (this.agentWeights.get(agent.id) || 1), 0
    )
    
    if (totalWeight === 0) {
      return agents[0] // Fallback to first agent
    }
    
    let random = Math.random() * totalWeight
    
    for (const agent of agents) {
      const weight = this.agentWeights.get(agent.id) || 1
      random -= weight
      
      if (random <= 0) {
        return agent
      }
    }
    
    return agents[agents.length - 1] // Fallback to last agent
  }

  private leastLoadSelection(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) => 
      current.metrics.currentLoad < least.metrics.currentLoad 
        ? current 
        : least
    )
  }

  recordSuccess(agentId: string): void {
    const circuitBreakerState = this.circuitBreakerStates.get(agentId)
    if (circuitBreakerState) {
      circuitBreakerState.failures = 0
      if (circuitBreakerState.state === 'half-open') {
        circuitBreakerState.state = 'closed'
        this.emit('circuitBreakerClosed', agentId)
      }
    }
  }

  recordFailure(agentId: string): void {
    const circuitBreakerState = this.circuitBreakerStates.get(agentId)
    if (!circuitBreakerState) return

    circuitBreakerState.failures++
    circuitBreakerState.lastFailureTime = Date.now()

    if (circuitBreakerState.state === 'closed' && 
        circuitBreakerState.failures >= this.config.circuitBreaker.failureThreshold) {
      circuitBreakerState.state = 'open'
      circuitBreakerState.nextAttemptTime = Date.now() + this.config.circuitBreaker.recoveryTimeout
      this.emit('circuitBreakerOpened', agentId, `Failure threshold reached: ${circuitBreakerState.failures}`)
    }
  }

  private isCircuitBreakerClosed(agentId: string): boolean {
    const circuitBreakerState = this.circuitBreakerStates.get(agentId)
    if (!circuitBreakerState) return true

    const now = Date.now()

    switch (circuitBreakerState.state) {
      case 'closed':
        return true
      
      case 'open':
        if (now >= circuitBreakerState.nextAttemptTime) {
          circuitBreakerState.state = 'half-open'
          circuitBreakerState.failures = 0
          return true
        }
        return false
      
      case 'half-open':
        return circuitBreakerState.failures < this.config.circuitBreaker.halfOpenMaxCalls
      
      default:
        return true
    }
  }

  getAgentWeight(agentId: string): number {
    return this.agentWeights.get(agentId) || 1
  }

  setAgentWeight(agentId: string, weight: number): void {
    this.agentWeights.set(agentId, weight)
  }

  getStrategy(agentType: string): LoadBalancingStrategy {
    return this.strategies.get(agentType) || this.config.defaultStrategy
  }

  setStrategy(agentType: string, strategy: LoadBalancingStrategy): void {
    this.strategies.set(agentType, strategy)
  }

  getCircuitBreakerState(agentId: string): CircuitBreakerState | undefined {
    return this.circuitBreakerStates.get(agentId)
  }

  resetCircuitBreaker(agentId: string): void {
    const circuitBreakerState = this.circuitBreakerStates.get(agentId)
    if (circuitBreakerState) {
      circuitBreakerState.state = 'closed'
      circuitBreakerState.failures = 0
      circuitBreakerState.lastFailureTime = 0
      circuitBreakerState.nextAttemptTime = 0
    }
  }

  getStats(): LoadBalancerStats {
    const stats: LoadBalancerStats = {
      totalAgents: this.agentWeights.size,
      strategies: Object.fromEntries(this.strategies),
      circuitBreakerStates: Object.fromEntries(
        Array.from(this.circuitBreakerStates.entries()).map(([id, state]) => [
          id, 
          { state: state.state, failures: state.failures }
        ])
      ),
      roundRobinCounters: Object.fromEntries(this.roundRobinCounters),
      agentWeights: Object.fromEntries(this.agentWeights)
    }

    return stats
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime: number
  nextAttemptTime: number
}

interface LoadBalancerStats {
  totalAgents: number
  strategies: Record<string, LoadBalancingStrategy>
  circuitBreakerStates: Record<string, { state: string; failures: number }>
  roundRobinCounters: Record<string, number>
  agentWeights: Record<string, number>
}
