# Deploy Final - Tools Financeiras Funcionais

**Data:** 12/10/2025  
**Status:** ✅ Pronto para Deploy

---

## 🎯 Solução Completa Implementada

### 1. **Endpoint Dedicado para CrewAI**
Criado `/api/financial/crewai/route.ts`:
- ✅ POST para criar transações
- ✅ GET para consultar transações
- ✅ Autenticação via token de serviço
- ✅ Validações de segurança

### 2. **Token de Serviço**
```
CREWAI_SERVICE_TOKEN=e096742e-7b6d-4b6a-b987-41d533adbd50
```

**Configurado em:**
- ✅ `.env.local` (Vercel - local)
- ✅ `/opt/falachefe-crewai/.env` (Hetzner)
- ⏳ Variáveis de ambiente do Vercel (dashboard)

### 3. **Tools Atualizadas**
`cashflow_tools.py`:
- ✅ Usa `https://falachefe.app.br/api/financial/crewai`
- ✅ Envia header `x-crewai-token`
- ✅ Não depende mais de autenticação de sessão

### 4. **Prompts Melhorados**
`agents.yaml` + `tasks.yaml`:
- ✅ Agente entende que deve **EXECUTAR** ações
- ✅ Task enfatiza uso de ferramentas
- ✅ Output esperado é curto e objetivo

---

## 📋 Checklist de Deploy

### Vercel (Next.js API)
- [x] Criar `/api/financial/crewai/route.ts`
- [x] Adicionar `CREWAI_SERVICE_TOKEN` no `.env.local`
- [ ] Adicionar `CREWAI_SERVICE_TOKEN` no dashboard Vercel
- [ ] Deploy para produção

### Hetzner (CrewAI)
- [x] Atualizar `cashflow_tools.py`
- [x] Atualizar `agents.yaml`
- [x] Atualizar `tasks.yaml`
- [x] Adicionar variáveis no `.env`
- [ ] Deploy arquivos atualizados
- [ ] Rebuild Docker image
- [ ] Update Docker Stack service

---

## 🚀 Comandos de Deploy

### 1. Deploy Vercel
```bash
# Local - já configurado
# Produção - adicionar no dashboard:
# Settings → Environment Variables → Add
# Key: CREWAI_SERVICE_TOKEN
# Value: e096742e-7b6d-4b6a-b987-41d533adbd50
# Environment: Production

# Push para trigger deploy
git add src/app/api/financial/crewai/route.ts
git commit -m "feat: adicionar endpoint crewai para tools financeiras"
git push origin master
```

### 2. Deploy Hetzner
```bash
# Copiar arquivos
scp crewai-projects/falachefe_crew/src/falachefe_crew/tools/cashflow_tools.py root@37.27.248.13:/opt/falachefe-crewai/src/falachefe_crew/tools/
scp crewai-projects/falachefe_crew/src/falachefe_crew/config/agents.yaml root@37.27.248.13:/opt/falachefe-crewai/src/falachefe_crew/config/
scp crewai-projects/falachefe_crew/src/falachefe_crew/config/tasks.yaml root@37.27.248.13:/opt/falachefe-crewai/src/falachefe_crew/config/

# Rebuild e deploy
ssh root@37.27.248.13 "cd /opt/falachefe-crewai && docker build -t falachefe-crewai:latest . && set -a && source .env && set +a && docker stack deploy -c docker-stack.yml falachefe"
```

---

## 🧪 Teste

**Mensagem:** "Adicionar saldo inicial no fluxo de caixa de 50 mil reais"

**Fluxo Esperado:**
1. ✅ Classificador detecta: `financial_task`
2. ✅ Roteador envia para: `financial_expert`
3. ✅ Agente identifica: "preciso ADICIONAR valor"
4. ✅ Agente usa tool: `AddCashflowTransactionTool`
5. ✅ Tool chama: `POST https://falachefe.app.br/api/financial/crewai`
6. ✅ Endpoint valida token e salva no PostgreSQL
7. ✅ Resposta: "✅ Transação Registrada... ID: abc-123"

---

## ✅ Validação

Após deploy, verificar:
1. Enviar mensagem de teste via WhatsApp
2. Verificar logs do CrewAI no Hetzner
3. Confirmar transação no Supabase:
   ```sql
   SELECT * FROM financial_data WHERE metadata->>'source' = 'crewai' ORDER BY created_at DESC LIMIT 1;
   ```

---

**Status:** Pronto para executar deploys! 🚀



