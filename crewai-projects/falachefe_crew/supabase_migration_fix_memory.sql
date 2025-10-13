-- ================================================
-- MIGRAÇÃO: Corrigir Sistema de Memória
-- ================================================
-- Data: 2025-01-13
-- Objetivo: Remover tabelas antigas e criar schema correto
--
-- ATENÇÃO: Esta migração DELETA dados existentes!
-- Execute apenas em desenvolvimento ou após backup.
--

-- 1. REMOVER TABELAS ANTIGAS
-- ================================================

-- Desabilitar checks de FK temporariamente
SET session_replication_role = 'replica';

-- Dropar tabelas antigas na ordem correta (por causa das FKs)
DROP TABLE IF EXISTS memory_embeddings CASCADE;
DROP TABLE IF EXISTS agent_memories CASCADE;
DROP TABLE IF EXISTS conversation_contexts CASCADE;
DROP TABLE IF EXISTS user_memory_profiles CASCADE;

-- Reabilitar checks de FK
SET session_replication_role = 'origin';

-- 2. HABILITAR EXTENSÃO PGVECTOR
-- ================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- 3. CRIAR ENUMS NECESSÁRIOS
-- ================================================

-- Memory type para agent_memories
DO $$ BEGIN
  CREATE TYPE memory_type AS ENUM (
    'fact',
    'preference', 
    'context',
    'learning',
    'pattern'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Shared memory type
DO $$ BEGIN
  CREATE TYPE shared_memory_type AS ENUM (
    'company_policy',
    'user_preference',
    'business_rule',
    'integration_config',
    'common_knowledge'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Access level
DO $$ BEGIN
  CREATE TYPE access_level AS ENUM (
    'public',
    'restricted',
    'confidential'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Context type
DO $$ BEGIN
  CREATE TYPE context_type AS ENUM (
    'business',
    'technical',
    'financial',
    'support'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Learning type
DO $$ BEGIN
  CREATE TYPE learning_type AS ENUM (
    'response_pattern',
    'user_behavior',
    'error_recovery',
    'optimization'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. CRIAR TABELA AGENT_MEMORIES (NOVA)
-- ================================================

CREATE TABLE agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  memory_type memory_type NOT NULL,
  content jsonb NOT NULL,
  importance numeric(3,2) DEFAULT 0.5 NOT NULL CHECK (importance >= 0 AND importance <= 1),
  expires_at timestamp,
  access_count integer DEFAULT 0,
  last_accessed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Comentários
COMMENT ON TABLE agent_memories IS 'Memórias individuais dos agentes CrewAI';
COMMENT ON COLUMN agent_memories.agent_id IS 'UUID do agente que criou a memória';
COMMENT ON COLUMN agent_memories.content IS 'Conteúdo JSONB flexível - user_id e company_id ficam aqui';
COMMENT ON COLUMN agent_memories.importance IS 'Score de importância 0.00 a 1.00';

-- 5. CRIAR TABELA SHARED_MEMORIES
-- ================================================

CREATE TABLE shared_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  memory_type shared_memory_type NOT NULL,
  content jsonb NOT NULL,
  access_level access_level DEFAULT 'public',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES agents(id),
  last_updated_by uuid REFERENCES agents(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

COMMENT ON TABLE shared_memories IS 'Memórias compartilhadas entre agentes da mesma empresa';
COMMENT ON COLUMN shared_memories.tags IS 'Tags para categorização e busca';

-- 6. CRIAR TABELA CONVERSATION_CONTEXTS (NOVA)
-- ================================================

CREATE TABLE conversation_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  context_type context_type NOT NULL,
  data jsonb NOT NULL,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

COMMENT ON TABLE conversation_contexts IS 'Contexto tipado das conversas';
COMMENT ON COLUMN conversation_contexts.version IS 'Versionamento do contexto';

-- 7. CRIAR TABELA AGENT_LEARNINGS
-- ================================================

CREATE TABLE agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  learning_type learning_type NOT NULL,
  pattern jsonb NOT NULL,
  confidence numeric(3,2) DEFAULT 0.5 NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  success_rate numeric(3,2) DEFAULT 0.0 NOT NULL CHECK (success_rate >= 0 AND success_rate <= 1),
  usage_count integer DEFAULT 0,
  is_validated boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

COMMENT ON TABLE agent_learnings IS 'Padrões e aprendizados dos agentes';
COMMENT ON COLUMN agent_learnings.confidence IS 'Confiança no padrão (0.00 a 1.00)';
COMMENT ON COLUMN agent_learnings.success_rate IS 'Taxa de sucesso ao aplicar (0.00 a 1.00)';

-- 8. CRIAR TABELA MEMORY_EMBEDDINGS (CORRIGIDA)
-- ================================================

CREATE TABLE memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES agent_memories(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536) NOT NULL,
  content_text text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

COMMENT ON TABLE memory_embeddings IS 'Embeddings vetoriais para busca semântica com pgvector';
COMMENT ON COLUMN memory_embeddings.embedding IS 'Vetor de 1536 dimensões (OpenAI text-embedding-3-small)';

-- 9. CRIAR ÍNDICES DE PERFORMANCE
-- ================================================

-- agent_memories
CREATE INDEX idx_agent_memories_agent_id ON agent_memories(agent_id);
CREATE INDEX idx_agent_memories_conversation_id ON agent_memories(conversation_id);
CREATE INDEX idx_agent_memories_created_at ON agent_memories(created_at DESC);
CREATE INDEX idx_agent_memories_user_id ON agent_memories((content->>'user_id'));
CREATE INDEX idx_agent_memories_company_id ON agent_memories((content->>'company_id'));

-- shared_memories
CREATE INDEX idx_shared_memories_company_id ON shared_memories(company_id);
CREATE INDEX idx_shared_memories_tags ON shared_memories USING GIN(tags);
CREATE INDEX idx_shared_memories_is_active ON shared_memories(is_active);

-- conversation_contexts
CREATE INDEX idx_conversation_contexts_conversation_id ON conversation_contexts(conversation_id);
CREATE INDEX idx_conversation_contexts_type ON conversation_contexts(context_type);

-- agent_learnings
CREATE INDEX idx_agent_learnings_agent_id ON agent_learnings(agent_id);
CREATE INDEX idx_agent_learnings_type ON agent_learnings(learning_type);
CREATE INDEX idx_agent_learnings_validated ON agent_learnings(is_validated);

-- memory_embeddings - ÍNDICE VETORIAL HNSW
CREATE INDEX idx_memory_embeddings_memory_id ON memory_embeddings(memory_id);
CREATE INDEX idx_memory_embeddings_vector ON memory_embeddings USING hnsw (embedding vector_cosine_ops);

-- 10. CRIAR FUNÇÕES DE BUSCA VETORIAL
-- ================================================

-- Função de busca vetorial por similaridade
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_user_id varchar DEFAULT NULL,
  filter_agent_id uuid DEFAULT NULL,
  filter_conversation_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  agent_id uuid,
  conversation_id uuid,
  memory_type text,
  content jsonb,
  importance numeric,
  similarity float,
  created_at timestamp,
  user_id text,
  company_id text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.agent_id,
    am.conversation_id,
    am.memory_type::text,
    am.content,
    am.importance,
    1 - (me.embedding <=> query_embedding) AS similarity,
    am.created_at,
    am.content->>'user_id' AS user_id,
    am.content->>'company_id' AS company_id
  FROM agent_memories am
  JOIN memory_embeddings me ON me.memory_id = am.id
  WHERE 
    1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_user_id IS NULL OR am.content->>'user_id' = filter_user_id)
    AND (filter_agent_id IS NULL OR am.agent_id = filter_agent_id)
    AND (filter_conversation_id IS NULL OR am.conversation_id = filter_conversation_id)
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para memórias recentes de um agente
CREATE OR REPLACE FUNCTION get_agent_recent_memories(
  p_agent_id uuid,
  p_user_id varchar DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  memory_type text,
  content jsonb,
  importance numeric,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.memory_type::text,
    am.content,
    am.importance,
    am.created_at
  FROM agent_memories am
  WHERE 
    am.agent_id = p_agent_id
    AND (p_user_id IS NULL OR am.content->>'user_id' = p_user_id)
  ORDER BY am.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Função para memórias de um usuário
CREATE OR REPLACE FUNCTION get_user_memories(
  p_user_id varchar,
  p_agent_id uuid DEFAULT NULL,
  p_memory_type text DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  agent_id uuid,
  memory_type text,
  content jsonb,
  importance numeric,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.agent_id,
    am.memory_type::text,
    am.content,
    am.importance,
    am.created_at
  FROM agent_memories am
  WHERE 
    am.content->>'user_id' = p_user_id
    AND (p_agent_id IS NULL OR am.agent_id = p_agent_id)
    AND (p_memory_type IS NULL OR am.memory_type::text = p_memory_type)
  ORDER BY am.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Função de estatísticas
CREATE OR REPLACE FUNCTION get_memory_stats()
RETURNS TABLE (
  total_memories bigint,
  total_embeddings bigint,
  memories_by_type jsonb,
  memories_by_agent jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM agent_memories)::bigint,
    (SELECT COUNT(*) FROM memory_embeddings)::bigint,
    (
      SELECT jsonb_object_agg(memory_type, count)
      FROM (
        SELECT memory_type::text, COUNT(*) as count
        FROM agent_memories
        GROUP BY memory_type
      ) t
    ),
    (
      SELECT jsonb_object_agg(agent_id, count)
      FROM (
        SELECT agent_id::text, COUNT(*) as count
        FROM agent_memories
        GROUP BY agent_id
      ) t
    );
END;
$$;

-- 11. GRANTS E PERMISSÕES
-- ================================================

-- Permitir acesso às tabelas
GRANT ALL ON agent_memories TO postgres, anon, authenticated, service_role;
GRANT ALL ON shared_memories TO postgres, anon, authenticated, service_role;
GRANT ALL ON conversation_contexts TO postgres, anon, authenticated, service_role;
GRANT ALL ON agent_learnings TO postgres, anon, authenticated, service_role;
GRANT ALL ON memory_embeddings TO postgres, anon, authenticated, service_role;

-- Permitir uso das funções
GRANT EXECUTE ON FUNCTION match_memories TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_agent_recent_memories TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_memories TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_memory_stats TO postgres, anon, authenticated, service_role;

-- ================================================
-- FIM DA MIGRAÇÃO
-- ================================================

-- Verificar instalação
SELECT 
  'agent_memories' as table_name,
  COUNT(*) as row_count
FROM agent_memories
UNION ALL
SELECT 
  'memory_embeddings',
  COUNT(*)
FROM memory_embeddings
UNION ALL
SELECT
  'shared_memories',
  COUNT(*)
FROM shared_memories
UNION ALL
SELECT
  'agent_learnings',
  COUNT(*)
FROM agent_learnings
UNION ALL
SELECT
  'conversation_contexts',
  COUNT(*)
FROM conversation_contexts;

