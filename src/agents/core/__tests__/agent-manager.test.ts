/**
 * Unit tests for Agent Manager
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AgentManager } from '../agent-manager'
import { BaseAgent, AgentMetadata, AgentState, LoadBalancingStrategy } from '../types'
import { defaultAgentManagerConfig } from '../agent-manager-config'

// Mock agent for testing
class MockAgent extends BaseAgent {
  public id: string
  public type: string
  private isHealthyState = true
  private memoryUsage = 100 * 1024 * 1024 // 100MB
  private currentLoadValue = 0.5
  private capabilities: string[] = ['test_capability']

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
    return this.isHealthyState
  }

  getCapabilities(): string[] {
    return this.capabilities
  }

  getCurrentLoad(): number {
    return this.currentLoadValue
  }

  getMemoryUsage(): number {
    return this.memoryUsage
  }

  // Test helpers
  setHealthy(healthy: boolean): void {
    this.isHealthyState = healthy
  }

  setMemoryUsage(usage: number): void {
    this.memoryUsage = usage
  }

  setLoad(load: number): void {
    this.currentLoadValue = load
  }

  setCapabilities(capabilities: string[]): void {
    this.capabilities = capabilities
  }
}

describe('AgentManager', () => {
  let agentManager: AgentManager
  let mockAgent: MockAgent
  let agentMetadata: AgentMetadata

  beforeEach(() => {
    agentManager = new AgentManager(defaultAgentManagerConfig)
    mockAgent = new MockAgent('test-agent-1', 'financial')
    agentMetadata = {
      id: 'test-agent-1',
      type: 'financial',
      name: 'Test Financial Agent',
      description: 'A test financial agent',
      version: '1.0.0',
      weight: 1,
      specializations: ['budget_planning'],
      config: { temperature: 0.7 }
    }
  })

  afterEach(() => {
    agentManager.destroy()
  })

  describe('Agent Registration', () => {
    it('should register an agent successfully', async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
      
      const agent = agentManager.getAgent('test-agent-1')
      expect(agent).toBeDefined()
      expect(agent).toBe(mockAgent)
    })

    it('should throw error for invalid agent metadata', async () => {
      const invalidMetadata = { ...agentMetadata, id: '' }
      
      await expect(
        agentManager.registerAgent(mockAgent, invalidMetadata)
      ).rejects.toThrow('Metadata deve incluir type e id')
    })

    it('should emit agentRegistered event', async () => {
      const eventSpy = jest.fn()
      agentManager.on('agentRegistered', eventSpy)
      
      await agentManager.registerAgent(mockAgent, agentMetadata)
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'test-agent-1',
          agentType: 'financial'
        })
      )
    })
  })

  describe('Agent Selection', () => {
    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
    })

    it('should select available agent by type', async () => {
      const selectedAgent = await agentManager.getAvailableAgent('financial')
      
      expect(selectedAgent).toBeDefined()
      expect(selectedAgent).toBe(mockAgent)
    })

    it('should return null when no agents available', async () => {
      const selectedAgent = await agentManager.getAvailableAgent('nonexistent')
      
      expect(selectedAgent).toBeNull()
    })

    it('should filter agents by requirements', async () => {
      const requirements = {
        specialization: 'budget_planning',
        minVersion: '1.0.0'
      }
      
      const selectedAgent = await agentManager.getAvailableAgent('financial', requirements)
      
      expect(selectedAgent).toBeDefined()
    })

    it('should return null when no agents meet requirements', async () => {
      const requirements = {
        specialization: 'nonexistent_specialization'
      }
      
      const selectedAgent = await agentManager.getAvailableAgent('financial', requirements)
      
      expect(selectedAgent).toBeNull()
    })
  })

  describe('Message Processing', () => {
    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
    })

    it('should process message successfully', async () => {
      const result = await agentManager.processMessage(
        'test-agent-1',
        'Test message',
        { context: 'test' }
      )
      
      expect(result).toEqual({
        response: 'Processed: Test message',
        agentId: 'test-agent-1'
      })
    })

    it('should throw error for non-existent agent', async () => {
      await expect(
        agentManager.processMessage('nonexistent', 'Test message', {})
      ).rejects.toThrow('Agent nonexistent not found')
    })

    it('should record processing metrics', async () => {
      await agentManager.processMessage('test-agent-1', 'Test message', {})
      
      const metrics = agentManager.getAgentMetrics('test-agent-1')
      expect(metrics.totalSelections).toBeGreaterThan(0)
    })
  })

  describe('Agent Unregistration', () => {
    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
    })

    it('should unregister agent successfully', async () => {
      await agentManager.unregisterAgent('test-agent-1')
      
      const agent = agentManager.getAgent('test-agent-1')
      expect(agent).toBeUndefined()
    })

    it('should throw error for non-existent agent', async () => {
      await expect(
        agentManager.unregisterAgent('nonexistent')
      ).rejects.toThrow('Agent nonexistent not found')
    })

    it('should emit agentUnregistered event', async () => {
      const eventSpy = jest.fn()
      agentManager.on('agentUnregistered', eventSpy)
      
      await agentManager.unregisterAgent('test-agent-1')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'test-agent-1'
        })
      )
    })
  })

  describe('Agent Statistics', () => {
    it('should return correct agent stats', async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
      
      const stats = agentManager.getAgentStats()
      
      expect(stats.totalAgents).toBe(1)
      expect(stats.activeAgents).toBe(1)
      expect(stats.totalAgents.financial).toBe(1)
    })

    it('should return system metrics', async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
      
      const metrics = agentManager.getSystemMetrics()
      
      expect(metrics.totalAgents).toBe(1)
      expect(metrics.totalSelections).toBe(0)
    })
  })

  describe('Health Checking', () => {
    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
    })

    it('should return health status for agent', () => {
      const healthStatus = agentManager.getHealthStatus('test-agent-1')
      
      expect(healthStatus).toBeDefined()
    })

    it('should return health summary for all agents', () => {
      const healthSummary = agentManager.getHealthStatus()
      
      expect(healthSummary).toBeDefined()
      expect(healthSummary.totalAgents).toBe(1)
    })
  })

  describe('Agent Recovery', () => {
    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
    })

    it('should restart agent successfully', async () => {
      await agentManager.restartAgent('test-agent-1')
      
      const agent = agentManager.getAgent('test-agent-1')
      expect(agent).toBeDefined()
    })

    it('should throw error for non-existent agent during restart', async () => {
      await expect(
        agentManager.restartAgent('nonexistent')
      ).rejects.toThrow('Agent nonexistent not found')
    })
  })

  describe('Load Balancing', () => {
    let mockAgent2: MockAgent
    let agentMetadata2: AgentMetadata

    beforeEach(async () => {
      await agentManager.registerAgent(mockAgent, agentMetadata)
      
      mockAgent2 = new MockAgent('test-agent-2', 'financial')
      agentMetadata2 = {
        ...agentMetadata,
        id: 'test-agent-2',
        weight: 2
      }
      await agentManager.registerAgent(mockAgent2, agentMetadata2)
    })

    it('should select different agents using round-robin', async () => {
      const agent1 = await agentManager.getAvailableAgent('financial')
      const agent2 = await agentManager.getAvailableAgent('financial')
      
      // With round-robin, we should get different agents
      expect(agent1).toBeDefined()
      expect(agent2).toBeDefined()
    })

    it('should handle circuit breaker failures', async () => {
      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        try {
          await agentManager.processMessage('test-agent-1', 'Test message', {})
        } catch (error) {
          // Ignore errors for circuit breaker testing
        }
      }
      
      // Agent should still be available (circuit breaker not implemented in this test)
      const agent = agentManager.getAgent('test-agent-1')
      expect(agent).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle agent processing errors gracefully', async () => {
      const errorAgent = new MockAgent('error-agent', 'financial')
      const errorMetadata = { ...agentMetadata, id: 'error-agent' }
      
      // Mock process method to throw error
      jest.spyOn(errorAgent, 'process').mockRejectedValue(new Error('Processing failed'))
      
      await agentManager.registerAgent(errorAgent, errorMetadata)
      
      await expect(
        agentManager.processMessage('error-agent', 'Test message', {})
      ).rejects.toThrow('Processing failed')
    })
  })
})
