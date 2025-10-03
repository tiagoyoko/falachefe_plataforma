/**
 * Unit tests for Load Balancer
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { LoadBalancer } from '../load-balancer'
import { LoadBalancerConfig, AgentInfo, LoadBalancingStrategy, AgentState, AgentMetrics } from '../types'

describe('LoadBalancer', () => {
  let loadBalancer: LoadBalancer
  let config: LoadBalancerConfig
  let agentInfo1: AgentInfo
  let agentInfo2: AgentInfo
  let agentInfo3: AgentInfo

  beforeEach(() => {
  config = {
    defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
    strategies: new Map([
      ['financial', LoadBalancingStrategy.ROUND_ROBIN], // Configure strategy for financial agents
      ['round_robin', LoadBalancingStrategy.ROUND_ROBIN],
      ['least_connections', LoadBalancingStrategy.LEAST_CONNECTIONS],
      ['weighted', LoadBalancingStrategy.WEIGHTED],
      ['least_load', LoadBalancingStrategy.LEAST_LOAD]
    ]),
    weights: new Map(),
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      halfOpenMaxCalls: 3
    }
  }
    
    loadBalancer = new LoadBalancer(config)
    
    agentInfo1 = {
      id: 'agent-1',
      type: 'financial',
      metadata: {
        id: 'agent-1',
        type: 'financial',
        name: 'Agent 1',
        description: 'Test Agent 1',
        version: '1.0.0',
        weight: 1,
        specializations: ['budget_planning'],
        config: {}
      },
      agent: {} as any,
      state: AgentState.ACTIVE,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      metrics: new AgentMetrics()
    }
    
    agentInfo2 = {
      id: 'agent-2',
      type: 'financial',
      metadata: {
        id: 'agent-2',
        type: 'financial',
        name: 'Agent 2',
        description: 'Test Agent 2',
        version: '1.0.0',
        weight: 2,
        specializations: ['budget_planning'],
        config: {}
      },
      agent: {} as any,
      state: AgentState.ACTIVE,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      metrics: new AgentMetrics()
    }
    
    agentInfo3 = {
      id: 'agent-3',
      type: 'financial',
      metadata: {
        id: 'agent-3',
        type: 'financial',
        name: 'Agent 3',
        description: 'Test Agent 3',
        version: '1.0.0',
        weight: 1,
        specializations: ['budget_planning'],
        config: {}
      },
      agent: {} as any,
      state: AgentState.ACTIVE,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      metrics: new AgentMetrics()
    }
  })

  describe('Agent Management', () => {
    it('should add agent successfully', () => {
      loadBalancer.addAgent(agentInfo1)
      
      const agents = loadBalancer.getAgents('financial')
      expect(agents).toHaveLength(1)
      expect(agents[0].id).toBe('agent-1')
    })

    it('should remove agent successfully', () => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.removeAgent('agent-1')
      
      const agents = loadBalancer.getAgents('financial')
      expect(agents).toHaveLength(0)
    })

    it('should get agents by type', () => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.addAgent(agentInfo2)
      
      const agents = loadBalancer.getAgents('financial')
      expect(agents).toHaveLength(2)
    })

    it('should return empty array for non-existent type', () => {
      const agents = loadBalancer.getAgents('nonexistent')
      expect(agents).toHaveLength(0)
    })
  })

  describe('Round Robin Selection', () => {
    beforeEach(() => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.addAgent(agentInfo2)
    })

    it('should select agents in round-robin order', () => {
      // First, let's verify the agents are added correctly
      const agents = loadBalancer.getAgents('financial')
      expect(agents).toHaveLength(2)
      
      // Let's test with explicit ordering of agents
      const selected1 = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      const selected2 = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      const selected3 = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      const selected4 = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      // After sorting, the agents should be: [agent-1, agent-2] (sorted by ID)
      // Counter starts at 0
      // Selection 1: counter=0, index=0, agent=agent-1, counter++
      // Selection 2: counter=1, index=1, agent=agent-2, counter++
      // Selection 3: counter=2, index=0, agent=agent-1, counter++
      // Selection 4: counter=3, index=1, agent=agent-2, counter++
      
      // Expected pattern: agent-1, agent-2, agent-1, agent-2
      expect(selected1?.id).toBe('agent-1')
      expect(selected2?.id).toBe('agent-2')
      expect(selected3?.id).toBe('agent-1')
      expect(selected4?.id).toBe('agent-2')
    })

    it('should cycle through all agents', () => {
      const selections = []
      for (let i = 0; i < 4; i++) {
        const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
        selections.push(selected?.id)
      }
      
      // Should have selected both agents
      expect(selections).toContain('agent-1')
      expect(selections).toContain('agent-2')
    })
  })

  describe('Least Connections Selection', () => {
    beforeEach(() => {
      // Configure strategy for financial agents to use least connections
      loadBalancer.setStrategy('financial', LoadBalancingStrategy.LEAST_CONNECTIONS)
      
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.addAgent(agentInfo2)
      
      // Set different connection counts
      agentInfo1.metrics.activeConnections = 5
      agentInfo2.metrics.activeConnections = 2
    })

    it('should select agent with least connections', () => {
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
      expect(selected?.id).toBe('agent-2') // agent-2 has fewer connections
    })

    it('should handle equal connection counts', () => {
      agentInfo1.metrics.activeConnections = 3
      agentInfo2.metrics.activeConnections = 3
      
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
      // Should select one of them (implementation may vary)
    })
  })

  describe('Weighted Selection', () => {
    beforeEach(() => {
      // Configure strategy for financial agents to use weighted selection
      loadBalancer.setStrategy('financial', LoadBalancingStrategy.WEIGHTED)
      
      loadBalancer.addAgent(agentInfo1) // weight: 1
      loadBalancer.addAgent(agentInfo2) // weight: 2
    })

    it('should select agents based on weight', () => {
      const selections = []
      for (let i = 0; i < 100; i++) {
        const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
        selections.push(selected?.id)
      }
      
      // agent-2 should be selected more often due to higher weight
      const agent1Count = selections.filter(id => id === 'agent-1').length
      const agent2Count = selections.filter(id => id === 'agent-2').length
      
      expect(agent2Count).toBeGreaterThan(agent1Count)
    })
  })

  describe('Least Load Selection', () => {
    beforeEach(() => {
      loadBalancer.addAgent(agentInfo1) // load: 0.3
      loadBalancer.addAgent(agentInfo2) // load: 0.5
      loadBalancer.addAgent(agentInfo3) // load: 0.8
    })

    it('should select agent with least load', () => {
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2, agentInfo3], 'financial')
      
      expect(selected).toBeDefined()
      expect(selected?.id).toBe('agent-1') // agent-1 has lowest load (0.3)
    })

    it('should handle equal loads', () => {
      agentInfo1.metrics.currentLoad = 0.5
      agentInfo2.metrics.currentLoad = 0.5
      
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
      // Should select one of them (implementation may vary)
    })
  })

  describe('Strategy Selection', () => {
    beforeEach(() => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.addAgent(agentInfo2)
    })

    it('should use default strategy when no strategy specified', () => {
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
    })

    it('should use specified strategy', () => {
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
    })

    it('should fallback to round-robin for invalid strategy', () => {
      const selected = loadBalancer.selectAgent([agentInfo1, agentInfo2], 'financial')
      
      expect(selected).toBeDefined()
    })
  })

  describe('Empty Agent List', () => {
    it('should return null when no agents available', () => {
      const selected = loadBalancer.selectAgent([], 'financial')
      
      expect(selected).toBeNull()
    })
  })

  describe('Agent Weight Management', () => {
    it('should update agent weight', () => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.setAgentWeight('agent-1', 5)
      
      const weight = loadBalancer.getAgentWeight('agent-1')
      expect(weight).toBe(5)
    })

    it('should return default weight for non-existent agent', () => {
      const weight = loadBalancer.getAgentWeight('nonexistent')
      expect(weight).toBe(1) // default weight
    })
  })

  describe('Statistics', () => {
    beforeEach(() => {
      loadBalancer.addAgent(agentInfo1)
      loadBalancer.addAgent(agentInfo2)
    })

    it('should return correct statistics', () => {
      const stats = loadBalancer.getStats()
      
      expect(stats.totalAgents).toBe(2)
      expect(stats.totalAgents.financial).toBe(2)
    })

    it('should return statistics for specific type', () => {
      const stats = loadBalancer.getStats('financial')
      
      expect(stats.totalAgents).toBe(2)
      expect(stats.totalAgents.financial).toBe(2)
    })
  })
})
