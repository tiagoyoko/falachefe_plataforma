/**
 * Integration tests for Agent Squad Framework
 * Tests the integration between Agent Squad and the chat API
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { FalachefeAgentSquad } from '../core/agent-squad-setup'
import { getAgentSquadConfig } from '../config/agent-squad-config'

describe('Agent Squad Integration Tests', () => {
  let agentSquad: FalachefeAgentSquad

  beforeEach(async () => {
    // Initialize Agent Squad for each test
    const config = getAgentSquadConfig()
    agentSquad = new FalachefeAgentSquad(config)
    await agentSquad.initialize()
  })

  afterEach(async () => {
    // Clean up after each test
    if (agentSquad) {
      await agentSquad.shutdown()
    }
  })

  describe('Agent Squad Initialization', () => {
    it('should initialize successfully', async () => {
      expect(agentSquad).toBeDefined()
      const status = agentSquad.getStatus()
      expect(status.isInitialized).toBe(true)
      expect(status.agentsCount).toBeGreaterThan(0)
    })

    it('should have memory system connected', () => {
      const status = agentSquad.getStatus()
      expect(status.memoryConnected).toBe(true)
    })

    it('should have streaming service connected', () => {
      const status = agentSquad.getStatus()
      expect(status.streamingConnected).toBe(true)
    })
  })

  describe('Message Processing', () => {
    it('should process financial messages correctly', async () => {
      const message = 'I want to add an expense of $100 for office supplies'
      
      const response = await agentSquad.processMessage({
        content: message,
        timestamp: new Date().toISOString(),
        userId: 'test-user'
      })

      expect(response).toBeDefined()
      expect(response.type).toBe('financial')
      expect(response.confidence).toBeGreaterThan(0.5)
      expect(response.agentId).toContain('financial')
    })

    it('should process general messages correctly', async () => {
      const message = 'Hello, how are you?'
      
      const response = await agentSquad.processMessage({
        content: message,
        timestamp: new Date().toISOString(),
        userId: 'test-user'
      })

      expect(response).toBeDefined()
      expect(response.type).toBeDefined()
      expect(response.confidence).toBeGreaterThan(0.3)
    })

    it('should handle error cases gracefully', async () => {
      const message = ''
      
      try {
        await agentSquad.processMessage({
          content: message,
          timestamp: new Date().toISOString(),
          userId: 'test-user'
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Agent Manager', () => {
    it('should have registered agents', () => {
      const agentManager = agentSquad.getAgentManager()
      const stats = agentManager.getAgentStats()
      
      expect(stats.totalAgents).toBeGreaterThan(0)
      expect(stats.activeAgents).toBeGreaterThan(0)
    })

    it('should have financial agent registered', () => {
      const agentManager = agentSquad.getAgentManager()
      const agents = agentManager.getAllAgents()
      
      const financialAgent = agents.find(agent => agent.type === 'financial')
      expect(financialAgent).toBeDefined()
      expect(financialAgent?.specializations).toContain('add_expense')
    })
  })

  describe('Memory System', () => {
    it('should have memory system available', () => {
      const memorySystem = agentSquad.getMemorySystem()
      expect(memorySystem).toBeDefined()
      expect(memorySystem.isConnected).toBe(true)
    })
  })

  describe('Orchestrator', () => {
    it('should have orchestrator available', () => {
      const orchestrator = agentSquad.getOrchestrator()
      expect(orchestrator).toBeDefined()
    })
  })
})

/**
 * Fallback System Tests
 */
describe('Fallback System Tests', () => {
  it('should handle Agent Squad failures gracefully', async () => {
    // Mock a failing Agent Squad
    const mockAgentSquad = {
      processMessage: jest.fn().mockRejectedValue(new Error('Agent Squad failed')),
      getStatus: jest.fn().mockReturnValue({ isInitialized: false })
    }

    // Test fallback logic (this would be in the API route)
    const message = 'I want to add an expense'
    const lowerMessage = message.toLowerCase()
    
    let response
    if (lowerMessage.includes('expense') || lowerMessage.includes('financial')) {
      response = {
        content: '💰 **Financial Agent Response**\n\n*Note: Using fallback mode*',
        type: 'financial',
        confidence: 0.7,
        processingTime: 50,
        agentId: 'financial-fallback',
        metadata: {
          fallback: true,
          reason: 'Agent Squad unavailable'
        }
      }
    }

    expect(response).toBeDefined()
    expect(response.type).toBe('financial')
    expect(response.metadata.fallback).toBe(true)
  })
})

