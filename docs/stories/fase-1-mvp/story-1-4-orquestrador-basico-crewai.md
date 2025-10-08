# 🎭 Story 1.4: Orquestrador Básico CrewAI

## 📋 **Informações da Story**

**ID**: STORY-1.4  
**Épico**: CrewAI Fundação - Infraestrutura Base  
**Sprint**: 1.2 - Banco de Dados e Memória  
**Prioridade**: Crítica  
**Complexidade**: Alta  
**Estimativa**: 10 story points  
**Desenvolvedor**: [A definir]  
**QA**: [A definir]  

---

## 🎯 **Objetivo**

Como sistema, quero ter um orquestrador CrewAI básico para coordenar agentes e gerenciar tarefas de forma eficiente e escalável.

---

## 📝 **Descrição Detalhada**

Esta story implementa o orquestrador básico CrewAI que serve como o núcleo central para coordenação de agentes, gerenciamento de tarefas e processamento de mensagens. O orquestrador integra todos os componentes CrewAI em um sistema coeso.

### **Contexto de Negócio**
- Sistema precisa coordenar múltiplos agentes simultaneamente
- Tarefas complexas precisam ser divididas e distribuídas
- Processamento de mensagens deve ser eficiente e contextual
- Sistema deve escalar para múltiplas empresas
- Coordenação deve ser resiliente a falhas

### **Escopo Técnico**
- Implementação do FalachefeOrchestrator
- Sistema de roteamento de mensagens
- Gerenciamento de ciclo de vida de crews
- Processamento assíncrono de tarefas
- Coleta e monitoramento de métricas

---

## ✅ **Critérios de Aceitação**

### **CA1: FalachefeOrchestrator Implementado**
- [ ] FalachefeOrchestrator implementado com interface completa
- [ ] Inicialização de crews por empresa
- [ ] Processamento básico de mensagens
- [ ] Criação e execução de tarefas
- [ ] Sistema de health check e monitoramento

### **CA2: Sistema de Roteamento de Mensagens**
- [ ] MessageRouter implementado
- [ ] Roteamento baseado em contexto e tipo
- [ ] Fallback para agentes não disponíveis
- [ ] Load balancing entre agentes
- [ ] Retry automático em caso de falha

### **CA3: Gerenciamento de Tarefas**
- [ ] TaskManager para criação e execução
- [ ] Sistema de filas para tarefas assíncronas
- [ ] Priorização de tarefas por importância
- [ ] Tracking de progresso e status
- [ ] Timeout e cancelamento de tarefas

### **CA4: Coleta de Métricas**
- [ ] Sistema de métricas básico implementado
- [ ] Coleta de métricas de performance
- [ ] Métricas de uso e disponibilidade
- [ ] Alertas para problemas críticos
- [ ] Dashboard básico de monitoramento

---

## 🔧 **Tarefas Técnicas**

### **T1.4.1: Implementação do FalachefeOrchestrator**

#### **Interface Principal**
```typescript
// src/lib/crewai/orchestrator/FalachefeOrchestrator.ts
export interface FalachefeOrchestrator {
  // Gerenciamento de Crews
  initializeCrew(companyId: string, crewConfig: CrewConfig): Promise<CrewInstance>;
  getCrew(crewId: string): Promise<CrewInstance | null>;
  shutdownCrew(crewId: string): Promise<void>;
  listCrews(companyId: string): Promise<CrewInstance[]>;
  
  // Processamento de Mensagens
  processMessage(message: CrewMessage): Promise<CrewResponse>;
  processMessages(messages: CrewMessage[]): Promise<CrewResponse[]>;
  
  // Gerenciamento de Tarefas
  createTask(task: CrewTask): Promise<string>;
  executeTask(taskId: string): Promise<CrewTaskResult>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  cancelTask(taskId: string): Promise<void>;
  
  // Métricas e Monitoramento
  getMetrics(): Promise<OrchestratorMetrics>;
  getHealthStatus(): Promise<HealthStatus>;
}

export interface CrewConfig {
  name: string;
  description?: string;
  agents: AgentConfig[];
  tasks: TaskTemplate[];
  memoryConfig: MemoryConfig;
  coordinationConfig: CoordinationConfig;
}

export interface CrewInstance {
  id: string;
  companyId: string;
  config: CrewConfig;
  status: CrewStatus;
  agents: Map<string, AgentInstance>;
  tasks: Map<string, CrewTask>;
  createdAt: Date;
  lastActivity: Date;
}
```

#### **Implementação Principal**
```typescript
// src/lib/crewai/orchestrator/FalachefeOrchestratorImpl.ts
export class FalachefeOrchestratorImpl implements FalachefeOrchestrator {
  private crews: Map<string, CrewInstance> = new Map();
  private taskQueue: TaskQueue;
  private metricsCollector: MetricsCollector;
  private messageRouter: MessageRouter;

  constructor(
    private db: Database,
    private redis: Redis,
    private memorySystem: CrewMemorySystem,
    private logger: Logger
  ) {
    this.taskQueue = new TaskQueue(this.redis);
    this.metricsCollector = new MetricsCollector(this.db);
    this.messageRouter = new MessageRouter();
  }

  async initializeCrew(companyId: string, config: CrewConfig): Promise<CrewInstance> {
    try {
      // 1. Validar configuração
      await this.validateCrewConfig(config);
      
      // 2. Criar instância da crew
      const crewId = generateId();
      const crewInstance: CrewInstance = {
        id: crewId,
        companyId,
        config,
        status: CrewStatus.INITIALIZING,
        agents: new Map(),
        tasks: new Map(),
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      // 3. Inicializar agentes
      await this.initializeAgents(crewInstance);
      
      // 4. Persistir no banco
      await this.persistCrew(crewInstance);
      
      // 5. Atualizar status
      crewInstance.status = CrewStatus.ACTIVE;
      this.crews.set(crewId, crewInstance);
      
      // 6. Coletar métricas
      await this.metricsCollector.recordCrewInitialization(crewId, companyId);
      
      this.logger.info(`Crew ${crewId} initialized for company ${companyId}`);
      return crewInstance;
      
    } catch (error) {
      this.logger.error(`Failed to initialize crew for company ${companyId}:`, error);
      throw new CrewInitializationError(error.message);
    }
  }

  async processMessage(message: CrewMessage): Promise<CrewResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Obter crew responsável
      const crew = await this.getCrewForMessage(message);
      if (!crew) {
        throw new CrewNotFoundError(`No crew found for message: ${message.id}`);
      }
      
      // 2. Rotear mensagem
      const routedMessage = await this.messageRouter.routeMessage(crew, message);
      
      // 3. Processar com agente
      const response = await this.processWithAgent(crew, routedMessage);
      
      // 4. Atualizar memória
      await this.updateMemoryFromMessage(crew.id, message, response);
      
      // 5. Coletar métricas
      const processingTime = Date.now() - startTime;
      await this.metricsCollector.recordMessageProcessing(
        crew.id, 
        message.id, 
        processingTime
      );
      
      return response;
      
    } catch (error) {
      this.logger.error(`Failed to process message ${message.id}:`, error);
      await this.metricsCollector.recordMessageError(message.id, error.message);
      throw error;
    }
  }
}
```

### **T1.4.2: MessageRouter para Roteamento Inteligente**

```typescript
// src/lib/crewai/orchestrator/MessageRouter.ts
export class MessageRouter {
  constructor(
    private memorySystem: CrewMemorySystem,
    private agentSelector: AgentSelector
  ) {}

  async routeMessage(crew: CrewInstance, message: CrewMessage): Promise<RoutedMessage> {
    // 1. Analisar contexto da mensagem
    const context = await this.analyzeMessageContext(message);
    
    // 2. Buscar memórias relevantes
    const relevantMemories = await this.memorySystem.searchMemories({
      crewId: crew.id,
      text: message.content,
      limit: 5
    });
    
    // 3. Selecionar agente apropriado
    const selectedAgent = await this.agentSelector.selectAgent(
      crew, 
      message, 
      context, 
      relevantMemories
    );
    
    // 4. Preparar mensagem roteada
    const routedMessage: RoutedMessage = {
      ...message,
      targetAgentId: selectedAgent.id,
      context,
      relevantMemories,
      priority: this.calculatePriority(message, context),
      estimatedProcessingTime: this.estimateProcessingTime(message, selectedAgent)
    };
    
    return routedMessage;
  }

  private async analyzeMessageContext(message: CrewMessage): Promise<MessageContext> {
    // Implementar análise de contexto usando NLP
    const entities = await this.extractEntities(message.content);
    const intent = await this.detectIntent(message.content);
    const sentiment = await this.analyzeSentiment(message.content);
    
    return {
      entities,
      intent,
      sentiment,
      urgency: this.detectUrgency(message),
      complexity: this.assessComplexity(message)
    };
  }
}
```

### **T1.4.3: AgentSelector para Seleção Inteligente**

```typescript
// src/lib/crewai/orchestrator/AgentSelector.ts
export class AgentSelector {
  constructor(private memorySystem: CrewMemorySystem) {}

  async selectAgent(
    crew: CrewInstance,
    message: CrewMessage,
    context: MessageContext,
    memories: CrewMemory[]
  ): Promise<AgentInstance> {
    
    // 1. Filtrar agentes disponíveis
    const availableAgents = Array.from(crew.agents.values())
      .filter(agent => agent.status === AgentStatus.AVAILABLE);
    
    if (availableAgents.length === 0) {
      throw new NoAvailableAgentsError('No agents available for processing');
    }
    
    // 2. Calcular score para cada agente
    const agentScores = await Promise.all(
      availableAgents.map(async (agent) => {
        const score = await this.calculateAgentScore(agent, message, context, memories);
        return { agent, score };
      })
    );
    
    // 3. Selecionar agente com maior score
    const bestMatch = agentScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestMatch.agent;
  }

  private async calculateAgentScore(
    agent: AgentInstance,
    message: CrewMessage,
    context: MessageContext,
    memories: CrewMemory[]
  ): Promise<number> {
    let score = 0;
    
    // 1. Score baseado em especialização
    score += this.calculateSpecializationScore(agent, context);
    
    // 2. Score baseado em histórico de performance
    score += await this.calculatePerformanceScore(agent);
    
    // 3. Score baseado em memórias relevantes
    score += this.calculateMemoryRelevanceScore(agent, memories);
    
    // 4. Score baseado em carga atual
    score += this.calculateLoadScore(agent);
    
    // 5. Score baseado em preferências do usuário
    score += await this.calculateUserPreferenceScore(agent, message.userId);
    
    return Math.max(0, Math.min(1, score)); // Normalizar entre 0 e 1
  }
}
```

### **T1.4.4: TaskManager para Gerenciamento de Tarefas**

```typescript
// src/lib/crewai/orchestrator/TaskManager.ts
export class TaskManager {
  constructor(
    private db: Database,
    private redis: Redis,
    private orchestrator: FalachefeOrchestrator
  ) {}

  async createTask(task: CrewTask): Promise<string> {
    // 1. Validar tarefa
    this.validateTask(task);
    
    // 2. Criar registro no banco
    const taskId = generateId();
    const dbTask = {
      id: taskId,
      crew_id: task.crewId,
      task_name: task.name,
      description: task.description,
      status: TaskStatus.PENDING,
      priority: task.priority,
      input_data: task.inputData,
      created_at: new Date()
    };
    
    await this.db.crew_tasks.create({ data: dbTask });
    
    // 3. Adicionar à fila de processamento
    await this.addToQueue(taskId, task.priority);
    
    // 4. Coletar métricas
    await this.recordTaskCreation(taskId, task);
    
    return taskId;
  }

  async executeTask(taskId: string): Promise<CrewTaskResult> {
    const startTime = Date.now();
    
    try {
      // 1. Obter tarefa do banco
      const task = await this.getTask(taskId);
      if (!task) {
        throw new TaskNotFoundError(`Task ${taskId} not found`);
      }
      
      // 2. Atualizar status para em execução
      await this.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
      
      // 3. Obter crew responsável
      const crew = await this.orchestrator.getCrew(task.crewId);
      if (!crew) {
        throw new CrewNotFoundError(`Crew ${task.crewId} not found`);
      }
      
      // 4. Executar tarefa
      const result = await this.executeTaskWithCrew(crew, task);
      
      // 5. Atualizar status e resultado
      await this.updateTaskResult(taskId, result);
      
      // 6. Coletar métricas
      const executionTime = Date.now() - startTime;
      await this.recordTaskExecution(taskId, executionTime, true);
      
      return result;
      
    } catch (error) {
      // Marcar tarefa como falhada
      await this.updateTaskStatus(taskId, TaskStatus.FAILED);
      await this.recordTaskExecution(taskId, Date.now() - startTime, false);
      throw error;
    }
  }

  private async executeTaskWithCrew(crew: CrewInstance, task: CrewTask): Promise<CrewTaskResult> {
    // Implementar execução específica baseada no tipo de tarefa
    switch (task.type) {
      case TaskType.SIMPLE_MESSAGE:
        return await this.executeSimpleMessageTask(crew, task);
      case TaskType.COMPLEX_ANALYSIS:
        return await this.executeComplexAnalysisTask(crew, task);
      case TaskType.MULTI_AGENT_COORDINATION:
        return await this.executeMultiAgentTask(crew, task);
      default:
        throw new UnsupportedTaskTypeError(`Task type ${task.type} not supported`);
    }
  }
}
```

### **T1.4.5: Sistema de Métricas e Monitoramento**

```typescript
// src/lib/crewai/orchestrator/MetricsCollector.ts
export class MetricsCollector {
  constructor(private db: Database) {}

  async recordCrewInitialization(crewId: string, companyId: string): Promise<void> {
    await this.db.crew_metrics.create({
      data: {
        crew_id: crewId,
        metric_name: 'crew_initialization',
        metric_value: 1,
        metric_unit: 'count',
        metadata: { companyId }
      }
    });
  }

  async recordMessageProcessing(
    crewId: string, 
    messageId: string, 
    processingTime: number
  ): Promise<void> {
    await Promise.all([
      // Métrica de tempo de processamento
      this.db.crew_metrics.create({
        data: {
          crew_id: crewId,
          metric_name: 'message_processing_time',
          metric_value: processingTime,
          metric_unit: 'milliseconds',
          metadata: { messageId }
        }
      }),
      
      // Métrica de throughput
      this.db.crew_metrics.create({
        data: {
          crew_id: crewId,
          metric_name: 'messages_processed',
          metric_value: 1,
          metric_unit: 'count'
        }
      })
    ]);
  }

  async getMetrics(crewId?: string): Promise<OrchestratorMetrics> {
    const whereClause = crewId ? { crew_id: crewId } : {};
    
    const metrics = await this.db.crew_metrics.findMany({
      where: whereClause,
      orderBy: { recorded_at: 'desc' },
      take: 1000
    });
    
    return this.aggregateMetrics(metrics);
  }

  private aggregateMetrics(rawMetrics: any[]): OrchestratorMetrics {
    const aggregated: OrchestratorMetrics = {
      totalCrews: 0,
      totalMessagesProcessed: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      activeCrews: 0,
      lastUpdated: new Date()
    };
    
    // Implementar agregação de métricas
    const crews = new Set(rawMetrics.map(m => m.crew_id));
    aggregated.totalCrews = crews.size;
    
    const processingTimes = rawMetrics
      .filter(m => m.metric_name === 'message_processing_time')
      .map(m => m.metric_value);
    
    if (processingTimes.length > 0) {
      aggregated.averageProcessingTime = 
        processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    }
    
    return aggregated;
  }
}
```

---

## 🧪 **Critérios de Teste**

### **Testes Unitários**
- [ ] Teste de inicialização de crew
- [ ] Teste de roteamento de mensagens
- [ ] Teste de seleção de agentes
- [ ] Teste de criação e execução de tarefas
- [ ] Teste de coleta de métricas

### **Testes de Integração**
- [ ] Teste de fluxo completo de processamento
- [ ] Teste de coordenação entre agentes
- [ ] Teste de integração com sistema de memória
- [ ] Teste de integração com banco de dados
- [ ] Teste de integração com Redis

### **Testes de Performance**
- [ ] Teste de processamento concorrente
- [ ] Teste de carga com múltiplas crews
- [ ] Teste de escalabilidade horizontal
- [ ] Teste de latência de resposta

### **Testes de Resilência**
- [ ] Teste de falha de agentes
- [ ] Teste de recuperação automática
- [ ] Teste de timeout de tarefas
- [ ] Teste de fallback de agentes

---

## 📊 **Métricas de Sucesso**

### **Métricas Técnicas**
- ✅ Tempo de inicialização de crew < 2 segundos
- ✅ Tempo de processamento de mensagem < 500ms
- ✅ Taxa de sucesso de tarefas > 95%
- ✅ Disponibilidade do orquestrador > 99.9%

### **Métricas de Negócio**
- ✅ Sistema suporta 50+ crews simultâneas
- ✅ Processamento de 1000+ mensagens/minuto
- ✅ Escalabilidade horizontal funcionando
- ✅ Zero perda de mensagens em condições normais

---

## 🚨 **Riscos e Mitigações**

### **Risco 1: Complexidade de Coordenação**
- **Probabilidade**: Alta
- **Impacto**: Alto
- **Mitigação**: Design modular e testes extensivos

### **Risco 2: Performance com Múltiplas Crews**
- **Probabilidade**: Média
- **Impacto**: Alto
- **Mitigação**: Otimização de recursos e cache

### **Risco 3: Falhas em Cascata**
- **Probabilidade**: Baixa
- **Impacto**: Crítico
- **Mitigação**: Circuit breakers e isolamento de falhas

### **Risco 4: Deadlocks em Tarefas**
- **Probabilidade**: Média
- **Impacto**: Médio
- **Mitigação**: Timeouts e detecção de deadlock

---

## 🔗 **Dependências**

### **Dependências Externas**
- Redis para coordenação
- Banco de dados para persistência
- OpenAI para processamento de linguagem

### **Dependências Internas**
- Story 1.1 (Dependências CrewAI) concluída
- Story 1.2 (Banco de Dados CrewAI) concluída
- Story 1.3 (Sistema de Memória CrewAI) concluída

---

## 📅 **Cronograma**

**Duração Estimada**: 5 dias  
**Esforço**: 40 horas  

### **Plano de Execução**
- **Dia 1 (8h)**: FalachefeOrchestrator e interfaces
- **Dia 2 (8h)**: MessageRouter e AgentSelector
- **Dia 3 (8h)**: TaskManager e sistema de filas
- **Dia 4 (8h)**: MetricsCollector e monitoramento
- **Dia 5 (8h)**: Testes, integração e otimização

---

## 🎯 **Entregáveis**

### **Código**
- [ ] FalachefeOrchestrator implementado
- [ ] MessageRouter com roteamento inteligente
- [ ] AgentSelector com seleção baseada em contexto
- [ ] TaskManager com gerenciamento assíncrono
- [ ] Sistema de métricas e monitoramento

### **Documentação**
- [ ] Documentação da API do orquestrador
- [ ] Guia de configuração de crews
- [ ] Documentação de métricas
- [ ] Guia de troubleshooting

### **Testes**
- [ ] Suite de testes unitários
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Testes de resilência

---

## ✅ **Definition of Done**

- [ ] FalachefeOrchestrator implementado e funcionando
- [ ] Sistema de roteamento de mensagens funcionando
- [ ] Gerenciamento de tarefas assíncrono implementado
- [ ] Sistema de métricas coletando dados
- [ ] Testes passando com cobertura > 85%
- [ ] Performance otimizada para produção
- [ ] Documentação completa
- [ ] Code review aprovado
- [ ] Deploy em ambiente de desenvolvimento

---

## 🔄 **Próximos Passos**

Após conclusão desta story:
1. **Story 1.5**: Integração Redis para Coordenação

---

**Esta story estabelece o coração do sistema CrewAI - o orquestrador!** 🎭
