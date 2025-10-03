/**
 * Unit tests for Health Checker
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { HealthChecker } from '../health-checker'
import { HealthCheckConfig, BaseAgent } from '../types'

// Mock agent for testing
class MockAgent extends BaseAgent {
  private isHealthyState = true
  private healthCheckDelay = 0

  constructor(id: string, type: string) {
    super()
    this.id = id
    this.type = type
  }

  async initialize(config: Record<string, any>): Promise<void> {
    // Mock initialization
  }

  async process(message: string, context: Record<string, any>): Promise<any> {
    return { response: `Processed: ${message}`, agentId: this.id }
  }

  async shutdown(): Promise<void> {
    // Mock shutdown
  }

  async isHealthy(): Promise<boolean> {
    if (this.healthCheckDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.healthCheckDelay))
    }
    return this.isHealthyState
  }

  getCapabilities(): string[] {
    return ['test_capability']
  }

  getCurrentLoad(): number {
    return 0.5
  }

  getMemoryUsage(): number {
    return 100 * 1024 * 1024 // 100MB
  }

  // Test helpers
  setHealthy(healthy: boolean): void {
    this.isHealthyState = healthy
  }

  setHealthCheckDelay(delay: number): void {
    this.healthCheckDelay = delay
  }
}

describe('HealthChecker', () => {
  let healthChecker: HealthChecker
  let config: HealthCheckConfig
  let mockAgent: MockAgent

  beforeEach(() => {
    config = {
      timeout: 5000,
      retries: 3,
      retryDelay: 1000,
      batchSize: 10,
      enableBatchChecking: true
    }
    
    healthChecker = new HealthChecker(config)
    mockAgent = new MockAgent('test-agent-1', 'financial')
  })

  describe('Single Agent Health Check', () => {
    it('should return true for healthy agent', async () => {
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(true)
    })

    it('should return false for unhealthy agent', async () => {
      mockAgent.setHealthy(false)
      
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(false)
    })

    it('should handle health check timeout', async () => {
      mockAgent.setHealthCheckDelay(6000) // 6 seconds > 5 second timeout
      
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(false)
    })

    it('should retry on failure', async () => {
      let attemptCount = 0
      const originalIsHealthy = mockAgent.isHealthy
      
      jest.spyOn(mockAgent, 'isHealthy').mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Health check failed')
        }
        return true
      })
      
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(true)
      expect(attemptCount).toBe(3)
    })

    it('should return false after max retries', async () => {
      jest.spyOn(mockAgent, 'isHealthy').mockRejectedValue(new Error('Health check failed'))
      
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(false)
    })
  })

  describe('Batch Health Check', () => {
    let mockAgents: MockAgent[]

    beforeEach(() => {
      mockAgents = [
        new MockAgent('agent-1', 'financial'),
        new MockAgent('agent-2', 'financial'),
        new MockAgent('agent-3', 'marketing')
      ]
    })

    it('should check health of multiple agents', async () => {
      const results = await healthChecker.checkHealthBatch(mockAgents)
      
      expect(results.size).toBe(3)
      expect(results.get('agent-1')).toBe(true)
      expect(results.get('agent-2')).toBe(true)
      expect(results.get('agent-3')).toBe(true)
    })

    it('should handle mixed health statuses', async () => {
      mockAgents[1].setHealthy(false)
      
      const results = await healthChecker.checkHealthBatch(mockAgents)
      
      expect(results.get('agent-1')).toBe(true)
      expect(results.get('agent-2')).toBe(false)
      expect(results.get('agent-3')).toBe(true)
    })

    it('should handle empty agent list', async () => {
      const results = await healthChecker.checkHealthBatch([])
      
      expect(results.size).toBe(0)
    })

    it('should process agents in batches when enabled', async () => {
      // Create more agents than batch size
      const manyAgents = Array.from({ length: 25 }, (_, i) => 
        new MockAgent(`agent-${i}`, 'financial')
      )
      
      const results = await healthChecker.checkHealthBatch(manyAgents)
      
      expect(results.size).toBe(25)
    })
  })

  describe('Health Status Tracking', () => {
    it('should track health status of checked agents', async () => {
      await healthChecker.checkHealth(mockAgent)
      
      const status = healthChecker.getHealthStatus('test-agent-1')
      expect(status).toBe(true)
    })

    it('should return undefined for unchecked agent', () => {
      const status = healthChecker.getHealthStatus('nonexistent')
      expect(status).toBeUndefined()
    })

    it('should return health summary for all agents', async () => {
      const agent1 = new MockAgent('agent-1', 'financial')
      const agent2 = new MockAgent('agent-2', 'financial')
      agent2.setHealthy(false)
      
      await healthChecker.checkHealth(agent1)
      await healthChecker.checkHealth(agent2)
      
      const summary = healthChecker.getHealthSummary()
      
      expect(summary).toBeDefined()
      expect(summary['agent-1']).toBe(true)
      expect(summary['agent-2']).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle agent that throws error', async () => {
      jest.spyOn(mockAgent, 'isHealthy').mockRejectedValue(new Error('Unexpected error'))
      
      const isHealthy = await healthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(false)
    })

    it('should handle null/undefined agent', async () => {
      const isHealthy = await healthChecker.checkHealth(null as any)
      
      expect(isHealthy).toBe(false)
    })

    it('should handle agent without isHealthy method', async () => {
      const invalidAgent = {
        id: 'invalid-agent',
        type: 'test'
      } as BaseAgent
      
      const isHealthy = await healthChecker.checkHealth(invalidAgent)
      
      expect(isHealthy).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should complete health checks within reasonable time', async () => {
      const startTime = Date.now()
      
      await healthChecker.checkHealth(mockAgent)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent health checks', async () => {
      const agents = Array.from({ length: 10 }, (_, i) => 
        new MockAgent(`agent-${i}`, 'financial')
      )
      
      const startTime = Date.now()
      const promises = agents.map(agent => healthChecker.checkHealth(agent))
      const results = await Promise.all(promises)
      const duration = Date.now() - startTime
      
      expect(results).toHaveLength(10)
      expect(results.every(result => result === true)).toBe(true)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })

  describe('Configuration', () => {
    it('should use custom timeout', async () => {
      const customConfig = { ...config, timeout: 1000 }
      const customHealthChecker = new HealthChecker(customConfig)
      
      mockAgent.setHealthCheckDelay(1500) // 1.5 seconds > 1 second timeout
      
      const isHealthy = await customHealthChecker.checkHealth(mockAgent)
      
      expect(isHealthy).toBe(false)
    })

    it('should use custom retry settings', async () => {
      const customConfig = { ...config, retries: 1, retryDelay: 100 }
      const customHealthChecker = new HealthChecker(customConfig)
      
      let attemptCount = 0
      jest.spyOn(mockAgent, 'isHealthy').mockImplementation(async () => {
        attemptCount++
        throw new Error('Health check failed')
      })
      
      await customHealthChecker.checkHealth(mockAgent)
      
      expect(attemptCount).toBe(2) // 1 retry + 1 initial attempt
    })
  })
})
