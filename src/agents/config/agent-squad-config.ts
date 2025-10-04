/**
 * Agent Squad Configuration for Falachefe
 * Uses existing environment variables without AWS dependencies
 */

import { FalachefeAgentSquadConfig } from '../core/agent-squad-setup'
import { LoadBalancingStrategy } from '../core/types'

/**
 * Production-ready configuration using existing environment variables
 */
export const falachefeAgentSquadConfig: FalachefeAgentSquadConfig = {
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
    enableWebSocket: false // Disabled for now, using HTTP REST API
  },
  
  orchestrator: {
    classification: {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
          minConfidence: 0.7,
          contextRequired: false
        },
        {
          intents: ['find_name', 'search', 'lookup'],
          domains: ['general'],
          agentType: 'find_name',
          priority: 'normal',
          minConfidence: 0.7,
          contextRequired: false
        },
        {
          intents: ['auth', 'login', 'signin', 'authentication'],
          domains: ['security'],
          agentType: 'auth',
          priority: 'high',
          minConfidence: 0.8,
          contextRequired: false
        },
        {
          intents: ['sync', 'synchronize', 'update', 'refresh'],
          domains: ['data'],
          agentType: 'sync',
          priority: 'normal',
          minConfidence: 0.7,
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
  
  agentManager: {
    loadBalancing: {
      defaultStrategy: LoadBalancingStrategy.LEAST_LOAD,
      strategies: new Map([
        ['financial', LoadBalancingStrategy.LEAST_LOAD],
        ['find_name', LoadBalancingStrategy.ROUND_ROBIN],
        ['auth', LoadBalancingStrategy.LEAST_LOAD],
        ['sync', LoadBalancingStrategy.ROUND_ROBIN],
        ['general', LoadBalancingStrategy.LEAST_CONNECTIONS]
      ]),
      weights: new Map(),
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000, // 30 seconds
        halfOpenMaxCalls: 3
      }
    },
    stateManagement: {
      stateTransitionTimeout: 10000, // 10 seconds
      recoveryAttempts: 3,
      recoveryDelay: 5000, // 5 seconds
      stateHistorySize: 50
    },
    metrics: {
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        maxProcessingTime: 5000, // 5 seconds
        maxErrors: 10,
        maxMemoryUsage: 500 * 1024 * 1024, // 500MB
        maxLoad: 0.8, // 80%
        minUptime: 60 * 60 * 1000 // 1 hour
      },
      exportEnabled: true
    },
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      healthyThreshold: 3,
      unhealthyThreshold: 2
    },
    logging: {
      level: 'info',
      enableAudit: true,
      enableMetrics: true
    }
  },
  
  agents: [
    {
      id: 'financial-agent-001',
      type: 'financial',
      name: 'Financial Agent',
      description: 'Handles financial operations and cash flow analysis for Falachefe',
      version: '1.0.0',
      weight: 1,
      specializations: [
        'add_expense',
        'add_revenue', 
        'cashflow_analysis',
        'budget_planning',
        'financial_query'
      ],
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      },
      autoRecovery: true,
      maxRetries: 3,
      timeout: 30000
    },
    {
      id: 'find-name-agent-001',
      type: 'find_name',
      name: 'Find Name Agent',
      description: 'Handles name finding and search operations',
      version: '1.0.0',
      weight: 1,
      specializations: [
        'find_name',
        'search',
        'lookup',
        'information_retrieval'
      ],
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 800
      },
      autoRecovery: true,
      maxRetries: 3,
      timeout: 30000
    },
    {
      id: 'auth-agent-001',
      type: 'auth',
      name: 'Auth Agent',
      description: 'Handles authentication and security operations',
      version: '1.0.0',
      weight: 1,
      specializations: [
        'auth',
        'login',
        'signin',
        'authentication',
        'security'
      ],
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 600
      },
      autoRecovery: true,
      maxRetries: 3,
      timeout: 30000
    },
    {
      id: 'sync-agent-001',
      type: 'sync',
      name: 'Sync Agent',
      description: 'Handles data synchronization and updates',
      version: '1.0.0',
      weight: 1,
      specializations: [
        'sync',
        'synchronize',
        'update',
        'refresh',
        'data_sync'
      ],
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        maxTokens: 700
      },
      autoRecovery: true,
      maxRetries: 3,
      timeout: 30000
    }
  ]
}

/**
 * Development configuration with relaxed settings
 */
export const falachefeAgentSquadDevConfig: FalachefeAgentSquadConfig = {
  ...falachefeAgentSquadConfig,
  orchestrator: {
    ...falachefeAgentSquadConfig.orchestrator,
    classification: {
      ...falachefeAgentSquadConfig.orchestrator.classification,
      temperature: 0.5, // More creative for development
      cacheTTL: 60 // Shorter cache for development
    }
  },
  agentManager: {
    ...falachefeAgentSquadConfig.agentManager,
    logging: {
      level: 'debug',
      enableAudit: true,
      enableMetrics: true
    }
  }
}

/**
 * Get configuration based on environment
 */
export function getAgentSquadConfig(): FalachefeAgentSquadConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? falachefeAgentSquadDevConfig : falachefeAgentSquadConfig
}
