# Verificação: Fluxo de Mensagens → Supabase + QStash

**Data**: 13/10/2025  
**Deploy**: ✅ READY (dpl_2AMWteeBzqCpRrYiEPzGJ2f2gjwg)  
**Commit**: `03d4113` - fix: corrigir validação webhook para eventos de read receipt

---

## ✅ 1. SALVAMENTO NO SUPABASE (MessageService)

### 1.1 Fluxo Implementado

```
WhatsApp → UAZAPI Webhook → MessageService.processIncomingMessage()
```

#### Validações:
✅ Normaliza telefone (`message.sender.replace('@c.us', '')`)  
✅ Busca usuário em `user_onboarding` (últimos 9 dígitos)  
✅ Verifica subscription em `user_subscriptions`  
✅ Cria/busca conversação ativa  
✅ Salva mensagem com metadata completo

#### Dados Salvos (Tabela `messages`):
```typescript
{
  conversationId: string,
  senderId: string,          // user_id da user_onboarding
  senderType: 'user',
  content: string,            // message.text || message.content
  messageType: string,        // mapeado de message.type
  uazMessageId: string,       // message.id || message.messageid
  metadata: {
    chatId: string,
    chatName: string,
    senderName: string,
    owner: string,
    timestamp: number,
    isGroup: boolean,
    fromMe: boolean
  }
}
```

### 1.2 Tratamento de Usuários Sem Empresa

✅ Implementado em `checkPlatformUserWithoutCompany()`  
- Se usuário existe mas sem subscription ativa → Retorna mensagem padrão  
- Não salva mensagem no banco (evita dados incompletos)  
- Mensagem enviada: "Acesse falachefe.app.br e cadastre sua empresa"

---

## ✅ 2. ENFILEIRAMENTO NO QSTASH

### 2.1 Fluxo Implementado

```
MessageService → MessageRouter.route() → QStashClient.publishMessage()
```

#### Processo:
1. **Classificação**: MessageRouter classifica tipo de mensagem
2. **Destino**: Define endpoint CrewAI apropriado
3. **Payload**: Prepara dados completos para processamento

#### Payload Enviado ao QStash:
```typescript
{
  message: string,              // Texto da mensagem
  userId: string,               // user_id do user_onboarding
  phoneNumber: string,          // Telefone normalizado (sem @s.whatsapp.net)
  context: {
    source: 'whatsapp',        // ✅ Identifica origem
    conversationId: string,
    chatName: string,
    senderName: string,
    isGroup: boolean,
    messageType: string,
    priority: number
  }
}
```

### 2.2 QStash Client

**Arquivo**: `src/lib/queue/qstash-client.ts`

✅ Headers configurados corretamente:
- `Authorization: Bearer ${token}`
- `Content-Type: application/json`
- `Upstash-Forward-Upstash-Message-Id: true`
- `Upstash-Retries: ${retries}` (configurável)

✅ Endpoint: `POST https://qstash.upstash.io/v2/publish/${destination}`

✅ Retorno:
```typescript
{
  success: boolean,
  messageId?: string,    // ID único do QStash
  error?: string
}
```

---

## ⚠️ 3. VARIÁVEIS DE AMBIENTE

### 3.1 Verificação Local (.env.local)

**Encontrado**:
- ✅ `CREWAI_SERVICE_TOKEN` = e096742e-7b6d-4b6a-b987-41d533adbd50

**Faltando** (localmente):
- ⚠️ `QSTASH_TOKEN` - **OPCIONAL** (sistema funciona sem, usa fallback direto)
- ✅ `CREWAI_API_URL` - **Corrigido** para usar servidor Hetzner como fallback

### 3.2 Correção Aplicada

❌ **ANTES**: Código tentava usar `RAILWAY_WORKER_URL` (não usamos Railway)
```typescript
const baseWorkerUrl = process.env.RAILWAY_WORKER_URL || process.env.CREWAI_API_URL;
```

✅ **DEPOIS**: Usa servidor Hetzner como fallback
```typescript
const baseWorkerUrl = process.env.CREWAI_API_URL || 'http://37.27.248.13:8000';
```

### 3.3 Comportamento Atual (Após Correção)

**Fluxo de Decisão**:

1. **Tentar QStash** (se `QSTASH_TOKEN` configurado):
   - Enfileira mensagem para processamento assíncrono
   - Retorna `messageId` do QStash

2. **Fallback Direto** (se QStash não disponível):
   - Usa `CREWAI_API_URL` ou fallback `http://37.27.248.13:8000`
   - Faz chamada HTTP direta ao servidor Hetzner
   - Timeout de 5 segundos

3. **Erro Final** (se ambos falharem):
   - Envia mensagem de erro ao usuário via WhatsApp
   - Log detalhado do erro

**Resultado Atual** (pelos logs):
- ✅ QStash não configurado → Usa fallback direto
- ✅ Chamada direta ao Hetzner → **Sucesso!**
- ✅ Processamento CrewAI → Funcionando

---

## ✅ 4. FALLBACK IMPLEMENTADO

### 4.1 Tentativa Direta (sem QStash)

Se QStash falhar, código tenta processamento direto (linha 480-494):

```typescript
try {
  const directResponse = await fetch(targetEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000)  // 5s timeout
  });
  
  if (directResponse.ok) {
    console.log('✅ Direct processing succeeded');
  }
} catch (fallbackError) {
  // Envia mensagem de erro ao usuário
}
```

---

## 🔍 5. LOGS PARA DEBUG

### 5.1 Logs de Sucesso (MessageService)

```
📨 MessageService: Processing incoming message
👤 User from onboarding: { userId, userName, phoneNumber }
🏢 Company from subscription: { companyId, userId }
💬 Conversation: { id, status }
✅ Message saved: { id, conversationId }
```

### 5.2 Logs de Roteamento (Webhook)

```
📍 Message Routing: { type, destination, shouldProcess, priority }
📬 Enqueuing message to QStash for async processing...
🎯 Target: ${endpoint} (${description})
✅ Message queued successfully: { messageId, destination, contentType, userId }
```

### 5.3 Logs de Erro (QStash)

```
⚠️ QStash not configured, falling back to direct call
❌ Worker URL not configured
❌ Error queueing message to QStash: ${error}
🔄 Trying direct processing as fallback...
```

---

## 📊 6. RESUMO DA ANÁLISE

### ✅ O QUE ESTÁ FUNCIONANDO

1. **Salvamento Supabase**:
   - ✅ Busca usuário em user_onboarding
   - ✅ Valida subscription ativa
   - ✅ Cria conversação automaticamente
   - ✅ Salva mensagem com metadata completo
   - ✅ Tratamento especial para usuários sem empresa

2. **Preparação Payload**:
   - ✅ MessageRouter classifica corretamente
   - ✅ Payload estruturado com todos campos necessários
   - ✅ Context.source = 'whatsapp' identificando origem
   - ✅ phoneNumber normalizado (sem @s.whatsapp.net)

3. **Sistema de Fallback**:
   - ✅ Tentativa direta se QStash falhar
   - ✅ Mensagem de erro enviada ao usuário
   - ✅ Logs detalhados em todas etapas

### ⚠️ PONTOS DE ATENÇÃO

1. **Variáveis de Ambiente** (verificar na Vercel):
   - ❓ `QSTASH_TOKEN` - Necessário para enfileiramento
   - ❓ `RAILWAY_WORKER_URL` ou `CREWAI_API_URL` - URL do worker
   
2. **Endpoint CrewAI**:
   - Atualmente usa: `${baseWorkerUrl}${routing.destination.endpoint}`
   - Exemplo: `http://37.27.248.13:8000/process`

3. **Timeout**:
   - QStash: Sem timeout explícito (usa padrão do serviço)
   - Fallback: 5 segundos
   - Webhook completo: 120 segundos (maxDuration)

---

## 🎯 7. PRÓXIMOS PASSOS

### 7.1 Verificar Variáveis no Vercel

1. Acessar: https://vercel.com/tiago-6739s-projects/falachefe/settings/environment-variables
2. Confirmar se existem:
   - `QSTASH_TOKEN`
   - `RAILWAY_WORKER_URL` ou `CREWAI_API_URL`

### 7.2 Testar Fluxo Completo

1. Enviar mensagem via WhatsApp
2. Verificar logs no Vercel:
   - Console → Deployments → Latest → Functions
3. Confirmar se mensagem:
   - ✅ Foi salva no Supabase (tabela messages)
   - ✅ Foi enfileirada no QStash (ou processada direto)
   - ✅ Gerou resposta do CrewAI

### 7.3 Monitorar Erros

**Logs Críticos**:
- `❌ Worker URL not configured` → Falta variável de ambiente
- `⚠️ QStash not configured` → Usando fallback direto
- `❌ Error queueing message to QStash` → Problema no enfileiramento

---

## 📝 CONCLUSÃO

**Status Geral**: ✅ **IMPLEMENTAÇÃO CORRETA**

O código está corretamente implementado para:
1. Salvar mensagens no Supabase com metadata completo
2. Enfileirar via QStash com payload estruturado
3. Fallback para chamada direta se QStash falhar
4. Tratamento especial para usuários sem empresa

**Pendência**: Verificar variáveis de ambiente `QSTASH_TOKEN` e `RAILWAY_WORKER_URL` no painel da Vercel.

