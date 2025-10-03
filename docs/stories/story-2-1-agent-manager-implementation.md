# 📋 **Story 2.1: Implementação do Agent Manager**

## 🎯 **Story Statement**
Como **sistema**, quero **um gerenciador central de agentes especializados** para que **possa registrar, monitorar e coordenar todos os agentes disponíveis** no Agent Squad Framework, garantindo alta disponibilidade e balanceamento de carga.

## 📝 **Descrição Detalhada**

### **Contexto**
O Agent Manager é o componente responsável por gerenciar o ciclo de vida de todos os agentes especializados no sistema. Ele atua como um "registry" central que mantém o estado de cada agente, gerencia sua disponibilidade, monitora performance e coordena a distribuição de carga entre agentes do mesmo tipo.

### **Objetivos**
- Implementar gerenciador central de agentes especializados
- Registrar e monitorar estado de todos os agentes
- Implementar balanceamento de carga inteligente
- Gerenciar ciclo de vida dos agentes (start, stop, restart)
- Monitorar performance e saúde dos agentes
- Implementar failover automático

## ✅ **Acceptance Criteria**

### **AC1: Registro e Descoberta de Agentes**
- [ ] Registrar agentes especializados automaticamente
- [ ] Manter registry central de agentes disponíveis
- [ ] Suportar descoberta dinâmica de novos agentes
- [ ] Validar configuração e dependências dos agentes
- [ ] Implementar heartbeat para verificar saúde dos agentes

### **AC2: Gerenciamento de Estado**
- [ ] Monitorar estado de cada agente (ativo, inativo, erro)
- [ ] Implementar transições de estado controladas
- [ ] Manter histórico de mudanças de estado
- [ ] Implementar recovery automático para agentes com falha
- [ ] Notificar sobre mudanças críticas de estado

### **AC3: Balanceamento de Carga**
- [ ] Distribuir mensagens entre agentes do mesmo tipo
- [ ] Implementar algoritmos de balanceamento (round-robin, least-connections)
- [ ] Considerar capacidade e performance de cada agente
- [ ] Implementar circuit breaker para agentes sobrecarregados
- [ ] Suportar priorização de agentes por especialização

### **AC4: Monitoramento e Métricas**
- [ ] Coletar métricas de performance de cada agente
- [ ] Implementar alertas para problemas de performance
- [ ] Gerar relatórios de utilização e eficiência
- [ ] Monitorar uso de recursos (CPU, memória, API calls)
- [ ] Implementar dashboard de monitoramento em tempo real

## 📋 **Tasks / Subtasks**

### **Task 1: Core Agent Manager**
- [ ] Criar classe `AgentManager` principal
- [ ] Implementar registry central de agentes
- [ ] Implementar sistema de heartbeat
- [ ] Criar interfaces para gerenciamento de agentes
- [ ] Implementar logging e auditoria

### **Task 2: Sistema de Registro de Agentes**
- [ ] Implementar `AgentRegistry` para descoberta
- [ ] Criar sistema de validação de agentes
- [ ] Implementar auto-registro de agentes
- [ ] Adicionar validação de dependências
- [ ] Implementar sistema de versionamento

### **Task 3: Gerenciamento de Estado**
- [ ] Implementar `AgentStateManager`
- [ ] Criar máquina de estados para agentes
- [ ] Implementar transições controladas
- [ ] Adicionar sistema de recovery automático
- [ ] Implementar notificações de estado

### **Task 4: Balanceamento de Carga**
- [ ] Implementar `LoadBalancer` inteligente
- [ ] Criar algoritmos de distribuição
- [ ] Implementar circuit breaker
- [ ] Adicionar métricas de carga
- [ ] Implementar failover automático

### **Task 5: Monitoramento e Métricas**
- [ ] Implementar `AgentMetricsCollector`
- [ ] Criar sistema de alertas
- [ ] Implementar dashboard de monitoramento
- [ ] Adicionar relatórios de performance
- [ ] Implementar exportação de métricas

### **Task 6: Integração com Agent Orchestrator**
- [ ] Integrar com sistema de roteamento
- [ ] Implementar API para consulta de agentes
- [ ] Adicionar suporte a handoff entre agentes
- [ ] Implementar cache de agentes disponíveis
- [ ] Otimizar performance de descoberta

## 🔧 **Dev Notes**

### **Arquitetura do Agent Manager**

```typescript
// src/agents/core/agent-manager.ts
import { EventEmitter } from 'events'
import { BaseAgent } from '@falachefe/agent-squad-core'
import { AgentMetrics, AgentState, LoadBalancingStrategy } from './types'

export class AgentManager extends EventEmitter {
  private registry: Map<string, AgentInfo>
  private loadBalancer: LoadBalancer
  private stateManager: AgentStateManager
  private metricsCollector: AgentMetricsCollector
  private healthChecker: HealthChecker
  private logger: Logger

  constructor(config: AgentManagerConfig) {
    super()
    this.registry = new Map()
    this.loadBalancer = new LoadBalancer(config.loadBalancing)
    this.stateManager = new AgentStateManager(config.stateManagement)
    this.metricsCollector = new AgentMetricsCollector(config.metrics)
    this.healthChecker = new HealthChecker(config.healthCheck)
    this.logger = new Logger('AgentManager')
    
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
        metrics: new AgentMetrics()
      }
      
      this.registry.set(metadata.id, agentInfo)
      
      // 3. Inicializar agente
      await agent.initialize(metadata.config)
      
      // 4. Atualizar estado
      await this.stateManager.setState(metadata.id, AgentState.ACTIVE)
      
      // 5. Adicionar ao load balancer
      this.loadBalancer.addAgent(agentInfo)
      
      // 6. Emitir evento
      this.emit('agentRegistered', agentInfo)
      
      this.logger.info(`Agente ${metadata.id} registrado com sucesso`)
      
    } catch (error) {
      this.logger.error(`Erro ao registrar agente ${metadata.id}:`, error)
      throw error
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
        this.logger.debug(`Agente ${selectedAgent.id} selecionado para ${agentType}`)
      }

      return selectedAgent?.agent || null

    } catch (error) {
      this.logger.error(`Erro ao selecionar agente ${agentType}:`, error)
      return null
    }
  }

  async unregisterAgent(agentId: string): Promise<void> {
    try {
      const agentInfo = this.registry.get(agentId)
      if (!agentInfo) {
        throw new Error(`Agente ${agentId} não encontrado`)
      }

      // 1. Parar agente
      await agentInfo.agent.shutdown()
      
      // 2. Remover do load balancer
      this.loadBalancer.removeAgent(agentId)
      
      // 3. Atualizar estado
      await this.stateManager.setState(agentId, AgentState.SHUTDOWN)
      
      // 4. Remover do registry
      this.registry.delete(agentId)
      
      // 5. Emitir evento
      this.emit('agentUnregistered', agentId)
      
      this.logger.info(`Agente ${agentId} desregistrado com sucesso`)

    } catch (error) {
      this.logger.error(`Erro ao desregistrar agente ${agentId}:`, error)
      throw error
    }
  }

  async getAgentMetrics(agentId?: string): Promise<AgentMetrics | Map<string, AgentMetrics>> {
    if (agentId) {
      const agentInfo = this.registry.get(agentId)
      return agentInfo?.metrics || new AgentMetrics()
    }
    
    const allMetrics = new Map<string, AgentMetrics>()
    for (const [id, agentInfo] of this.registry) {
      allMetrics.set(id, agentInfo.metrics)
    }
    
    return allMetrics
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

  private getAgentsByType(agentType: string): AgentInfo[] {
    return Array.from(this.registry.values())
      .filter(agent => 
        agent.type === agentType && 
        agent.state === AgentState.ACTIVE
      )
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

      return true
    })
  }

  private setupEventHandlers(): void {
    this.on('agentRegistered', (agentInfo: AgentInfo) => {
      this.logger.info(`Agente ${agentInfo.id} registrado`)
    })

    this.on('agentUnregistered', (agentId: string) => {
      this.logger.info(`Agente ${agentId} desregistrado`)
    })

    this.on('agentStateChanged', (agentId: string, newState: AgentState) => {
      this.logger.info(`Agente ${agentId} mudou para estado ${newState}`)
    })

    this.on('agentError', (agentId: string, error: Error) => {
      this.logger.error(`Erro no agente ${agentId}:`, error)
      this.handleAgentError(agentId, error)
    })
  }

  private async handleAgentError(agentId: string, error: Error): Promise<void> {
    const agentInfo = this.registry.get(agentId)
    if (!agentInfo) return

    // Implementar estratégia de recovery
    if (agentInfo.metadata.autoRecovery) {
      try {
        await this.restartAgent(agentId)
        this.logger.info(`Agente ${agentId} reiniciado automaticamente`)
      } catch (restartError) {
        this.logger.error(`Falha ao reiniciar agente ${agentId}:`, restartError)
        await this.stateManager.setState(agentId, AgentState.ERROR)
      }
    } else {
      await this.stateManager.setState(agentId, AgentState.ERROR)
    }
  }

  private async restartAgent(agentId: string): Promise<void> {
    const agentInfo = this.registry.get(agentId)
    if (!agentInfo) return

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
  }

  private startHealthCheck(): void {
    setInterval(async () => {
      for (const [agentId, agentInfo] of this.registry) {
        try {
          const isHealthy = await this.healthChecker.checkHealth(agentInfo.agent)
          
          if (!isHealthy && agentInfo.state === AgentState.ACTIVE) {
            this.emit('agentError', agentId, new Error('Health check failed'))
          } else if (isHealthy && agentInfo.state === AgentState.ERROR) {
            await this.stateManager.setState(agentId, AgentState.ACTIVE)
          }
          
          agentInfo.lastHeartbeat = new Date()
          
        } catch (error) {
          this.emit('agentError', agentId, error)
        }
      }
    }, 30000) // Check every 30 seconds
  }
}
```

### **Sistema de Load Balancing**

```typescript
// src/agents/core/load-balancer.ts
export class LoadBalancer {
  private strategies: Map<string, LoadBalancingStrategy>
  private agentWeights: Map<string, number>
  private roundRobinCounters: Map<string, number>

  constructor(config: LoadBalancerConfig) {
    this.strategies = new Map()
    this.agentWeights = new Map()
    this.roundRobinCounters = new Map()
    
    this.initializeStrategies()
  }

  addAgent(agentInfo: AgentInfo): void {
    this.agentWeights.set(agentInfo.id, agentInfo.metadata.weight || 1)
    this.roundRobinCounters.set(agentInfo.id, 0)
  }

  removeAgent(agentId: string): void {
    this.agentWeights.delete(agentId)
    this.roundRobinCounters.delete(agentId)
  }

  selectAgent(agents: AgentInfo[], agentType: string): AgentInfo | null {
    if (agents.length === 0) return null

    const strategy = this.strategies.get(agentType) || LoadBalancingStrategy.ROUND_ROBIN

    switch (strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.roundRobinSelection(agents)
      
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.leastConnectionsSelection(agents)
      
      case LoadBalancingStrategy.WEIGHTED:
        return this.weightedSelection(agents)
      
      case LoadBalancingStrategy.LEAST_LOAD:
        return this.leastLoadSelection(agents)
      
      default:
        return this.roundRobinSelection(agents)
    }
  }

  private roundRobinSelection(agents: AgentInfo[]): AgentInfo {
    const agentType = agents[0].type
    const counter = this.roundRobinCounters.get(agentType) || 0
    const selectedIndex = counter % agents.length
    
    this.roundRobinCounters.set(agentType, counter + 1)
    
    return agents[selectedIndex]
  }

  private leastConnectionsSelection(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) => 
      current.metrics.activeConnections < least.metrics.activeConnections 
        ? current 
        : least
    )
  }

  private weightedSelection(agents: AgentInfo[]): AgentInfo {
    const totalWeight = agents.reduce((sum, agent) => 
      sum + (this.agentWeights.get(agent.id) || 1), 0
    )
    
    let random = Math.random() * totalWeight
    
    for (const agent of agents) {
      const weight = this.agentWeights.get(agent.id) || 1
      random -= weight
      
      if (random <= 0) {
        return agent
      }
    }
    
    return agents[agents.length - 1]
  }

  private leastLoadSelection(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) => 
      current.metrics.currentLoad < least.metrics.currentLoad 
        ? current 
        : least
    )
  }
}
```

### **Sistema de Monitoramento**

```typescript
// src/agents/core/agent-metrics-collector.ts
export class AgentMetricsCollector {
  private metrics: Map<string, AgentMetrics>
  private alertThresholds: AlertThresholds
  private logger: Logger

  constructor(config: MetricsConfig) {
    this.metrics = new Map()
    this.alertThresholds = config.alertThresholds
    this.logger = new Logger('AgentMetricsCollector')
  }

  recordAgentSelection(agentId: string): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalSelections++
    metrics.lastSelectedAt = new Date()
  }

  recordProcessingTime(agentId: string, processingTime: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalProcessingTime += processingTime
    metrics.averageProcessingTime = 
      metrics.totalProcessingTime / metrics.totalSelections
    
    // Verificar se excede threshold
    if (processingTime > this.alertThresholds.maxProcessingTime) {
      this.emitAlert('high_processing_time', agentId, { processingTime })
    }
  }

  recordError(agentId: string, error: Error): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.totalErrors++
    metrics.lastErrorAt = new Date()
    metrics.lastError = error.message
    
    // Verificar se excede threshold de erros
    if (metrics.totalErrors > this.alertThresholds.maxErrors) {
      this.emitAlert('high_error_rate', agentId, { errorCount: metrics.totalErrors })
    }
  }

  recordMemoryUsage(agentId: string, memoryUsage: number): void {
    const metrics = this.getOrCreateMetrics(agentId)
    metrics.memoryUsage = memoryUsage
    
    if (memoryUsage > this.alertThresholds.maxMemoryUsage) {
      this.emitAlert('high_memory_usage', agentId, { memoryUsage })
    }
  }

  getMetrics(agentId?: string): AgentMetrics | Map<string, AgentMetrics> {
    if (agentId) {
      return this.metrics.get(agentId) || new AgentMetrics()
    }
    
    return new Map(this.metrics)
  }

  private getOrCreateMetrics(agentId: string): AgentMetrics {
    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, new AgentMetrics())
    }
    
    return this.metrics.get(agentId)!
  }

  private emitAlert(type: string, agentId: string, data: any): void {
    this.logger.warn(`Alert: ${type} for agent ${agentId}`, data)
    // Implementar sistema de notificações
  }
}
```

## 🧪 **Testing**

### **Testes Unitários**
- [ ] Testar registro e desregistro de agentes
- [ ] Testar balanceamento de carga
- [ ] Testar gerenciamento de estado
- [ ] Testar coleta de métricas
- [ ] Testar sistema de alertas

### **Testes de Integração**
- [ ] Testar integração com Agent Orchestrator
- [ ] Testar integração com sistema de memória
- [ ] Testar failover automático
- [ ] Testar recovery de agentes

### **Testes de Performance**
- [ ] Testar seleção de agentes < 100ms
- [ ] Testar processamento de múltiplos agentes
- [ ] Testar uso de memória e CPU
- [ ] Testar escalabilidade

## 📊 **Definition of Done**

- [ ] Agent Manager implementado e funcionando
- [ ] Sistema de registro de agentes operacional
- [ ] Balanceamento de carga implementado
- [ ] Monitoramento e métricas funcionando
- [ ] Integração com Agent Orchestrator completa
- [ ] Testes unitários e de integração passando
- [ ] Performance dentro dos parâmetros especificados
- [ ] Documentação atualizada

## 📈 **Estimativas**

- **Story Points**: 18
- **Tempo Estimado**: 2-3 dias
- **Prioridade**: Alta
- **Dependências**: Story 1.4 (Agent Orchestrator)
- **Complexidade**: Alta

## 👥 **Responsáveis**

- **Tech Lead**: Arquitetura e design
- **Backend Developer**: Implementação principal
- **DevOps**: Monitoramento e alertas
- **QA**: Testes e validação

## 🔗 **Dependências**

- **Entrada**: Story 1.4 concluída (Agent Orchestrator)
- **Saída**: Agent Manager funcional
- **Bloqueadores**: 
  - Configuração de métricas
  - Sistema de alertas
  - Load balancer configurado

---

**Status**: Ready for Development
**Criado em**: Janeiro 2025
**Última atualização**: Janeiro 2025
**Responsável**: Sarah (Product Owner)
**Desenvolvedor**: James (Full Stack Developer)
