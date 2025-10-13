# Configuração de Memória dos Agentes - Completa

## ✅ Status: Todos os Agentes com Memória Habilitada

### 📋 Resumo das Mudanças

Todos os 4 agentes do FalaChefe Crew agora estão configurados com memória individual e compartilhada através do Supabase Vector Storage.

**Nota**: O agente `orchestrator` foi removido do sistema. Agora usamos um classificador LLM para determinar qual especialista deve responder.

### 🤖 Agentes Configurados

#### 1. **Leo - Financial Expert**
```python
@agent
def financial_expert(self) -> Agent:
    return Agent(
        config=self.agents_config['financial_expert'],
        verbose=True,
        memory=True,  # ✅ Memória individual habilitada
        tools=[...],
        max_iter=15,
        allow_delegation=False,
    )
```

#### 2. **Max - Marketing & Sales Expert**
```python
@agent
def marketing_sales_expert(self) -> Agent:
    return Agent(
        config=self.agents_config['marketing_sales_expert'],
        verbose=True,
        memory=True,  # ✅ Memória individual habilitada
        max_iter=15,
        allow_delegation=False,
    )
```

#### 3. **Lia - HR Expert**
```python
@agent
def hr_expert(self) -> Agent:
    return Agent(
        config=self.agents_config['hr_expert'],
        verbose=True,
        memory=True,  # ✅ Memória individual habilitada
        max_iter=15,
        allow_delegation=False,
    )
```

#### 4. **Support Agent**
```python
@agent
def support_agent(self) -> Agent:
    return Agent(
        config=self.agents_config['support_agent'],
        verbose=True,
        memory=True,  # ✅ Memória individual habilitada
        tools=[...],
        max_iter=15,
        allow_delegation=False,
    )
```

### 🔧 Configuração de Crews

#### Crew Sequencial
```python
@crew
def crew(self) -> Crew:
    # Configurar storage Supabase Vector
    supabase_storage = SupabaseVectorStorage()
    
    return Crew(
        agents=self.agents,
        tasks=self.tasks,
        process=Process.sequential,
        verbose=True,
        memory=True,  # ✅ Memória do crew habilitada
        long_term_memory=LongTermMemory(
            storage=supabase_storage  # ✅ Usa Supabase Vector ao invés de SQLite
        )
    )
```

**Nota**: O crew orquestrado (hierárquico) foi removido. Agora usamos apenas o crew sequencial com classificador LLM externo.

### 🗄️ Sistema de Armazenamento

#### SupabaseVectorStorage

**Localização**: `crewai-projects/falachefe_crew/src/falachefe_crew/storage/supabase_storage.py`

**Funcionalidades**:
- ✅ **Salvar Memórias**: Método `save(value, metadata, agent)`
- ✅ **Buscar Memórias**: Método `search(query, limit, score_threshold, filter_metadata)`
- ✅ **Busca Vetorial**: Usa pgvector para similaridade semântica
- ✅ **Embeddings**: OpenAI text-embedding-3-small (1536 dimensões)
- ✅ **Fallback**: Busca por texto quando vetorial falha

**Tabelas Utilizadas**:
1. `agent_memories` - Armazena o conteúdo das memórias
2. `memory_embeddings` - Armazena os vetores para busca semântica

**Schema Correto** (conforme `memory-schema.ts`):
```typescript
agent_memories:
  - id: uuid (PK)
  - agent_id: uuid (FK -> agents.id)
  - conversation_id: uuid (opcional)
  - memory_type: enum ('fact', 'preference', 'context', 'learning', 'pattern')
  - content: jsonb
    ├── text: string
    ├── user_id: string
    ├── company_id: string
    └── metadata: object
  - importance: decimal (0.00-1.00)
  - created_at: timestamp

memory_embeddings:
  - id: uuid (PK)
  - memory_id: uuid (FK -> agent_memories.id, ON DELETE CASCADE)
  - embedding: vector(1536)
  - content_text: text
  - created_at: timestamp
```

### 🔍 Como os Agentes Usam Memória

#### Gravação Automática
Quando um agente executa uma task, o CrewAI automaticamente:
1. Extrai informações relevantes da execução
2. Chama `storage.save()` com o conteúdo
3. Gera embedding do texto
4. Armazena em `agent_memories` e `memory_embeddings`

#### Leitura Automática
Antes de executar uma nova task, o CrewAI:
1. Analisa o contexto da task
2. Chama `storage.search()` com query relevante
3. Recupera memórias similares via pgvector
4. Injeta memórias no contexto do agente

### 📊 Tipos de Memória

#### Memória Individual (Agent-level)
- Habilitada com `memory=True` no agente
- Armazena experiências específicas do agente
- Filtrada por `agent_id`

#### Memória Compartilhada (Crew-level)
- Habilitada com `memory=True` no crew
- Compartilhada entre todos os agentes do crew
- Permite colaboração e aprendizado coletivo

#### Memória de Longo Prazo
- Configurada com `LongTermMemory(storage=supabase_storage)`
- Persistente no Supabase (não SQLite local)
- Sobrevive a reinicializações
- Disponível em todas as instâncias

### 🔑 Variáveis de Ambiente Necessárias

```bash
# Supabase
SUPABASE_URL=https://zpdartuyaergbxmbmtur.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# OpenAI (para embeddings)
OPENAI_API_KEY=<openai_key>
```

### 🐛 Correções Realizadas

1. ✅ **Habilitado `memory=True` em todos os 5 agentes**
   - financial_expert
   - marketing_sales_expert
   - hr_expert
   - orchestrator
   - support_agent

2. ✅ **Corrigido lista de agentes subordinados**
   - Removido `marketing_expert()` e `sales_expert()` (não existiam)
   - Adicionado `marketing_sales_expert()` (agente unificado)

3. ✅ **Configurado SupabaseVectorStorage em ambos os crews**
   - Crew sequencial
   - Crew orquestrado (hierárquico)

4. ✅ **Alinhado schema com `memory-schema.ts`**
   - `user_id` e `company_id` dentro do JSONB `content`
   - Funções SQL RPC corrigidas para extrair do JSONB
   - Índices JSONB criados para performance

### 📝 Próximos Passos

1. **Deploy no Hetzner**
   ```bash
   ssh root@37.27.248.13
   cd /opt/falachefe-crewai
   git pull origin master
   docker compose up -d --build
   ```

2. **Testar busca vetorial**
   - Enviar mensagens via WhatsApp
   - Verificar logs dos agentes
   - Confirmar que memórias estão sendo salvas
   - Testar recuperação de memórias em conversas subsequentes

3. **Monitorar no Supabase**
   ```sql
   -- Ver memórias criadas
   SELECT * FROM agent_memories ORDER BY created_at DESC LIMIT 10;
   
   -- Ver embeddings
   SELECT * FROM memory_embeddings ORDER BY created_at DESC LIMIT 10;
   
   -- Testar busca vetorial
   SELECT * FROM match_memories(
     query_embedding := (SELECT embedding FROM memory_embeddings LIMIT 1),
     match_threshold := 0.5,
     match_count := 5
   );
   ```

### ✅ Checklist Final

- [x] Todos os agentes com `memory=True`
- [x] Crews com `memory=True` e `long_term_memory` configurado
- [x] SupabaseVectorStorage implementado corretamente
- [x] Schema do banco de dados alinhado
- [x] Funções SQL RPC corrigidas
- [x] Migrações aplicadas com sucesso
- [x] pgvector extension ativada no Supabase
- [ ] Deploy no servidor Hetzner
- [ ] Testes em produção
- [ ] Validação de busca vetorial

## 🎯 Resultado Esperado

Todos os agentes agora podem:
1. **Gravar memórias** de suas interações
2. **Recuperar memórias** relevantes automaticamente
3. **Aprender** com experiências passadas
4. **Compartilhar** conhecimento entre si (quando no mesmo crew)
5. **Persistir** informações no Supabase (centralizado e escalável)

