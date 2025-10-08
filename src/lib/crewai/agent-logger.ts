/**
 * Agent Logger - Integration with existing UAZ Logger system
 * Provides structured logging for Agent Manager components
 */

import { UAZLogger } from '../../lib/logger/uaz-logger'

export class AgentLogger {
  private logger: UAZLogger
  private service: string

  constructor(service: string = 'agent-manager') {
    this.service = service
    this.logger = new UAZLogger(service, '1.0.0')
  }

  // Agent Manager specific logging methods
  logAgentRegistered(agentId: string, agentType: string, metadata: any): void {
    this.logger.log('info', `Agent registered: ${agentId}`, {
      agentId,
      agentType,
      service: this.service,
      action: 'agent_registered',
      metadata: this.sanitizeMetadata(metadata)
    })
  }

  logAgentUnregistered(agentId: string, reason?: string): void {
    this.logger.log('info', `Agent unregistered: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'agent_unregistered',
      reason
    })
  }

  logAgentStateChanged(agentId: string, oldState: string, newState: string, reason?: string): void {
    this.logger.log('info', `Agent state changed: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'state_changed',
      oldState,
      newState,
      reason
    })
  }

  logAgentError(agentId: string, error: Error, context?: any): void {
    this.logger.log('error', `Agent error: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'agent_error',
      error: error,
      stack: error.stack,
      context: this.sanitizeContext(context)
    })
  }

  logLoadBalancerSelection(agentId: string, strategy: string, agentType: string, reason: string): void {
    this.logger.log('debug', `Load balancer selection: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'load_balancer_selection',
      strategy,
      agentType,
      reason
    })
  }

  logHealthCheck(agentId: string, isHealthy: boolean, responseTime: number, details?: string): void {
    const level = isHealthy ? 'debug' : 'warn'
    this.logger.log(level, `Health check: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'health_check',
      isHealthy,
      responseTime,
      details
    })
  }

  logMetrics(agentId: string, metrics: any): void {
    this.logger.log('debug', `Agent metrics: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'metrics_update',
      metrics: this.sanitizeMetrics(metrics)
    })
  }

  logCircuitBreakerOpened(agentId: string, reason: string): void {
    this.logger.log('warn', `Circuit breaker opened: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'circuit_breaker_opened',
      reason
    })
  }

  logCircuitBreakerClosed(agentId: string): void {
    this.logger.log('info', `Circuit breaker closed: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'circuit_breaker_closed'
    })
  }

  logRecoveryAttempt(agentId: string, attempt: number, maxAttempts: number): void {
    this.logger.log('info', `Recovery attempt: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'recovery_attempt',
      attempt,
      maxAttempts
    })
  }

  logRecoverySuccess(agentId: string): void {
    this.logger.log('info', `Recovery successful: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'recovery_success'
    })
  }

  logRecoveryFailed(agentId: string, error: Error): void {
    this.logger.log('error', `Recovery failed: ${agentId}`, {
      agentId,
      service: this.service,
      action: 'recovery_failed',
      error: error,
      stack: error.stack
    })
  }

  logAlert(type: string, agentId: string, data: any): void {
    this.logger.log('warn', `Alert: ${type} for agent ${agentId}`, {
      agentId,
      service: this.service,
      action: 'alert',
      alertType: type,
      data: this.sanitizeContext(data)
    })
  }

  logSystemMetrics(metrics: any): void {
    this.logger.log('debug', 'System metrics update', {
      service: this.service,
      action: 'system_metrics',
      metrics: this.sanitizeMetrics(metrics)
    })
  }

  logPerformance(operation: string, duration: number, agentId?: string): void {
    this.logger.log('debug', `Performance: ${operation}`, {
      agentId,
      service: this.service,
      action: 'performance',
      operation,
      duration,
      performance: {
        operation,
        duration,
        timestamp: new Date().toISOString()
      }
    })
  }

  logAudit(action: string, resource: string, context: any): void {
    this.logger.logAudit(action, resource, {
      service: this.service,
      ...this.sanitizeContext(context)
    })
  }

  // Generic logging methods
  debug(message: string, context?: any): void {
    this.logger.log('debug', message, {
      service: this.service,
      ...this.sanitizeContext(context)
    })
  }

  info(message: string, context?: any): void {
    this.logger.log('info', message, {
      service: this.service,
      ...this.sanitizeContext(context)
    })
  }

  warn(message: string, context?: any): void {
    this.logger.log('warn', message, {
      service: this.service,
      ...this.sanitizeContext(context)
    })
  }

  error(message: string, context?: any): void {
    this.logger.log('error', message, {
      service: this.service,
      ...this.sanitizeContext(context)
    })
  }

  // Utility methods
  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return metadata
    }

    const sanitized = { ...metadata }
    
    // Remove sensitive information
    delete sanitized.password
    delete sanitized.token
    delete sanitized.secret
    delete sanitized.key
    
    // Limit size of large objects
    if (JSON.stringify(sanitized).length > 1000) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: JSON.stringify(metadata).length
      }
    }

    return sanitized
  }

  private sanitizeContext(context: any): any {
    if (!context || typeof context !== 'object') {
      return context
    }

    const sanitized = { ...context }
    
    // Remove sensitive information
    delete sanitized.password
    delete sanitized.token
    delete sanitized.secret
    delete sanitized.key
    delete sanitized.authorization
    
    // Sanitize error objects
    if (sanitized.error && typeof sanitized.error === 'object') {
      sanitized.error = {
        message: sanitized.error.message,
        name: sanitized.error.name,
        stack: sanitized.error.stack
      }
    }

    return sanitized
  }

  private sanitizeMetrics(metrics: any): any {
    if (!metrics || typeof metrics !== 'object') {
      return metrics
    }

    const sanitized = { ...metrics }
    
    // Round numeric values for better readability
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'number') {
        sanitized[key] = Math.round(sanitized[key] * 100) / 100
      }
    }

    return sanitized
  }

  // Create logger with context
  withContext(defaultContext: any): AgentLogger {
    const logger = new AgentLogger(this.service)
    
    // Override methods to include default context
    const originalMethods = [
      'logAgentRegistered', 'logAgentUnregistered', 'logAgentStateChanged',
      'logAgentError', 'logLoadBalancerSelection', 'logHealthCheck',
      'logMetrics', 'logCircuitBreakerOpened', 'logCircuitBreakerClosed',
      'logRecoveryAttempt', 'logRecoverySuccess', 'logRecoveryFailed',
      'logAlert', 'logSystemMetrics', 'logPerformance', 'logAudit',
      'debug', 'info', 'warn', 'error'
    ]

    for (const method of originalMethods) {
      const originalMethod = (logger as any)[method].bind(logger)
      (logger as any)[method] = (message: string, context?: any) => {
        return originalMethod(message, { ...defaultContext, ...context })
      }
    }

    return logger
  }

  // Create logger for specific agent
  forAgent(agentId: string): AgentLogger {
    return this.withContext({ agentId })
  }

  // Create logger for specific operation
  forOperation(operation: string): AgentLogger {
    return this.withContext({ operation })
  }
}

// Singleton instance
let instance: AgentLogger | null = null

export function getAgentLogger(): AgentLogger {
  if (!instance) {
    instance = new AgentLogger()
  }
  return instance
}

export function createAgentLogger(service: string): AgentLogger {
  return new AgentLogger(service)
}
