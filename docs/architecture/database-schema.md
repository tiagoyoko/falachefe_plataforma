# Database Schema

## Novas Tabelas CrewAI

```sql
-- Tabela crews (Equipes de agentes por empresa)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}',
  llm_config JSONB NOT NULL DEFAULT '{}',
  memory_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crews_status CHECK (status IN ('active', 'paused', 'disabled', 'maintenance')),
  CONSTRAINT chk_crews_name_length CHECK (LENGTH(name) >= 3)
);

-- Tabela crew_agents (Agentes especializados)
CREATE TABLE crew_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  goal TEXT NOT NULL,
  backstory TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_agents_status CHECK (status IN ('active', 'inactive', 'maintenance')),
  CONSTRAINT chk_crew_agents_role CHECK (role IN ('orchestrator', 'financial', 'marketing', 'hr', 'support')),
  CONSTRAINT chk_crew_agents_goal_length CHECK (LENGTH(goal) >= 10)
);

-- Tabela crew_tasks (Tarefas dos agentes)
CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES crew_agents(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES crew_tasks(id),
  description TEXT NOT NULL,
  expected_output TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  execution_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}',
  cost_usd DECIMAL(10,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT chk_crew_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT chk_crew_tasks_execution_time CHECK (execution_time_ms >= 0),
  CONSTRAINT chk_crew_tasks_cost CHECK (cost_usd >= 0)
);

-- Tabela crew_memories (Memória CrewAI)
CREATE TABLE crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  content TEXT NOT NULL,
  summary TEXT,
  importance_score INTEGER NOT NULL DEFAULT 1,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_memories_type CHECK (memory_type IN ('fact', 'preference', 'context', 'learning', 'pattern')),
  CONSTRAINT chk_crew_memories_importance CHECK (importance_score >= 1 AND importance_score <= 10),
  CONSTRAINT chk_crew_memories_access_count CHECK (access_count >= 0)
);

-- Tabela crew_metrics (Métricas de performance)
CREATE TABLE crew_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES crew_agents(id) ON DELETE SET NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(15,6) NOT NULL,
  unit VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_metrics_value CHECK (value >= 0)
);
```

## Índices para Performance

```sql
-- Índices para crews
CREATE INDEX idx_crews_company_id ON crews(company_id);
CREATE INDEX idx_crews_status ON crews(status);
CREATE INDEX idx_crews_created_at ON crews(created_at);

-- Índices para crew_agents
CREATE INDEX idx_crew_agents_crew_id ON crew_agents(crew_id);
CREATE INDEX idx_crew_agents_role ON crew_agents(role);
CREATE INDEX idx_crew_agents_status ON crew_agents(status);

-- Índices para crew_tasks
CREATE INDEX idx_crew_tasks_crew_id ON crew_tasks(crew_id);
CREATE INDEX idx_crew_tasks_agent_id ON crew_tasks(agent_id);
CREATE INDEX idx_crew_tasks_conversation_id ON crew_tasks(conversation_id);
CREATE INDEX idx_crew_tasks_status ON crew_tasks(status);
CREATE INDEX idx_crew_tasks_created_at ON crew_tasks(created_at);

-- Índices para crew_memories
CREATE INDEX idx_crew_memories_company_id ON crew_memories(company_id);
CREATE INDEX idx_crew_memories_user_id ON crew_memories(user_id);
CREATE INDEX idx_crew_memories_conversation_id ON crew_memories(conversation_id);
CREATE INDEX idx_crew_memories_type ON crew_memories(memory_type);
CREATE INDEX idx_crew_memories_importance ON crew_memories(importance_score);

-- Índices para crew_metrics
CREATE INDEX idx_crew_metrics_crew_id ON crew_metrics(crew_id);
CREATE INDEX idx_crew_metrics_agent_id ON crew_metrics(agent_id);
CREATE INDEX idx_crew_metrics_type ON crew_metrics(metric_type);
CREATE INDEX idx_crew_metrics_recorded_at ON crew_metrics(recorded_at);
```

## Tabelas Adaptadas

```sql
-- Adaptar conversations para CrewAI
ALTER TABLE conversations 
ADD COLUMN crew_id UUID REFERENCES crews(id),
ADD COLUMN current_agent_id UUID REFERENCES crew_agents(id),
ADD COLUMN handoff_history JSONB DEFAULT '[]',
ADD COLUMN crew_context JSONB DEFAULT '{}',
ADD COLUMN requires_human_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN human_approval_status VARCHAR(50) DEFAULT 'not_required';

-- Adaptar messages para CrewAI
ALTER TABLE messages 
ADD COLUMN crew_task_id UUID REFERENCES crew_tasks(id),
ADD COLUMN agent_response JSONB DEFAULT '{}',
ADD COLUMN token_usage JSONB DEFAULT '{}',
ADD COLUMN processing_time_ms INTEGER,
ADD COLUMN confidence_score DECIMAL(3,2),
ADD COLUMN crew_metadata JSONB DEFAULT '{}';

-- Constraints
ALTER TABLE conversations 
ADD CONSTRAINT chk_conversations_human_approval_status 
CHECK (human_approval_status IN ('not_required', 'pending', 'approved', 'rejected'));

ALTER TABLE messages 
ADD CONSTRAINT chk_messages_confidence_score 
CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);
```

## Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas CrewAI
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para isolamento por empresa
CREATE POLICY "Companies can access their own crews" ON crews
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id'::text);

CREATE POLICY "Companies can access their own crew agents" ON crew_agents
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );

CREATE POLICY "Companies can access their own crew tasks" ON crew_tasks
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );

CREATE POLICY "Companies can access their own crew memories" ON crew_memories
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id'::text);

CREATE POLICY "Companies can access their own crew metrics" ON crew_metrics
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );
```
