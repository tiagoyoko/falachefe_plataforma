# ⚡ Quick Start - Integração CrewAI + Falachefe

## 🎯 Comece em 5 Minutos

Este guia vai te ajudar a fazer sua primeira integração em **menos de 5 minutos**.

---

## ✅ Checklist Pré-requisitos

```bash
# 1. Servidor Next.js rodando
cd /Users/tiagoyokoyama/Falachefe
npm run dev
# ✓ Servidor em http://localhost:3000

# 2. PostgreSQL ativo
# ✓ Banco 'falachefe' criado

# 3. Variáveis de ambiente configuradas
# ✓ .env.local (projeto principal)
# ✓ .env (projeto CrewAI)
```

---

## 🚀 Passo 1: Configurar Ambiente CrewAI

```bash
# Navegar para o projeto CrewAI
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Ativar ambiente virtual
source .venv/bin/activate

# Verificar instalação
crewai --version
# ✓ crewai version 0.x.x
```

---

## 🔑 Passo 2: Configurar API Keys

Criar/editar `.env`:

```bash
# OpenAI (obrigatório)
OPENAI_API_KEY=sk-proj-seu-token-aqui
MODEL=gpt-4o-mini

# API Falachefe (local)
FALACHEFE_API_URL=http://localhost:3000

# UazAPI (opcional - só para WhatsApp)
UAZAPI_INSTANCE_ID=seu_instance_id
UAZAPI_TOKEN=seu_token
```

---

## 🧪 Passo 3: Primeiro Teste (Tool Direta)

Crie um arquivo `teste_rapido.py`:

```python
#!/usr/bin/env python
"""Teste rápido da integração"""

from falachefe_crew.tools.cashflow_tools import (
    GetCashflowBalanceTool,
    AddCashflowTransactionTool
)

print("="*60)
print("TESTE DE INTEGRAÇÃO CREWAI + FALACHEFE")
print("="*60)

# 1. CONSULTAR SALDO
print("\n1️⃣ Consultando saldo...")
balance_tool = GetCashflowBalanceTool()
saldo = balance_tool._run(
    user_id="test_empresa",
    period="month"
)
print(saldo)

# 2. ADICIONAR TRANSAÇÃO
print("\n2️⃣ Adicionando transação...")
add_tool = AddCashflowTransactionTool()
resultado = add_tool._run(
    user_id="test_empresa",
    transaction_type="entrada",
    amount=1000.00,
    category="vendas",
    description="Venda teste - Quick Start"
)
print(resultado)

# 3. CONSULTAR NOVAMENTE
print("\n3️⃣ Consultando saldo atualizado...")
saldo_novo = balance_tool._run(
    user_id="test_empresa",
    period="month"
)
print(saldo_novo)

print("\n" + "="*60)
print("✅ TESTE CONCLUÍDO COM SUCESSO!")
print("="*60)
```

Execute:

```bash
python teste_rapido.py
```

**Saída esperada:**

```
============================================================
TESTE DE INTEGRAÇÃO CREWAI + FALACHEFE
============================================================

1️⃣ Consultando saldo...
💰 Saldo Atual do Fluxo de Caixa
📊 Período: Últimos 30 dias

✅ Entradas: R$ 25,000.00
❌ Saídas: R$ 18,000.00
💵 Saldo: R$ 7,000.00

2️⃣ Adicionando transação...
✅ Transação Registrada com Sucesso no Banco de Dados!
💸 Tipo: Entrada
💵 Valor: R$ 1,000.00
📁 Categoria: vendas
📝 Descrição: Venda teste - Quick Start
🆔 ID da transação: abc-123-def

3️⃣ Consultando saldo atualizado...
💰 Saldo Atual do Fluxo de Caixa
📊 Período: Últimos 30 dias

✅ Entradas: R$ 26,000.00
❌ Saídas: R$ 18,000.00
💵 Saldo: R$ 8,000.00

============================================================
✅ TESTE CONCLUÍDO COM SUCESSO!
============================================================
```

---

## 🤖 Passo 4: Teste com Agente IA

Crie `teste_com_ia.py`:

```python
#!/usr/bin/env python
"""Teste com agente de IA"""

from falachefe_crew.crew import FalachefeCrew

print("="*60)
print("TESTE COM AGENTE INTELIGENTE")
print("="*60)

# Criar crew hierárquica
crew = FalachefeCrew()
orchestrated = crew.orchestrated_crew()

# Input do usuário (linguagem natural)
print("\n📝 Enviando pergunta ao agente...")
resultado = orchestrated.kickoff(inputs={
    "user_message": """
        Olá! Preciso de ajuda:
        1. Qual é o meu saldo atual?
        2. Registre uma despesa de R$ 500 em alimentação
        3. Me dê uma dica de economia
    """,
    "user_id": "test_empresa",
    "phone_number": "+5511999999999"
})

print("\n🤖 Resposta do agente:")
print(resultado)

print("\n" + "="*60)
print("✅ TESTE COM IA CONCLUÍDO!")
print("="*60)
```

Execute:

```bash
python teste_com_ia.py
```

**O que acontece:**

1. ✅ Orchestrator analisa a mensagem
2. ✅ Delega para Financial Expert
3. ✅ Agente consulta saldo via GetBalanceTool
4. ✅ Agente registra despesa via AddTransactionTool
5. ✅ Agente fornece dica personalizada
6. ✅ Support Agent formata resposta

---

## 📊 Passo 5: Verificar no Banco

```bash
# Conectar ao PostgreSQL
psql -U postgres -d falachefe

# Ver transações criadas
SELECT 
  id,
  user_id,
  type,
  amount / 100.0 as valor_reais,
  category,
  description,
  date,
  created_at
FROM financial_data
WHERE user_id = 'test_empresa'
ORDER BY created_at DESC
LIMIT 5;
```

**Saída esperada:**

```
         id          |   user_id    | type    | valor_reais | category    | description            | date                | created_at
---------------------+--------------+---------+-------------+-------------+------------------------+---------------------+---------------------
 abc-123-def-456     | test_empresa | saida   | 500.00      | alimentacao | Despesa registrada...  | 2025-10-08 00:00:00 | 2025-10-08 20:30:00
 xyz-789-ghi-012     | test_empresa | entrada | 1000.00     | vendas      | Venda teste...         | 2025-10-08 00:00:00 | 2025-10-08 20:25:00
```

---

## 🎉 Próximos Passos

### Você acabou de:
- ✅ Configurar o ambiente CrewAI
- ✅ Testar integração com API
- ✅ Usar agente de IA
- ✅ Salvar dados no PostgreSQL

### Explore mais:

1. **Guia Completo**
   ```bash
   cat docs/crewai/GUIA-INTEGRACAO.md
   ```

2. **Modos de Uso**
   ```bash
   cat docs/crewai/MODOS-DE-USO.md
   ```

3. **Exemplos Avançados**
   ```bash
   python exemplo_integracao_completa.py
   ```

---

## 🐛 Problemas Comuns

### Erro: "Connection refused"

```bash
❌ ConnectionError: [Errno 61] Connection refused
```

**Solução:**
```bash
# Verifique se o servidor está rodando
cd /Users/tiagoyokoyama/Falachefe
npm run dev
```

### Erro: "Invalid API Key"

```bash
❌ AuthenticationError: Invalid API Key
```

**Solução:**
```bash
# Verifique seu .env
cd crewai-projects/falachefe_crew
cat .env | grep OPENAI

# Se vazio, adicione:
echo "OPENAI_API_KEY=sk-proj-sua-chave" >> .env
```

### Erro: "userId é obrigatório"

```bash
❌ 400 Bad Request: userId é obrigatório
```

**Solução:**
```python
# SEMPRE passe user_id
tool._run(
    user_id="test_empresa",  # ⚠️ OBRIGATÓRIO
    # ... outros parâmetros
)
```

---

## 📚 Recursos

| Recurso | Link |
|---------|------|
| **Guia Completo** | [GUIA-INTEGRACAO.md](./GUIA-INTEGRACAO.md) |
| **Modos de Uso** | [MODOS-DE-USO.md](./MODOS-DE-USO.md) |
| **API Docs** | [README-INTEGRACAO-API.md](../../crewai-projects/falachefe_crew/README-INTEGRACAO-API.md) |
| **LGPD** | [LGPD-COMPLIANCE.md](../../crewai-projects/falachefe_crew/LGPD-COMPLIANCE.md) |

---

## 🆘 Ajuda

Em caso de problemas:

1. Verifique os logs do servidor: `npm run dev`
2. Verifique os logs do CrewAI
3. Consulte a documentação
4. Execute os testes: `python teste_rapido.py`

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│  INTEGRAÇÃO EM 5 PASSOS                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. ✅ Configurar ambiente CrewAI                       │
│     └─ cd crewai-projects/falachefe_crew                │
│                                                         │
│  2. ✅ Configurar API Keys (.env)                       │
│     └─ OPENAI_API_KEY + FALACHEFE_API_URL              │
│                                                         │
│  3. ✅ Teste Tool Direta                                │
│     └─ python teste_rapido.py                          │
│                                                         │
│  4. ✅ Teste com IA                                     │
│     └─ python teste_com_ia.py                          │
│                                                         │
│  5. ✅ Verificar no banco                               │
│     └─ psql -U postgres -d falachefe                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Tempo total:** ⏱️ ~5 minutos  
**Dificuldade:** 🟢 Iniciante  
**Status:** ✅ Testado e funcionando

---

**Última atualização**: 08/10/2025  
**Versão**: 1.0.0

