# 🐛 Problema: Fetch Não Completa - Investigação

**Data**: 17/10/2025 12:15  
**Status**: 🔴 EM INVESTIGAÇÃO

---

## 🔍 Observações dos Logs

### ✅ O Que Funciona
1. Webhook recebe mensagem ✅
2. Salva no banco ✅
3. Passa por todos os DEBUGs (1-12) ✅
4. Inicia `processMessageAsync` ✅
5. Inicia fetch ✅ (`DEBUG 1`)

### ❌ O Que NÃO Funciona
1. Fetch **nunca completa** ❌
2. **Não aparece** `DEBUG 2` (Resposta recebida)
3. **Não aparece** `DEBUG 14` (Erro)
4. **Nenhuma exceção** é logada
5. **Servidor CrewAI não recebe request** ❌

---

## 🧩 Descobertas Adicionais

### Webhook Duplicado

UAZAPI está enviando a **mesma mensagem DUAS vezes**:

**Webhook 1** (correto):
```javascript
owner: '554791945151'  // Número do bot
sender: '5511992345329@s.whatsapp.net'  // Usuário
fromMe: false  ✅
→ Processa normalmente
```

**Webhook 2** (invertido):
```javascript
owner: '5511992345329'  // Número do usuário  
sender: '5511992345329@s.whatsapp.net'  // Usuário
fromMe: true  ❌
→ Detectado como "mensagem do agente" e ignorado
```

**Por que acontece**: UAZAPI envia webhook na perspectiva de cada participante da conversa.

**Solução atual**: O segundo webhook é corretamente ignorado (fromMe = true).

---

## 🎯 Problema Principal: Fetch Trava Silenciosamente

### Evidência

```
🔍 [processMessageAsync 1] Iniciando fetch: {
  endpoint: 'https://api.falachefe.app.br/process',
  timeout: '180000ms',
  payloadSize: 351
}

[... NADA MAIS ...]
```

**Esperado mas não aparece**:
- `🔍 [processMessageAsync 2] Resposta recebida...` ❌
- `🔍 [DEBUG 14] Async processing failed...` ❌  
- `🔍 [DEBUG 15] Async processing finished...` ❌

### Hipóteses

#### 1. **Timeout da Vercel Function**
- Vercel tem limite de **120 segundos** (maxDuration: 120 em vercel.json)
- Se fetch demorar mais, função é **killed** sem exceção
- Promise fica "hanging" sem resolver ou rejeitar

#### 2. **Fetch Bloqueado por Firewall/CORS**
- Request sai da Vercel
- Não chega no servidor Hetzner
- Fica esperando indefinidamente
- Sem erro porque não falha, só não responde

#### 3. **Problema no AbortController**
- Timeout do fetch (180s) > Timeout da função Vercel (120s)
- Função morre antes do AbortController abortar
- Promise nunca resolve

---

## ✅ Melhorias Implementadas

### 1. Logs Mais Robustos

```typescript
.catch((error) => {
  console.error('🔍 [DEBUG 14] ❌ Async processing failed:', {
    error: error.message,
    name: error.name,  // ← Tipo do erro
    stack: error.stack,
    endpoint,
    timeout
  });
})
.finally(() => {
  console.log('🔍 [DEBUG 15] 🏁 Async processing finished');
  // ← VAI APARECER SEMPRE, sucesso ou falha
});
```

### 2. Detecção de Tipos de Erro

```typescript
const errorDetails = {
  isAbortError: error.name === 'AbortError',
  isTimeoutError: error.name === 'TimeoutError' || error.message.includes('timeout'),
  isNetworkError: error.message.includes('fetch') || error.message.includes('network')
};
```

---

## 🧪 Próximo Teste

Com os novos logs, vamos descobrir:

1. **Se DEBUG 15 aparece**: Promise está sendo resolvida/rejeitada
2. **Se DEBUG 15 NÃO aparece**: Função Vercel está sendo killed
3. **Se DEBUG 14 aparece**: Qual tipo de erro está acontecendo

---

## 🔧 Soluções Possíveis

### Se for Timeout da Vercel:

**Opção A**: Reduzir timeout do fetch para 60s (menor que função)
```typescript
const fetchTimeout = Math.min(timeout, 60000); // Max 60s
```

**Opção B**: Usar Queue (QStash/Redis) para processamento async real
```typescript
await qstash.publishJSON({
  url: endpoint,
  body: payload
});
// Webhook retorna imediatamente
// QStash chama CrewAI depois
// CrewAI envia resposta diretamente ao WhatsApp
```

### Se for Problema de Rede:

**Opção A**: Chamar via IP direto temporariamente
```typescript
const endpoint = 'http://37.27.248.13:8000/process';
```

**Opção B**: Verificar DNS/Traefik
```bash
# Da Vercel, consegue resolver o DNS?
nslookup api.falachefe.app.br
```

---

## 📋 Checklist de Investigação

- [x] Adicionar logs detalhados de erro
- [x] Adicionar .finally() para sempre logar
- [x] Deploy com melhorias
- [ ] Testar novamente
- [ ] Ver logs da Vercel
- [ ] Identificar se DEBUG 15 aparece
- [ ] Identificar tipo de erro
- [ ] Aplicar solução específica

---

**Próximo**: Aguardar novo teste com logs melhorados  
**Status**: DEBUGGING EM PROGRESSO

