# 🚨 PROBLEMA: Mensagens Não Recebem Resposta do Bot

**Data**: 15/10/2025 10:52  
**Reportado por**: Usuário (Tiago)

## 📊 Situação Atual

### ✅ O Que ESTÁ Funcionando:
1. Webhook recebendo mensagens
2. Mensagens sendo salvas no banco
3. Servidor CrewAI online e funcionando (testado manualmente)
4. Usuário tem empresa cadastrada ✅
5. Subscription ativa ✅

### ❌ O Que NÃO Está Funcionando:
**Mensagens não recebem resposta do bot!**

Estatísticas das últimas 24h:
```
📊 Conversação 3cf45852-ef33-4b8c-89c1-ce2ad911f25f:
   - 158 mensagens de USUÁRIO
   - 2 mensagens de AGENTE apenas! ❌

Taxa de resposta: 1.3% (esperado: ~50%)
```

## 🔍 Investigação Detalhada

### Mensagens Recentes SEM Resposta:

```sql
✅ 15/10 10:44 - "testando" - user_id: or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb
   ❌ Sem resposta do agente
   
✅ 15/10 10:43 - "teste" - user_id: or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb
   ❌ Sem resposta do agente
```

### Dados do Usuário:

```
user_id: or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb
nome: Tiago
telefone: 11992345329
empresa: agencia vibe code
company_id: bd7c774b-e790-46ea-9a91-91d8f4527087 ✅
subscription: active ✅
```

**Conclusão**: Usuário TEM todos os requisitos para receber respostas!

### Teste Manual do Servidor CrewAI:

```bash
curl -X POST https://api.falachefe.app.br/process \
  -d '{"userId":"test123","message":"Oi",...}'

RESULTADO: ✅ SUCESSO
- Tempo: 9 segundos
- Resposta: "Olá test123! 👋 Sou a Ana..."
- sent_to_user: true
```

**Conclusão**: Servidor CrewAI funciona perfeitamente quando chamado diretamente!

## 🎯 DIAGNÓSTICO DO PROBLEMA

### Problema Identificado:

O webhook está:
1. ✅ Recebendo mensagens
2. ✅ Salvando no banco
3. ❌ **MAS NÃO está chamando o CrewAI**

### Possíveis Causas:

#### 1. **MessageRouter não está classificando corretamente**
- Mensagem pode estar sendo classificada como "IGNORE"
- Ou classificação está falhando silenciosamente

#### 2. **Erro silencioso no processMessageAsync**
- Promise sendo rejeitada sem log
- Erro de rede sendo engolido
- Timeout muito curto

#### 3. **Condição de bloqueio no código**
- `requiresCompanySetup` incorreto
- `shouldProcess` retornando false
- Verificação de `fromMe` bloqueando

#### 4. **Variável de ambiente CREWAI_API_URL incorreta**
- URL com espaços/quebras de linha
- URL apontando para lugar errado

## 🔧 Soluções Propostas

### Solução 1: Adicionar Logs Detalhados (Diagnóstico)

Adicionar logs temporários para rastrear onde o processamento está parando:

```typescript
// Em src/app/api/webhook/uaz/route.ts

console.log('🔍 [DEBUG] requiresCompanySetup:', result.requiresCompanySetup);
console.log('🔍 [DEBUG] routing:', routing);
console.log('🔍 [DEBUG] shouldProcess:', routing.shouldProcess);
console.log('🔍 [DEBUG] destination:', routing.classification.destination);
console.log('🔍 [DEBUG] baseWorkerUrl:', baseWorkerUrl);
console.log('🔍 [DEBUG] targetEndpoint:', targetEndpoint);
```

### Solução 2: Forçar Processamento para Teste

Temporariamente ignorar verificações e forçar chamada ao CrewAI:

```typescript
// TESTE: forçar processamento
const FORCE_PROCESS = true;

if (FORCE_PROCESS || (!message.fromMe && !result.requiresCompanySetup)) {
  console.log('🚀 FORCING CrewAI processing...');
  // ... processamento
}
```

### Solução 3: Verificar Variável de Ambiente

```bash
# Verificar no Vercel Dashboard:
# Settings > Environment Variables > CREWAI_API_URL

Deve ser: https://api.falachefe.app.br
Sem espaços, sem quebras de linha
```

### Solução 4: Catch de Erros Explícito

Adicionar tratamento de erro mais robusto:

```typescript
processMessageAsync(...)
  .then(() => {
    console.log('✅ [SUCCESS] Async processing completed');
  })
  .catch((error) => {
    console.error('❌ [ERROR] Async processing failed:', {
      error: error.message,
      stack: error.stack,
      endpoint: targetEndpoint
    });
    
    // Notificar via banco ou webhook
  });
```

## 🧪 Teste Recomendado

### Passo 1: Adicionar Logs de Debug

Editar `src/app/api/webhook/uaz/route.ts` e adicionar logs:

```typescript
async function handleMessageEvent(data) {
  // ... código existente ...
  
  console.log('🔍 [DEBUG 1] MessageService result:', {
    requiresCompanySetup: result.requiresCompanySetup,
    userId: result.user.id,
    hasCompany: !!result.user
  });
  
  if (result.requiresCompanySetup) {
    console.log('🔍 [DEBUG 2] BLOQUEADO: requiresCompanySetup = true');
    return;
  }
  
  console.log('🔍 [DEBUG 3] Chamando MessageRouter...');
  const routing = await MessageRouter.route(...);
  
  console.log('🔍 [DEBUG 4] Routing result:', {
    shouldProcess: routing.shouldProcess,
    destination: routing.classification.destination,
    contentType: routing.classification.contentType
  });
  
  if (!routing.shouldProcess) {
    console.log('🔍 [DEBUG 5] BLOQUEADO: shouldProcess = false, reason:', routing.reason);
    return;
  }
  
  console.log('🔍 [DEBUG 6] Preparando endpoint...');
  const baseWorkerUrl = (process.env.CREWAI_API_URL || 'http://37.27.248.13:8000').trim();
  
  console.log('🔍 [DEBUG 7] Calling processMessageAsync:', {
    endpoint: targetEndpoint,
    hasPayload: !!payload
  });
  
  processMessageAsync(...)
    .then(() => {
      console.log('🔍 [DEBUG 8] ✅ SUCESSO!');
    })
    .catch((err) => {
      console.error('🔍 [DEBUG 9] ❌ ERRO:', err.message);
    });
}
```

### Passo 2: Deploy e Teste

1. Deploy com logs
2. Enviar mensagem "debug teste" para +55 47 9194-5151
3. Verificar logs na Vercel em tempo real
4. Identificar em qual DEBUG parou

### Passo 3: Corrigir Baseado nos Logs

Dependendo de onde parou:
- DEBUG 2: Problema em `requiresCompanySetup`
- DEBUG 5: Problema no `MessageRouter`
- DEBUG 9: Problema na chamada HTTP

## 📋 Checklist de Verificação

- [ ] Variável CREWAI_API_URL está correta na Vercel?
- [ ] MessageRouter está importado e funcionando?
- [ ] processMessageAsync está sendo chamado?
- [ ] Há erros sendo engolidos silenciosamente?
- [ ] Timeout está adequado (120s)?
- [ ] Rede entre Vercel e Hetzner está OK?

## 🚀 Próximos Passos

1. **AGORA**: Adicionar logs de debug
2. **Deploy**: Push para GitHub (auto-deploy Vercel)
3. **Teste**: Enviar mensagem e observar logs
4. **Corrigir**: Baseado no resultado dos logs
5. **Validar**: Confirmar que resposta chega no WhatsApp

---

## 📱 Para Testar Novamente:

Envie mensagem para: **+55 47 9194-5151**

Mensagem sugerida: "debug teste 123"

Depois verifique:
1. Logs da Vercel (tempo real)
2. Banco de dados (mensagem salva?)
3. WhatsApp (recebeu resposta?)

---

**Status**: Aguardando implementação de logs de debug

