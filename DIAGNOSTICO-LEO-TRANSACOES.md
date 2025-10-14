# 🔍 Diagnóstico - Leo Não Consegue Registrar Transações

**Data**: 14 de Outubro de 2025  
**Problema**: Leo retorna "problema de acesso" ao tentar registrar transações financeiras

---

## 🐛 Problema Identificado

### Mensagem do Agente:
> "Infelizmente, estou enfrentando dificuldades para registrar a transação inicial devido a um problema de acesso."

### Logs do Servidor (Hetzner):
```
├── 🔧 Used Adicionar Transação ao Fluxo de Caixa (1)
└── 🔧 Used Adicionar Transação ao Fluxo de Caixa (2)
```

O agente **tentou usar a ferramenta 2 vezes** mas falhou em ambas.

---

## 🔍 Análise

### 1. Configuração de Tokens ✅
- **Vercel (.env.local)**: `CREWAI_SERVICE_TOKEN=e096742e-7b6d-4b6a-b987-41d533adbd50`
- **Hetzner (.env)**: `CREWAI_SERVICE_TOKEN=e096742e-7b6d-4b6a-b987-41d533adbd50`
- **Tokens coincidem**: ✅

### 2. URL da API ⚠️
**Configuração Atual:**
```python
# crewai-projects/falachefe_crew/src/falachefe_crew/tools/cashflow_tools.py
API_BASE_URL = os.getenv("FALACHEFE_API_URL", "https://falachefe.app.br")
```

**Endpoint Alvo:**
```
POST https://falachefe.app.br/api/financial/crewai
Header: x-crewai-token: e096742e-7b6d-4b6a-b987-41d533adbd50
```

**Problema**: A variável `FALACHEFE_API_URL` **NÃO estava configurada** no servidor Hetzner!
- **Antes**: Usava o valor padrão `https://falachefe.app.br`
- **Agora**: Adicionamos `FALACHEFE_API_URL=https://falachefe.app.br` no `.env`

### 3. Teste do Endpoint
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

**Resultado**: Token inválido (esperado - token local diferente de produção)

---

## 🔧 Ações Realizadas

### 1. Atualização do .env no Hetzner
```bash
# Adicionado ao /opt/falachefe-crewai/.env
FALACHEFE_API_URL=https://falachefe.app.br
```

### 2. Atualização do Docker Service
```bash
docker service update \
  --env-add FALACHEFE_API_URL=https://falachefe.app.br \
  falachefe_crewai-api
```

**Status**: ✅ Serviço reiniciado com sucesso

---

## ❓ Possíveis Causas Restantes

### 1. Token de Produção Diferente ⚠️
O token configurado localmente (`e096742e-7b6d-4b6a-b987-41d533adbd50`) pode ser diferente do token em produção no Vercel.

**Verificar:**
- Dashboard Vercel → Settings → Environment Variables
- Procurar por `CREWAI_SERVICE_TOKEN`
- Confirmar que o valor é o mesmo

### 2. Problema de Rede/CORS
A requisição do servidor Hetzner (37.27.248.13) para o Vercel pode estar sendo bloqueada.

**Sintomas:**
- Timeout
- Connection refused
- CORS error

### 3. Erro na Ferramenta
A ferramenta pode estar retornando uma mensagem de erro genérica sem detalhes.

**Verificar logs detalhados:**
```python
# cashflow_tools.py linha 285-298
except requests.exceptions.ConnectionError:
    return f"❌ Erro de conexão: Não foi possível conectar..."
except requests.exceptions.Timeout:
    return f"❌ Timeout: A API levou mais de {API_TIMEOUT}s..."
except Exception as e:
    return f"❌ Erro inesperado: {str(e)}"
```

---

## 🧪 Próximos Testes

### 1. Testar com Usuário Real
Enviar mensagem via WhatsApp:
```
"Quero registrar uma entrada de R$ 1.000 de vendas hoje"
```

### 2. Verificar Logs em Tempo Real
```bash
# Terminal 1: Logs CrewAI
ssh root@37.27.248.13 "docker service logs -f falachefe_crewai-api | grep -i 'transação\|financial'"

# Terminal 2: Logs Vercel
vercel logs --follow
```

### 3. Ativar Modo Verbose
Adicionar `verbose=True` e mais prints na ferramenta:
```python
def _run(self, ...):
    print(f"🔍 DEBUG: API_BASE_URL = {API_BASE_URL}")
    print(f"🔍 DEBUG: CREWAI_SERVICE_TOKEN = {CREWAI_SERVICE_TOKEN[:10]}...")
    print(f"🔍 DEBUG: Payload = {json.dumps(payload, indent=2)}")
    
    response = requests.post(api_url, ...)
    print(f"🔍 DEBUG: Status Code = {response.status_code}")
    print(f"🔍 DEBUG: Response = {response.text}")
```

---

## 📊 Checklist de Validação

- [x] Token configurado no Hetzner
- [x] URL da API configurada no Hetzner
- [x] Serviço reiniciado com sucesso
- [ ] Token verificado no Vercel (produção)
- [ ] Endpoint testado em produção
- [ ] Logs verbosos ativados
- [ ] Teste com usuário real realizado
- [ ] Erro específico identificado

---

## 🎯 Solução Provável

**Hipótese Principal**: Token divergente entre `.env.local` (desenvolvimento) e Vercel (produção).

**Ação Necessária**:
1. Acessar Vercel Dashboard
2. Verificar variável `CREWAI_SERVICE_TOKEN`
3. Se diferente: Atualizar `.env` no Hetzner com o token correto
4. Reiniciar serviço Docker

---

**Status**: 🟡 Em investigação  
**Próximo Passo**: Verificar token de produção no Vercel

