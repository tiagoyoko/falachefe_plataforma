/**
 * Agent State Manager
 * Manages agent state transitions and recovery
 */

import { EventEmitter } from 'events'
import { 
  AgentState, 
  StateManagerConfig, 
  AgentStateChangedEvent,
  AgentManagerError 
} from './types'

export class AgentStateManager extends EventEmitter {
  private agentStates: Map<string, AgentState>
  private stateHistory: Map<string, StateTransition[]>
  private recoveryAttempts: Map<string, number>
  private config: StateManagerConfig

  constructor(config: StateManagerConfig) {
    super()
    this.config = config
    this.agentStates = new Map()
    this.stateHistory = new Map()
    this.recoveryAttempts = new Map()
  }

  async setState(agentId: string, newState: AgentState, reason?: string): Promise<void> {
    const currentState = this.agentStates.get(agentId)
    
    if (currentState === newState) {
      return // No change needed
    }

    // For new agents, allow direct transition to any state from undefined
    if (currentState === undefined) {
      // Direct assignment without validation for new agents
      this.agentStates.set(agentId, newState)
      this.emit('stateChanged', {
        agentId,
        oldState: undefined,
        newState,
        reason
      })
      return
    }

    // Validate state transition for existing agents
    if (!this.isValidTransition(currentState, newState)) {
      throw new AgentManagerError(
        `Invalid state transition from ${currentState} to ${newState} for agent ${agentId}`,
        agentId,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Record state transition
    const transition: StateTransition = {
      from: currentState,
      to: newState,
      timestamp: new Date(),
      reason: reason || 'Manual state change'
    }

    this.recordStateTransition(agentId, transition)
    this.agentStates.set(agentId, newState)

    // Emit state change event
    const event: AgentStateChangedEvent = {
      agentId,
      oldState: currentState || AgentState.INITIALIZING,
      newState,
      timestamp: new Date(),
      reason
    }

    this.emit('agentStateChanged', event)

    // Handle state-specific logic
    await this.handleStateChange(agentId, newState, currentState)
  }

  getState(agentId: string): AgentState | undefined {
    return this.agentStates.get(agentId) || AgentState.INACTIVE
  }

  removeAgent(agentId: string): void {
    this.agentStates.delete(agentId)
    this.stateHistory.delete(agentId)
    this.recoveryAttempts.delete(agentId)
    this.emit('agentUnregistered', { agentId })
  }

  registerAgent(agentId: string): void {
    this.emit('agentRegistered', { agentId })
  }

  unregisterAgent(agentId: string): void {
    this.removeAgent(agentId)
  }

  incrementRecoveryAttempts(agentId: string): void {
    const current = this.recoveryAttempts.get(agentId) || 0
    this.recoveryAttempts.set(agentId, current + 1)
  }

  getRecoveryAttempts(agentId: string): number {
    return this.recoveryAttempts.get(agentId) || 0
  }

  canRecover(agentId: string): boolean {
    const attempts = this.getRecoveryAttempts(agentId)
    return attempts < this.config.recoveryAttempts
  }

  getAllStates(): Map<string, AgentState> {
    return new Map(this.agentStates)
  }

  getStateHistory(agentId: string): StateTransition[] {
    return this.stateHistory.get(agentId) || []
  }

  async recoverAgent(agentId: string): Promise<boolean> {
    const currentState = this.agentStates.get(agentId)
    const attempts = this.recoveryAttempts.get(agentId) || 0

    if (attempts >= this.config.recoveryAttempts) {
      this.emit('recoveryFailed', agentId, 'Max recovery attempts reached')
      return false
    }

    if (currentState !== AgentState.ERROR) {
      return true // Agent is not in error state
    }

    try {
      // Wait for recovery delay
      await this.delay(this.config.recoveryDelay)
      
      // Attempt recovery
      await this.setState(agentId, AgentState.RECOVERING, 'Recovery attempt')
      
      // Simulate recovery process (in real implementation, this would call agent methods)
      await this.delay(1000)
      
      // Set to active if recovery successful
      await this.setState(agentId, AgentState.ACTIVE, 'Recovery successful')
      
      // Reset recovery attempts
      this.recoveryAttempts.set(agentId, 0)
      
      this.emit('agentRecovered', agentId)
      return true

    } catch (error) {
      // Increment recovery attempts
      this.recoveryAttempts.set(agentId, attempts + 1)
      
      // Set back to error state
      await this.setState(agentId, AgentState.ERROR, `Recovery failed: ${error}`)
      
      this.emit('recoveryFailed', agentId, error)
      return false
    }
  }

  async shutdownAgent(agentId: string): Promise<void> {
    const currentState = this.agentStates.get(agentId)
    
    if (currentState === AgentState.SHUTDOWN) {
      return // Already shutdown
    }

    await this.setState(agentId, AgentState.SHUTDOWN, 'Agent shutdown requested')
    
    // Clean up state data
    this.agentStates.delete(agentId)
    this.recoveryAttempts.delete(agentId)
    
    this.emit('agentShutdown', agentId)
  }

  isAgentActive(agentId: string): boolean {
    const state = this.agentStates.get(agentId)
    return state === AgentState.ACTIVE
  }

  isAgentInError(agentId: string): boolean {
    const state = this.agentStates.get(agentId)
    return state === AgentState.ERROR
  }

  getAgentsInState(state: AgentState): string[] {
    const agents: string[] = []
    
    for (const [agentId, agentState] of this.agentStates) {
      if (agentState === state) {
        agents.push(agentId)
      }
    }
    
    return agents
  }

  getActiveAgents(): string[] {
    return this.getAgentsInState(AgentState.ACTIVE)
  }

  getErrorAgents(): string[] {
    return this.getAgentsInState(AgentState.ERROR)
  }

  resetRecoveryAttempts(agentId: string): void {
    this.recoveryAttempts.set(agentId, 0)
  }

  private isValidTransition(from: AgentState | undefined, to: AgentState): boolean {
    // Define valid state transitions
    const validTransitions: Record<AgentState, AgentState[]> = {
      [AgentState.INITIALIZING]: [AgentState.ACTIVE, AgentState.ERROR, AgentState.SHUTDOWN],
      [AgentState.ACTIVE]: [AgentState.INACTIVE, AgentState.ERROR, AgentState.SHUTDOWN],
      [AgentState.INACTIVE]: [AgentState.ACTIVE, AgentState.ERROR, AgentState.SHUTDOWN],
      [AgentState.ERROR]: [AgentState.RECOVERING, AgentState.SHUTDOWN],
      [AgentState.RECOVERING]: [AgentState.ACTIVE, AgentState.ERROR, AgentState.SHUTDOWN],
      [AgentState.SHUTDOWN]: [] // Terminal state
    }

    if (!from) {
      return to === AgentState.INITIALIZING
    }

    return validTransitions[from].includes(to)
  }

  private recordStateTransition(agentId: string, transition: StateTransition): void {
    if (!this.stateHistory.has(agentId)) {
      this.stateHistory.set(agentId, [])
    }

    const history = this.stateHistory.get(agentId)!
    history.push(transition)

    // Limit history size
    if (history.length > this.config.stateHistorySize) {
      history.shift()
    }
  }

  private async handleStateChange(
    agentId: string, 
    newState: AgentState, 
    oldState: AgentState | undefined
  ): Promise<void> {
    switch (newState) {
      case AgentState.ERROR:
        // Start recovery process if auto-recovery is enabled
        this.emit('agentError', agentId, new Error('Agent entered error state'))
        break

      case AgentState.ACTIVE:
        // Reset recovery attempts when agent becomes active
        this.recoveryAttempts.set(agentId, 0)
        break

      case AgentState.SHUTDOWN:
        // Clean up resources
        this.cleanupAgent(agentId)
        break
    }
  }

  private cleanupAgent(agentId: string): void {
    this.agentStates.delete(agentId)
    this.recoveryAttempts.delete(agentId)
    // Keep state history for audit purposes
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStats(): StateManagerStats {
    const stats: StateManagerStats = {
      totalAgents: this.agentStates.size,
      states: {} as Record<AgentState, number>,
      recoveryAttempts: Object.fromEntries(this.recoveryAttempts),
      stateTransitions: 0
    }

    // Count agents by state
    for (const state of Object.values(AgentState)) {
      stats.states[state] = this.getAgentsInState(state).length
    }

    // Count total state transitions
    for (const history of this.stateHistory.values()) {
      stats.stateTransitions += history.length
    }

    return stats
  }
}

interface StateTransition {
  from: AgentState | undefined
  to: AgentState
  timestamp: Date
  reason: string
}

interface StateManagerStats {
  totalAgents: number
  states: Record<AgentState, number>
  recoveryAttempts: Record<string, number>
  stateTransitions: number
}
