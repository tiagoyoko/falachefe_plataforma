# 🎯 Decisão: Tabelas de Memória - O que será usado?

## ❌ Problema Encontrado

Havia **CONFLITO** entre 2 schemas diferentes:

```
src/lib/
├── schema/memory.ts         ❌ ANTIGO (removido)
└── memory-schema.ts         ✅ ATUAL (mantido)
```

### Schema Antigo (REMOVIDO)
```typescript
// src/lib/schema/memory.ts - ❌ DELETADO

export const agentMemories = pgTable('agent_memories', {
  userId: varchar(100),        // ❌ Campo errado
  memoryKey: varchar(255),     // ❌ Campo extra
  memoryValue: jsonb,          // ❌ Nome errado
  // SEM agent_id
  // SEM relações
})
```

**Motivo da remoção:**
- ❌ Não estava sendo usado no código
- ❌ Conflitava com memory-schema.ts
- ❌ Campos incompatíveis com sistema de agentes
- ❌ Sem suporte a múltiplos agentes

---

## ✅ Schema Atual (MANTIDO e SERÁ USADO)

### 1. `agent_memories` - Memórias Individuais

```typescript
// src/lib/memory-schema.ts

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey(),
  agentId: uuid("agent_id")                    // ← Qual agente criou
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  conversationId: uuid("conversation_id")      // ← Conversa relacionada
    .references(() => conversations.id),
  memoryType: memoryTypeEnum("memory_type")    // ← Tipo estruturado
    .notNull(),
  content: jsonb("content").notNull(),         // ← Conteúdo flexível
  importance: decimal("importance", { precision: 3, scale: 2 })
    .default("0.5"),
  expiresAt: timestamp("expires_at"),          // ← Memórias podem expirar
  accessCount: integer("access_count")         // ← Tracking de uso
    .default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
})
```

**Tipos de memória (memoryType):**
- `fact` - Fatos objetivos
- `preference` - Preferências do usuário
- `context` - Contexto situacional
- `learning` - Aprendizados
- `pattern` - Padrões identificados

**Exemplo de uso:**
```json
{
  "agent_id": "uuid-do-leo",
  "memory_type": "fact",
  "content": {
    "text": "João Silva, Padaria do João, faturamento R$ 50k/mês",
    "user_id": "+5511999999999",
    "empresa": "Padaria do João",
    "faturamento": 50000
  },
  "importance": 0.9
}
```

### 2. `shared_memories` - Memórias Compartilhadas

```typescript
export const sharedMemories = pgTable("shared_memories", {
  id: uuid("id").primaryKey(),
  companyId: uuid("company_id")                // ← Por empresa
    .references(() => companies.id)
    .notNull(),
  memoryType: sharedMemoryTypeEnum,            // ← Tipo compartilhado
  content: jsonb("content").notNull(),
  accessLevel: accessLevelEnum                 // ← Controle acesso
    .default("public"),
  tags: text("tags").array().default([]),      // ← Tags para busca
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by")                // ← Quem criou
    .references(() => agents.id),
  lastUpdatedBy: uuid("last_updated_by"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
})
```

**Tipos compartilhados:**
- `company_policy` - Políticas da empresa
- `user_preference` - Preferências gerais
- `business_rule` - Regras de negócio
- `integration_config` - Configs de integração
- `common_knowledge` - Conhecimento comum

**Exemplo:**
```json
{
  "company_id": "uuid-padaria-joao",
  "memory_type": "company_policy",
  "content": {
    "politica": "Descontos acima de 10% precisam aprovação do dono",
    "aplicavel_a": ["vendas", "atendimento"]
  },
  "tags": ["vendas", "desconto", "aprovacao"],
  "access_level": "public",
  "created_by": "uuid-do-max"
}
```

**Fluxo:**
```
1. Max cria política de desconto → shared_memories
2. Leo acessa → Sabe da política ao falar de precificação
3. Lia acessa → Sabe da política ao treinar vendedor
```

### 3. `conversation_contexts` - Contexto das Conversas

```typescript
export const conversationContexts = pgTable("conversation_contexts", {
  id: uuid("id").primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  contextType: contextTypeEnum("context_type")  // ← Tipo de contexto
    .notNull(),
  data: jsonb("data").notNull(),               // ← Dados do contexto
  version: integer("version").default(1),      // ← Versionamento
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
})
```

**Tipos de contexto:**
- `business` - Contexto de negócios
- `technical` - Contexto técnico
- `financial` - Contexto financeiro
- `support` - Contexto de suporte

### 4. `agent_learnings` - Aprendizados dos Agentes

```typescript
export const agentLearnings = pgTable("agent_learnings", {
  id: uuid("id").primaryKey(),
  agentId: uuid("agent_id")
    .references(() => agents.id)
    .notNull(),
  learningType: learningTypeEnum               // ← Tipo de aprendizado
    .notNull(),
  pattern: jsonb("pattern").notNull(),         // ← Padrão aprendido
  confidence: decimal("confidence")            // ← Confiança (0.00-1.00)
    .default("0.5"),
  successRate: decimal("success_rate")         // ← Taxa de sucesso
    .default("0.0"),
  usageCount: integer("usage_count")           // ← Quantas vezes usado
    .default(0),
  isValidated: boolean("is_validated")         // ← Validado por humano?
    .default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
})
```

**Tipos de learning:**
- `user_pattern` - Padrão de comportamento
- `optimization` - Otimizações
- `failure_recovery` - Recuperação de falhas

**Exemplo:**
```json
{
  "agent_id": "uuid-do-leo",
  "learning_type": "user_pattern",
  "pattern": {
    "condicao": "Quando usuário diz 'caixa apertado'",
    "acao": "Sempre sugerir análise de custos fixos primeiro",
    "contexto": "financeiro"
  },
  "confidence": 0.85,
  "success_rate": 0.92,
  "usage_count": 47,
  "is_validated": true
}
```

---

## 🔧 SupabaseVectorStorage Atualizado

```python
# Agora usa campos CORRETOS de memory-schema.ts

def save(self, value, metadata, agent):
    memory_data = {
        'agent_id': meta.get('agent_uuid'),      # ✅ UUID do agente
        'conversation_id': meta.get('conversation_id'),  # ✅ UUID conversa
        'memory_type': meta.get('memory_type', 'learning'),  # ✅ Enum
        'content': {
            'text': content_text,
            'user_id': meta.get('user_id'),      # ✅ Dentro do content
            'company_id': meta.get('company_id'),
            'metadata': meta
        },
        'importance': meta.get('importance', 0.5)  # ✅ Decimal
    }
```

---

## 📊 Como Serão Usadas

### Cenário Real: João da Padaria

```
1️⃣ Primeira Interação
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 João: "Meu nome é João Silva, tenho a Padaria do João"

💾 agent_memories:
{
  "agent_id": "orchestrator-uuid",
  "memory_type": "fact",
  "content": {
    "text": "João Silva, Padaria do João",
    "user_name": "João Silva",
    "empresa": "Padaria do João"
  }
}

💾 shared_memories:
{
  "company_id": "padaria-joao-uuid",
  "memory_type": "business_rule",
  "content": {
    "contexto": "Sempre usar exemplos de padaria"
  },
  "tags": ["padaria", "contextualizacao"]
}


2️⃣ Segunda Interação (com Leo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 João: "Como melhorar meu caixa?"

🔍 Leo busca:
- agent_memories WHERE user_id = "+5511999999999"
  → Encontra: "João Silva, Padaria do João"
  
- shared_memories WHERE company_id = "padaria-joao-uuid"
  → Encontra: "Usar exemplos de padaria"

💬 Leo responde:
"João, para a Padaria do João, sugiro:
1. Revisar margem do pão francês (produto âncora)
2. Analisar custos de farinha e energia
3. Avaliar horário de pico para otimizar produção"

💾 agent_learnings:
{
  "agent_id": "leo-uuid",
  "learning_type": "user_pattern",
  "pattern": {
    "usuario_tipo": "padaria",
    "resposta_efetiva": "usar_exemplos_setor"
  },
  "confidence": 0.7,
  "usage_count": 1
}


3️⃣ Terceira Interação (com Max)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 João: "Como divulgar mais?"

🔍 Max busca:
- agent_memories → Sabe que é João da Padaria
- shared_memories → Sabe para usar exemplos de padaria
- agent_learnings (de Leo) → Aprende padrão de contextualização

💬 Max responde:
"João, para divulgar a Padaria do João:
1. Instagram com fotos do pão quentinho saindo do forno
2. Promoção café da manhã (combo pão + café)
3. Parceria com empresas locais para café corporativo"


4️⃣ Learning em Ação
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Após 10 interações bem-sucedidas:

💾 agent_learnings (atualizado):
{
  "agent_id": "max-uuid",
  "learning_type": "user_pattern",
  "pattern": {
    "setor": "padaria",
    "estrategia_efetiva": "visual_produto_fresco + combos + b2b"
  },
  "confidence": 0.95,
  "success_rate": 0.9,
  "usage_count": 10,
  "is_validated": true  ← Validado!
}
```

---

## ✅ Conclusão

### Tabelas REMOVIDAS:
- ❌ `src/lib/schema/memory.ts` (todas as 4 tabelas antigas)

### Tabelas que SERÃO USADAS:
1. ✅ **agent_memories** - Memórias individuais dos agentes
2. ✅ **shared_memories** - Compartilhadas entre agentes
3. ✅ **conversation_contexts** - Contexto das conversas
4. ✅ **agent_learnings** - Padrões aprendidos

### Benefícios:
- 🎯 **Compartilhamento**: Leo, Max e Lia compartilham conhecimento
- 🧠 **Aprendizado**: Sistema fica mais inteligente com o tempo
- 📊 **Tracking**: Sabe quais memórias são mais úteis
- 🏢 **Políticas**: Empresas definem regras globais
- 🔍 **Busca Vetorial**: pgvector + embeddings otimizados

---

## 🚀 Próximos Passos

1. ✅ Schema consolidado em `memory-schema.ts`
2. ✅ SupabaseVectorStorage corrigido
3. ⏳ Executar funções SQL no Supabase
4. ⏳ Deploy no Hetzner
5. ⏳ Testar sistema de memória completo


