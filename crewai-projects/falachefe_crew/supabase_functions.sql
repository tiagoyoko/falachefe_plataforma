-- ================================================
-- Funções Supabase para Busca Vetorial de Memórias
-- ================================================
-- 
-- Essas funções devem ser executadas no Supabase SQL Editor
-- para habilitar busca semântica com pgvector
--

-- 1. Habilitar extensão pgvector (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Função de busca vetorial por similaridade
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
    am.content->>'user_id' AS user_id,        -- Extrai do JSONB
    am.content->>'company_id' AS company_id   -- Extrai do JSONB
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

-- 3. Função para buscar memórias recentes de um agente
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

-- 4. Função para buscar memórias de um usuário específico
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

-- 5. Função para estatísticas de memória
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
        SELECT memory_type, COUNT(*) as count
        FROM agent_memories
        GROUP BY memory_type
      ) t
    ),
    (
      SELECT jsonb_object_agg(agent_id, count)
      FROM (
        SELECT agent_id, COUNT(*) as count
        FROM agent_memories
        GROUP BY agent_id
      ) t
    );
END;
$$;

-- 6. Criar tabela memory_embeddings se não existir
CREATE TABLE IF NOT EXISTS memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES agent_memories(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  content_text text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id 
  ON agent_memories(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_memories_conversation_id
  ON agent_memories(conversation_id);

-- Índice JSONB para busca por user_id dentro do content
CREATE INDEX IF NOT EXISTS idx_agent_memories_user_id 
  ON agent_memories((content->>'user_id'));

-- Índice JSONB para busca por company_id dentro do content  
CREATE INDEX IF NOT EXISTS idx_agent_memories_company_id
  ON agent_memories((content->>'company_id'));

CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at 
  ON agent_memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory_id 
  ON memory_embeddings(memory_id);

-- Índice HNSW para busca vetorial rápida
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector 
  ON memory_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- 7. Políticas RLS (Row Level Security) - DESABILITADO para service role
-- Se você quiser habilitar RLS no futuro:
-- 
-- ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can see their own memories"
--   ON agent_memories FOR SELECT
--   USING (auth.uid()::text = user_id);
--
-- CREATE POLICY "Service role can do anything"
--   ON agent_memories FOR ALL
--   USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- Como usar essas funções:
-- ================================================
--
-- 1. Busca vetorial:
--    SELECT * FROM match_memories(
--      '[0.1, 0.2, ...]'::vector(1536),
--      match_threshold := 0.7,
--      match_count := 5
--    );
--
-- 2. Memórias recentes do agente:
--    SELECT * FROM get_agent_recent_memories('financial_expert', 'user_123');
--
-- 3. Memórias de usuário:
--    SELECT * FROM get_user_memories('user_123', 'financial_expert');
--
-- 4. Estatísticas:
--    SELECT * FROM get_memory_stats();
--

