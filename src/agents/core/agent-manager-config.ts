/**
 * Default configuration for Agent Manager
 */

import { 
  AgentManagerConfig, 
  LoadBalancingStrategy, 
  AlertThresholds 
} from './types'

export const defaultAgentManagerConfig: AgentManagerConfig = {
  loadBalancing: {
    defaultStrategy: LoadBalancingStrategy.LEAST_LOAD,
    strategies: new Map([
      ['financial', LoadBalancingStrategy.LEAST_LOAD],
      ['marketing_sales', LoadBalancingStrategy.ROUND_ROBIN],
      ['hr', LoadBalancingStrategy.WEIGHTED],
      ['general', LoadBalancingStrategy.LEAST_CONNECTIONS],
      ['orchestrator', LoadBalancingStrategy.LEAST_LOAD]
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
}

export function createAgentManagerConfig(overrides: Partial<AgentManagerConfig> = {}): AgentManagerConfig {
  return {
    loadBalancing: {
      ...defaultAgentManagerConfig.loadBalancing,
      ...overrides.loadBalancing
    },
    stateManagement: {
      ...defaultAgentManagerConfig.stateManagement,
      ...overrides.stateManagement
    },
    metrics: {
      ...defaultAgentManagerConfig.metrics,
      ...overrides.metrics,
      alertThresholds: {
        ...defaultAgentManagerConfig.metrics.alertThresholds,
        ...overrides.metrics?.alertThresholds
      }
    },
    healthCheck: {
      ...defaultAgentManagerConfig.healthCheck,
      ...overrides.healthCheck
    },
    logging: {
      ...defaultAgentManagerConfig.logging,
      ...overrides.logging
    }
  }
}
