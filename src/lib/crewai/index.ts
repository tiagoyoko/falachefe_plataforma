/**
 * Agent Manager Core - Main exports
 */

// Main Agent Manager
export { default as AgentManager } from './agent-manager'
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

// User Tools
export { userQueryTool, userBasicQueryTool, userOnboardingQueryTool } from './user-query-tool'
export { userProfileTool } from './user-profile-tool'

// OpenAI Agent SDK Integration
export { 
  openaiAgentTools, 
  toolExecutors, 
  openaiAgentConfig, 
  getToolsForAgentType, 
  executeTool, 
  validateToolParameters 
} from './openai-agent-tools'

// Agent Examples
export { UserAwareAgent, exampleUsage } from './agent-with-tools-example'

// Setup and Configuration - Removed agent-squad references

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
