/**
 * Health Checker for Agent Manager
 * Monitors agent health and availability
 */

import { EventEmitter } from 'events'
import { 
  BaseAgent, 
  HealthCheckConfig, 
  HealthCheckResult,
  AgentManagerError 
} from './types'

export class HealthChecker extends EventEmitter {
  private config: HealthCheckConfig
  private healthHistory: Map<string, HealthCheckResult[]>
  private consecutiveFailures: Map<string, number>
  private consecutiveSuccesses: Map<string, number>

  constructor(config: HealthCheckConfig) {
    super()
    this.config = config
    this.healthHistory = new Map()
    this.consecutiveFailures = new Map()
    this.consecutiveSuccesses = new Map()
  }

  async checkHealth(agent: BaseAgent): Promise<boolean> {
    const agentId = this.getAgentId(agent)
    const startTime = Date.now()

    try {
      // Perform health check with timeout
      const healthResult = await this.performHealthCheck(agent, startTime)
      
      // Record health check result
      this.recordHealthCheck(agentId, healthResult)
      
      // Update consecutive counters
      if (healthResult.isHealthy) {
        this.consecutiveSuccesses.set(agentId, (this.consecutiveSuccesses.get(agentId) || 0) + 1)
        this.consecutiveFailures.set(agentId, 0)
      } else {
        this.consecutiveFailures.set(agentId, (this.consecutiveFailures.get(agentId) || 0) + 1)
        this.consecutiveSuccesses.set(agentId, 0)
      }

      // Emit health check result
      this.emit('healthCheckCompleted', agentId, healthResult)

      // Check if agent should be marked as healthy/unhealthy
      this.checkHealthThresholds(agentId, healthResult)

      return healthResult.isHealthy

    } catch (error) {
      const healthResult: HealthCheckResult = {
        isHealthy: false,
        checks: {
          responseTime: Date.now() - startTime,
          memoryUsage: 0,
          load: 0,
          errors: 1
        },
        timestamp: new Date(),
        details: `Health check failed: ${error}`
      }

      this.recordHealthCheck(agentId, healthResult)
      this.consecutiveFailures.set(agentId, (this.consecutiveFailures.get(agentId) || 0) + 1)
      this.consecutiveSuccesses.set(agentId, 0)

      this.emit('healthCheckFailed', agentId, healthResult)
      return false
    }
  }

  async checkHealthBatch(agents: BaseAgent[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    
    // Perform health checks in parallel with concurrency limit
    const concurrencyLimit = 5
    const chunks = this.chunkArray(agents, concurrencyLimit)
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (agent) => {
        const agentId = this.getAgentId(agent)
        const isHealthy = await this.checkHealth(agent)
        results.set(agentId, isHealthy)
      })
      
      await Promise.all(promises)
    }
    
    return results
  }

  getHealthHistory(agentId: string, limit: number = 10): HealthCheckResult[] {
    const history = this.healthHistory.get(agentId) || []
    return history.slice(-limit)
  }

  getHealthStatus(agentId: string): 'healthy' | 'unhealthy' | 'unknown' {
    const history = this.healthHistory.get(agentId)
    if (!history || history.length === 0) {
      return 'unknown'
    }

    const recentResults = history.slice(-this.config.healthyThreshold)
    const healthyCount = recentResults.filter(result => result.isHealthy).length
    
    if (healthyCount >= this.config.healthyThreshold) {
      return 'healthy'
    } else if (healthyCount <= this.config.unhealthyThreshold) {
      return 'unhealthy'
    } else {
      return 'unknown'
    }
  }

  getConsecutiveFailures(agentId: string): number {
    return this.consecutiveFailures.get(agentId) || 0
  }

  getConsecutiveSuccesses(agentId: string): number {
    return this.consecutiveSuccesses.get(agentId) || 0
  }

  resetHealthHistory(agentId: string): void {
    this.healthHistory.delete(agentId)
    this.consecutiveFailures.set(agentId, 0)
    this.consecutiveSuccesses.set(agentId, 0)
  }

  getHealthSummary(): HealthSummary {
    const summary: HealthSummary = {
      totalAgents: this.healthHistory.size,
      healthyAgents: 0,
      unhealthyAgents: 0,
      unknownAgents: 0,
      averageResponseTime: 0,
      totalHealthChecks: 0,
      failureRate: 0
    }

    let totalResponseTime = 0
    let totalChecks = 0
    let failedChecks = 0

    for (const [agentId, history] of this.healthHistory) {
      const status = this.getHealthStatus(agentId)
      
      switch (status) {
        case 'healthy':
          summary.healthyAgents++
          break
        case 'unhealthy':
          summary.unhealthyAgents++
          break
        case 'unknown':
          summary.unknownAgents++
          break
      }

      totalChecks += history.length
      failedChecks += history.filter(result => !result.isHealthy).length
      
      for (const result of history) {
        totalResponseTime += result.checks.responseTime
      }
    }

    summary.averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0
    summary.totalHealthChecks = totalChecks
    summary.failureRate = totalChecks > 0 ? failedChecks / totalChecks : 0

    return summary
  }

  private async performHealthCheck(agent: BaseAgent, startTime: number): Promise<HealthCheckResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
    })

    const healthCheckPromise = this.runHealthChecks(agent, startTime)

    try {
      const result = await Promise.race([healthCheckPromise, timeoutPromise])
      return result
    } catch (error) {
      throw new AgentManagerError(
        `Health check failed for agent: ${error}`,
        this.getAgentId(agent),
        'HEALTH_CHECK_FAILED'
      )
    }
  }

  private async runHealthChecks(agent: BaseAgent, startTime: number): Promise<HealthCheckResult> {
    const checks = {
      responseTime: 0,
      memoryUsage: 0,
      load: 0,
      errors: 0
    }

    let isHealthy = true
    let details = ''

    try {
      // Test 1: Basic health check
      const healthCheckStart = Date.now()
      const isAgentHealthy = await agent.isHealthy()
      checks.responseTime = Date.now() - healthCheckStart

      if (!isAgentHealthy) {
        isHealthy = false
        details += 'Agent health check failed. '
      }

      // Test 2: Memory usage check
      try {
        checks.memoryUsage = agent.getMemoryUsage()
        if (checks.memoryUsage > 1000 * 1024 * 1024) { // 1GB threshold
          isHealthy = false
          details += 'High memory usage detected. '
        }
      } catch (error) {
        checks.errors++
        details += 'Memory usage check failed. '
      }

      // Test 3: Load check
      try {
        checks.load = agent.getCurrentLoad()
        if (checks.load > 0.9) { // 90% load threshold
          isHealthy = false
          details += 'High load detected. '
        }
      } catch (error) {
        checks.errors++
        details += 'Load check failed. '
      }

      // Test 4: Capabilities check
      try {
        const capabilities = agent.getCapabilities()
        if (!capabilities || capabilities.length === 0) {
          isHealthy = false
          details += 'No capabilities found. '
        }
      } catch (error) {
        checks.errors++
        details += 'Capabilities check failed. '
      }

      // Test 5: Response time check
      if (checks.responseTime > this.config.timeout * 0.8) { // 80% of timeout
        isHealthy = false
        details += 'Slow response time detected. '
      }

    } catch (error) {
      isHealthy = false
      checks.errors++
      details += `Health check error: ${error}. `
    }

    return {
      isHealthy,
      checks,
      timestamp: new Date(),
      details: details.trim() || (isHealthy ? 'All checks passed' : 'Health check failed')
    }
  }

  private recordHealthCheck(agentId: string, result: HealthCheckResult): void {
    if (!this.healthHistory.has(agentId)) {
      this.healthHistory.set(agentId, [])
    }

    const history = this.healthHistory.get(agentId)!
    history.push(result)

    // Keep only recent history (last 100 checks)
    if (history.length > 100) {
      history.shift()
    }
  }

  private checkHealthThresholds(agentId: string, result: HealthCheckResult): void {
    const consecutiveFailures = this.consecutiveFailures.get(agentId) || 0
    const consecutiveSuccesses = this.consecutiveSuccesses.get(agentId) || 0

    // Mark as unhealthy if too many consecutive failures
    if (consecutiveFailures >= this.config.unhealthyThreshold) {
      this.emit('agentUnhealthy', agentId, {
        consecutiveFailures,
        lastResult: result
      })
    }

    // Mark as healthy if enough consecutive successes
    if (consecutiveSuccesses >= this.config.healthyThreshold) {
      this.emit('agentHealthy', agentId, {
        consecutiveSuccesses,
        lastResult: result
      })
    }
  }

  private getAgentId(agent: BaseAgent): string {
    // Try to get agent ID from various possible properties
    return (agent as any).id || 
           (agent as any).agentId || 
           (agent as any).name || 
           'unknown'
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

interface HealthSummary {
  totalAgents: number
  healthyAgents: number
  unhealthyAgents: number
  unknownAgents: number
  averageResponseTime: number
  totalHealthChecks: number
  failureRate: number
}
