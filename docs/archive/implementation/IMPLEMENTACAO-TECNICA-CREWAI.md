# 🔧 Implementação Técnica CrewAI - Detalhes Específicos

## 📦 **Dependências Necessárias**

### **Core CrewAI**
```json
{
  "dependencies": {
    "crewai": "^0.80.0",
    "@crewai/tools": "^0.8.0",
    "@crewai/core": "^0.8.0",
    "crewai-llm": "^0.8.0"
  }
}
```

### **Integrações Específicas**
```json
{
  "dependencies": {
    "redis": "^4.6.0",
    "@types/redis": "^4.0.10",
    "openai": "^4.0.0",
    "langchain": "^0.2.0",
    "langchain-openai": "^0.1.0"
  }
}
```

---

## 🗄️ **Estrutura de Banco de Dados Detalhada**

### **1. Tabela `crews` (Equipes)**

```sql
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, disabled, maintenance
  config JSONB NOT NULL DEFAULT '{}', -- Configurações específicas da crew
  llm_config JSONB NOT NULL DEFAULT '{}', -- Configurações do LLM
  memory_config JSONB NOT NULL DEFAULT '{}', -- Configurações de memória
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Índices
  INDEX idx_crews_company_id (company_id),
  INDEX idx_crews_status (status),
  INDEX idx_crews_created_at (created_at),
  
  -- Constraints
  CONSTRAINT chk_crews_status CHECK (status IN ('active', 'paused', 'disabled', 'maintenance')),
  CONSTRAINT chk_crews_name_length CHECK (LENGTH(name) >= 3)
);

-- Trigger para updated_at
CREATE TRIGGER update_crews_updated_at
  BEFORE UPDATE ON crews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **2. Tabela `crew_agents` (Agentes)**

```sql
CREATE TABLE crew_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL, -- orchestrator, financial, marketing, hr, support
  goal TEXT NOT NULL,
  backstory TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]', -- Lista de ferramentas disponíveis
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, maintenance
  config JSONB NOT NULL DEFAULT '{}', -- Configurações específicas do agente
  performance_metrics JSONB NOT NULL DEFAULT '{}', -- Métricas de performance
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Índices
  INDEX idx_crew_agents_crew_id (crew_id),
  INDEX idx_crew_agents_role (role),
  INDEX idx_crew_agents_status (status),
  
  -- Constraints
  CONSTRAINT chk_crew_agents_status CHECK (status IN ('active', 'inactive', 'maintenance')),
  CONSTRAINT chk_crew_agents_role CHECK (role IN ('orchestrator', 'financial', 'marketing', 'hr', 'support')),
  CONSTRAINT chk_crew_agents_goal_length CHECK (LENGTH(goal) >= 10)
);
```

### **3. Tabela `crew_tasks` (Tarefas)**

```sql
CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES crew_agents(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES crew_tasks(id), -- Para subtarefas
  description TEXT NOT NULL,
  expected_output TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, cancelled
  result JSONB DEFAULT '{}', -- Resultado da execução
  error_message TEXT,
  execution_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}', -- {input: 100, output: 50, total: 150}
  cost_usd DECIMAL(10,6), -- Custo em USD
  metadata JSONB DEFAULT '{}', -- Metadados adicionais
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Índices
  INDEX idx_crew_tasks_crew_id (crew_id),
  INDEX idx_crew_tasks_agent_id (agent_id),
  INDEX idx_crew_tasks_conversation_id (conversation_id),
  INDEX idx_crew_tasks_status (status),
  INDEX idx_crew_tasks_created_at (created_at),
  
  -- Constraints
  CONSTRAINT chk_crew_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT chk_crew_tasks_execution_time CHECK (execution_time_ms >= 0),
  CONSTRAINT chk_crew_tasks_cost CHECK (cost_usd >= 0)
);
```

### **4. Tabela `crew_memories` (Memória CrewAI)**

```sql
CREATE TABLE crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL, -- fact, preference, context, learning, pattern
  category VARCHAR(100), -- financial, personal, business, etc.
  content TEXT NOT NULL,
  summary TEXT, -- Resumo da memória
  importance_score INTEGER NOT NULL DEFAULT 1, -- 1-10
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Índices
  INDEX idx_crew_memories_company_id (company_id),
  INDEX idx_crew_memories_user_id (user_id),
  INDEX idx_crew_memories_conversation_id (conversation_id),
  INDEX idx_crew_memories_type (memory_type),
  INDEX idx_crew_memories_category (category),
  INDEX idx_crew_memories_importance (importance_score),
  INDEX idx_crew_memories_created_at (created_at),
  
  -- Constraints
  CONSTRAINT chk_crew_memories_type CHECK (memory_type IN ('fact', 'preference', 'context', 'learning', 'pattern')),
  CONSTRAINT chk_crew_memories_importance CHECK (importance_score >= 1 AND importance_score <= 10),
  CONSTRAINT chk_crew_memories_access_count CHECK (access_count >= 0)
);
```

### **5. Tabela `crew_metrics` (Métricas)**

```sql
CREATE TABLE crew_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES crew_agents(id) ON DELETE SET NULL,
  metric_type VARCHAR(100) NOT NULL, -- response_time, token_usage, success_rate, cost, etc.
  metric_name VARCHAR(255) NOT NULL, -- Nome específico da métrica
  value DECIMAL(15,6) NOT NULL,
  unit VARCHAR(50), -- ms, tokens, USD, %, etc.
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Índices
  INDEX idx_crew_metrics_crew_id (crew_id),
  INDEX idx_crew_metrics_agent_id (agent_id),
  INDEX idx_crew_metrics_type (metric_type),
  INDEX idx_crew_metrics_recorded_at (recorded_at),
  
  -- Constraints
  CONSTRAINT chk_crew_metrics_value CHECK (value >= 0)
);
```

---

## 🔄 **Adaptações nas Tabelas Existentes**

### **1. Tabela `conversations`**

```sql
-- Adicionar colunas para CrewAI
ALTER TABLE conversations 
ADD COLUMN crew_id UUID REFERENCES crews(id),
ADD COLUMN current_agent_id UUID REFERENCES crew_agents(id),
ADD COLUMN handoff_history JSONB DEFAULT '[]',
ADD COLUMN crew_context JSONB DEFAULT '{}',
ADD COLUMN requires_human_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN human_approval_status VARCHAR(50) DEFAULT 'not_required'; -- not_required, pending, approved, rejected

-- Índices
CREATE INDEX idx_conversations_crew_id ON conversations(crew_id);
CREATE INDEX idx_conversations_current_agent_id ON conversations(current_agent_id);
CREATE INDEX idx_conversations_human_approval ON conversations(requires_human_approval, human_approval_status);

-- Constraints
ALTER TABLE conversations 
ADD CONSTRAINT chk_conversations_human_approval_status 
CHECK (human_approval_status IN ('not_required', 'pending', 'approved', 'rejected'));
```

### **2. Tabela `messages`**

```sql
-- Adicionar colunas para CrewAI
ALTER TABLE messages 
ADD COLUMN crew_task_id UUID REFERENCES crew_tasks(id),
ADD COLUMN agent_response JSONB DEFAULT '{}',
ADD COLUMN token_usage JSONB DEFAULT '{}',
ADD COLUMN processing_time_ms INTEGER,
ADD COLUMN confidence_score DECIMAL(3,2), -- 0.00 a 1.00
ADD COLUMN crew_metadata JSONB DEFAULT '{}';

-- Índices
CREATE INDEX idx_messages_crew_task_id ON messages(crew_task_id);
CREATE INDEX idx_messages_confidence_score ON messages(confidence_score);
CREATE INDEX idx_messages_processing_time ON messages(processing_time_ms);

-- Constraints
ALTER TABLE messages 
ADD CONSTRAINT chk_messages_confidence_score 
CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);
```

---

## 🏗️ **Estrutura de Código**

### **1. Estrutura de Diretórios**

```
src/
├── agents/
│   ├── crewai/
│   │   ├── orchestrator/
│   │   │   ├── falachefe-orchestrator.ts
│   │   │   ├── message-router.ts
│   │   │   ├── agent-selector.ts
│   │   │   └── handoff-manager.ts
│   │   ├── agents/
│   │   │   ├── financial/
│   │   │   │   ├── financial-agent.ts
│   │   │   │   ├── financial-tools.ts
│   │   │   │   └── financial-memory.ts
│   │   │   ├── orchestrator/
│   │   │   │   ├── orchestrator-agent.ts
│   │   │   │   └── orchestrator-tools.ts
│   │   │   └── base/
│   │   │       ├── base-agent.ts
│   │   │       └── agent-interface.ts
│   │   ├── memory/
│   │   │   ├── crew-memory-system.ts
│   │   │   ├── memory-manager.ts
│   │   │   └── memory-types.ts
│   │   ├── tools/
│   │   │   ├── database-tools.ts
│   │   │   ├── uaz-tools.ts
│   │   │   └── financial-tools.ts
│   │   ├── config/
│   │   │   ├── crew-config.ts
│   │   │   ├── agent-config.ts
│   │   │   └── llm-config.ts
│   │   └── types/
│   │       ├── crew-types.ts
│   │       ├── agent-types.ts
│   │       └── task-types.ts
│   └── legacy/ (agentes antigos durante migração)
├── lib/
│   ├── crewai/
│   │   ├── redis-coordinator.ts
│   │   ├── token-controller.ts
│   │   ├── metrics-collector.ts
│   │   └── tenant-isolation.ts
│   └── database/
│       ├── crew-schema.ts
│       ├── crew-queries.ts
│       └── crew-migrations.ts
└── app/
    ├── api/
    │   ├── crewai/
    │   │   ├── chat/
    │   │   │   └── route.ts
    │   │   ├── webhook/
    │   │   │   └── route.ts
    │   │   └── admin/
    │   │       ├── crews/
    │   │       │   └── route.ts
    │   │       └── metrics/
    │   │           └── route.ts
    │   └── webhook/
    │       └── uaz/
    │           └── route.ts (adaptado)
    └── (dashboard)/
        └── dashboard/
            ├── crews/
            │   └── page.tsx
            └── metrics/
                └── page.tsx
```

---

## 🔧 **Implementação do Orquestrador**

### **1. FalachefeOrchestrator**

```typescript
// src/agents/crewai/orchestrator/falachefe-orchestrator.ts
import { Crew, Agent, Task, Process } from 'crewai';
import { RedisClient } from '@/lib/cache/redis-client';
import { CrewMemorySystem } from '../memory/crew-memory-system';
import { MessageRouter } from './message-router';
import { AgentSelector } from './agent-selector';
import { HandoffManager } from './handoff-manager';

export interface OrchestratorConfig {
  companyId: string;
  userId: string;
  conversationId: string;
  redisClient: RedisClient;
  memorySystem: CrewMemorySystem;
}

export class FalachefeOrchestrator {
  private crew: Crew;
  private config: OrchestratorConfig;
  private messageRouter: MessageRouter;
  private agentSelector: AgentSelector;
  private handoffManager: HandoffManager;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.messageRouter = new MessageRouter(config);
    this.agentSelector = new AgentSelector(config);
    this.handoffManager = new HandoffManager(config);
  }

  async initialize(): Promise<void> {
    // 1. Carregar configuração da crew da empresa
    const crewConfig = await this.loadCrewConfig();
    
    // 2. Inicializar agentes
    const agents = await this.initializeAgents(crewConfig);
    
    // 3. Criar crew
    this.crew = new Crew({
      agents,
      tasks: [], // Tarefas serão criadas dinamicamente
      process: Process.sequential,
      memory: true,
      verbose: true,
    });
  }

  async processMessage(message: string): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Analisar mensagem e extrair intenção
      const messageAnalysis = await this.messageRouter.analyzeMessage(message);
      
      // 2. Selecionar agente apropriado
      const selectedAgent = await this.agentSelector.selectAgent(messageAnalysis);
      
      // 3. Verificar se precisa de handoff
      const needsHandoff = await this.handoffManager.needsHandoff(
        messageAnalysis,
        selectedAgent
      );
      
      if (needsHandoff) {
        return await this.handoffManager.executeHandoff(
          messageAnalysis,
          selectedAgent
        );
      }
      
      // 4. Criar e executar tarefa
      const task = await this.createTask(messageAnalysis, selectedAgent);
      const result = await this.executeTask(task);
      
      // 5. Coletar métricas
      await this.collectMetrics(startTime, result);
      
      return {
        response: result.output,
        agentId: selectedAgent.id,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        metadata: {
          taskId: task.id,
          tokenUsage: result.tokenUsage,
          cost: result.cost
        }
      };
      
    } catch (error) {
      await this.handleError(error, startTime);
      throw error;
    }
  }

  private async loadCrewConfig(): Promise<CrewConfig> {
    // Carregar configuração do banco de dados
  }

  private async initializeAgents(config: CrewConfig): Promise<Agent[]> {
    // Inicializar agentes baseado na configuração
  }

  private async createTask(analysis: MessageAnalysis, agent: Agent): Promise<Task> {
    // Criar tarefa específica para o agente
  }

  private async executeTask(task: Task): Promise<TaskResult> {
    // Executar tarefa e coletar resultados
  }

  private async collectMetrics(startTime: number, result: any): Promise<void> {
    // Salvar métricas no banco de dados
  }
}
```

### **2. Message Router**

```typescript
// src/agents/crewai/orchestrator/message-router.ts
export interface MessageAnalysis {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: Record<string, any>;
  requiresHumanApproval: boolean;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export class MessageRouter {
  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    // Usar LLM para analisar mensagem
    // Extrair intenção e entidades
    // Determinar complexidade
    // Verificar se precisa aprovação humana
  }
}
```

### **3. Agent Selector**

```typescript
// src/agents/crewai/orchestrator/agent-selector.ts
export class AgentSelector {
  async selectAgent(analysis: MessageAnalysis): Promise<Agent> {
    // Lógica para selecionar agente baseado na análise
    // Considerar histórico de conversa
    // Considerar especialização dos agentes
  }
}
```

### **4. Handoff Manager**

```typescript
// src/agents/crewai/orchestrator/handoff-manager.ts
export class HandoffManager {
  async needsHandoff(analysis: MessageAnalysis, agent: Agent): Promise<boolean> {
    // Verificar se mensagem requer transferência
  }

  async executeHandoff(analysis: MessageAnalysis, targetAgent: Agent): Promise<HandoffResult> {
    // Executar transferência entre agentes
    // Preservar contexto
    // Notificar usuário se necessário
  }
}
```

---

## 🤖 **Implementação do Agente Financeiro**

### **1. Financial Agent**

```typescript
// src/agents/crewai/agents/financial/financial-agent.ts
import { Agent } from 'crewai';
import { FinancialTools } from './financial-tools';
import { FinancialMemory } from './financial-memory';

export class FinancialAgent {
  private agent: Agent;
  private tools: FinancialTools;
  private memory: FinancialMemory;

  constructor(config: AgentConfig) {
    this.tools = new FinancialTools(config);
    this.memory = new FinancialMemory(config);
    
    this.agent = new Agent({
      role: 'Financial Advisor',
      goal: 'Help users manage their finances effectively by providing accurate financial analysis, expense tracking, and budget planning',
      backstory: `You are an experienced financial advisor with expertise in small business finance, 
                  personal budgeting, and expense management. You provide clear, actionable advice 
                  while maintaining a professional and supportive tone.`,
      tools: this.tools.getTools(),
      memory: this.memory.getMemory(),
      verbose: true,
      maxIter: 3,
      maxExecutionTime: 30000, // 30 seconds
    });
  }

  async processFinancialRequest(request: FinancialRequest): Promise<FinancialResponse> {
    // Processar solicitação financeira específica
    // Usar ferramentas apropriadas
    // Atualizar memória com insights
  }
}
```

### **2. Financial Tools**

```typescript
// src/agents/crewai/agents/financial/financial-tools.ts
import { tool } from '@crewai/tools';

export class FinancialTools {
  @tool('Add expense to user account')
  async addExpense(data: ExpenseData): Promise<ExpenseResult> {
    // Adicionar despesa ao banco de dados
  }

  @tool('Get expense report for period')
  async getExpenseReport(period: DateRange): Promise<ExpenseReport> {
    // Gerar relatório de despesas
  }

  @tool('Analyze cash flow')
  async analyzeCashFlow(data: CashFlowData): Promise<CashFlowAnalysis> {
    // Analisar fluxo de caixa
  }

  @tool('Create budget plan')
  async createBudgetPlan(budgetData: BudgetData): Promise<BudgetPlan> {
    // Criar plano orçamentário
  }
}
```

---

## 🧠 **Sistema de Memória CrewAI**

### **1. Crew Memory System**

```typescript
// src/agents/crewai/memory/crew-memory-system.ts
export class CrewMemorySystem {
  async storeMemory(
    companyId: string,
    userId: string,
    memory: MemoryData
  ): Promise<void> {
    // Armazenar memória no banco de dados
    // Indexar para busca rápida
  }

  async retrieveRelevantMemories(
    companyId: string,
    userId: string,
    context: string,
    limit: number = 10
  ): Promise<Memory[]> {
    // Buscar memórias relevantes baseado no contexto
  }

  async updateMemoryImportance(
    memoryId: string,
    importance: number
  ): Promise<void> {
    // Atualizar importância da memória baseado no uso
  }
}
```

---

## 🔴 **Integração com Redis**

### **1. Redis Coordinator**

```typescript
// src/lib/crewai/redis-coordinator.ts
export class RedisCoordinator {
  async storeSessionData(
    sessionId: string,
    data: SessionData,
    ttl: number = 3600
  ): Promise<void> {
    // Armazenar dados da sessão
  }

  async getSessionData(sessionId: string): Promise<SessionData | null> {
    // Recuperar dados da sessão
  }

  async lockResource(resourceId: string, ttl: number = 30): Promise<boolean> {
    // Implementar lock distribuído
  }

  async releaseLock(resourceId: string): Promise<void> {
    // Liberar lock
  }
}
```

---

## 📊 **Sistema de Métricas**

### **1. Metrics Collector**

```typescript
// src/lib/crewai/metrics-collector.ts
export class MetricsCollector {
  async recordMetric(
    crewId: string,
    agentId: string,
    metric: MetricData
  ): Promise<void> {
    // Salvar métrica no banco de dados
  }

  async getCrewMetrics(
    crewId: string,
    timeRange: DateRange
  ): Promise<CrewMetrics> {
    // Recuperar métricas da crew
  }

  async getAgentMetrics(
    agentId: string,
    timeRange: DateRange
  ): Promise<AgentMetrics> {
    // Recuperar métricas do agente
  }
}
```

---

## 🔒 **Controle de Tokens**

### **1. Token Controller**

```typescript
// src/lib/crewai/token-controller.ts
export class TokenController {
  async checkTokenLimit(
    companyId: string,
    estimatedTokens: number
  ): Promise<boolean> {
    // Verificar limite de tokens por empresa
  }

  async recordTokenUsage(
    companyId: string,
    usage: TokenUsage
  ): Promise<void> {
    // Registrar uso de tokens
  }

  async getTokenUsage(
    companyId: string,
    period: DateRange
  ): Promise<TokenUsageSummary> {
    // Recuperar resumo de uso de tokens
  }
}
```

Este documento técnico fornece todos os detalhes necessários para implementar a integração CrewAI de forma robusta e escalável! 🚀
