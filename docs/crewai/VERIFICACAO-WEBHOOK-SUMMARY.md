# 🔍 Verificação Webhook → CrewAI - Resumo Executivo

## 🚨 Problema Identificado

### Status Atual: ❌ **Webhook NÃO está entregando mensagens ao CrewAI**

**Causa Raiz:**
```typescript
// src/app/api/webhook/uaz/route.ts - Linha 84

throw new Error('AgentOrchestrator initialization needs to be updated after removing Agent Squad framework');
```

O webhook está tentando usar `AgentOrchestrator`, mas a função sempre lança um erro. Por isso, **nenhuma mensagem chega ao CrewAI**.

---

## 📊 Diagnóstico Completo

### O Que Funciona ✅

1. **Webhook recebe mensagens** do WhatsApp via UazAPI
2. **Payload é validado** corretamente
3. **Mensagens são salvas** no banco de dados PostgreSQL
4. **Sistema de janelas** (window control) funciona

### O Que Está Quebrado ❌

1. **AgentOrchestrator lança erro** na inicialização
2. **CrewAI nunca é chamado**
3. **Mensagens não são processadas** por IA
4. **Respostas não são geradas** automaticamente

### Fluxo Atual (QUEBRADO)

```
┌─────────────────┐
│ WhatsApp User   │
└────────┬────────┘
         │ envia mensagem
         ▼
┌──────────────────────────┐
│ UazAPI                   │
│ (WhatsApp Business API)  │
└────────┬─────────────────┘
         │ POST webhook
         ▼
┌─────────────────────────────────┐
│ /api/webhook/uaz (Next.js)      │
│                                 │
│ ✅ Valida payload               │
│ ✅ Salva mensagem no banco      │
│ ❌ Tenta inicializar Agent...   │  
│    └─> ERRO: "AgentOrchestrator │
│        initialization needs..."  │
└─────────────────────────────────┘
         │
         ❌ PARA AQUI
         │
         ✗ CrewAI nunca é chamado
```

---

## ✅ Solução Implementada

### Arquivos Criados

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| **webhook_processor.py** | Bridge Python (stdin → CrewAI → stdout) | ✅ Criado |
| **test_webhook_processor.sh** | Suite de testes (6 testes) | ✅ Criado |
| **test_webhook_quick.sh** | Teste rápido | ✅ Criado |
| **README-WEBHOOK-TESTS.md** | Documentação de testes | ✅ Criado |
| **WEBHOOK-CREWAI-INTEGRATION.md** | Documentação técnica completa | ✅ Criado |

### Próximos Passos para Implementação

#### Fase 1: Testar Bridge Python (10 min)

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Ativar ambiente
source .venv/bin/activate

# Teste rápido
./test_webhook_quick.sh
```

**Resultado esperado:**
```
✅ Sucesso!
{"success": true, "response": "...", "metadata": {...}}
```

#### Fase 2: Implementar Endpoint Next.js (30 min)

**Criar arquivo:**
```
/src/app/api/crewai/process/route.ts
```

**Conteúdo:** Ver `WEBHOOK-CREWAI-INTEGRATION.md` seção "Passo 1"

#### Fase 3: Atualizar Webhook (15 min)

**Editar arquivo:**
```
/src/app/api/webhook/uaz/route.ts
```

**Mudanças:**
1. Remover `initializeAgentOrchestrator()`
2. Adicionar `processMessageWithCrewAI()`
3. Substituir chamada na linha ~323

**Conteúdo:** Ver `WEBHOOK-CREWAI-INTEGRATION.md` seção "Passo 3"

#### Fase 4: Testar Integração Completa (15 min)

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Simular webhook
curl -X POST http://localhost:3000/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d @test-webhook-payload.json
```

---

## 🎯 Plano de Ação Imediato

### 1️⃣ Primeiro: Testar Bridge Python ⏱️ 10 min

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew
source .venv/bin/activate
./test_webhook_quick.sh
```

**Se funcionar:** ✅ Prosseguir para passo 2  
**Se falhar:** 🔧 Debugar e corrigir

### 2️⃣ Segundo: Implementar Endpoint CrewAI ⏱️ 30 min

**Ação:** Criar `/src/app/api/crewai/process/route.ts`

**Referência:** `WEBHOOK-CREWAI-INTEGRATION.md` - Seção "Passo 1"

**Teste:**
```bash
curl -X POST http://localhost:3000/api/crewai/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste",
    "userId": "test",
    "phoneNumber": "+5511999999999"
  }'
```

### 3️⃣ Terceiro: Atualizar Webhook ⏱️ 15 min

**Ação:** Editar `/src/app/api/webhook/uaz/route.ts`

**Mudanças:**
- Linha 78-86: Remover `initializeAgentOrchestrator()`
- Adicionar nova função `processMessageWithCrewAI()`
- Linha 321-402: Substituir lógica

**Referência:** `WEBHOOK-CREWAI-INTEGRATION.md` - Seção "Passo 3"

### 4️⃣ Quarto: Testar Fluxo Completo ⏱️ 15 min

**Ação:** Simular mensagem real do WhatsApp

```bash
# Criar payload de teste
cat > test-webhook-payload.json <<'EOF'
{
  "EventType": "messages",
  "message": {
    "id": "test-123",
    "text": "Qual é o meu saldo?",
    "sender": "+5511999999999",
    "chatid": "5511999999999@c.us",
    "type": "text",
    "fromMe": false,
    "messageTimestamp": 1699999999
  },
  "chat": {
    "id": "5511999999999@c.us",
    "name": "Teste Usuario"
  },
  "owner": "test-owner",
  "token": "test-token"
}
EOF

# Enviar
curl -X POST http://localhost:3000/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d @test-webhook-payload.json
```

**Verificar logs:**
```bash
# Logs esperados no console do Next.js:
✅ UAZ Webhook received
✅ Message saved successfully
✅ 🤖 Calling CrewAI bridge...
✅ CrewAI response received
✅ Response sent successfully
```

---

## 📊 Checklist de Validação

### Fase 1: Bridge Python

- [ ] `webhook_processor.py` executável
- [ ] Teste rápido passa
- [ ] Suite completa passa (4/6 testes funcionais)
- [ ] Validações funcionam (2 testes de erro)

### Fase 2: Endpoint Next.js

- [ ] Endpoint criado em `/api/crewai/process`
- [ ] GET retorna health check
- [ ] POST processa mensagem
- [ ] Timeout configurado (60s)
- [ ] Erro handling implementado

### Fase 3: Integração Webhook

- [ ] Função `initializeAgentOrchestrator()` removida
- [ ] Função `processMessageWithCrewAI()` adicionada
- [ ] Webhook chama novo endpoint
- [ ] Erros são capturados gracefully
- [ ] Logs detalhados implementados

### Fase 4: Testes End-to-End

- [ ] Webhook recebe payload
- [ ] Mensagem salva no banco
- [ ] CrewAI bridge chamado
- [ ] Resposta gerada
- [ ] Resposta enviada ao usuário via UazAPI

---

## 🎓 Documentação de Referência

### Para Desenvolvedores

| Documento | Descrição | Tempo de Leitura |
|-----------|-----------|------------------|
| **[WEBHOOK-CREWAI-INTEGRATION.md](./WEBHOOK-CREWAI-INTEGRATION.md)** | Documentação técnica completa | 20 min |
| **[README-WEBHOOK-TESTS.md](../../crewai-projects/falachefe_crew/README-WEBHOOK-TESTS.md)** | Como testar webhook processor | 10 min |
| **[webhook_processor.py](../../crewai-projects/falachefe_crew/webhook_processor.py)** | Código do bridge Python | 5 min |

### Para Testes

```bash
# Documentos de teste
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Leia primeiro
cat README-WEBHOOK-TESTS.md

# Execute testes
./test_webhook_quick.sh        # Teste rápido
./test_webhook_processor.sh    # Suite completa
```

---

## 🆘 Troubleshooting Rápido

### Problema: "Module not found"

```bash
cd crewai-projects/falachefe_crew
source .venv/bin/activate
pip install -r requirements.txt
```

### Problema: "Permission denied"

```bash
chmod +x webhook_processor.py
chmod +x test_webhook_processor.sh
chmod +x test_webhook_quick.sh
```

### Problema: "OpenAI API Key not configured"

```bash
echo "OPENAI_API_KEY=sk-proj-sua-chave" >> .env
```

### Problema: "Connection refused"

```bash
# Iniciar servidor
cd /Users/tiagoyokoyama/Falachefe
npm run dev
```

---

## 📞 Contato e Suporte

**Documentação:**
- `/docs/crewai/` - Guias completos
- `/crewai-projects/falachefe_crew/` - Código e testes

**Próximos Passos:**
1. Leia: `WEBHOOK-CREWAI-INTEGRATION.md`
2. Execute: `./test_webhook_quick.sh`
3. Implemente: Seguir plano de ação acima

---

**Status Geral:** 🔴 Webhook → CrewAI quebrado (solução pronta para implementar)  
**Prioridade:** 🔴 Alta (bloqueia WhatsApp → IA)  
**Tempo Estimado:** ⏱️ 70 minutos (10 + 30 + 15 + 15)  
**Impacto:** 🎯 Crítico (funcionalidade principal)

---

**Última atualização:** 08/10/2025  
**Versão:** 1.0.0  
**Autor:** AI Assistant

