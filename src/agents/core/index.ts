/**
 * Agent Manager Core - Main exports
 * Based on AWS Labs Agent Squad Framework
 */

// Main Agent Manager
export { AgentManager } from './agent-manager'
export { defaultAgentManagerConfig, createAgentManagerConfig } from './agent-manager-config'

// Core Components
export { LoadBalancer } from './load-balancer'
export { AgentStateManager } from './agent-state-manager'
export { AgentMetricsCollector } from './agent-metrics-collector'
export { HealthChecker } from './health-checker'
export { AgentLogger } from './agent-logger'

// Orchestration
export { AgentOrchestrator } from './agent-orchestrator'
export { AgentRouter } from './agent-router'
export { IntentClassifier } from './intent-classifier'
export { ConversationContextManager } from './conversation-context-manager'

// Memory and Streaming
export { MemorySystem } from './memory-system'
export { StreamingService } from './streaming-service'

// Setup and Configuration
export { 
  FalachefeAgentSquad, 
  createFalachefeAgentSquad, 
  defaultFalachefeConfig,
  type FalachefeAgentSquadConfig 
} from './agent-squad-setup'

// Types and Interfaces
export {
  // Enums
  AgentState,
  LoadBalancingStrategy,
  
  // Interfaces
  type AgentMetadata,
  type AgentRequirements,
  type AgentInfo,
  type AgentManagerConfig,
  type LoadBalancerConfig,
  type StateManagerConfig,
  type MetricsConfig,
  type HealthCheckConfig,
  type LoggingConfig,
  type CircuitBreakerConfig,
  type AlertThresholds,
  
  // Event Types
  type AgentRegisteredEvent,
  type AgentUnregisteredEvent,
  type AgentStateChangedEvent,
  type AgentErrorEvent,
  type AgentMetricsEvent,
  type HealthCheckResult,
  type LoadBalancerSelection,
  type AgentManagerEvents,
  
  // Utility Types
  type AgentType,
  type AgentCapability,
  type AgentId,
  type AgentTypeId,
  
  // Error Classes
  AgentManagerError,
  AgentNotFoundError,
  AgentNotAvailableError,
  AgentRegistrationError,
  LoadBalancerError,
  
  // Base Classes
  BaseAgent,
  AgentMetrics
} from './types'

// Default export for convenience
export default AgentManager
