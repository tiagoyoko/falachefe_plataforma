# 🔌 Integração CrewAI + Falachefe API

## Visão Geral

Os agentes do CrewAI agora estão integrados com a API do Falachefe e salvam dados **reais no banco de dados PostgreSQL**.

## ✅ O Que Mudou

### Antes (Mock)
```python
# Dados simulados em memória
transaction = {
    "id": f"txn_{timestamp}",
    "amount": 5000,
    # Perdido após execução
}
```

### Agora (Produção)
```python
# POST para API → Salvo no PostgreSQL
response = requests.post(
    "http://localhost:3000/api/financial/transactions",
    json={
        "userId": "user-123",  # ⚠️ OBRIGATÓRIO (LGPD)
        "type": "saida",
        "amount": 5000,
        "category": "aluguel",
        "description": "Pagamento aluguel outubro"
    }
)
# ✅ Dados persistidos no banco
```

## 🔒 LGPD Compliance

### userId é OBRIGATÓRIO

Para compliance com LGPD, **todas as operações exigem userId**:

```python
# ❌ ERRO - Sem userId
add_transaction(
    type="saida",
    amount=5000,
    category="aluguel"
)
# → 400 Bad Request: "userId é obrigatório"

# ✅ CORRETO - Com userId
add_transaction(
    user_id="user-123",  # OBRIGATÓRIO
    type="saida",
    amount=5000,
    category="aluguel"
)
```

### Proteções Implementadas

1. **Autenticação Obrigatória** - API requer sessão válida
2. **Isolamento de Dados** - Usuário só acessa seus próprios dados
3. **Audit Trail** - Todas operações são logadas
4. **Metadata de Rastreabilidade** - Quem criou, quando, de onde

Ver [LGPD-COMPLIANCE.md](./LGPD-COMPLIANCE.md) para detalhes completos.

## 📊 Endpoints Disponíveis

### 1. Criar Transação

**POST** `/api/financial/transactions`

```python
payload = {
    "userId": "user-123",      # ⚠️ OBRIGATÓRIO
    "type": "entrada",         # ou "saida"
    "amount": 5000.00,         # em reais
    "description": "Venda produtos",
    "category": "vendas",
    "date": "2025-10-07",      # opcional (hoje se omitido)
    "metadata": {}             # opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-da-transacao",
    "userId": "user-123",
    "type": "entrada",
    "amount": 500000,        // centavos
    "amountInReais": 5000.00,
    "category": "vendas",
    "date": "2025-10-07T00:00:00.000Z",
    "metadata": {
      "createdBy": "user-123",
      "createdAt": "2025-10-07T20:00:00Z",
      // ...audit trail
    }
  }
}
```

### 2. Listar Transações

**GET** `/api/financial/transactions?userId=user-123`

**Query Params:**
- `userId` - ⚠️ OBRIGATÓRIO
- `type` - entrada | saida (opcional)
- `category` - categoria específica (opcional)
- `startDate` - formato YYYY-MM-DD (opcional)
- `endDate` - formato YYYY-MM-DD (opcional)
- `limit` - máximo de resultados (padrão: 100)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "entrada",
        "amountInReais": 5000.00,
        "category": "vendas",
        "date": "2025-10-07",
        // ...
      }
    ],
    "summary": {
      "total": 10,
      "entradas": 15000.00,
      "saidas": 8000.00,
      "saldo": 7000.00
    }
  }
}
```

## 🛠️ Configuração

### 1. Variáveis de Ambiente

Criar/atualizar `.env` no projeto CrewAI:

```bash
# API do Falachefe
FALACHEFE_API_URL=http://localhost:3000

# OpenAI (já configurado)
OPENAI_API_KEY=sk-proj-...
MODEL=gpt-4o-mini
```

### 2. Dependências Python

Já incluído em `pyproject.toml`:

```toml
[tool.crewai]
dependencies = [
    "requests>=2.31.0",  # Para chamadas HTTP
]
```

## 🧪 Testando a Integração

### 1. Iniciar o Servidor Next.js

```bash
cd /Users/tiagoyokoyama/Falachefe
npm run dev
```

### 2. Executar os Testes CrewAI

```bash
cd crewai-projects/falachefe_crew
export OPENAI_API_KEY="sua-chave"
crewai test -n 1 -m gpt-4o-mini
```

### 3. Verificar no Banco

```bash
# Conectar ao PostgreSQL
psql -U postgres -d falachefe

# Consultar transações criadas
SELECT 
  id, 
  user_id, 
  type, 
  amount / 100.0 as amount_reais,
  category,
  date,
  created_at
FROM financial_data
ORDER BY created_at DESC
LIMIT 10;
```

## 📝 Exemplo Completo

```python
from crewai_projects.falachefe_crew.tools.cashflow_tools import AddCashflowTransactionTool

# Criar instância da tool
tool = AddCashflowTransactionTool()

# Usar a tool
result = tool._run(
    user_id="user-123",           # ⚠️ OBRIGATÓRIO
    transaction_type="saida",
    amount=5000.00,
    category="aluguel",
    description="Pagamento aluguel outubro",
    date="2025-10-07"
)

print(result)
# ✅ Transação Registrada com Sucesso no Banco de Dados!
# 💸 Tipo: Saída
# 💵 Valor: R$ 5,000.00
# 📁 Categoria: aluguel
# 📅 Data: 2025-10-07
# 📝 Descrição: Pagamento aluguel outubro
# 🆔 ID da transação: uuid-gerado
# 💾 Salvo em: PostgreSQL (financial_data)
```

## 🔍 Logs e Debug

### Console da API

```bash
📤 Enviando transação para API: http://localhost:3000/api/financial/transactions
   Dados: {
     "userId": "test_empresa",
     "type": "saida",
     "amount": 5000,
     ...
   }
📝 LGPD Audit: User test_empresa criou transação para test_empresa em 2025-10-07T20:00:00Z
✅ Transação criada: uuid-da-transacao
```

### Console do CrewAI

```bash
🚀 Crew: crew
└── 📋 Task: update_cashflow
    └── 🔧 Used Adicionar Transação ao Fluxo de Caixa (1)
        ✅ Transação registrada com sucesso
```

## ⚠️ Erros Comuns

### 1. Erro: userId é obrigatório

```python
# ❌ Faltou userId
tool._run(type="saida", amount=5000)

# ✅ Corrigido
tool._run(user_id="user-123", type="saida", amount=5000)
```

### 2. Erro: Não autorizado (401)

A API requer autenticação. Para testes:
- Use um userId existente no banco
- Ou desabilite temporariamente a auth (apenas desenvolvimento)

### 3. Erro: Conexão recusada

```bash
❌ Erro de conexão: Não foi possível conectar à API em http://localhost:3000
```

**Solução**: Verificar se o Next.js está rodando:
```bash
cd /Users/tiagoyokoyama/Falachefe
npm run dev
```

### 4. Erro: Acesso negado (403)

```
User user-A tentou criar transação para user-B
```

**Motivo**: LGPD - usuário só pode criar transações para si mesmo.
**Solução**: Usar o mesmo userId do usuário autenticado.

## 📚 Referências

- [LGPD-COMPLIANCE.md](./LGPD-COMPLIANCE.md) - Detalhes de compliance
- [cashflow_tools.py](./src/falachefe_crew/tools/cashflow_tools.py) - Implementação das tools
- [API Route](../../src/app/api/financial/transactions/route.ts) - Código da API

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs do Next.js (`npm run dev`)
2. Verificar logs do CrewAI
3. Consultar [LGPD-COMPLIANCE.md](./LGPD-COMPLIANCE.md)
4. Verificar se o userId existe no banco

---

**Última atualização**: 07/10/2025  
**Versão**: 1.0.0  
**Status**: ✅ Produção

