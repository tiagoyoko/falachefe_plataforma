# 🧪 Guia Completo de Teste: Webhook → CrewAI

## 📋 Status Atual da Integração

### ❌ Problemas Identificados

1. **Webhook recebe mensagens** ✅
2. **Salva no banco de dados** ✅  
3. **NÃO chama o CrewAI** ❌ (código comentado/desabilitado)
4. **Falta endpoint `/api/crewai/process`** ❌

### 🎯 O que vamos testar

Este guia tem 3 níveis de teste:

```
Nível 1: Teste do Webhook (endpoint UAZ)
   ↓
Nível 2: Teste do CrewAI Standalone  
   ↓
Nível 3: Teste da Integração Completa
```

---

## 📍 Nível 1: Testar Webhook UAZ

### Teste 1.1: Health Check do Webhook

Verifica se o endpoint está respondendo.

```bash
# Produção
curl https://falachefe.app.br/api/webhook/uaz

# Esperado:
# {
#   "status": "ok",
#   "service": "UAZ Webhook Handler",
#   "timestamp": "2025-10-08T..."
# }
```

**✅ Sucesso**: Retorna status 200 com JSON  
**❌ Falha**: Timeout ou erro 500

---

### Teste 1.2: Simular Webhook do WhatsApp (Mensagem Real)

Simula uma mensagem vinda do UAZAPI.

```bash
#!/bin/bash
# Arquivo: test-webhook-production.sh

curl -X POST https://falachefe.app.br/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "messages",
    "message": {
      "id": "test-msg-'$(date +%s)'",
      "messageid": "wamid.test123",
      "text": "Olá! Teste de webhook",
      "content": "Olá! Teste de webhook",
      "sender": "5511999999999@c.us",
      "chatid": "5511999999999@c.us",
      "type": "chat",
      "messageType": "extendedTextMessage",
      "fromMe": false,
      "isGroup": false,
      "messageTimestamp": '$(date +%s)',
      "senderName": "Teste Usuario"
    },
    "chat": {
      "id": "5511999999999@c.us",
      "name": "Teste Usuario",
      "wa_chatid": "5511999999999@c.us",
      "wa_name": "Teste Usuario",
      "wa_isGroup": false,
      "wa_unreadCount": 0
    },
    "owner": "falachefe-owner",
    "token": "test-token-123"
  }'
```

**Salvar como**: `test-webhook-production.sh`

```bash
chmod +x test-webhook-production.sh
./test-webhook-production.sh
```

**✅ Sucesso**: 
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "timestamp": "..."
}
```

**🔍 Verificar nos logs da Vercel**:
1. Acesse: https://vercel.com/seu-projeto/logs
2. Procure por:
   - ✅ `UAZ Webhook received`
   - ✅ `Message saved successfully`  
   - ⚠️ `AgentOrchestrator disabled` (confirma que CrewAI não está sendo chamado)

---

## 📍 Nível 2: Testar CrewAI Standalone

Testa se o processador CrewAI funciona isoladamente.

### Teste 2.1: Verificar Script Python

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Verificar se script existe
ls -la webhook_processor.py

# Deve mostrar:
# -rwxr-xr-x  1 user  staff  7623 Oct  8 20:00 webhook_processor.py
```

---

### Teste 2.2: Testar Processador Python Diretamente

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Ativar ambiente virtual
source .venv/bin/activate

# Testar processador
echo '{
  "user_message": "Olá, qual é o meu saldo?",
  "user_id": "test_user_vercel",
  "phone_number": "+5511999999999",
  "context": {}
}' | python webhook_processor.py
```

**✅ Sucesso**: Resposta JSON do CrewAI
```json
{
  "success": true,
  "response": "Olá! Para consultar seu saldo...",
  "metadata": {
    "processed_at": "2025-10-08T...",
    "crew_type": "hierarchical",
    "processing_time_ms": 5234
  }
}
```

**❌ Falha**: 
- `Module not found`: Execute `pip install -r requirements.txt`
- `OpenAI API Key`: Verifique `.env` tem `OPENAI_API_KEY`

---

### Teste 2.3: Teste Rápido Automatizado

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Executar teste rápido
./test_webhook_quick.sh
```

**✅ Sucesso**: Ver `✅ Sucesso!` no final

---

## 📍 Nível 3: Testar Integração Completa

**⚠️ IMPORTANTE**: A integração completa **NÃO está funcionando ainda** porque:
1. ❌ Não existe endpoint `/api/crewai/process`
2. ❌ O webhook não está chamando o CrewAI

### O que precisa ser feito:

```
┌─────────────────────────────┐
│ 1. Criar endpoint bridge    │ → Falta implementar
│    /api/crewai/process      │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│ 2. Atualizar webhook para   │ → Falta implementar
│    chamar o bridge          │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│ 3. Testar fluxo completo    │ → Depois das etapas acima
└─────────────────────────────┘
```

---

## 🔧 Testes na Vercel (Produção)

### Como verificar logs em produção:

1. **Acessar Vercel Dashboard**:
   ```
   https://vercel.com/[seu-usuario]/falachefe/logs
   ```

2. **Filtrar logs relevantes**:
   - Procure por: `webhook`, `uaz`, `message`
   - Tipo: `Runtime Logs`
   - Função: `/api/webhook/uaz`

3. **Logs esperados**:
   ```
   ✅ UAZ Webhook received
   ✅ Processing message event
   ✅ Message saved successfully
   ⚠️ AgentOrchestrator disabled - implement /api/crewai/process integration
   ```

---

## 📊 Checklist de Validação

### ✅ Testes Básicos (Podem ser feitos AGORA)

- [ ] **Health check do webhook funciona**
  ```bash
  curl https://falachefe.app.br/api/webhook/uaz
  ```

- [ ] **Webhook recebe mensagens simuladas**
  ```bash
  ./test-webhook-production.sh
  ```

- [ ] **Mensagens são salvas no banco**
  - Verificar logs da Vercel mostrando `Message saved successfully`

- [ ] **CrewAI standalone funciona**
  ```bash
  cd crewai-projects/falachefe_crew
  ./test_webhook_quick.sh
  ```

### ⚠️ Testes que NÃO vão funcionar ainda

- [ ] ❌ **Webhook chama CrewAI** 
  - Motivo: Código está comentado/desabilitado
  
- [ ] ❌ **Endpoint `/api/crewai/process` existe**
  - Motivo: Não foi implementado ainda

- [ ] ❌ **Mensagens retornam resposta do CrewAI**
  - Motivo: Integração não está completa

---

## 🚀 Como Fazer os Testes AGORA

### Teste Rápido (5 minutos)

```bash
# 1. Health check
echo "🧪 Teste 1: Health Check"
curl https://falachefe.app.br/api/webhook/uaz
echo -e "\n"

# 2. Simular mensagem
echo "🧪 Teste 2: Mensagem Simulada"
curl -X POST https://falachefe.app.br/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "messages",
    "message": {
      "id": "test-123",
      "text": "Teste de webhook",
      "sender": "5511999999999@c.us",
      "chatid": "5511999999999@c.us",
      "type": "chat",
      "fromMe": false,
      "messageTimestamp": 1728424800
    },
    "chat": {
      "id": "5511999999999@c.us",
      "name": "Teste"
    },
    "owner": "test",
    "token": "test"
  }'
echo -e "\n"

# 3. Verificar logs
echo "🔍 Agora verifique os logs em:"
echo "https://vercel.com/[seu-usuario]/falachefe/logs"
```

### Teste do CrewAI (10 minutos)

```bash
# No seu computador local
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Ativar ambiente
source .venv/bin/activate

# Executar teste
./test_webhook_quick.sh

# Ver resultado
# ✅ Se ver "Sucesso!", o CrewAI está funcionando
```

---

## 📋 Resultado Esperado dos Testes

### ✅ O que DEVE funcionar

1. **Webhook recebe requisições**: Status 200 ✅
2. **Mensagens são salvas no banco**: Ver logs ✅  
3. **CrewAI processa mensagens standalone**: Teste local ✅

### ❌ O que NÃO vai funcionar (ainda)

1. **Webhook → CrewAI**: Integração não implementada ❌
2. **Resposta automática**: CrewAI não é chamado ❌
3. **Endpoint `/api/crewai/process`**: Não existe ❌

---

## 🎯 Próximos Passos

Após confirmar que os testes básicos funcionam:

1. **Implementar endpoint `/api/crewai/process`** (30 min)
2. **Atualizar webhook para chamar endpoint** (15 min)
3. **Testar integração completa** (15 min)
4. **Deploy e teste em produção** (10 min)

**Total estimado**: ~70 minutos para integração completa

---

## 🆘 Troubleshooting

### Problema: "Webhook returns 500"

**Causa**: Erro no processamento  
**Solução**: Verificar logs da Vercel

### Problema: "CrewAI timeout"

**Causa**: Processamento demora muito  
**Solução**: Aumentar timeout ou usar fila assíncrona

### Problema: "Module not found" no CrewAI

**Causa**: Dependências não instaladas  
**Solução**: 
```bash
cd crewai-projects/falachefe_crew
pip install -r requirements.txt
```

---

## 📞 Suporte

Em caso de dúvidas:
1. Verificar logs da Vercel primeiro
2. Testar CrewAI standalone
3. Verificar se variáveis de ambiente estão configuradas

---

**Última atualização**: 08/10/2025  
**Status**: ⚠️ Integração parcial (webhook OK, CrewAI standalone OK, bridge pendente)

