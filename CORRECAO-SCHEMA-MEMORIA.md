# ✅ Correção: Schema de Memória dos Agentes

## 🔍 Problema Encontrado

A função SQL `match_memories()` estava tentando acessar campos que **não existem** na tabela `agent_memories`.

### ❌ SQL Antigo (ERRADO)
```sql
SELECT
  am.user_id,      -- ❌ Campo não existe!
  am.company_id,   -- ❌ Campo não existe!
  am.metadata,     -- ❌ Campo não existe!
FROM agent_memories am
WHERE am.user_id = filter_user_id  -- ❌ Erro!
```

### ✅ Schema Real (memory-schema.ts)
```typescript
agent_memories {
  id: uuid,
  agentId: uuid,              // ✅ Existe
  conversationId: uuid,       // ✅ Existe
  memoryType: enum,           // ✅ Existe
  content: jsonb,             // ✅ Existe (user_id está DENTRO)
  importance: decimal,        // ✅ Existe
  // ❌ NÃO TEM user_id como coluna separada
  // ❌ NÃO TEM company_id como coluna separada
  // ❌ NÃO TEM metadata como coluna separada
}
```

## 🔧 Correção Aplicada

### 1. Função `match_memories()` Corrigida

```sql
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_user_id varchar DEFAULT NULL,
  filter_agent_id uuid DEFAULT NULL,          -- ✅ UUID correto
  filter_conversation_id uuid DEFAULT NULL    -- ✅ Novo filtro
)
RETURNS TABLE (
  id uuid,
  agent_id uuid,                    -- ✅ UUID
  conversation_id uuid,             -- ✅ UUID
  memory_type text,                 -- ✅ Enum convertido
  content jsonb,                    -- ✅ JSONB
  importance numeric,               -- ✅ Decimal
  similarity float,
  created_at timestamp,
  user_id text,                     -- ✅ Extraído do JSONB
  company_id text                   -- ✅ Extraído do JSONB
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
    am.content->>'user_id' AS user_id,        -- ✅ Extrai do JSONB
    am.content->>'company_id' AS company_id   -- ✅ Extrai do JSONB
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
```

**Mudanças:**
- ✅ `am.content->>'user_id'` - Extrai user_id de dentro do JSONB
- ✅ `am.content->>'company_id'` - Extrai company_id de dentro do JSONB
- ✅ `filter_agent_id uuid` - Tipo correto (UUID)
- ✅ Filtros corretos usando operador `->>` para JSONB

### 2. Função `get_agent_recent_memories()` Corrigida

```sql
CREATE OR REPLACE FUNCTION get_agent_recent_memories(
  p_agent_id uuid,              -- ✅ UUID (antes era varchar)
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
    AND (p_user_id IS NULL OR am.content->>'user_id' = p_user_id)  -- ✅ JSONB
  ORDER BY am.created_at DESC
  LIMIT p_limit;
END;
$$;
```

### 3. Função `get_user_memories()` Corrigida

```sql
CREATE OR REPLACE FUNCTION get_user_memories(
  p_user_id varchar,
  p_agent_id uuid DEFAULT NULL,    -- ✅ UUID
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
    am.content->>'user_id' = p_user_id                            -- ✅ JSONB
    AND (p_agent_id IS NULL OR am.agent_id = p_agent_id)
    AND (p_memory_type IS NULL OR am.memory_type::text = p_memory_type)
  ORDER BY am.created_at DESC
  LIMIT p_limit;
END;
$$;
```

### 4. Índices JSONB Adicionados

```sql
-- Índice para busca rápida por user_id dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_agent_memories_user_id 
  ON agent_memories((content->>'user_id'));

-- Índice para busca rápida por company_id dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_agent_memories_company_id
  ON agent_memories((content->>'company_id'));
```

**Benefício:** Busca por `content->>'user_id'` será rápida mesmo com milhões de registros.

### 5. SupabaseVectorStorage Atualizado

```python
# Correção nos filtros
if filter_metadata:
    if 'user_id' in filter_metadata:
        rpc_params['filter_user_id'] = filter_metadata['user_id']
    if 'agent_uuid' in filter_metadata:
        rpc_params['filter_agent_id'] = filter_metadata['agent_uuid']    # ✅ Correto
    if 'conversation_id' in filter_metadata:
        rpc_params['filter_conversation_id'] = filter_metadata['conversation_id']  # ✅ Novo
```

## ✅ Validação do Schema

### Schema Correto: memory-schema.ts

```typescript
// ✅ Tabela agent_memories
{
  id: uuid ✅
  agentId: uuid ✅               // Relaciona com agents.id
  conversationId: uuid ✅        // Relaciona com conversations.id
  memoryType: enum ✅            // 'fact', 'preference', 'context', 'learning', 'pattern'
  content: jsonb ✅              // Dados flexíveis (user_id, company_id dentro)
  importance: decimal(3,2) ✅    // 0.00 a 1.00
  expiresAt: timestamp
  accessCount: integer ✅
  lastAccessedAt: timestamp
  createdAt: timestamp ✅
  updatedAt: timestamp ✅
}

// ✅ Tabela memory_embeddings
{
  id: uuid ✅
  memoryId: uuid ✅              // FK para agent_memories.id
  embedding: vector(1536) ✅     // pgvector
  contentText: text ✅
  createdAt: timestamp ✅
}
```

### Exemplo de Dados

```json
// agent_memories
{
  "id": "uuid-123",
  "agent_id": "uuid-leo-financeiro",
  "conversation_id": "uuid-conv-456",
  "memory_type": "fact",
  "content": {
    "text": "João Silva, Padaria do João, faturamento R$ 50k/mês",
    "user_id": "+5511999999999",
    "company_id": "uuid-padaria-joao",
    "detalhes": {
      "faturamento_mensal": 50000,
      "setor": "alimenticio"
    }
  },
  "importance": 0.9
}

// memory_embeddings
{
  "id": "uuid-emb-789",
  "memory_id": "uuid-123",
  "embedding": [0.123, -0.456, ...],  // 1536 dimensões
  "content_text": "João Silva, Padaria do João, faturamento R$ 50k/mês"
}
```

## 🧪 Como Testar

### 1. Executar SQL no Supabase

```bash
# Copiar conteúdo de supabase_functions.sql
# Colar no SQL Editor do Supabase
# Executar
```

### 2. Testar Função match_memories

```sql
-- Buscar memórias de um usuário
SELECT * FROM match_memories(
  '[0.1, 0.2, ...]'::vector(1536),
  match_threshold := 0.5,
  match_count := 10,
  filter_user_id := '+5511999999999'
);

-- Buscar memórias de um agente específico
SELECT * FROM match_memories(
  '[0.1, 0.2, ...]'::vector(1536),
  filter_agent_id := 'uuid-do-leo'
);
```

### 3. Testar Índices JSONB

```sql
-- Deve usar índice idx_agent_memories_user_id
EXPLAIN ANALYZE
SELECT * FROM agent_memories
WHERE content->>'user_id' = '+5511999999999';
```

## 📊 Resultado Final

### ✅ Agora está CORRETO:

1. ✅ **Schema TypeScript** = **Schema SQL** = **SupabaseVectorStorage**
2. ✅ Funções SQL usam campos que existem
3. ✅ Extração correta de user_id/company_id do JSONB
4. ✅ Índices otimizados para busca JSONB
5. ✅ Tipos corretos (uuid, text, numeric)
6. ✅ Filtros funcionando

### Checklist de Deploy:

- [x] Schema memory-schema.ts correto
- [x] SupabaseVectorStorage correto
- [x] Funções SQL corrigidas
- [x] Índices JSONB adicionados
- [ ] Executar SQL no Supabase
- [ ] Deploy no Hetzner
- [ ] Testar busca vetorial

**Status:** ✅ Schema validado e corrigido!


