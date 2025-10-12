# Salvar Mensagens do Agente no Supabase

**Data:** 12/10/2025  
**Status:** ✅ Implementado

---

## 🎯 Problema Identificado

As mensagens estavam sendo registradas de forma incompleta:
- ✅ Mensagens do **usuário**: Salvando no banco
- ❌ Mensagens do **agente**: **NÃO** estavam sendo salvas

---

## 📊 Fluxo Atual (ANTES da correção)

```
1. Usuário envia mensagem via WhatsApp
   ↓
2. Webhook /api/webhook/uaz recebe
   ↓
3. MessageService.processMessage() → ✅ Salva mensagem do usuário
   ↓
4. Envia para CrewAI via QStash
   ↓
5. CrewAI processa e gera resposta
   ↓
6. CrewAI envia resposta via UAZAPI → ❌ NÃO salva no banco
```

---

## ✅ Solução Implementada

### 1. Função `save_agent_message()` em `api_server.py`

```python
def save_agent_message(
    conversation_id: str,
    agent_id: str,
    content: str,
    metadata: dict = None
) -> bool:
    """
    Salva mensagem do agente no Supabase
    """
    # POST para /rest/v1/messages com:
    payload = {
        "conversation_id": conversation_id,
        "sender_id": agent_id,           # Ex: 'financial_expert', 'crewai'
        "sender_type": "agent",
        "content": content,               # Resposta do agente
        "message_type": "text",
        "status": "delivered",
        "metadata": metadata,
        "sent_at": datetime.now().isoformat(),
        "delivered_at": datetime.now().isoformat()
    }
```

### 2. Chamada após CrewAI processar

```python
# Após obter resposta do CrewAI
response_text = str(result)

# Salvar mensagem do agente
save_agent_message(
    conversation_id=context.get('conversationId'),
    agent_id=specialist_type,  # 'financial_expert', 'marketing_expert', etc
    content=response_text,
    metadata={
        "specialist_type": agent_id,
        "processing_time_ms": processing_time,
        "classification": classification['type'],
        "source": "whatsapp",
        "timestamp": datetime.now().isoformat()
    }
)
```

---

## 🔄 Fluxo Corrigido (DEPOIS)

```
1. Usuário envia mensagem via WhatsApp
   ↓
2. Webhook /api/webhook/uaz recebe
   ↓
3. MessageService.processMessage() → ✅ Salva mensagem do usuário
   ↓
4. Envia para CrewAI via QStash
   ↓
5. CrewAI processa e gera resposta
   ↓
6. save_agent_message() → ✅ Salva resposta no banco
   ↓
7. CrewAI envia resposta via UAZAPI
```

---

## 📦 Tabela `messages` no Supabase

Estrutura:
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id TEXT NOT NULL,           -- user_id OU agent_id
    sender_type TEXT NOT NULL,         -- 'user' | 'agent' | 'system'
    content TEXT NOT NULL,
    message_type TEXT NOT NULL,
    uaz_message_id TEXT,
    status TEXT,
    metadata JSONB,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);
```

### Exemplo de registro (Mensagem do Agente):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "abc-123-def",
  "sender_id": "financial_expert",
  "sender_type": "agent",
  "content": "✅ Transação registrada com sucesso...",
  "message_type": "text",
  "status": "delivered",
  "metadata": {
    "specialist_type": "financial_expert",
    "processing_time_ms": 15000,
    "classification": "financial_task",
    "source": "whatsapp"
  },
  "sent_at": "2025-10-12T22:00:00Z",
  "delivered_at": "2025-10-12T22:00:00Z"
}
```

---

## 🧪 Validação

### 1. Verificar no Supabase:

```sql
-- Ver todas mensagens de uma conversa
SELECT 
    sender_type,
    sender_id,
    content,
    sent_at,
    metadata->>'specialist_type' as specialist
FROM messages
WHERE conversation_id = 'abc-123'
ORDER BY sent_at DESC;
```

### 2. Verificar histórico completo:

```sql
-- Ver mensagens do usuário E do agente
SELECT 
    sender_type,
    LEFT(content, 50) as preview,
    sent_at
FROM messages
WHERE conversation_id = 'abc-123'
ORDER BY sent_at ASC;
```

Esperado:
```
sender_type | preview                           | sent_at
------------|-----------------------------------|----------
user        | Adicionar 50 mil reais no fluxo  | 22:00:00
agent       | ✅ Transação registrada com suces... | 22:00:15
```

---

## ✅ Benefícios

1. ✅ **Histórico completo** - Todas mensagens registradas
2. ✅ **Auditoria** - Rastreabilidade de conversas
3. ✅ **Analytics** - Análise de performance dos agentes
4. ✅ **Debug** - Fácil verificar o que o agente respondeu
5. ✅ **Treinamento** - Dados para melhorar os agentes

---

## 📋 Deploy

1. ✅ Função `save_agent_message()` criada
2. ✅ Chamada adicionada após CrewAI processar
3. [ ] Deploy para Hetzner
4. [ ] Testar com mensagem real
5. [ ] Validar no Supabase

---

**Status:** Código implementado, aguardando deploy! 🚀

