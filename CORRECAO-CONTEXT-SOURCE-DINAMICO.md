# Correção: context.source Dinâmico

## 🔍 Problema Identificado

O sistema estava usando **número de telefone dummy** (`+5500000000`) como condição para detectar se era chat web ou WhatsApp. Isso causava problemas porque:

1. ❌ Usuários **reais** têm telefones válidos no banco
2. ❌ Mas podem estar acessando pela **página web**, não pelo WhatsApp
3. ❌ O sistema enviava resposta via UAZAPI (WhatsApp) mesmo para usuários navegando no site

## 🎯 Solução Implementada

### 1. **Detecção Correta no CrewAI** (`api_server.py`)

Alterado para usar **APENAS** `context.source` (dinâmico):

```python
# ❌ ANTES (errado - baseado em telefone)
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

# ✅ DEPOIS (correto - baseado em source)
is_web_chat = context.get('source') == 'web-chat'
```

**Lógica:**
- Se `context.source == 'web-chat'` → **NÃO** enviar via UAZAPI (resposta JSON direto)
- Se `context.source == 'whatsapp'` → Enviar via UAZAPI

### 2. **Adicionar source no Webhook WhatsApp** (`router.ts`)

O webhook do WhatsApp **não estava enviando** `context.source`!

```typescript
// ✅ ADICIONADO
context: {
  source: 'whatsapp',  // Identificar origem WhatsApp
  conversationId,
  chatName: chat.name,
  senderName: message.senderName,
  isGroup: message.isGroup || false,
  messageType: classification.contentType,
  priority: classification.priority
}
```

### 3. **Chat Web já estava correto** (`/api/chat/route.ts`)

```typescript
const context = {
  source: 'web-chat',  // ✅ Já estava correto
  conversationId: conversationId || `web_${Date.now()}`,
  includeUserProfile: includeUserProfile ?? true,
  forceToolUse: forceToolUse ?? false,
  timestamp: new Date().toISOString()
};
```

## 📊 Fluxo Completo

### Chat Web:
```
Usuário digita no chat → /api/chat
  ↓
context.source = 'web-chat'
  ↓
CrewAI processa
  ↓
is_web_chat = True → NÃO envia via UAZAPI
  ↓
Retorna JSON direto para /api/chat
  ↓
Frontend exibe resposta
```

### WhatsApp:
```
Usuário manda WhatsApp → UAZAPI Webhook
  ↓
/api/webhook/uaz → MessageRouter.preparePayload
  ↓
context.source = 'whatsapp'
  ↓
CrewAI processa
  ↓
is_web_chat = False → Envia via UAZAPI
  ↓
UAZAPI entrega no WhatsApp do usuário
```

## 📁 Arquivos Alterados

1. **`crewai-projects/falachefe_crew/api_server.py`**
   - Linha 268: Removida condição de `phoneNumber`
   - Agora usa **apenas** `context.get('source') == 'web-chat'`

2. **`src/lib/message-router/router.ts`**
   - Linha 163: Adicionado `source: 'whatsapp'` no contexto
   - Garante que webhook identifica origem corretamente

3. **`src/app/api/chat/route.ts`**
   - Linha 53: Já tinha `source: 'web-chat'` ✅
   - Nenhuma alteração necessária

## ✅ Validação

- ✅ Lint passou sem erros
- ✅ Build local OK
- ⏳ Deploy para Hetzner (CrewAI)
- ⏳ Deploy para Vercel (Frontend)

## 🎯 Resultado Esperado

- ✅ Usuários no **chat web** recebem resposta na **página**
- ✅ Usuários no **WhatsApp** recebem resposta via **UAZAPI**
- ✅ Funciona independente do telefone do usuário (real ou dummy)
- ✅ Detecção baseada em **origem real** da mensagem

---

**Data:** 12/10/2025  
**Autor:** Cursor AI + Tiago Yokoyama



