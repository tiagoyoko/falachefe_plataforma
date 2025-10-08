/**
 * Agent Manager - Core component for managing Agent Squad agents
 * Based on AWS Labs Agent Squad Framework
 * Enhanced with load balancing, health checking, and metrics collection
 */

import { EventEmitter } from 'events'
import { 
  AgentManagerConfig,
  AgentInfo,
  AgentMetadata,
  AgentState,
  AgentRequirements,
  AgentManagerEvents,
  AgentManagerError,
  AgentNotFoundError,
  AgentNotAvailableError,
  AgentRegistrationError,
  BaseAgent
} from './types'
import { LoadBalancer } from './load-balancer'
import { AgentStateManager } from './agent-state-manager'
import { AgentMetricsCollector } from './agent-metrics-collector'
import { HealthChecker } from './health-checker'
import { AgentLogger } from './agent-logger'

export class AgentManager extends EventEmitter {
  private registry: Map<string, AgentInfo>
  private loadBalancer: LoadBalancer
  private stateManager: AgentStateManager
  private metricsCollector: AgentMetricsCollector
  private healthChecker: HealthChecker
  private logger: AgentLogger
  private config: AgentManagerConfig
  private healthCheckInterval?: NodeJS.Timeout

  constructor(config: AgentManagerConfig) {
    super()
    this.config = config
    this.registry = new Map()
    this.loadBalancer = new LoadBalancer(config.loadBalancing)
    this.stateManager = new AgentStateManager(config.stateManagement)
    this.metricsCollector = new AgentMetricsCollector(config.metrics)
    this.healthChecker = new HealthChecker(config.healthCheck)
    this.logger = new AgentLogger('agent-manager')
    
    this.setupEventHandlers()
    this.startHealthCheck()
  }

  async registerAgent(agent: BaseAgent, metadata: AgentMetadata): Promise<void> {
    try {
      // 1. Validar agente
      await this.validateAgent(agent, metadata)
      
      // 2. Registrar no registry
      const agentInfo: AgentInfo = {
        id: metadata.id,
        type: metadata.type,
        agent,
        metadata,
        state: AgentState.INITIALIZING,
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        metrics: new (await import('./types')).AgentMetrics()
      }
      
      this.registry.set(metadata.id, agentInfo)
      
      // 3. Inicializar agente
      await agent.initialize(metadata.config)
      
      // 4. Atualizar estado
      await this.stateManager.setState(metadata.id, AgentState.ACTIVE)
      
      // 5. Adicionar ao load balancer
      this.loadBalancer.addAgent(agentInfo)
      
      // 6. Emitir evento
      this.emit('agentRegistered', {
        agentId: metadata.id,
        agentType: metadata.type,
        metadata,
        timestamp: new Date()
      })
      
      this.logger.logAgentRegistered(metadata.id, metadata.type, metadata)
      
    } catch (error) {
      this.logger.logAgentError(metadata.id, error as Error)
      throw new AgentRegistrationError(metadata.id, (error as Error).message)
    }
  }

  async getAvailableAgent(
    agentType: string,
    requirements?: AgentRequirements
  ): Promise<BaseAgent | null> {
    try {
      // 1. Filtrar agentes por tipo
      const availableAgents = this.getAgentsByType(agentType)
      
      if (availableAgents.length === 0) {
        this.logger.warn(`Nenhum agente disponível do tipo ${agentType}`)
        return null
      }

      // 2. Aplicar filtros de requisitos
      const filteredAgents = this.filterAgentsByRequirements(
        availableAgents,
        requirements
      )

      if (filteredAgents.length === 0) {
        this.logger.warn(`Nenhum agente atende aos requisitos para ${agentType}`)
        return null
      }

      // 3. Selecionar agente via load balancer
      const selectedAgent = this.loadBalancer.selectAgent(
        filteredAgents,
        agentType
      )

      if (selectedAgent) {
        // 4. Atualizar métricas
        this.metricsCollector.recordAgentSelection(selectedAgent.id)
        this.logger.logLoadBalancerSelection(
          selectedAgent.id, 
          this.loadBalancer.getStrategy(agentType), 
          agentType,
          'Agent selected via load balancer'
        )
      }

      return selectedAgent?.agent || null

    } catch (error) {
      this.logger.error(`Erro ao selecionar agente ${agentType}:`, { error })
      return null
    }
  }

  async unregisterAgent(agentId: string): Promise<void> {
    try {
      const agentInfo = this.registry.get(agentId)
      if (!agentInfo) {
        throw new AgentNotFoundError(agentId)
      }

      // 1. Parar agente
      await agentInfo.agent.shutdown()
      
      // 2. Remover do load balancer
      this.loadBalancer.removeAgent(agentId)
      
      // 3. Atualizar estado
      await this.stateManager.setState(agentId, AgentState.SHUTDOWN)
      
      // 4. Remover do registry
      this.registry.delete(agentId)
      
      // 5. Limpar métricas
      this.metricsCollector.removeAgent(agentId)
      
      // 6. Emitir evento
      this.emit('agentUnregistered', {
        agentId,
        timestamp: new Date()
      })
      
      this.logger.logAgentUnregistered(agentId, 'Agent unregistered successfully')

    } catch (error) {
      this.logger.logAgentError(agentId, error as Error)
      throw error
    }
  }

  async processMessage(
    agentId: string,
    message: string,
    context: Record<string, any>
  ): Promise<any> {
    const agentInfo = this.registry.get(agentId)
    if (!agentInfo) {
      throw new AgentNotFoundError(agentId)
    }

    if (!this.stateManager.isAgentActive(agentId)) {
      throw new AgentNotAvailableError(agentId)
    }

    const startTime = Date.now()
    
    try {
      const result = await agentInfo.agent.process(message, context)
      const processingTime = Date.now() - startTime
      
      // Record metrics
      this.metricsCollector.recordProcessingTime(agentId, processingTime)
      this.loadBalancer.recordSuccess(agentId)
      
      this.logger.logPerformance('processMessage', processingTime, agentId)
      
      return result
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      // Record error metrics
      this.metricsCollector.recordError(agentId, error as Error)
      this.loadBalancer.recordFailure(agentId)
      
      this.logger.logAgentError(agentId, error as Error, { processingTime })
      throw error
    }
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.registry.get(agentId)?.agent
  }

  getAgentInfo(agentId: string): AgentInfo | undefined {
    return this.registry.get(agentId)
  }

  getAgentsByType(type: string): AgentInfo[] {
    return Array.from(this.registry.values())
      .filter(agent => 
        agent.type === type && 
        agent.state === AgentState.ACTIVE
      )
  }

  getAvailableAgents(): AgentInfo[] {
    return Array.from(this.registry.values())
      .filter(agent => this.stateManager.isAgentActive(agent.id))
  }

  getAgentMetrics(agentId?: string): any {
    return this.metricsCollector.getMetrics(agentId)
  }

  getSystemMetrics(): any {
    return this.metricsCollector.getSystemMetrics()
  }

  getHealthStatus(agentId?: string): any {
    if (agentId) {
      return this.healthChecker.getHealthStatus(agentId)
    }
    
    return this.healthChecker.getHealthSummary()
  }

  getAgentStats(): Record<string, any> {
    const stats = {
      totalAgents: this.registry.size,
      activeAgents: this.getAvailableAgents().length,
      agentsByType: {} as Record<string, number>,
      capabilities: new Set<string>(),
      states: this.stateManager.getStats().states,
      loadBalancerStats: this.loadBalancer.getStats()
    }

    this.registry.forEach(agent => {
      stats.agentsByType[agent.type] = (stats.agentsByType[agent.type] || 0) + 1
      agent.agent.getCapabilities().forEach(cap => stats.capabilities.add(cap))
    })

    return {
      ...stats,
      capabilities: Array.from(stats.capabilities)
    }
  }

  async restartAgent(agentId: string): Promise<void> {
    const agentInfo = this.registry.get(agentId)
    if (!agentInfo) {
      throw new AgentNotFoundError(agentId)
    }

    try {
      this.logger.logRecoveryAttempt(agentId, 1, 1)
      
      // 1. Parar agente
      await agentInfo.agent.shutdown()
      
      // 2. Aguardar cooldown
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // 3. Reinicializar
      await agentInfo.agent.initialize(agentInfo.metadata.config)
      
      // 4. Atualizar estado
      await this.stateManager.setState(agentId, AgentState.ACTIVE)
      
      // 5. Resetar métricas
      agentInfo.metrics.reset()
      
      this.logger.logRecoverySuccess(agentId)
      
    } catch (error) {
      this.logger.logRecoveryFailed(agentId, error as Error)
      throw error
    }
  }

  private async validateAgent(agent: BaseAgent, metadata: AgentMetadata): Promise<void> {
    // Validar se agente implementa interface necessária
    if (!agent.initialize || !agent.process || !agent.shutdown) {
      throw new Error('Agente deve implementar interface BaseAgent')
    }

    // Validar configuração
    if (!metadata.type || !metadata.id) {
      throw new Error('Metadata deve incluir type e id')
    }

    // Validar dependências
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        if (!this.isDependencyAvailable(dep)) {
          throw new Error(`Dependência ${dep} não disponível`)
        }
      }
    }
  }

  private filterAgentsByRequirements(
    agents: AgentInfo[],
    requirements?: AgentRequirements
  ): AgentInfo[] {
    if (!requirements) return agents

    return agents.filter(agent => {
      // Verificar capacidade mínima
      if (requirements.minCapacity && 
          agent.metrics.currentLoad > requirements.minCapacity) {
        return false
      }

      // Verificar especialização
      if (requirements.specialization && 
          !agent.metadata.specializations?.includes(requirements.specialization)) {
        return false
      }

      // Verificar versão mínima
      if (requirements.minVersion && 
          this.compareVersions(agent.metadata.version, requirements.minVersion) < 0) {
        return false
      }

      // Verificar capacidades necessárias
      if (requirements.requiredCapabilities) {
        const agentCapabilities = agent.agent.getCapabilities()
        const hasAllCapabilities = requirements.requiredCapabilities.every(
          cap => agentCapabilities.includes(cap)
        )
        if (!hasAllCapabilities) {
          return false
        }
      }

      return true
    })
  }

  private isDependencyAvailable(dependency: string): boolean {
    // Verificar se dependência está disponível no registry
    return Array.from(this.registry.values())
      .some(agent => agent.type === dependency && agent.state === AgentState.ACTIVE)
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }
    
    return 0
  }

  private setupEventHandlers(): void {
    this.on('agentRegistered', (event) => {
      this.logger.info(`Agente ${event.agentId} registrado`)
    })

    this.on('agentUnregistered', (event) => {
      this.logger.info(`Agente ${event.agentId} desregistrado`)
    })

    this.stateManager.on('agentStateChanged', (event) => {
      this.logger.logAgentStateChanged(
        event.agentId, 
        event.oldState, 
        event.newState, 
        event.reason
      )
    })

    this.stateManager.on('agentError', (agentId, error) => {
      this.logger.logAgentError(agentId, error)
      this.handleAgentError(agentId, error)
    })

    this.metricsCollector.on('alert', (alert) => {
      this.logger.logAlert(alert.type, alert.agentId, alert.data)
    })
  }

  private async handleAgentError(agentId: string, error: Error): Promise<void> {
    const agentInfo = this.registry.get(agentId)
    if (!agentInfo) return

    // Implementar estratégia de recovery
    if (agentInfo.metadata.autoRecovery) {
      try {
        await this.restartAgent(agentId)
        this.logger.logRecoverySuccess(agentId)
      } catch (restartError) {
        this.logger.logRecoveryFailed(agentId, restartError as Error)
        await this.stateManager.setState(agentId, AgentState.ERROR)
      }
    } else {
      await this.stateManager.setState(agentId, AgentState.ERROR)
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const agents = Array.from(this.registry.values())
        .map(info => info.agent)
      
      if (agents.length === 0) return

      try {
        const healthResults = await this.healthChecker.checkHealthBatch(agents)
        
        for (const [agentId, isHealthy] of healthResults) {
          const agentInfo = this.registry.get(agentId)
          if (!agentInfo) continue

          if (!isHealthy && agentInfo.state === AgentState.ACTIVE) {
            this.emit('agentError', agentId, new Error('Health check failed'))
          } else if (isHealthy && agentInfo.state === AgentState.ERROR) {
            await this.stateManager.setState(agentId, AgentState.ACTIVE)
          }
          
          agentInfo.lastHeartbeat = new Date()
        }
        
      } catch (error) {
        this.logger.error('Health check batch failed', { error })
      }
    }, this.config.healthCheck.interval)
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    this.metricsCollector.destroy()
    this.removeAllListeners()
  }
}

export default AgentManager
