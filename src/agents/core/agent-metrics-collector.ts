/**
 * Agent Metrics Collector
 * Collects and analyzes agent performance metrics
 */

import { EventEmitter } from 'events'
import { 
  AgentMetrics, 
  MetricsConfig, 
  AlertThresholds,
  AgentMetricsEvent 
} from './types'

export class AgentMetricsCollector extends EventEmitter {
  private metrics: Map<string, AgentMetrics>
  private alertThresholds: AlertThresholds
  private collectionInterval?: NodeJS.Timeout
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    super()
    this.config = config
    this.metrics = new Map()
    this.alertThresholds = config.alertThresholds || {
      maxProcessingTime: 5000,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxErrors: 10,
      maxErrorRate: 0.1
    }
    
    this.startCollection()
  }

  recordAgentSelection(agentId: string): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalSelections++
    metrics.lastSelectedAt = new Date()
    
    this.emitMetricsEvent(agentId, metrics)
  }

  recordProcessingTime(agentId: string, processingTime: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalProcessingTime += processingTime
    metrics.averageProcessingTime = 
      metrics.totalSelections > 0 
        ? metrics.totalProcessingTime / metrics.totalSelections 
        : 0
    
    // Check for high processing time alert
    if (processingTime > this.alertThresholds.maxProcessingTime) {
      this.emitAlert('high_processing_time', agentId, { 
        processingTime, 
        threshold: this.alertThresholds.maxProcessingTime 
      })
    }
  }

  recordError(agentId: string, error: Error): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalErrors++
    metrics.lastErrorAt = new Date()
    metrics.lastError = error.message
    
    // Check for high error rate alert
    if (metrics.totalErrors > this.alertThresholds.maxErrors) {
      this.emitAlert('high_error_rate', agentId, { 
        errorCount: metrics.totalErrors,
        threshold: this.alertThresholds.maxErrors
      })
    }
  }

  recordMemoryUsage(agentId: string, memoryUsage: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.memoryUsage = memoryUsage
    
    // Check for high memory usage alert
    if (memoryUsage > this.alertThresholds.maxMemoryUsage) {
      this.emitAlert('high_memory_usage', agentId, { 
        memoryUsage, 
        threshold: this.alertThresholds.maxMemoryUsage 
      })
    }
  }

  recordLoad(agentId: string, load: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.currentLoad = load
    
    // Check for high load alert
    if (load > this.alertThresholds.maxLoad) {
      this.emitAlert('high_load', agentId, { 
        load, 
        threshold: this.alertThresholds.maxLoad 
      })
    }
  }

  recordApiCall(agentId: string, operation: string, statusCode: number, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalApiCalls = (metrics.totalApiCalls || 0) + 1
    
    // Track status codes
    if (!metrics.apiCallStatusCodes) {
      metrics.apiCallStatusCodes = new Map()
    }
    const count = metrics.apiCallStatusCodes.get(statusCode) || 0
    metrics.apiCallStatusCodes.set(statusCode, count + 1)
    
    // Track response times
    if (!metrics.apiResponseTimes) {
      metrics.apiResponseTimes = []
    }
    metrics.apiResponseTimes.push({
      timestamp: new Date(),
      operation,
      statusCode,
      responseTime
    })
    
    // Keep only last 100 API response time records
    if (metrics.apiResponseTimes.length > 100) {
      metrics.apiResponseTimes = metrics.apiResponseTimes.slice(-100)
    }
    
    this.emitMetricsEvent(agentId, metrics)
  }

  recordConnections(agentId: string, connections: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.activeConnections = connections
  }

  updateUptime(agentId: string): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.updateUptime()
  }

  getMetrics(agentId?: string): AgentMetrics | Map<string, AgentMetrics> {
    if (agentId) {
      return this.metrics.get(agentId) || new AgentMetrics()
    }
    
    return new Map(this.metrics)
  }

  getAgentMetrics(agentId: string): AgentMetrics {
    return this.getOrCreateMetrics(agentId)
  }

  getAllMetrics(): Map<string, AgentMetrics> {
    return new Map(this.metrics)
  }

  resetMetrics(agentId: string): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.reset()
    this.emitMetricsEvent(agentId, metrics)
  }

  removeAgent(agentId: string): void {
    this.metrics.delete(agentId)
  }

  getTopPerformers(limit: number = 10): AgentPerformance[] {
    const performances: AgentPerformance[] = []
    
    for (const [agentId, metrics] of this.metrics) {
      const performance = this.calculatePerformance(agentId, metrics)
      performances.push(performance)
    }
    
    return performances
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  getWorstPerformers(limit: number = 10): AgentPerformance[] {
    const performances: AgentPerformance[] = []
    
    for (const [agentId, metrics] of this.metrics) {
      const performance = this.calculatePerformance(agentId, metrics)
      performances.push(performance)
    }
    
    return performances
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
  }

  getSystemMetrics(): SystemMetrics {
    const totalAgents = this.metrics.size
    let totalSelections = 0
    let totalProcessingTime = 0
    let totalErrors = 0
    let totalMemoryUsage = 0
    let totalLoad = 0
    let totalConnections = 0

    for (const metrics of this.metrics.values()) {
      totalSelections += metrics.totalSelections
      totalProcessingTime += metrics.totalProcessingTime
      totalErrors += metrics.totalErrors
      totalMemoryUsage += metrics.memoryUsage
      totalLoad += metrics.currentLoad
      totalConnections += metrics.activeConnections
    }

    return {
      totalAgents,
      totalSelections,
      averageProcessingTime: totalSelections > 0 ? totalProcessingTime / totalSelections : 0,
      totalErrors,
      averageMemoryUsage: totalAgents > 0 ? totalMemoryUsage / totalAgents : 0,
      averageLoad: totalAgents > 0 ? totalLoad / totalAgents : 0,
      totalConnections,
      errorRate: totalSelections > 0 ? totalErrors / totalSelections : 0
    }
  }

  getAlertSummary(): AlertSummary {
    const alerts: AlertSummary = {
      high_processing_time: 0,
      high_error_rate: 0,
      high_memory_usage: 0,
      high_load: 0,
      low_uptime: 0
    }

    for (const [agentId, metrics] of this.metrics) {
      // Check processing time
      if (metrics.averageProcessingTime > this.alertThresholds.maxProcessingTime) {
        alerts.high_processing_time++
      }

      // Check error rate
      if (metrics.totalErrors > this.alertThresholds.maxErrors) {
        alerts.high_error_rate++
      }

      // Check memory usage
      if (metrics.memoryUsage > this.alertThresholds.maxMemoryUsage) {
        alerts.high_memory_usage++
      }

      // Check load
      if (metrics.currentLoad > this.alertThresholds.maxLoad) {
        alerts.high_load++
      }

      // Check uptime
      if (metrics.uptime < this.alertThresholds.minUptime) {
        alerts.low_uptime++
      }
    }

    return alerts
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV()
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      system: this.getSystemMetrics(),
      alerts: this.getAlertSummary()
    }, null, 2)
  }

  private getOrCreateMetrics(agentId: string): AgentMetrics {
    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, new AgentMetrics())
    }
    
    return this.metrics.get(agentId)!
  }

  private emitMetricsEvent(agentId: string, metrics: AgentMetrics): void {
    const event: AgentMetricsEvent = {
      agentId,
      metrics,
      timestamp: new Date()
    }
    
    this.emit('agentMetrics', event)
  }

  private emitAlert(type: string, agentId: string, data: any): void {
    this.emit('alert', {
      type,
      agentId,
      data,
      timestamp: new Date()
    })
  }

  private calculatePerformance(agentId: string, metrics: AgentMetrics): AgentPerformance {
    // Calculate performance score based on multiple factors
    let score = 100 // Start with perfect score

    // Deduct points for high processing time
    if (metrics.averageProcessingTime > 0) {
      const processingPenalty = Math.min(
        (metrics.averageProcessingTime / this.alertThresholds.maxProcessingTime) * 20,
        20
      )
      score -= processingPenalty
    }

    // Deduct points for errors
    if (metrics.totalSelections > 0) {
      const errorRate = metrics.totalErrors / metrics.totalSelections
      const errorPenalty = Math.min(errorRate * 100, 30)
      score -= errorPenalty
    }

    // Deduct points for high memory usage
    if (metrics.memoryUsage > 0) {
      const memoryPenalty = Math.min(
        (metrics.memoryUsage / this.alertThresholds.maxMemoryUsage) * 15,
        15
      )
      score -= memoryPenalty
    }

    // Deduct points for high load
    if (metrics.currentLoad > 0) {
      const loadPenalty = Math.min(
        (metrics.currentLoad / this.alertThresholds.maxLoad) * 10,
        10
      )
      score -= loadPenalty
    }

    // Bonus for high selection count (indicates reliability)
    if (metrics.totalSelections > 100) {
      score += Math.min(metrics.totalSelections / 1000, 5)
    }

    return {
      agentId,
      score: Math.max(0, Math.min(100, score)),
      metrics: { ...metrics }
    }
  }

  private exportToCSV(): string {
    const headers = [
      'agentId',
      'totalSelections',
      'averageProcessingTime',
      'totalErrors',
      'memoryUsage',
      'currentLoad',
      'activeConnections',
      'uptime',
      'lastSelectedAt',
      'lastErrorAt'
    ]

    const rows = [headers.join(',')]

    for (const [agentId, metrics] of this.metrics) {
      const row = [
        agentId,
        metrics.totalSelections,
        metrics.averageProcessingTime,
        metrics.totalErrors,
        metrics.memoryUsage,
        metrics.currentLoad,
        metrics.activeConnections,
        metrics.uptime,
        metrics.lastSelectedAt?.toISOString() || '',
        metrics.lastErrorAt?.toISOString() || ''
      ]
      rows.push(row.join(','))
    }

    return rows.join('\n')
  }

  private startCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
    }

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics()
    }, this.config.collectionInterval)
  }

  private collectSystemMetrics(): void {
    // Update uptime for all agents
    for (const [agentId, metrics] of this.metrics) {
      metrics.updateUptime()
    }

    // Emit system metrics event
    this.emit('systemMetrics', this.getSystemMetrics())
  }

  destroy(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
    }
    this.metrics.clear()
  }
}

interface AgentPerformance {
  agentId: string
  score: number
  metrics: AgentMetrics
}

interface SystemMetrics {
  totalAgents: number
  totalSelections: number
  averageProcessingTime: number
  totalErrors: number
  averageMemoryUsage: number
  averageLoad: number
  totalConnections: number
  errorRate: number
}

interface AlertSummary {
  high_processing_time: number
  high_error_rate: number
  high_memory_usage: number
  high_load: number
  low_uptime: number
}
