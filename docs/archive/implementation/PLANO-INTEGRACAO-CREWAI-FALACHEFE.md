# 🚀 Plano de Integração CrewAI - Falachefe

## 📋 **Resumo Executivo**

**Objetivo**: Substituir o sistema atual de agentes por CrewAI, mantendo compatibilidade com UAZ API e interface existente.

**Escopo Inicial**: Orquestrador + Agente Financeiro + Handoff entre eles
**Abordagem**: Integração gradual em 4 fases
**Escalabilidade**: Preparado para alta escala (atualmente 20 empresas simultâneas)

---

## 🎯 **Objetivos Específicos**

### **Funcionalidades Principais**
- ✅ Substituir AgentOrchestrator por CrewAI Orquestrador
- ✅ Implementar Agente Financeiro especializado
- ✅ Sistema de handoff inteligente entre agentes
- ✅ Integração completa com UAZ API (WhatsApp)
- ✅ Integração com página de chat existente
- ✅ Sistema de memória próprio do CrewAI
- ✅ Multi-tenancy rigoroso (empresas isoladas)

### **Requisitos Técnicos**
- 🔧 Redis para cache e coordenação
- 🔧 OpenAI como LLM principal com controle rigoroso de tokens
- 🔧 Human-in-the-loop para aprovações
- 🔧 Logs detalhados e métricas por crew
- 🔧 Integração com Supabase (banco atual)

---

## 🏗️ **Arquitetura Proposta**

### **Componentes Principais**

```
┌─────────────────────────────────────────────────────────────┐
│                    FALACHEFE CREWAI SYSTEM                 │
├─────────────────────────────────────────────────────────────┤
│  🌐 UAZ API Webhook  │  💬 Chat Interface  │  📊 Dashboard  │
├─────────────────────────────────────────────────────────────┤
│                    CREWAI ORCHESTRATOR                     │
│  • Message Router    • Agent Selection    • Handoff Logic  │
├─────────────────────────────────────────────────────────────┤
│  🤖 FINANCIAL AGENT  │  🔄 HANDOFF SYSTEM  │  📝 MEMORY    │
│  • Expense Manager   • Context Transfer   • CrewAI Memory  │
│  • Cash Flow         • State Management   • Tenant Isolation│
│  • Budget Planning   • Error Handling     • User Context   │
├─────────────────────────────────────────────────────────────┤
│  💾 SUPABASE DB     │  🔴 REDIS CACHE     │  📈 METRICS    │
│  • Conversations    │  • Session Data     │  • Crew Stats  │
│  • Financial Data   │  • Token Control    │  • Performance│
│  • User Profiles    │  • Rate Limiting    │  • Costs      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **Estrutura de Dados Adaptada**

### **Novas Tabelas CrewAI**

```sql
-- Crews (Equipes de agentes por empresa)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, disabled
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agents (Agentes especializados)
CREATE TABLE crew_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL, -- orchestrator, financial, marketing, hr
  goal TEXT NOT NULL,
  backstory TEXT NOT NULL,
  tools JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks (Tarefas dos agentes)
CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES crew_agents(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  expected_output TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  result JSONB DEFAULT '{}',
  error_message TEXT,
  execution_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- CrewAI Memory (Memória específica do CrewAI)
CREATE TABLE crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  memory_type VARCHAR(50) NOT NULL, -- fact, preference, context, learning
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  importance_score INTEGER DEFAULT 1, -- 1-10
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crew Metrics (Métricas de performance)
CREATE TABLE crew_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- response_time, token_usage, success_rate
  value DECIMAL(10,4) NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabelas Adaptadas**

```sql
-- Adaptar conversations para CrewAI
ALTER TABLE conversations ADD COLUMN crew_id UUID REFERENCES crews(id);
ALTER TABLE conversations ADD COLUMN current_agent_id UUID REFERENCES crew_agents(id);
ALTER TABLE conversations ADD COLUMN handoff_history JSONB DEFAULT '[]';

-- Adaptar messages para CrewAI
ALTER TABLE messages ADD COLUMN crew_task_id UUID REFERENCES crew_tasks(id);
ALTER TABLE messages ADD COLUMN agent_response JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN token_usage JSONB DEFAULT '{}';
```

---

## 🔄 **Fluxo de Integração Gradual**

### **FASE 1: Fundação (Semana 1-2)**
```
🎯 Objetivo: Setup básico do CrewAI
├── Instalar dependências CrewAI
├── Criar estrutura de dados
├── Implementar CrewAI Orquestrador básico
├── Integrar com Redis
└── Testes unitários básicos
```

### **FASE 2: Agente Financeiro (Semana 3-4)**
```
🎯 Objetivo: Agente financeiro funcional
├── Implementar Financial Agent
├── Migrar funcionalidades existentes
├── Sistema de memória CrewAI
├── Integração com banco de dados
└── Testes de integração
```

### **FASE 3: Handoff System (Semana 5-6)**
```
🎯 Objetivo: Sistema de transferência entre agentes
├── Lógica de handoff inteligente
├── Transferência de contexto
├── Gerenciamento de estado
├── Error handling robusto
└── Testes de handoff
```

### **FASE 4: Integração Completa (Semana 7-8)**
```
🎯 Objetivo: Sistema completo em produção
├── Integração com UAZ API
├── Integração com chat interface
├── Dashboard de métricas
├── Human-in-the-loop
└── Deploy e monitoramento
```

---

## 🔧 **Implementação Técnica**

### **1. CrewAI Orquestrador**

```typescript
// src/agents/crewai/orchestrator.ts
export class FalachefeCrewOrchestrator {
  private crew: Crew;
  private redis: RedisClient;
  private memorySystem: CrewMemorySystem;
  
  async processMessage(
    message: string,
    userId: string,
    companyId: string,
    conversationId: string
  ): Promise<CrewResponse> {
    // 1. Carregar contexto da empresa
    // 2. Selecionar agente apropriado
    // 3. Executar tarefa
    // 4. Gerenciar handoff se necessário
    // 5. Salvar métricas
  }
}
```

### **2. Financial Agent**

```typescript
// src/agents/crewai/financial-agent.ts
export class FinancialAgent {
  private tools: FinancialTools[];
  private memory: CrewMemory;
  
  async processFinancialRequest(
    request: FinancialRequest,
    context: AgentContext
  ): Promise<FinancialResponse> {
    // Processar solicitação financeira
    // Usar ferramentas apropriadas
    // Atualizar memória
  }
}
```

### **3. Handoff System**

```typescript
// src/agents/crewai/handoff-system.ts
export class HandoffSystem {
  async transferToAgent(
    fromAgent: string,
    toAgent: string,
    context: ConversationContext
  ): Promise<HandoffResult> {
    // Transferir contexto
    // Notificar usuário se necessário
    // Atualizar estado da conversa
  }
}
```

---

## 🌐 **Integração com UAZ API**

### **Webhook Handler Adaptado**

```typescript
// src/app/api/webhook/uaz/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar webhook
  // 2. Extrair dados da mensagem
  // 3. Chamar CrewAI Orquestrador
  // 4. Processar resposta
  // 5. Enviar via UAZ API
}
```

### **Chat Interface Adaptada**

```typescript
// src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  // 1. Autenticar usuário
  // 2. Chamar CrewAI Orquestrador
  // 3. Retornar resposta formatada
}
```

---

## 📊 **Sistema de Métricas e Monitoramento**

### **Métricas Essenciais**

```typescript
interface CrewMetrics {
  responseTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  successRate: number;
  handoffCount: number;
  userSatisfaction: number;
  costPerInteraction: number;
}
```

### **Dashboard Adaptado**

```typescript
// src/app/(dashboard)/dashboard/crews/page.tsx
export default function CrewsDashboard() {
  // Mostrar status dos crews
  // Métricas de performance
  // Controle de agentes
  // Logs de atividades
}
```

---

## 🔒 **Segurança e Multi-tenancy**

### **Isolamento por Empresa**

```typescript
class TenantIsolation {
  async ensureTenantAccess(
    companyId: string,
    userId: string
  ): Promise<boolean> {
    // Verificar se usuário pertence à empresa
    // Validar permissões
  }
  
  async createTenantContext(
    companyId: string
  ): Promise<CrewContext> {
    // Criar contexto isolado por empresa
  }
}
```

### **Controle de Tokens**

```typescript
class TokenController {
  async checkTokenLimit(
    companyId: string,
    estimatedTokens: number
  ): Promise<boolean> {
    // Verificar limite de tokens por empresa
    // Implementar rate limiting
  }
}
```

---

## 🚀 **Plano de Deploy**

### **Ambiente de Desenvolvimento**
1. Setup CrewAI local
2. Banco de dados de teste
3. Redis local
4. Testes automatizados

### **Ambiente de Produção**
1. Deploy gradual por empresa
2. Monitoramento ativo
3. Rollback automático se necessário
4. Métricas em tempo real

---

## 📋 **Checklist de Implementação**

### **Fase 1 - Fundação**
- [ ] Instalar dependências CrewAI
- [ ] Criar estrutura de banco de dados
- [ ] Implementar CrewAI Orquestrador básico
- [ ] Configurar Redis
- [ ] Testes unitários

### **Fase 2 - Agente Financeiro**
- [ ] Implementar Financial Agent
- [ ] Migrar funcionalidades existentes
- [ ] Sistema de memória CrewAI
- [ ] Integração com banco
- [ ] Testes de integração

### **Fase 3 - Handoff System**
- [ ] Lógica de handoff
- [ ] Transferência de contexto
- [ ] Gerenciamento de estado
- [ ] Error handling
- [ ] Testes de handoff

### **Fase 4 - Integração Completa**
- [ ] Integração UAZ API
- [ ] Integração chat interface
- [ ] Dashboard métricas
- [ ] Human-in-the-loop
- [ ] Deploy produção

---

## 🎯 **Próximos Passos Imediatos**

1. **Instalar dependências CrewAI**
2. **Criar estrutura de banco de dados**
3. **Implementar CrewAI Orquestrador básico**
4. **Configurar Redis para coordenação**
5. **Criar testes unitários básicos**

**Este plano garante uma migração segura e gradual, mantendo a funcionalidade existente enquanto introduz as capacidades avançadas do CrewAI!** 🚀
