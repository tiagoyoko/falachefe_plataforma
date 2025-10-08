# 🔍 Diagnóstico: Integração Agentes CrewAI ↔ Envio de Mensagens

## 📊 Situação Atual (Descoberta)

Existem **DOIS CAMINHOS** para envio de mensagens, mas apenas **UM** está sendo usado:

---

## 🔄 Fluxo 1: ATUAL (Implementado)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. WhatsApp → UAZAPI Webhook                                   │
│    +55 47 9194-5151 recebe mensagem                            │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. UAZAPI envia POST para:                                     │
│    https://falachefe.app.br/api/webhook/uaz                    │
│                                                                  │
│    Payload: { message, chat, owner, token }                    │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Next.js Webhook Handler (route.ts)                          │
│    ✅ Valida usuário (MessageService)                          │
│    ✅ Salva mensagem no banco (PostgreSQL)                     │
│    ✅ Chama endpoint CrewAI:                                   │
│       POST /api/crewai/process                                  │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CrewAI Bridge (Next.js → Python)                            │
│    ✅ Spawn child process (python3)                            │
│    ✅ Executa: webhook_processor.py                            │
│    ✅ Envia inputs via stdin (JSON)                            │
│    ✅ Timeout: 60 segundos                                     │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. webhook_processor.py                                         │
│    ✅ Inicializa FalachefeCrew                                 │
│    ✅ Executa crew.orchestrated_crew()                         │
│    ✅ Retorna APENAS TEXTO via stdout                          │
│    ⚠️  NÃO USA as ferramentas SendTextMessageTool!            │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CrewAI Bridge recebe resposta                               │
│    ✅ Parse JSON do stdout                                     │
│    ✅ Retorna para webhook handler                             │
│    { success: true, response: "texto..." }                     │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Next.js Webhook Handler                                     │
│    ✅ Recebe resposta do CrewAI                                │
│    ✅ Chama sendResponseToUserWithWindowValidation()           │
│    ✅ Envia via UAZClient.sendMessageWithWindowValidation()    │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UAZClient (Next.js)                                         │
│    ✅ Valida janela de 24h                                     │
│    ✅ POST https://falachefe.uazapi.com/send/text              │
│    ✅ Headers: { "token": "UAZAPI_TOKEN" }                     │
│    ❌ PROBLEMA: Estava usando UAZ_API_KEY (variável errada!)  │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. UAZAPI → WhatsApp                                           │
│    ✅ Envia mensagem para o usuário                            │
│    📱 Usuário recebe resposta                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Fluxo 2: ORIGINAL (NÃO USADO - Mas está configurado!)

```
┌─────────────────────────────────────────────────────────────────┐
│ WhatsApp → Webhook → CrewAI                                     │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Support Agent (CrewAI)                                          │
│                                                                  │
│ Tem as FERRAMENTAS:                                             │
│ ✅ SendTextMessageTool()        ← Envia direto via UAZAPI      │
│ ✅ SendMenuMessageTool()        ← Envia menus interativos       │
│ ✅ SendMediaMessageTool()       ← Envia imagens/docs            │
│ ✅ GetChatDetailsTool()         ← Busca info do chat           │
│ ✅ UpdateLeadInfoTool()         ← Atualiza dados do lead       │
│                                                                  │
│ MAS webhook_processor.py NÃO deixa os agentes usarem!          │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ webhook_processor.py                                            │
│                                                                  │
│ Apenas retorna: str(result)                                     │
│                                                                  │
│ Os agentes PODERIAM usar as ferramentas para enviar            │
│ mensagens direto, mas o código atual apenas retorna texto!     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 PROBLEMA IDENTIFICADO

### **Erro #1: Variáveis de Ambiente**
```typescript
// ❌ ESTAVA ASSIM:
apiKey: process.env.UAZ_API_KEY || '',        // Não existe!
apiSecret: process.env.UAZ_API_SECRET || '',  // Não existe!
baseUrl: process.env.UAZ_BASE_URL || '',      // Não existe!

// ✅ CORRIGIDO PARA:
apiKey: process.env.UAZAPI_TOKEN || '',
apiSecret: process.env.UAZAPI_ADMIN_TOKEN || '',
baseUrl: process.env.UAZAPI_BASE_URL || '',
```

**Impacto:** UAZClient estava sendo inicializado com token VAZIO!

---

### **Erro #2: Dois Modelos de Integração Conflitantes**

#### **Modelo A: Agentes Enviam Direto (Configurado mas NÃO usado)**
```python
# support_agent tem as ferramentas:
tools=[
    SendTextMessageTool(),      # ← Pode enviar mensagens
    SendMenuMessageTool(),       # ← Pode enviar menus
    SendMediaMessageTool(),      # ← Pode enviar mídia
]

# MAS webhook_processor.py apenas retorna texto!
return {
    "success": True,
    "response": str(result),  # ← Apenas texto, não envia nada
}
```

#### **Modelo B: Next.js Envia (IMPLEMENTADO)**
```typescript
// Next.js recebe resposta do CrewAI
const crewaiData = await crewaiResponse.json();

// Next.js ENVIA a resposta via UAZ API
await sendResponseToUserWithWindowValidation(
    chat, 
    crewaiData.response,  // ← Texto do CrewAI
    owner, 
    token, 
    message.sender
);
```

---

## ✅ SOLUÇÃO

### **Opção 1: Manter Modelo Atual (Recomendado)**
```
CrewAI retorna texto → Next.js envia via UAZ
```

**Vantagens:**
- ✅ Controle centralizado de envio (Next.js)
- ✅ Validação de janela 24h no Next.js
- ✅ Logging unificado
- ✅ Mais fácil debugar

**Ação:**
- ✅ Já corrigimos as variáveis de ambiente
- ⏳ Aguardar deploy completar
- 🧪 Testar novamente

---

### **Opção 2: Agentes Enviam Direto**
```
CrewAI envia mensagens via ferramentas
```

**Vantagens:**
- ✅ Agentes têm controle total
- ✅ Podem enviar menus/mídias complexas
- ✅ Mais autônomo

**Desvantagens:**
- ❌ Menos controle
- ❌ Precisa configurar UAZAPI_TOKEN no Python
- ❌ Mais difícil debugar
- ❌ Validação de janela duplicada

---

## 🎯 PRÓXIMOS PASSOS

### **Imediato:**
1. ⏳ **Aguardar deploy completar** (em andamento)
2. 🧪 **Testar novamente** enviando mensagem
3. 🔍 **Verificar logs** para confirmar funcionamento

### **Se ainda não funcionar:**
1. Verificar se UAZAPI_TOKEN está correto na Vercel
2. Verificar logs do Python (stderr)
3. Testar endpoint /send/text diretamente via curl

### **Para melhorar:**
1. Decidir qual modelo usar (A ou B)
2. Remover ferramentas não utilizadas do support_agent
3. Ou implementar uso das ferramentas no webhook_processor.py

---

## 📝 Variáveis que DEVEM estar na Vercel

```bash
✅ UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
✅ UAZAPI_INSTANCE_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
✅ UAZAPI_BASE_URL="https://falachefe.uazapi.com"
✅ UAZAPI_ADMIN_TOKEN="aCOqY35qDa9NCd25XmwgOKnBbKyxymZZfStBRaHzb8NiIqqfPn"
✅ NEXT_PUBLIC_APP_URL="https://falachefe.app.br"
```

---

## 🧪 Teste Manual do Envio

Para testar se o envio está funcionando agora:

```bash
curl -X POST "https://falachefe.uazapi.com/send/text" \
  -H "token: 4fbeda58-0b8a-4905-9218-8ec89967a4a4" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "SEU_NUMERO_AQUI",
    "text": "Teste de envio direto via API"
  }'
```

Se isso funcionar, confirmamos que o token está OK e o problema era só as variáveis!

---

## 🎯 CONCLUSÃO

**O que estava errado:**
- ❌ Variáveis de ambiente com nomes incorretos (UAZ_* ao invés de UAZAPI_*)
- ❌ UAZClient sendo inicializado com token vazio
- ❌ Todas as tentativas de envio falhavam silenciosamente

**O que foi corrigido:**
- ✅ Nomes de variáveis corrigidos no código
- ✅ Webhook UAZAPI configurado com URL correta
- ✅ Deploy em andamento com correção

**Próximo passo:**
- 🔄 Aguardar deploy
- 📱 Testar enviando mensagem novamente
- 📊 Verificar logs para confirmar sucesso

