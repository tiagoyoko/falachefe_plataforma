# 🗄️ Story 1.2: Estrutura de Banco de Dados CrewAI

## 📋 **Informações da Story**

**ID**: STORY-1.2  
**Épico**: CrewAI Fundação - Infraestrutura Base  
**Sprint**: 1.2 - Banco de Dados e Memória  
**Prioridade**: Crítica  
**Complexidade**: Alta  
**Estimativa**: 8 story points  
**Desenvolvedor**: [A definir]  
**QA**: [A definir]  

---

## 🎯 **Objetivo**

Como sistema, quero ter tabelas específicas para CrewAI para armazenar crews, agentes, tarefas e memórias de forma organizada e eficiente.

---

## 📝 **Descrição Detalhada**

Esta story estabelece a estrutura de banco de dados necessária para suportar a integração CrewAI. Inclui a criação de tabelas específicas, adaptação de tabelas existentes, criação de índices e constraints para otimizar performance e garantir integridade dos dados.

### **Contexto de Negócio**
- O sistema precisa armazenar informações sobre crews (equipes de agentes)
- Necessário rastreamento de agentes individuais e suas configurações
- Tarefas precisam ser armazenadas com status e histórico
- Sistema de memória requer persistência para recuperação de contexto
- Multi-tenancy exige isolamento completo de dados

### **Escopo Técnico**
- Criação de tabelas CrewAI específicas
- Adaptação de tabelas existentes (conversations, messages)
- Implementação de índices para performance
- Constraints para integridade referencial
- Triggers para automação de dados

---

## ✅ **Critérios de Aceitação**

### **CA1: Tabelas CrewAI Criadas**
- [ ] Tabela `crews` criada com índices apropriados
- [ ] Tabela `crew_agents` criada para relacionamento
- [ ] Tabela `crew_tasks` criada para tarefas
- [ ] Tabela `crew_memories` criada para memórias
- [ ] Tabela `crew_metrics` criada para métricas

### **CA2: Adaptação de Tabelas Existentes**
- [ ] Tabela `conversations` adaptada para CrewAI
- [ ] Tabela `messages` adaptada para CrewAI
- [ ] Campos adicionais para rastreamento de crews
- [ ] Relacionamentos com tabelas CrewAI

### **CA3: Índices e Performance**
- [ ] Índices criados para consultas frequentes
- [ ] Índices compostos para queries complexas
- [ ] Índices parciais para otimização
- [ ] Constraints de integridade implementados

### **CA4: Migrações Validadas**
- [ ] Migrações testadas em ambiente de desenvolvimento
- [ ] Rollback testado e funcionando
- [ ] Validação de integridade de dados
- [ ] Performance testada com dados de volume

---

## 🔧 **Tarefas Técnicas**

### **T1.2.1: Criação de Tabelas CrewAI**

#### **Tabela `crews`**
```sql
CREATE TABLE crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, name)
);

-- Índices
CREATE INDEX idx_crews_company_id ON crews(company_id);
CREATE INDEX idx_crews_status ON crews(status);
CREATE INDEX idx_crews_created_at ON crews(created_at);
```

#### **Tabela `crew_agents`**
```sql
CREATE TABLE crew_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100) NOT NULL,
    configuration JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crew_id, agent_id)
);

-- Índices
CREATE INDEX idx_crew_agents_crew_id ON crew_agents(crew_id);
CREATE INDEX idx_crew_agents_agent_id ON crew_agents(agent_id);
CREATE INDEX idx_crew_agents_status ON crew_agents(status);
```

#### **Tabela `crew_tasks`**
```sql
CREATE TABLE crew_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    assigned_agent_id UUID REFERENCES users(id),
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_crew_tasks_crew_id ON crew_tasks(crew_id);
CREATE INDEX idx_crew_tasks_status ON crew_tasks(status);
CREATE INDEX idx_crew_tasks_priority ON crew_tasks(priority);
CREATE INDEX idx_crew_tasks_assigned_agent ON crew_tasks(assigned_agent_id);
CREATE INDEX idx_crew_tasks_created_at ON crew_tasks(created_at);
```

#### **Tabela `crew_memories`**
```sql
CREATE TABLE crew_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL, -- 'fact', 'preference', 'context', 'learning'
    content TEXT NOT NULL,
    metadata JSONB,
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_crew_memories_crew_id ON crew_memories(crew_id);
CREATE INDEX idx_crew_memories_type ON crew_memories(memory_type);
CREATE INDEX idx_crew_memories_importance ON crew_memories(importance_score);
CREATE INDEX idx_crew_memories_created_at ON crew_memories(created_at);
CREATE INDEX idx_crew_memories_expires ON crew_memories(expires_at);
```

#### **Tabela `crew_metrics`**
```sql
CREATE TABLE crew_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crew_id, metric_name, recorded_at)
);

-- Índices
CREATE INDEX idx_crew_metrics_crew_id ON crew_metrics(crew_id);
CREATE INDEX idx_crew_metrics_name ON crew_metrics(metric_name);
CREATE INDEX idx_crew_metrics_recorded_at ON crew_metrics(recorded_at);
```

### **T1.2.2: Adaptação de Tabelas Existentes**

#### **Tabela `conversations` - Adições**
```sql
-- Adicionar colunas CrewAI
ALTER TABLE conversations ADD COLUMN crew_id UUID REFERENCES crews(id);
ALTER TABLE conversations ADD COLUMN crew_session_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN crew_metadata JSONB;

-- Índices adicionais
CREATE INDEX idx_conversations_crew_id ON conversations(crew_id);
CREATE INDEX idx_conversations_crew_session ON conversations(crew_session_id);
```

#### **Tabela `messages` - Adições**
```sql
-- Adicionar colunas CrewAI
ALTER TABLE messages ADD COLUMN crew_task_id UUID REFERENCES crew_tasks(id);
ALTER TABLE messages ADD COLUMN agent_id UUID REFERENCES users(id);
ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'user';
ALTER TABLE messages ADD COLUMN crew_metadata JSONB;

-- Índices adicionais
CREATE INDEX idx_messages_crew_task ON messages(crew_task_id);
CREATE INDEX idx_messages_agent_id ON messages(agent_id);
CREATE INDEX idx_messages_type ON messages(message_type);
```

### **T1.2.3: Triggers e Automação**

#### **Trigger de Updated At**
```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas CrewAI
CREATE TRIGGER update_crews_updated_at BEFORE UPDATE ON crews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_agents_updated_at BEFORE UPDATE ON crew_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_tasks_updated_at BEFORE UPDATE ON crew_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crew_memories_updated_at BEFORE UPDATE ON crew_memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **T1.2.4: Constraints e Validações**

#### **Constraints de Integridade**
```sql
-- Constraints para status válidos
ALTER TABLE crews ADD CONSTRAINT chk_crews_status CHECK (status IN ('active', 'inactive', 'paused', 'error'));
ALTER TABLE crew_agents ADD CONSTRAINT chk_crew_agents_status CHECK (status IN ('active', 'inactive', 'paused'));
ALTER TABLE crew_tasks ADD CONSTRAINT chk_crew_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled'));
ALTER TABLE crew_tasks ADD CONSTRAINT chk_crew_tasks_priority CHECK (priority BETWEEN 1 AND 5);

-- Constraints para tipos de memória
ALTER TABLE crew_memories ADD CONSTRAINT chk_crew_memories_type CHECK (memory_type IN ('fact', 'preference', 'context', 'learning'));

-- Constraints para importância
ALTER TABLE crew_memories ADD CONSTRAINT chk_crew_memories_importance CHECK (importance_score BETWEEN 0 AND 1);
```

---

## 🧪 **Critérios de Teste**

### **Testes Unitários**
- [ ] Teste de criação de crews
- [ ] Teste de associação de agentes
- [ ] Teste de criação de tarefas
- [ ] Teste de armazenamento de memórias
- [ ] Teste de métricas

### **Testes de Integração**
- [ ] Teste de relacionamentos entre tabelas
- [ ] Teste de constraints e validações
- [ ] Teste de triggers e automação
- [ ] Teste de isolamento por tenant

### **Testes de Performance**
- [ ] Teste de consultas com índices
- [ ] Teste de inserção em massa
- [ ] Teste de performance com volume de dados
- [ ] Teste de otimização de queries

### **Testes de Migração**
- [ ] Teste de migração completa
- [ ] Teste de rollback
- [ ] Teste de integridade pós-migração
- [ ] Teste de compatibilidade com dados existentes

---

## 📊 **Métricas de Sucesso**

### **Métricas Técnicas**
- ✅ Tempo de criação de crew < 100ms
- ✅ Tempo de consulta de memórias < 50ms
- ✅ Tempo de inserção de tarefa < 50ms
- ✅ Taxa de sucesso de migrações = 100%

### **Métricas de Qualidade**
- ✅ Zero vazamento de dados entre tenants
- ✅ Integridade referencial mantida
- ✅ Performance otimizada com índices
- ✅ Cobertura de testes > 85%

---

## 🚨 **Riscos e Mitigações**

### **Risco 1: Complexidade de Migração**
- **Probabilidade**: Alta
- **Impacto**: Alto
- **Mitigação**: Migrações incrementais e testes extensivos

### **Risco 2: Performance com Volume**
- **Probabilidade**: Média
- **Impacto**: Médio
- **Mitigação**: Índices otimizados e particionamento

### **Risco 3: Integridade de Dados**
- **Probabilidade**: Baixa
- **Impacto**: Alto
- **Mitigação**: Constraints rigorosos e validações

### **Risco 4: Compatibilidade com Dados Existentes**
- **Probabilidade**: Média
- **Impacto**: Médio
- **Mitigação**: Scripts de migração de dados e validação

---

## 🔗 **Dependências**

### **Dependências Externas**
- Banco de dados Supabase funcionando
- Sistema de migrações Drizzle configurado
- Acesso de escrita ao banco de dados

### **Dependências Internas**
- Story 1.1 (Dependências CrewAI) concluída
- Estrutura de banco existente estável
- Sistema de autenticação funcionando

---

## 📅 **Cronograma**

**Duração Estimada**: 3 dias  
**Esforço**: 24 horas  

### **Plano de Execução**
- **Dia 1 (8h)**: Criação de tabelas e índices
- **Dia 2 (8h)**: Adaptação de tabelas existentes e triggers
- **Dia 3 (8h)**: Testes, validação e otimização

---

## 🎯 **Entregáveis**

### **Código**
- [ ] Scripts de migração Drizzle
- [ ] Tabelas CrewAI criadas
- [ ] Índices e constraints implementados
- [ ] Triggers e automação funcionando

### **Documentação**
- [ ] Esquema de banco atualizado
- [ ] Documentação de relacionamentos
- [ ] Guia de migração
- [ ] Documentação de índices

### **Testes**
- [ ] Suite de testes de migração
- [ ] Testes de integridade
- [ ] Testes de performance
- [ ] Validação de dados

---

## ✅ **Definition of Done**

- [ ] Todas as tabelas CrewAI criadas e funcionando
- [ ] Tabelas existentes adaptadas com sucesso
- [ ] Índices e constraints implementados
- [ ] Triggers funcionando corretamente
- [ ] Migrações testadas e validadas
- [ ] Testes passando com cobertura > 85%
- [ ] Performance otimizada
- [ ] Documentação completa
- [ ] Code review aprovado
- [ ] Deploy em ambiente de desenvolvimento

---

## 🔄 **Próximos Passos**

Após conclusão desta story:
1. **Story 1.3**: Sistema de Memória CrewAI
2. **Story 1.4**: Orquestrador Básico CrewAI
3. **Story 1.5**: Integração Redis para Coordenação

---

**Esta story estabelece a base de dados sólida para toda a integração CrewAI!** 🗄️
