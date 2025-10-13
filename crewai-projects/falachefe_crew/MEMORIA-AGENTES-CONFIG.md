# 🧠 Configuração de Memória dos Agentes CrewAI

## Status Atual: ✅ MEMÓRIA HABILITADA

### Alterações Realizadas

```python
# crew.py - Linhas 254-268
@crew
def crew(self) -> Crew:
    return Crew(
        agents=self.agents,
        tasks=self.tasks,
        process=Process.sequential,
        verbose=True,
        memory=True,  # ✅ Habilitada memória de longo prazo
    )

# crew.py - Linhas 301-310
def orchestrated_crew(self) -> Crew:
    return Crew(
        agents=subordinate_agents,
        tasks=orchestration_tasks,
        process=Process.hierarchical,
        manager_agent=self.orchestrator(),
        verbose=True,
        memory=True,  # ✅ Habilitada memória de longo prazo
    )
```

---

## 📚 Tipos de Memória CrewAI

Ao habilitar `memory=True`, o CrewAI ativa **3 tipos de memória**:

### 1. **Short-Term Memory** (Memória de Curto Prazo)
- Contexto da conversa atual
- Lembranças da sessão em andamento
- Informações temporárias

### 2. **Long-Term Memory** (Memória de Longo Prazo)
- Informações persistentes entre execuções
- Armazenada em **SQLite** por padrão
- Learnings e insights acumulados

### 3. **Entity Memory** (Memória de Entidades)
- Conhecimento sobre pessoas, empresas, produtos
- Relacionamentos entre entidades
- Fatos específicos sobre cada entidade

---

## 💾 Armazenamento de Memória

### Padrão: SQLite Local

Por padrão, o CrewAI armazena memórias em:
```
./storage/memory.db
```

### Configurar Path Customizado

```python
import os
from crewai import Crew
from crewai.memory import LongTermMemory
from crewai.memory.storage.ltm_sqlite_storage import LTMSQLiteStorage

# Definir diretório customizado
custom_storage_path = "./crewai_storage"
os.makedirs(custom_storage_path, exist_ok=True)

crew = Crew(
    agents=[...],
    tasks=[...],
    memory=True,
    long_term_memory=LongTermMemory(
        storage=LTMSQLiteStorage(
            db_path=f"{custom_storage_path}/memory.db"
        )
    )
)
```

### Via Variável de Ambiente

```bash
export CREWAI_STORAGE_DIR="./crewai_storage"
```

```python
import os
from crewai import Crew

# Usar variável de ambiente
os.environ["CREWAI_STORAGE_DIR"] = "./crewai_storage"

crew = Crew(
    agents=[...],
    tasks=[...],
    memory=True
)
```

---

## 🔧 Configuração de Embeddings

### OpenAI (Padrão)

```python
crew = Crew(
    memory=True,
    embedder={
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small"  # ou "text-embedding-3-large"
        }
    }
)
```

### Ollama (Local)

```bash
# Instalar Ollama e baixar modelo
ollama pull mxbai-embed-large
```

```python
crew = Crew(
    memory=True,
    embedder={
        "provider": "ollama",
        "config": {
            "model": "mxbai-embed-large",
            "url": "http://localhost:11434/api/embeddings"
        }
    }
)
```

### Vertex AI (Google Cloud)

```python
crew = Crew(
    memory=True,
    embedder={
        "provider": "vertexai",
        "config": {
            "project_id": "your-gcp-project-id",
            "region": "us-central1",
            "api_key": "your-service-account-key",
            "model_name": "textembedding-gecko"
        }
    }
)
```

---

## 🔄 Memória por Agente

Cada agente pode ter memória individual:

```python
from crewai import Agent

analyst = Agent(
    role="Analista Financeiro",
    goal="Analisar e lembrar padrões financeiros",
    memory=True,  # ✅ Memória habilitada para este agente
    verbose=True
)
```

---

## 🗑️ Resetar Memórias (Debugging)

### Resetar Todas

```python
from crewai import Crew

crew = Crew(agents=[...], tasks=[...], memory=True)

# Resetar todas as memórias
crew.reset_memories()
```

### Resetar Memórias Específicas

```python
# Memória de curto prazo
crew.reset_memories(command_type='short')

# Memória de longo prazo
crew.reset_memories(command_type='long')

# Memória de entidades
crew.reset_memories(command_type='entity')

# Base de conhecimento
crew.reset_memories(command_type='knowledge')
```

---

## 📊 Integração com Supabase (Futuro)

### Tabela Existente no Banco

```typescript
// src/lib/schema/memory.ts
export const agentMemories = pgTable('agent_memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  agent_id: varchar('agent_id', { length: 255 }).notNull(),
  user_id: varchar('user_id', { length: 255 }),
  company_id: varchar('company_id', { length: 255 }),
  memory_type: varchar('memory_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
```

### Implementação Customizada (Opcional)

```python
from crewai.memory.storage.interface import Storage
from supabase import create_client

class SupabaseMemoryStorage(Storage):
    def __init__(self, supabase_url: str, supabase_key: str):
        self.client = create_client(supabase_url, supabase_key)
    
    def save(self, value, metadata=None, agent=None):
        self.client.table('agent_memories').insert({
            'agent_id': agent,
            'content': value,
            'metadata': metadata,
            'memory_type': 'long_term'
        }).execute()
    
    def search(self, query, limit=10, score_threshold=0.5):
        result = self.client.table('agent_memories')\
            .select('*')\
            .ilike('content', f'%{query}%')\
            .limit(limit)\
            .execute()
        return result.data
    
    def reset(self):
        self.client.table('agent_memories').delete().neq('id', '0').execute()
```

---

## 🚀 Próximos Passos

### 1. Deploy da Memória
```bash
# No servidor Hetzner
cd /opt/falachefe-crewai
docker compose down
docker compose build
docker compose up -d
```

### 2. Testar Memória

```bash
# Teste 1: Primeira interação
curl -X POST http://37.27.248.13:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Meu nome é João e minha empresa é Padaria do João",
    "user_id": "test_user_123",
    "phone_number": "+5511999999999"
  }'

# Teste 2: Segunda interação (deve lembrar)
curl -X POST http://37.27.248.13:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Qual é o nome da minha empresa?",
    "user_id": "test_user_123",
    "phone_number": "+5511999999999"
  }'
```

### 3. Verificar Armazenamento

```bash
# Acessar servidor
ssh root@37.27.248.13

# Verificar banco de memória
cd /opt/falachefe-crewai
ls -lah ./storage/memory.db

# Ver tamanho
du -h ./storage/memory.db
```

### 4. Monitorar Logs

```bash
# Ver logs do CrewAI
docker logs -f falachefe-crewai-api --tail 100

# Filtrar logs de memória
docker logs falachefe-crewai-api 2>&1 | grep -i memory
```

---

## 📈 Benefícios da Memória Habilitada

### Para Usuários
- ✅ Agentes lembram conversas anteriores
- ✅ Não precisa repetir informações (nome, empresa, contexto)
- ✅ Respostas mais personalizadas e contextualizadas
- ✅ Continuidade natural nas conversas

### Para Agentes
- ✅ **Leo (Financeiro)**: Lembra histórico de fluxo de caixa
- ✅ **Max (Marketing/Vendas)**: Lembra estratégias discutidas
- ✅ **Lia (RH)**: Lembra sobre equipe e problemas anteriores
- ✅ **Orchestrator**: Lembra preferências de roteamento

### Para o Sistema
- ✅ Melhora performance ao longo do tempo
- ✅ Reduz tokens repetitivos
- ✅ Aprende padrões de uso
- ✅ Oferece experiência mais inteligente

---

## ⚠️ Considerações Importantes

### Privacidade
- Memórias são persistentes
- Armazenadas localmente no servidor
- Não compartilhadas entre usuários diferentes
- Podem ser resetadas quando necessário

### Performance
- Queries de memória usam embeddings
- Requer modelo de embedding configurado (OpenAI por padrão)
- Consome tokens para embeddings
- Armazenamento SQLite é eficiente

### Manutenção
- Backup regular do `memory.db`
- Limpeza periódica se necessário
- Monitoramento de tamanho do banco
- Logs de operações de memória

---

## 📝 Changelog

### 2025-01-13
- ✅ Habilitada `memory=True` no crew padrão
- ✅ Habilitada `memory=True` no orchestrated_crew
- ✅ Documentação completa criada
- 🔄 Aguardando deploy no Hetzner

### Próximas Melhorias
- [ ] Integrar com tabela `agent_memories` do Supabase
- [ ] Implementar limpeza automática de memórias antigas
- [ ] Dashboard de visualização de memórias
- [ ] Backup automático do banco SQLite
- [ ] Métricas de uso de memória

---

## 🔗 Referências

- [CrewAI Memory Docs](https://docs.crewai.com/en/concepts/memory)
- [CrewAI GitHub](https://github.com/crewaiinc/crewai)
- [SQLite Storage](https://docs.crewai.com/en/concepts/memory#custom-storage)
- [Embeddings Config](https://docs.crewai.com/en/concepts/memory#embedding-configuration)


