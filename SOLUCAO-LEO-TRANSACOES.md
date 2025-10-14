# ✅ Solução - Leo Registrando Transações Financeiras

**Data**: 14 de Outubro de 2025  
**Problema**: Leo retorna "problema de acesso" ao tentar registrar transações
**Status**: 🔧 Em correção

---

## 🎯 Resumo do Problema

O agente Leo (Financial Expert) possui uma ferramenta `AddCashflowTransactionTool` que deveria registrar transações financeiras no banco de dados PostgreSQL através da API do Vercel.

**Fluxo esperado:**
```
1. Usuário: "Quero registrar uma entrada de R$ 1.000"
2. Leo identifica necessidade de usar ferramenta
3. Ferramenta faz POST para https://falachefe.app.br/api/financial/crewai
4. API salva no PostgreSQL
5. Leo confirma: "✅ Transação registrada com sucesso!"
```

**Fluxo atual (com erro):**
```
1. Usuário: "Quero registrar uma entrada de R$ 1.000"
2. Leo tenta usar ferramenta (2x nos logs)
3. Ferramenta retorna erro
4. Leo responde: "Infelizmente, estou enfrentando dificuldades... problema de acesso"
```

---

## 🔍 Causas Identificadas

### 1. Variável de Ambiente Faltando ✅ CORRIGIDO
**Problema**: `FALACHEFE_API_URL` não estava configurada no servidor Hetzner

**Código da ferramenta:**
```python
# crewai-projects/falachefe_crew/src/falachefe_crew/tools/cashflow_tools.py
API_BASE_URL = os.getenv("FALACHEFE_API_URL", "https://falachefe.app.br")
CREWAI_SERVICE_TOKEN = os.getenv("CREWAI_SERVICE_TOKEN", "")
```

**Solução Aplicada:**
```bash
# Adicionado ao /opt/falachefe-crewai/.env
FALACHEFE_API_URL=https://falachefe.app.br

# Serviço atualizado
docker service update --env-add FALACHEFE_API_URL=https://falachefe.app.br falachefe_crewai-api
```

### 2. Possível Divergência de Token 🟡 A VERIFICAR
O token `CREWAI_SERVICE_TOKEN` pode ser diferente entre:
- **Local**: `.env.local` (desenvolvimento)
- **Vercel**: Environment Variables (produção)
- **Hetzner**: `.env` no servidor

**Verificar**: Todos devem ter o mesmo valor: `e096742e-7b6d-4b6a-b987-41d533adbd50`

---

## 🧪 Testes Realizados

### 1. Teste Local → Vercel
```bash
curl -X POST https://falachefe.app.br/api/financial/crewai \
  -H "Content-Type: application/json" \
  -H "x-crewai-token: e096742e-7b6d-4b6a-b987-41d533adbd50" \
  -d '{
    "userId": "test-user-123",
    "type": "entrada",
    "amount": 100.00,
    "description": "Teste de transação",
    "category": "vendas"
  }'
```

**Resultado**: `{"error":"Não autorizado","message":"Token de serviço inválido"}`

⚠️ Isso sugere que o token em produção é diferente do local!

### 2. Teste Hetzner → Vercel (A REALIZAR)
```bash
ssh root@37.27.248.13 'curl -X POST https://falachefe.app.br/api/financial/crewai ...'
```

---

## 🛠️ Plano de Ação

### Etapa 1: Verificar Token de Produção ⏳
```bash
# Acessar Vercel Dashboard
# https://vercel.com/tiagoyoko/falachefe-plataforma/settings/environment-variables

# Procurar por:
CREWAI_SERVICE_TOKEN

# Comparar com:
- .env.local (local): e096742e-7b6d-4b6a-b987-41d533adbd50
- .env (Hetzner): e096742e-7b6d-4b6a-b987-41d533adbd50
```

### Etapa 2: Sincronizar Tokens
Se os tokens forem diferentes:

**Opção A**: Atualizar Hetzner com token de produção
```bash
ssh root@37.27.248.13
cd /opt/falachefe-crewai
sed -i 's/CREWAI_SERVICE_TOKEN=.*/CREWAI_SERVICE_TOKEN=<novo_token>/' .env
docker service update --env-add CREWAI_SERVICE_TOKEN=<novo_token> falachefe_crewai-api
```

**Opção B**: Atualizar Vercel com token atual
```bash
# Via Vercel Dashboard
# Settings → Environment Variables
# Editar CREWAI_SERVICE_TOKEN = e096742e-7b6d-4b6a-b987-41d533adbd50
# Redeploy
```

### Etapa 3: Adicionar Logs Detalhados na Ferramenta
```python
# cashflow_tools.py - Método _run da AddCashflowTransactionTool

def _run(self, user_id, transaction_type, amount, category, description=None, date=None):
    try:
        # ... código existente ...
        
        print(f"📤 [DEBUG] Enviando para: {api_url}")
        print(f"📤 [DEBUG] Token (primeiros 10): {CREWAI_SERVICE_TOKEN[:10]}...")
        print(f"📤 [DEBUG] Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=API_TIMEOUT)
        
        print(f"📥 [DEBUG] Status Code: {response.status_code}")
        print(f"📥 [DEBUG] Response: {response.text[:200]}...")  # Primeiros 200 chars
        
        if response.status_code not in [200, 201]:
            error_detail = response.json().get('error', 'Erro desconhecido')
            error_msg = f"❌ Erro ao registrar transação: {error_detail} (Status: {response.status_code})"
            print(error_msg)
            return error_msg
        
        # ... resto do código ...
```

### Etapa 4: Rebuild e Deploy
```bash
cd /opt/falachefe-crewai
docker build -t falachefe-crewai:latest .
docker stack deploy -c docker-stack.yml falachefe
```

### Etapa 5: Teste com Usuário Real
```
WhatsApp → 5511992345329
Mensagem: "Quero registrar uma entrada de R$ 1.000 de vendas hoje"
```

**Logs para monitorar:**
```bash
# Terminal 1
ssh root@37.27.248.13 "docker service logs -f falachefe_crewai-api | grep 'DEBUG\|transação'"

# Terminal 2 (se tiver acesso)
vercel logs --follow
```

---

## 📋 Checklist de Resolução

- [x] Variável `FALACHEFE_API_URL` adicionada no Hetzner
- [x] Serviço Docker reiniciado com sucesso
- [ ] Token de produção verificado no Vercel
- [ ] Tokens sincronizados em todos os ambientes
- [ ] Logs detalhados adicionados na ferramenta
- [ ] Rebuild da imagem Docker
- [ ] Deploy da nova versão
- [ ] Teste com usuário real
- [ ] Transação salva com sucesso no banco

---

## 🎯 Resultado Esperado

Após as correções, quando o usuário pedir para registrar uma transação:

```
Usuário: "Quero registrar uma entrada de R$ 1.000 de vendas hoje"

Leo: ✅ Transação Registrada com Sucesso no Banco de Dados!

💰 Tipo: Entrada
💵 Valor: R$ 1,000.00
📁 Categoria: vendas
📅 Data: 2025-10-14
📝 Descrição: Venda registrada

🆔 ID da transação: abc123-xyz789
💾 Salvo em: PostgreSQL (financial_data)
```

---

**Status Atual**: 🟡 Aguardando verificação de token de produção
**Próximo Passo**: Verificar `CREWAI_SERVICE_TOKEN` no Vercel Dashboard

