/**
 * Unit tests for Agent Metrics Collector
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { AgentMetricsCollector } from '../agent-metrics-collector'
import { MetricsConfig, AlertThresholds } from '../types'

describe('AgentMetricsCollector', () => {
  let metricsCollector: AgentMetricsCollector
  let config: MetricsConfig
  let alertThresholds: AlertThresholds

  beforeEach(() => {
    config = {
      collectionInterval: 60000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enableSystemMetrics: true,
      systemMetricsInterval: 30000
    }
    
    alertThresholds = {
      highErrorRate: 0.1, // 10%
      highMemoryUsage: 0.8, // 80%
      highCpuUsage: 0.8, // 80%
      lowThroughput: 10, // requests per minute
      highResponseTime: 5000 // 5 seconds
    }
    
    metricsCollector = new AgentMetricsCollector(config, alertThresholds)
  })

  afterEach(() => {
    metricsCollector.removeAllListeners()
  })

  describe('Agent Selection Metrics', () => {
    it('should record agent selection', () => {
      metricsCollector.recordAgentSelection('agent-1')
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalSelections).toBe(1)
    })

    it('should increment selection count on multiple selections', () => {
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordAgentSelection('agent-1')
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalSelections).toBe(3)
    })
  })

  describe('Processing Time Metrics', () => {
    it('should record processing time', () => {
      metricsCollector.recordProcessingTime('agent-1', 1000)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalProcessingTime).toBe(1000)
      expect(metrics.averageProcessingTime).toBe(1000)
    })

    it('should calculate average processing time correctly', () => {
      metricsCollector.recordProcessingTime('agent-1', 1000)
      metricsCollector.recordProcessingTime('agent-1', 2000)
      metricsCollector.recordProcessingTime('agent-1', 3000)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalProcessingTime).toBe(6000)
      expect(metrics.averageProcessingTime).toBe(2000)
    })

    it('should track min and max processing times', () => {
      metricsCollector.recordProcessingTime('agent-1', 1000)
      metricsCollector.recordProcessingTime('agent-1', 500)
      metricsCollector.recordProcessingTime('agent-1', 2000)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.minProcessingTime).toBe(500)
      expect(metrics.maxProcessingTime).toBe(2000)
    })
  })

  describe('Error Metrics', () => {
    it('should record errors', () => {
      const error = new Error('Test error')
      metricsCollector.recordError('agent-1', error)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalErrors).toBe(1)
      expect(metrics.errorRate).toBe(1) // 100% error rate
    })

    it('should calculate error rate correctly', () => {
      // 2 successful operations, 1 error
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordError('agent-1', new Error('Test error'))
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalErrors).toBe(1)
      expect(metrics.errorRate).toBe(0.5) // 50% error rate
    })

    it('should track error types', () => {
      metricsCollector.recordError('agent-1', new Error('TypeError'))
      metricsCollector.recordError('agent-1', new Error('ReferenceError'))
      metricsCollector.recordError('agent-1', new Error('TypeError'))
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.errorTypes.TypeError).toBe(2)
      expect(metrics.errorTypes.ReferenceError).toBe(1)
    })
  })

  describe('Memory Usage Metrics', () => {
    it('should record memory usage', () => {
      metricsCollector.recordMemoryUsage('agent-1', 100 * 1024 * 1024) // 100MB
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.memoryUsage).toBe(100 * 1024 * 1024)
    })

    it('should track memory usage over time', () => {
      metricsCollector.recordMemoryUsage('agent-1', 100 * 1024 * 1024)
      metricsCollector.recordMemoryUsage('agent-1', 150 * 1024 * 1024)
      metricsCollector.recordMemoryUsage('agent-1', 120 * 1024 * 1024)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.memoryUsage).toBe(120 * 1024 * 1024) // Latest value
    })
  })

  describe('API Call Metrics', () => {
    it('should record API calls', () => {
      metricsCollector.recordApiCall('agent-1', 'create_task', 200, 500)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalApiCalls).toBe(1)
      expect(metrics.apiCallsByEndpoint.create_task).toBe(1)
    })

    it('should track API call status codes', () => {
      metricsCollector.recordApiCall('agent-1', 'create_task', 200, 500)
      metricsCollector.recordApiCall('agent-1', 'create_task', 400, 300)
      metricsCollector.recordApiCall('agent-1', 'create_task', 500, 1000)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.apiCallsByStatus[200]).toBe(1)
      expect(metrics.apiCallsByStatus[400]).toBe(1)
      expect(metrics.apiCallsByStatus[500]).toBe(1)
    })

    it('should calculate average API response time', () => {
      metricsCollector.recordApiCall('agent-1', 'create_task', 200, 500)
      metricsCollector.recordApiCall('agent-1', 'create_task', 200, 1000)
      metricsCollector.recordApiCall('agent-1', 'create_task', 200, 1500)
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.averageApiResponseTime).toBe(1000)
    })
  })

  describe('System Metrics', () => {
    it('should collect system metrics', () => {
      const systemMetrics = metricsCollector.getSystemMetrics()
      
      expect(systemMetrics).toBeDefined()
      expect(systemMetrics.totalAgents).toBe(0)
      expect(systemMetrics.totalSelections).toBe(0)
      expect(systemMetrics.totalErrors).toBe(0)
      expect(systemMetrics.totalProcessingTime).toBe(0)
    })

    it('should update system metrics when agent metrics change', () => {
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordAgentSelection('agent-2')
      
      const systemMetrics = metricsCollector.getSystemMetrics()
      expect(systemMetrics.totalAgents).toBe(2)
      expect(systemMetrics.totalSelections).toBe(2)
    })
  })

  describe('Alerting', () => {
    it('should emit alert for high error rate', () => {
      const alertSpy = jest.fn()
      metricsCollector.on('alert', alertSpy)
      
      // Create high error rate (50% > 10% threshold)
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordError('agent-1', new Error('Test error'))
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'high_error_rate',
          agentId: 'agent-1'
        })
      )
    })

    it('should emit alert for high memory usage', () => {
      const alertSpy = jest.fn()
      metricsCollector.on('alert', alertSpy)
      
      // Simulate high memory usage (90% > 80% threshold)
      metricsCollector.recordMemoryUsage('agent-1', 0.9)
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'high_memory_usage',
          agentId: 'agent-1'
        })
      )
    })

    it('should emit alert for high response time', () => {
      const alertSpy = jest.fn()
      metricsCollector.on('alert', alertSpy)
      
      // Simulate high response time (6s > 5s threshold)
      metricsCollector.recordProcessingTime('agent-1', 6000)
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'high_response_time',
          agentId: 'agent-1'
        })
      )
    })
  })

  describe('Agent Cleanup', () => {
    it('should remove agent metrics', () => {
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordProcessingTime('agent-1', 1000)
      
      metricsCollector.removeAgent('agent-1')
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.totalSelections).toBe(0)
      expect(metrics.totalProcessingTime).toBe(0)
    })

    it('should handle removal of non-existent agent', () => {
      expect(() => {
        metricsCollector.removeAgent('nonexistent')
      }).not.toThrow()
    })
  })

  describe('Metrics Retrieval', () => {
    it('should return metrics for specific agent', () => {
      metricsCollector.recordAgentSelection('agent-1')
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics).toBeDefined()
      expect(metrics.totalSelections).toBe(1)
    })

    it('should return all metrics when no agent specified', () => {
      metricsCollector.recordAgentSelection('agent-1')
      metricsCollector.recordAgentSelection('agent-2')
      
      const allMetrics = metricsCollector.getMetrics()
      expect(allMetrics).toBeInstanceOf(Map)
      expect(allMetrics.size).toBe(2)
    })

    it('should return empty metrics for non-existent agent', () => {
      const metrics = metricsCollector.getMetrics('nonexistent')
      expect(metrics.totalSelections).toBe(0)
    })
  })

  describe('Performance Tracking', () => {
    it('should track throughput over time', () => {
      const startTime = Date.now()
      
      // Simulate 10 selections over 1 minute
      for (let i = 0; i < 10; i++) {
        metricsCollector.recordAgentSelection('agent-1')
      }
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.throughput).toBeGreaterThan(0)
    })

    it('should calculate availability percentage', () => {
      // 8 successful operations, 2 errors = 80% availability
      for (let i = 0; i < 8; i++) {
        metricsCollector.recordAgentSelection('agent-1')
      }
      for (let i = 0; i < 2; i++) {
        metricsCollector.recordError('agent-1', new Error('Test error'))
      }
      
      const metrics = metricsCollector.getMetrics('agent-1')
      expect(metrics.availability).toBe(0.8)
    })
  })
})
