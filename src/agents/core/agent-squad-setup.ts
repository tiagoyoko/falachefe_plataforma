/**
 * Agent Squad Setup - Main initialization and configuration
 * Based on AWS Labs Agent Squad Framework
 */

import { AgentManager, AgentConfig } from './agent-manager'
import { MemorySystem, MemoryConfig } from './memory-system'
import { StreamingService, StreamingConfig } from './streaming-service'
import { AgentOrchestrator, OrchestratorConfig } from './agent-orchestrator'
import { FinancialAgent } from '../financial/financial-agent'

export interface FalachefeAgentSquadConfig {
  memory: MemoryConfig
  streaming: StreamingConfig
  orchestrator: Omit<OrchestratorConfig, 'agentManager' | 'memorySystem' | 'streamingService'>
  agents: AgentConfig[]
}

export class FalachefeAgentSquad {
  private agentManager: AgentManager
  private memorySystem: MemorySystem
  private streamingService: StreamingService
  private orchestrator: AgentOrchestrator
  private isInitialized: boolean = false

  constructor(private config: FalachefeAgentSquadConfig) {
    // Initialize core systems
    this.memorySystem = new MemorySystem(config.memory)
    this.streamingService = new StreamingService(config.streaming)
    this.agentManager = new AgentManager()
    
    // Initialize orchestrator
    this.orchestrator = new AgentOrchestrator({
      ...config.orchestrator,
      agentManager: this.agentManager,
      memorySystem: this.memorySystem,
      streamingService: this.streamingService
    })
  }

  /**
   * Initialize the Agent Squad system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Agent Squad already initialized')
      return
    }

    try {
      console.log('🚀 Initializing Falachefe Agent Squad...')

      // Initialize memory system
      await this.memorySystem.initialize()
      console.log('✅ Memory system initialized')

      // Initialize streaming service
      await this.streamingService.initialize()
      console.log('✅ Streaming service initialized')

      // Register default agents
      await this.registerDefaultAgents()
      console.log('✅ Default agents registered')

      // Initialize orchestrator
      await this.orchestrator.initialize()
      console.log('✅ Orchestrator initialized')

      this.isInitialized = true
      console.log('🎉 Falachefe Agent Squad initialized successfully!')
    } catch (error) {
      console.error('❌ Failed to initialize Agent Squad:', error)
      throw error
    }
  }

  /**
   * Register default agents for the Falachefe system
   */
  private async registerDefaultAgents(): Promise<void> {
    // Register Financial Agent
    const financialAgent = new FinancialAgent({
      id: 'financial-agent-001',
      type: 'financial',
      name: 'Financial Agent',
      description: 'Handles financial operations and cash flow analysis for Falachefe',
      capabilities: [
        'add_expense',
        'add_revenue', 
        'cashflow_analysis',
        'budget_planning',
        'financial_query'
      ],
      isActive: true,
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    })

    await this.agentManager.registerAgent(financialAgent)

    // Register additional agents from config
    for (const agentConfig of this.config.agents) {
      if (agentConfig.type === 'financial') {
        // Skip financial agent as it's already registered
        continue
      }

      // For now, we only have FinancialAgent implemented
      // Other agents will be implemented in future stories
      console.log(`⚠️ Agent type ${agentConfig.type} not yet implemented`)
    }
  }

  /**
   * Process incoming message through the orchestrator
   */
  async processMessage(message: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Agent Squad not initialized. Call initialize() first.')
    }

    return await this.orchestrator.processIncomingMessage(message)
  }

  /**
   * Get agent manager instance
   */
  getAgentManager(): AgentManager {
    return this.agentManager
  }

  /**
   * Get memory system instance
   */
  getMemorySystem(): MemorySystem {
    return this.memorySystem
  }

  /**
   * Get streaming service instance
   */
  getStreamingService(): StreamingService {
    return this.streamingService
  }

  /**
   * Get orchestrator instance
   */
  getOrchestrator(): AgentOrchestrator {
    return this.orchestrator
  }

  /**
   * Shutdown the Agent Squad system
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      console.log('🔄 Shutting down Agent Squad...')
      
      await this.streamingService.shutdown()
      await this.memorySystem.shutdown()
      
      this.isInitialized = false
      console.log('✅ Agent Squad shutdown complete')
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      throw error
    }
  }

  /**
   * Get system status
   */
  getStatus(): {
    isInitialized: boolean
    agentsCount: number
    activeAgentsCount: number
    memoryConnected: boolean
    streamingConnected: boolean
  } {
    return {
      isInitialized: this.isInitialized,
      agentsCount: this.agentManager.getAgentsCount(),
      activeAgentsCount: this.agentManager.getActiveAgentsCount(),
      memoryConnected: this.memorySystem.isConnected,
      streamingConnected: this.streamingService.isConnected('')
    }
  }
}

/**
 * Create and configure a new Falachefe Agent Squad instance
 */
export function createFalachefeAgentSquad(config: FalachefeAgentSquadConfig): FalachefeAgentSquad {
  return new FalachefeAgentSquad(config)
}

/**
 * Default configuration for Falachefe Agent Squad
 */
export const defaultFalachefeConfig: FalachefeAgentSquadConfig = {
  memory: {
    redis: {
      host: process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379',
      port: 6379,
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
      db: 0
    },
    postgres: {
      connectionString: process.env.DATABASE_URL || ''
    },
    defaultTTL: 3600, // 1 hour
    maxMemorySize: 1024 * 1024 // 1MB
  },
  streaming: {
    maxConnections: 100,
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 60000, // 1 minute
    enableSSE: true,
    enableWebSocket: true
  },
  orchestrator: {
    classification: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      cacheEnabled: true,
      cacheTTL: 300 // 5 minutes
    },
    routing: {
      rules: [
        {
          intents: ['add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning'],
          domains: ['financial'],
          agentType: 'financial',
          priority: 'high',
          minConfidence: 0.8,
          contextRequired: false
        }
      ],
      fallbackAgent: 'general'
    },
    context: {
      ttl: 3600, // 1 hour
      maxHistory: 50,
      autoCleanup: true
    }
  },
  agents: [
    {
      id: 'financial-agent-001',
      type: 'financial',
      name: 'Financial Agent',
      description: 'Handles financial operations and cash flow analysis',
      capabilities: ['add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning'],
      isActive: true,
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.7
      }
    }
  ]
}
