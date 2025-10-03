/**
 * Testes unitários para AgentRouter
 */

import { AgentRouter } from '../agent-router'
import { BaseAgent } from '../agent-manager'
import { IntentClassification, ConversationContext } from '../agent-orchestrator'

// Mock BaseAgent
class MockAgent implements BaseAgent {
  type: string
  isAvailable: () => boolean
  processMessage: (message: any) => Promise<any>

  constructor(type: string, isAvailable: boolean = true) {
    this.type = type
    this.isAvailable = jest.fn().mockReturnValue(isAvailable)
    this.processMessage = jest.fn().mockResolvedValue({
      success: true,
      response: `Response from ${type} agent`,
      confidence: 0.8
    })
  }
}

describe('AgentRouter', () => {
  let router: AgentRouter
  let mockAgents: BaseAgent[]

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock agents
    mockAgents = [
      new MockAgent('financial', true),
      new MockAgent('marketing_sales', true),
      new MockAgent('hr', true),
      new MockAgent('general', true)
    ]

    // Create router with test configuration
    router = new AgentRouter({
      rules: [
        {
          id: 'financial-rule',
          name: 'Financial Operations',
          intents: ['add_expense', 'view_balance', 'budget_analysis'],
          domains: ['financial'],
          agentType: 'financial',
          priority: 'high',
          minConfidence: 0.8,
          contextRequired: false,
          estimatedTime: 2000,
          enabled: true,
          description: 'Route financial operations to financial agent'
        },
        {
          id: 'marketing-rule',
          name: 'Marketing Operations',
          intents: ['create_campaign', 'analyze_metrics'],
          domains: ['marketing'],
          agentType: 'marketing_sales',
          priority: 'normal',
          minConfidence: 0.7,
          contextRequired: false,
          estimatedTime: 3000,
          enabled: true,
          description: 'Route marketing operations to marketing agent'
        },
        {
          id: 'hr-rule',
          name: 'HR Operations',
          intents: ['schedule_meeting', 'employee_info'],
          domains: ['hr'],
          agentType: 'hr',
          priority: 'normal',
          minConfidence: 0.6,
          contextRequired: true,
          contextConditions: [
            {
              field: 'userPreferences.role',
              operator: 'equals',
              value: 'manager',
              description: 'Only for managers'
            }
          ],
          estimatedTime: 2500,
          enabled: true,
          description: 'Route HR operations to HR agent for managers'
        }
      ],
      fallbackAgent: 'general',
      enableLoadBalancing: true,
      enablePriorityRouting: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true
    })
  })

  describe('route', () => {
    it('should route financial intent to financial agent', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: ['$50', 'groceries'],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const result = await router.route(intent, context, mockAgents)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.agent.type).toBe('financial')
      expect(result!.priority).toBe('high')
      expect(result!.reason).toContain('Financial Operations')
      expect(result!.confidence).toBe(0.9)
    })

    it('should route marketing intent to marketing agent', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'create_campaign',
        domain: 'marketing',
        confidence: 0.8,
        suggestedAgent: 'marketing_sales',
        urgency: 'normal',
        entities: ['social media', 'Q1'],
        reasoning: 'User wants to create marketing campaign'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const result = await router.route(intent, context, mockAgents)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.agent.type).toBe('marketing_sales')
      expect(result!.priority).toBe('normal')
      expect(result!.reason).toContain('Marketing Operations')
    })

    it('should route HR intent only for managers', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'schedule_meeting',
        domain: 'hr',
        confidence: 0.8,
        suggestedAgent: 'hr',
        urgency: 'normal',
        entities: ['team meeting'],
        reasoning: 'User wants to schedule meeting'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: { role: 'manager' },
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const result = await router.route(intent, context, mockAgents)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.agent.type).toBe('hr')
      expect(result!.reason).toContain('HR Operations')
    })

    it('should not route HR intent for non-managers', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'schedule_meeting',
        domain: 'hr',
        confidence: 0.8,
        suggestedAgent: 'hr',
        urgency: 'normal',
        entities: ['team meeting'],
        reasoning: 'User wants to schedule meeting'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: { role: 'employee' },
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const result = await router.route(intent, context, mockAgents)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.agent.type).toBe('general') // Should fallback to general
      expect(result!.reason).toContain('Fallback')
    })

    it('should fallback to general agent when no rules match', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'unknown_intent',
        domain: 'unknown',
        confidence: 0.5,
        suggestedAgent: 'general',
        urgency: 'low',
        entities: [],
        reasoning: 'Unknown intent'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const result = await router.route(intent, context, mockAgents)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.agent.type).toBe('general')
      expect(result!.priority).toBe('low')
      expect(result!.reason).toContain('Fallback')
    })

    it('should return null when no agents are available', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: [],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Create unavailable agents
      const unavailableAgents = [
        new MockAgent('financial', false),
        new MockAgent('general', false)
      ]

      // Act
      const result = await router.route(intent, context, unavailableAgents)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle routing errors gracefully', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: [],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Mock console.error to avoid test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Act
      const result = await router.route(intent, context, [])

      // Assert
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('rule management', () => {
    it('should add new rule', () => {
      // Arrange
      const newRule = {
        id: 'test-rule',
        name: 'Test Rule',
        intents: ['test_intent'],
        domains: ['test'],
        agentType: 'general',
        priority: 'normal' as const,
        minConfidence: 0.5,
        contextRequired: false,
        estimatedTime: 1000,
        enabled: true,
        description: 'Test rule for testing'
      }

      // Act
      router.addRule(newRule)

      // Assert
      const rule = router.getRule('test-rule')
      expect(rule).toEqual(newRule)
    })

    it('should update existing rule', () => {
      // Arrange
      const updates = {
        priority: 'high' as const,
        minConfidence: 0.9
      }

      // Act
      const result = router.updateRule('financial-rule', updates)

      // Assert
      expect(result).toBe(true)
      const rule = router.getRule('financial-rule')
      expect(rule!.priority).toBe('high')
      expect(rule!.minConfidence).toBe(0.9)
    })

    it('should remove rule', () => {
      // Act
      const result = router.removeRule('financial-rule')

      // Assert
      expect(result).toBe(true)
      const rule = router.getRule('financial-rule')
      expect(rule).toBeUndefined()
    })

    it('should return all rules', () => {
      // Act
      const rules = router.getAllRules()

      // Assert
      expect(rules).toHaveLength(3) // Initial rules
      expect(rules.map(r => r.id)).toContain('financial-rule')
      expect(rules.map(r => r.id)).toContain('marketing-rule')
      expect(rules.map(r => r.id)).toContain('hr-rule')
    })

    it('should return only enabled rules', () => {
      // Arrange
      router.updateRule('financial-rule', { enabled: false })

      // Act
      const enabledRules = router.getEnabledRules()

      // Assert
      expect(enabledRules).toHaveLength(2)
      expect(enabledRules.map(r => r.id)).not.toContain('financial-rule')
    })
  })

  describe('metrics', () => {
    it('should track routing metrics', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: [],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      await router.route(intent, context, mockAgents)

      // Assert
      const metrics = router.getMetrics()
      expect(metrics.totalRoutes).toBe(1)
      expect(metrics.successfulRoutes).toBe(1)
      expect(metrics.failedRoutes).toBe(0)
      expect(metrics.routesByAgent.financial).toBe(1)
      expect(metrics.routesByPriority.high).toBe(1)
      expect(metrics.routesByIntent.add_expense).toBe(1)
    })

    it('should calculate success rate', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: [],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      await router.route(intent, context, mockAgents)
      const successRate = router.getSuccessRate()

      // Assert
      expect(successRate).toBe(1.0) // 100% success rate
    })

    it('should reset metrics', () => {
      // Arrange
      const metrics = router.getMetrics()
      expect(metrics.totalRoutes).toBeGreaterThan(0)

      // Act
      router.resetMetrics()

      // Assert
      const newMetrics = router.getMetrics()
      expect(newMetrics.totalRoutes).toBe(0)
      expect(newMetrics.successfulRoutes).toBe(0)
      expect(newMetrics.failedRoutes).toBe(0)
    })
  })

  describe('validation', () => {
    it('should validate rule correctly', () => {
      // Arrange
      const validRule = {
        id: 'valid-rule',
        name: 'Valid Rule',
        intents: ['test_intent'],
        domains: ['test'],
        agentType: 'general',
        priority: 'normal' as const,
        minConfidence: 0.5,
        contextRequired: false,
        estimatedTime: 1000,
        enabled: true,
        description: 'Valid rule'
      }

      const invalidRule = {
        id: '',
        name: '',
        intents: [],
        domains: [],
        agentType: '',
        priority: 'normal' as const,
        minConfidence: -1,
        contextRequired: false,
        estimatedTime: -1,
        enabled: true,
        description: 'Invalid rule'
      }

      // Act
      const validErrors = router.validateRule(validRule)
      const invalidErrors = router.validateRule(invalidRule)

      // Assert
      expect(validErrors).toHaveLength(0)
      expect(invalidErrors.length).toBeGreaterThan(0)
      expect(invalidErrors).toContain('Rule ID is required')
      expect(invalidErrors).toContain('Rule name is required')
      expect(invalidErrors).toContain('Agent type is required')
    })

    it('should validate all rules', () => {
      // Act
      const results = router.validateAllRules()

      // Assert
      expect(results).toHaveProperty('financial-rule')
      expect(results).toHaveProperty('marketing-rule')
      expect(results).toHaveProperty('hr-rule')
      expect(results['financial-rule']).toHaveLength(0) // Should be valid
    })
  })

  describe('debug', () => {
    it('should provide debug information', async () => {
      // Arrange
      const intent: IntentClassification = {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        suggestedAgent: 'financial',
        urgency: 'normal',
        entities: [],
        reasoning: 'User wants to add expense'
      }

      const context: ConversationContext = {
        conversationId: 'chat-123',
        userId: 'user-123',
        agentId: 'general',
        currentIntent: null,
        conversationHistory: [],
        userPreferences: {},
        sessionData: {},
        metadata: { createdAt: new Date(), lastUpdated: new Date(), version: 1 }
      }

      // Act
      const debugInfo = router.debugRoute(intent, context, mockAgents)

      // Assert
      expect(debugInfo).toHaveProperty('matchingRules')
      expect(debugInfo).toHaveProperty('domainAgent')
      expect(debugInfo).toHaveProperty('suggestedAgent')
      expect(debugInfo).toHaveProperty('fallbackAgent')
      expect(debugInfo).toHaveProperty('finalRoute')
      expect(debugInfo.matchingRules.length).toBeGreaterThan(0)
      expect(debugInfo.finalRoute).not.toBeNull()
    })
  })
})
