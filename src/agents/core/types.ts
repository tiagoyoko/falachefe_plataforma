/**
 * Types and interfaces for Agent Manager system
 * Based on AWS Labs Agent Squad Framework
 */

import { EventEmitter } from 'events'

// Agent States
export enum AgentState {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
  RECOVERING = 'recovering'
}

// Load Balancing Strategies
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED = 'weighted',
  LEAST_LOAD = 'least_load'
}

// Agent Metadata
export interface AgentMetadata {
  id: string
  type: string
  name: string
  description: string
  version: string
  weight?: number
  specializations?: string[]
  dependencies?: string[]
  config: Record<string, any>
  autoRecovery?: boolean
  maxRetries?: number
  timeout?: number
}

// Agent Requirements for Selection
export interface AgentRequirements {
  minCapacity?: number
  specialization?: string
  minVersion?: string
  maxLoad?: number
  requiredCapabilities?: string[]
}

// Agent Information
export interface AgentInfo {
  id: string
  type: string
  agent: BaseAgent
  metadata: AgentMetadata
  state: AgentState
  registeredAt: Date
  lastHeartbeat: Date
  metrics: AgentMetrics
}

// Agent Metrics
export class AgentMetrics {
  totalSelections: number = 0
  totalProcessingTime: number = 0
  averageProcessingTime: number = 0
  totalErrors: number = 0
  lastSelectedAt?: Date
  lastErrorAt?: Date
  lastError?: string
  memoryUsage: number = 0
  currentLoad: number = 0
  activeConnections: number = 0
  uptime: number = 0
  lastResetAt: Date = new Date()

  reset(): void {
    this.totalSelections = 0
    this.totalProcessingTime = 0
    this.averageProcessingTime = 0
    this.totalErrors = 0
    this.lastSelectedAt = undefined
    this.lastErrorAt = undefined
    this.lastError = undefined
    this.memoryUsage = 0
    this.currentLoad = 0
    this.activeConnections = 0
    this.uptime = 0
    this.lastResetAt = new Date()
  }

  updateProcessingTime(processingTime: number): void {
    this.totalProcessingTime += processingTime
    this.averageProcessingTime = this.totalSelections > 0 
      ? this.totalProcessingTime / this.totalSelections 
      : 0
  }

  updateUptime(): void {
    this.uptime = Date.now() - this.lastResetAt.getTime()
  }
}

// Base Agent Interface
export abstract class BaseAgent extends EventEmitter {
  abstract initialize(config: Record<string, any>): Promise<void>
  abstract process(message: string, context: Record<string, any>): Promise<any>
  abstract shutdown(): Promise<void>
  abstract isHealthy(): Promise<boolean>
  abstract getCapabilities(): string[]
  abstract getCurrentLoad(): number
  abstract getMemoryUsage(): number
}

// Configuration Interfaces
export interface AgentManagerConfig {
  loadBalancing: LoadBalancerConfig
  stateManagement: StateManagerConfig
  metrics: MetricsConfig
  healthCheck: HealthCheckConfig
  logging: LoggingConfig
}

export interface LoadBalancerConfig {
  defaultStrategy: LoadBalancingStrategy
  strategies: Map<string, LoadBalancingStrategy>
  weights: Map<string, number>
  circuitBreaker: CircuitBreakerConfig
}

export interface StateManagerConfig {
  stateTransitionTimeout: number
  recoveryAttempts: number
  recoveryDelay: number
  stateHistorySize: number
}

export interface MetricsConfig {
  collectionInterval: number
  retentionPeriod: number
  alertThresholds: AlertThresholds
  exportEnabled: boolean
}

export interface HealthCheckConfig {
  interval: number
  timeout: number
  retries: number
  healthyThreshold: number
  unhealthyThreshold: number
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableAudit: boolean
  enableMetrics: boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  halfOpenMaxCalls: number
}

export interface AlertThresholds {
  maxProcessingTime: number
  maxErrors: number
  maxMemoryUsage: number
  maxLoad: number
  minUptime: number
}

// Event Types
export interface AgentRegisteredEvent {
  agentId: string
  agentType: string
  metadata: AgentMetadata
  timestamp: Date
}

export interface AgentUnregisteredEvent {
  agentId: string
  timestamp: Date
}

export interface AgentStateChangedEvent {
  agentId: string
  oldState: AgentState
  newState: AgentState
  timestamp: Date
  reason?: string
}

export interface AgentErrorEvent {
  agentId: string
  error: Error
  timestamp: Date
  context?: Record<string, any>
}

export interface AgentMetricsEvent {
  agentId: string
  metrics: AgentMetrics
  timestamp: Date
}

// Health Check Result
export interface HealthCheckResult {
  isHealthy: boolean
  checks: {
    responseTime: number
    memoryUsage: number
    load: number
    errors: number
  }
  timestamp: Date
  details?: string
}

// Load Balancer Selection Result
export interface LoadBalancerSelection {
  agentId: string
  strategy: LoadBalancingStrategy
  reason: string
  timestamp: Date
}

// Agent Manager Events
export interface AgentManagerEvents {
  'agentRegistered': (event: AgentRegisteredEvent) => void
  'agentUnregistered': (event: AgentUnregisteredEvent) => void
  'agentStateChanged': (event: AgentStateChangedEvent) => void
  'agentError': (event: AgentErrorEvent) => void
  'agentMetrics': (event: AgentMetricsEvent) => void
  'loadBalancerSelection': (selection: LoadBalancerSelection) => void
  'healthCheckFailed': (agentId: string, result: HealthCheckResult) => void
  'circuitBreakerOpened': (agentId: string, reason: string) => void
  'circuitBreakerClosed': (agentId: string) => void
}

// Agent Response Interface
export interface AgentResponse {
  agentId: string
  response: string
  intent?: string
  confidence: number
  processingTime: number
  metadata?: Record<string, any>
}

// Utility Types
export type AgentType = 'financial' | 'marketing_sales' | 'hr' | 'general' | 'orchestrator'
export type AgentCapability = string
export type AgentId = string
export type AgentTypeId = string

// Error Types
export class AgentManagerError extends Error {
  constructor(
    message: string,
    public agentId?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AgentManagerError'
  }
}

export class AgentNotFoundError extends AgentManagerError {
  constructor(agentId: string) {
    super(`Agent ${agentId} not found`, agentId, 'AGENT_NOT_FOUND')
    this.name = 'AgentNotFoundError'
  }
}

export class AgentNotAvailableError extends AgentManagerError {
  constructor(agentId: string) {
    super(`Agent ${agentId} is not available`, agentId, 'AGENT_NOT_AVAILABLE')
    this.name = 'AgentNotAvailableError'
  }
}

export class AgentRegistrationError extends AgentManagerError {
  constructor(agentId: string, reason: string) {
    super(`Failed to register agent ${agentId}: ${reason}`, agentId, 'AGENT_REGISTRATION_FAILED')
    this.name = 'AgentRegistrationError'
  }
}

export class LoadBalancerError extends AgentManagerError {
  constructor(message: string, agentType?: string) {
    super(message, undefined, 'LOAD_BALANCER_ERROR')
    this.name = 'LoadBalancerError'
  }
}
