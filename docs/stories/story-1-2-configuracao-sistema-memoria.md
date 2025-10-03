# 📋 **Story 1.2: Configuração do Sistema de Memória**

## 🎯 **Story Statement**
Como **Backend Developer**, quero **implementar o sistema de memória individual e compartilhada** para que **os agentes possam manter contexto entre conversas** e **compartilhar informações relevantes**.

## 📝 **Descrição Detalhada**

### **Contexto**
O sistema de memória é fundamental para o funcionamento eficaz dos agentes. Ele permite que cada agente mantenha seu contexto individual (memória individual) e compartilhe informações relevantes com outros agentes (memória compartilhada).

### **Objetivos**
- Implementar sistema de memória individual usando Redis
- Implementar sistema de memória compartilhada usando PostgreSQL
- Criar interface unificada para gerenciamento de memória
- Garantir performance e escalabilidade

## ✅ **Acceptance Criteria**

### **AC1: Memória Individual (Redis)**
- [ ] Implementar armazenamento de contexto por agente
- [ ] Configurar TTL (Time To Live) para limpeza automática
- [ ] Implementar serialização/deserialização de dados
- [ ] Garantir performance < 50ms por operação

### **AC2: Memória Compartilhada (PostgreSQL)**
- [ ] Implementar armazenamento persistente de contexto
- [ ] Configurar sincronização entre agentes
- [ ] Implementar versionamento de dados
- [ ] Garantir consistência de dados

### **AC3: Interface Unificada**
- [ ] Criar MemoryManager com API unificada
- [ ] Implementar métodos para get/set/delete
- [ ] Implementar busca e filtros
- [ ] Garantir tratamento de erros

### **AC4: Performance e Monitoramento**
- [ ] Implementar cache de consultas frequentes
- [ ] Configurar métricas de performance
- [ ] Implementar logs de operações
- [ ] Garantir escalabilidade

## 📋 **Tasks / Subtasks**

### **Task 1: Configurar Redis para Memória Individual**
- [ ] Configurar cliente Redis
- [ ] Implementar serialização JSON
- [ ] Configurar TTL padrão (24 horas)
- [ ] Implementar conexão com pool
- [ ] Testar conectividade

### **Task 2: Implementar Memória Individual**
- [ ] Criar `IndividualMemoryManager`
- [ ] Implementar métodos CRUD
- [ ] Implementar busca por padrões
- [ ] Implementar limpeza automática
- [ ] Adicionar tratamento de erros

### **Task 3: Implementar Memória Compartilhada**
- [ ] Criar `SharedMemoryManager`
- [ ] Implementar operações atômicas
- [ ] Implementar versionamento
- [ ] Implementar sincronização
- [ ] Adicionar validação de dados

### **Task 4: Criar Interface Unificada**
- [ ] Criar `MemoryManager` principal
- [ ] Implementar API unificada
- [ ] Implementar fallback entre sistemas
- [ ] Adicionar cache inteligente
- [ ] Implementar métricas

### **Task 5: Testes e Validação**
- [ ] Testes unitários para cada componente
- [ ] Testes de integração Redis + PostgreSQL
- [ ] Testes de performance
- [ ] Testes de concorrência
- [ ] Validação de consistência

## 🔧 **Dev Notes**

### **Arquitetura do Sistema de Memória**

```typescript
// Estrutura da memória individual
interface IndividualMemory {
  conversationId: string
  agentType: string
  data: Record<string, any>
  ttl: number
  createdAt: Date
  updatedAt: Date
}

// Estrutura da memória compartilhada
interface SharedMemory {
  conversationId: string
  data: Record<string, any>
  version: number
  createdAt: Date
  updatedAt: Date
}

// Interface unificada
interface MemoryManager {
  // Memória individual
  getIndividualMemory(conversationId: string, agentType: string): Promise<Record<string, any>>
  setIndividualMemory(conversationId: string, agentType: string, data: Record<string, any>): Promise<void>
  deleteIndividualMemory(conversationId: string, agentType: string): Promise<void>
  
  // Memória compartilhada
  getSharedMemory(conversationId: string): Promise<Record<string, any>>
  setSharedMemory(conversationId: string, data: Record<string, any>): Promise<void>
  updateSharedMemory(conversationId: string, updates: Record<string, any>): Promise<void>
  
  // Operações combinadas
  syncMemories(conversationId: string): Promise<void>
  clearAllMemories(conversationId: string): Promise<void>
}
```

### **Configuração Redis**
```typescript
// src/lib/cache/redis-config.ts
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'falachefe:agent:',
  ttl: {
    individual: 86400, // 24 horas
    shared: 604800,    // 7 dias
    cache: 3600        // 1 hora
  }
}
```

### **Schema PostgreSQL Atualizado**
```sql
-- Memória individual (cache no Redis, backup no PostgreSQL)
CREATE TABLE agent_individual_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  memory_data JSONB NOT NULL,
  ttl INTEGER DEFAULT 86400,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, agent_type)
);

-- Memória compartilhada (principal no PostgreSQL)
CREATE TABLE agent_shared_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  memory_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Log de operações de memória
CREATE TABLE agent_memory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(50),
  operation VARCHAR(50) NOT NULL, -- 'get', 'set', 'delete', 'sync'
  memory_type VARCHAR(20) NOT NULL, -- 'individual', 'shared'
  data_size INTEGER,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_agent_individual_memory_conversation ON agent_individual_memory(conversation_id);
CREATE INDEX idx_agent_individual_memory_agent_type ON agent_individual_memory(agent_type);
CREATE INDEX idx_agent_individual_memory_ttl ON agent_individual_memory(created_at + INTERVAL '1 second' * ttl);
CREATE INDEX idx_agent_shared_memory_conversation ON agent_shared_memory(conversation_id);
CREATE INDEX idx_agent_memory_logs_conversation ON agent_memory_logs(conversation_id);
CREATE INDEX idx_agent_memory_logs_created_at ON agent_memory_logs(created_at);
```

### **Implementação dos Componentes**

```typescript
// src/agents/memory/individual-memory-manager.ts
export class IndividualMemoryManager {
  private redis: Redis
  private db: DrizzleClient
  
  async get(conversationId: string, agentType: string): Promise<Record<string, any>> {
    // 1. Tentar Redis primeiro
    const cached = await this.redis.get(`individual:${conversationId}:${agentType}`)
    if (cached) return JSON.parse(cached)
    
    // 2. Fallback para PostgreSQL
    const result = await this.db.select()
      .from(agentIndividualMemory)
      .where(and(
        eq(agentIndividualMemory.conversationId, conversationId),
        eq(agentIndividualMemory.agentType, agentType)
      ))
      .limit(1)
    
    if (result[0]) {
      // 3. Cache no Redis para próximas consultas
      await this.redis.setex(
        `individual:${conversationId}:${agentType}`,
        result[0].ttl,
        JSON.stringify(result[0].memoryData)
      )
      return result[0].memoryData
    }
    
    return {}
  }
  
  async set(conversationId: string, agentType: string, data: Record<string, any>): Promise<void> {
    const ttl = 86400 // 24 horas
    
    // 1. Salvar no Redis
    await this.redis.setex(
      `individual:${conversationId}:${agentType}`,
      ttl,
      JSON.stringify(data)
    )
    
    // 2. Backup no PostgreSQL
    await this.db.insert(agentIndividualMemory)
      .values({
        conversationId,
        agentType,
        memoryData: data,
        ttl
      })
      .onConflictDoUpdate({
        target: [agentIndividualMemory.conversationId, agentIndividualMemory.agentType],
        set: {
          memoryData: data,
          ttl,
          updatedAt: new Date()
        }
      })
  }
}
```

## 🧪 **Testing**

### **Testes Unitários**
- [ ] Testar operações CRUD da memória individual
- [ ] Testar operações CRUD da memória compartilhada
- [ ] Testar serialização/deserialização
- [ ] Testar tratamento de erros

### **Testes de Integração**
- [ ] Testar integração Redis + PostgreSQL
- [ ] Testar sincronização entre sistemas
- [ ] Testar fallback entre Redis e PostgreSQL
- [ ] Testar performance com dados reais

### **Testes de Performance**
- [ ] Testar latência < 50ms por operação
- [ ] Testar throughput com múltiplas operações
- [ ] Testar uso de memória
- [ ] Testar escalabilidade

## 📊 **Definition of Done**

- [ ] Sistema de memória individual implementado e testado
- [ ] Sistema de memória compartilhada implementado e testado
- [ ] Interface unificada funcionando
- [ ] Performance dentro dos parâmetros especificados
- [ ] Testes unitários e de integração passando
- [ ] Documentação atualizada
- [ ] Código commitado e revisado

## 📈 **Estimativas**

- **Story Points**: 13
- **Tempo Estimado**: 2-3 dias
- **Prioridade**: Alta
- **Dependências**: Story 1.1 (Setup do Framework)
- **Complexidade**: Alta

## 👥 **Responsáveis**

- **Backend Developer**: Implementação principal
- **Tech Lead**: Revisão e validação
- **DevOps**: Configuração Redis e PostgreSQL

## 🔗 **Dependências**

- **Entrada**: Story 1.1 concluída
- **Saída**: Sistema de memória funcional
- **Bloqueadores**: Configuração Redis e PostgreSQL

---

**Status**: Ready for Development
**Criado em**: Janeiro 2025
**Última atualização**: Janeiro 2025
**Responsável**: Sarah (Product Owner)
**Desenvolvedor**: James (Full Stack Developer)
