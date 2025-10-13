# 📊 Tabelas de Memória do Sistema - Explicação Completa

## 🔍 Visão Geral

O projeto FalaChefe tem **DUAS arquiteturas de memória** definidas em arquivos diferentes:

```
src/lib/
├── schema/memory.ts          ← Schema SIMPLES (4 tabelas)
└── memory-schema.ts           ← Schema COMPLETO (4 tabelas + relações)
```

Vou explicar **todas as tabelas** e suas funções.

---

## 📁 Schema 1: memory.ts (Sistema Simples)

### 1. `agent_memories` 
**Propósito:** Armazenar memórias individuais dos agentes

```typescript
{
  id: uuid,
  userId: varchar(100),           // Usuário dono da memória
  conversationId: varchar(100),   // Conversa relacionada
  category: varchar(50),          // Tipo: conversation, user_profile, business, etc
  memoryKey: varchar(255),        // Chave identificadora (ex: "user_name")
  memoryValue: jsonb,             // Valor da memória (flexível)
  importanceScore: real,          // 0.0 a 1.0 - quão importante é
  ttlSeconds: integer,            // Tempo de vida (opcional)
  createdAt: timestamp,
  updatedAt: timestamp,
  expiresAt: timestamp            // Quando expira (se TTL definido)
}
```

**Exemplo de uso:**
```json
{
  "userId": "+5511999999999",
  "category": "user_profile",
  "memoryKey": "user_name",
  "memoryValue": { "name": "João Silva", "empresa": "Padaria do João" },
  "importanceScore": 0.9
}
```

### 2. `conversation_contexts`
**Propósito:** Contexto geral de cada conversa

```typescript
{
  id: uuid,
  conversationId: varchar(100),   // ID único da conversa
  userId: varchar(100),
  contextData: jsonb,             // Dados de contexto (tópico, status, etc)
  messageCount: integer,          // Quantas mensagens
  lastActivity: timestamp,
  createdAt: timestamp
}
```

**Uso:** Rastrear estado da conversa (em andamento, pausada, finalizada)

### 3. `user_memory_profiles`
**Propósito:** Perfil consolidado do usuário

```typescript
{
  id: uuid,
  userId: varchar(100),
  profileData: jsonb,             // Dados gerais do usuário
  preferences: jsonb,             // Preferências (horário, canal, etc)
  businessContext: jsonb,         // Contexto do negócio
  lastUpdated: timestamp,
  createdAt: timestamp
}
```

**Exemplo:**
```json
{
  "userId": "+5511999999999",
  "profileData": {
    "name": "João Silva",
    "empresa": "Padaria do João",
    "segmento": "Food & Beverage"
  },
  "preferences": {
    "horario_preferido": "manhã",
    "canal_preferido": "whatsapp"
  },
  "businessContext": {
    "faturamento_mensal": 50000,
    "funcionarios": 5
  }
}
```

### 4. `memory_embeddings`
**Propósito:** Vetores para busca semântica

```typescript
{
  id: uuid,
  memoryId: uuid,                 // Referência para agent_memories
  embedding: vector(1536),        // Vetor OpenAI embedding
  contentText: text,              // Texto usado para gerar embedding
  createdAt: timestamp
}
```

**Uso:** Permite busca por similaridade (ex: "empresa de padaria" encontra "Padaria do João")

---

## 📁 Schema 2: memory-schema.ts (Sistema Avançado)

### 1. `agent_memories` (versão avançada)
**Propósito:** Memórias com relacionamentos e tracking

```typescript
{
  id: uuid,
  agentId: uuid,                  // Qual agente criou (Leo, Max, Lia)
  conversationId: uuid,           // Conversa relacionada
  memoryType: enum,               // 'fact', 'preference', 'context', 'learning', 'pattern'
  content: jsonb,                 // Conteúdo da memória
  importance: decimal(3,2),       // 0.00 a 1.00
  expiresAt: timestamp,
  accessCount: integer,           // Quantas vezes foi acessada
  lastAccessedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Tipos de memória:**
- `fact`: Fatos objetivos ("Empresa fatura R$ 50k/mês")
- `preference`: Preferências ("Usuário prefere manhã")
- `context`: Contexto situacional ("Está em dificuldade financeira")
- `learning`: Aprendizado ("Usuário responde melhor com exemplos")
- `pattern`: Padrões ("Sempre pergunta sobre impostos")

### 2. `shared_memories`
**Propósito:** Memórias compartilhadas entre agentes da mesma empresa

```typescript
{
  id: uuid,
  companyId: uuid,                // Empresa dona da memória
  memoryType: enum,               // 'company_policy', 'user_preference', 'business_rule', etc
  content: jsonb,
  accessLevel: enum,              // 'public', 'restricted', 'private'
  tags: text[],                   // ['financeiro', 'RH', 'vendas']
  isActive: boolean,
  createdBy: uuid,                // Agente criador
  lastUpdatedBy: uuid,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Exemplo:**
```json
{
  "companyId": "empresa-123",
  "memoryType": "company_policy",
  "content": {
    "politica": "Descontos acima de 10% precisam aprovação",
    "setor": "vendas"
  },
  "tags": ["vendas", "politica", "descontos"],
  "accessLevel": "public"
}
```

**Uso:** Todos os agentes (Leo, Max, Lia) podem acessar e usar essas políticas

### 3. `conversation_contexts` (versão avançada)
**Propósito:** Contexto tipado das conversas

```typescript
{
  id: uuid,
  conversationId: uuid,
  contextType: enum,              // 'business', 'technical', 'financial', 'support'
  data: jsonb,
  version: integer,               // Versionamento do contexto
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. `agent_learnings`
**Propósito:** Padrões aprendidos pelos agentes

```typescript
{
  id: uuid,
  agentId: uuid,
  learningType: enum,             // 'user_pattern', 'optimization', 'failure_recovery'
  pattern: jsonb,                 // Padrão identificado
  confidence: decimal(3,2),       // Confiança no padrão (0.00 a 1.00)
  successRate: decimal(3,2),      // Taxa de sucesso ao aplicar
  usageCount: integer,            // Quantas vezes foi usado
  isValidated: boolean,           // Se foi validado por humano
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Exemplo:**
```json
{
  "agentId": "leo-financeiro",
  "learningType": "user_pattern",
  "pattern": {
    "regra": "Quando usuário menciona 'caixa apertado', sempre sugerir análise de custos fixos primeiro",
    "contexto": "financeiro"
  },
  "confidence": 0.85,
  "successRate": 0.92,
  "usageCount": 47,
  "isValidated": true
}
```

---

## 🤔 Qual Schema Usar?

### Use `schema/memory.ts` (SIMPLES) se:
- ✅ Quer implementação rápida
- ✅ Memória por usuário é suficiente
- ✅ Busca vetorial básica
- ✅ Perfis simples

### Use `memory-schema.ts` (AVANÇADO) se:
- ✅ Precisa compartilhar memórias entre agentes
- ✅ Quer tracking de uso (accessCount)
- ✅ Precisa de learnings/padrões
- ✅ Múltiplos agentes na mesma empresa
- ✅ Versionamento de contexto

---

## 🎯 Recomendação para FalaChefe

**Usar `memory-schema.ts` (AVANÇADO)** porque:

1. **Compartilhamento:** Leo, Max e Lia devem compartilhar conhecimento sobre o cliente
2. **Learnings:** Agentes aprendem padrões ao longo do tempo
3. **Tracking:** Saber quais memórias são mais acessadas
4. **Políticas:** Empresas têm regras que todos agentes devem seguir

### Exemplo Prático:

```
📞 Usuário: "Meu nome é João, Padaria do João"

💾 agent_memories:
{
  agentId: "orchestrator",
  memoryType: "fact",
  content: { "user_name": "João", "company": "Padaria do João" }
}

💾 shared_memories:
{
  companyId: "padaria-joao-id",
  memoryType: "business_rule",
  content: { "regra": "Sempre usar exemplos de padaria nas respostas" },
  tags: ["contextualizacao"]
}

📞 Usuário (próxima conversa): "Como melhorar minhas vendas?"

🤖 Max acessa:
- agent_memories → Sabe que é João da Padaria
- shared_memories → Usa exemplos de padaria
- agent_learnings → Aplica padrões aprendidos

💬 Resposta:
"João, para a Padaria do João, sugiro:
1. Promoção café da manhã (combo pão + café)
2. Programa de fidelidade (10 compras = 1 grátis)
..."
```

---

## 🔄 Integração com CrewAI

O `SupabaseVectorStorage` que criamos usa **ambos os schemas**:

```python
class SupabaseVectorStorage:
    def save(self, value, metadata, agent):
        # Salvar em agent_memories (memory-schema.ts)
        self.client.table('agent_memories').insert({
            'agent_id': agent,
            'memory_type': 'learning',
            'content': value,
            ...
        })
        
        # Gerar embedding e salvar (schema/memory.ts)
        embedding = self._generate_embedding(value)
        self.client.table('memory_embeddings').insert({
            'embedding': embedding,
            ...
        })
```

---

## ✅ Conclusão

**Resposta à sua pergunta:** "Para que serve a tabela memory?"

**Não existe UMA tabela `memory`**. Existem **8 tabelas** relacionadas a memória:

### Esquema Simples (4 tabelas):
1. ✅ `agent_memories` - Memórias dos agentes
2. ✅ `memory_embeddings` - Vetores para busca
3. ✅ `user_memory_profiles` - Perfis de usuário
4. ✅ `conversation_contexts` - Contexto de conversas

### Esquema Avançado (4 tabelas):
5. ✅ `agent_memories` (versão avançada) - Com tracking
6. ✅ `shared_memories` - Compartilhadas entre agentes
7. ✅ `conversation_contexts` (versão avançada) - Tipado
8. ✅ `agent_learnings` - Padrões aprendidos

**Todas trabalham juntas** para criar um sistema de memória inteligente e contextual! 🧠


