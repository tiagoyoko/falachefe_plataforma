# 🛠️ Ferramentas (Tools) do Falachefe CrewAI

## Visão Geral

As **tools** são ferramentas customizadas que permitem aos agentes de IA interagir com sistemas externos, bancos de dados e APIs. No Falachefe, criamos ferramentas específicas para cada área de atuação dos agentes.

## 📊 Ferramentas de Fluxo de Caixa (cashflow_tools.py)

### Como Funciona

Cada tool é uma classe que herda de `BaseTool` do CrewAI e implementa:

1. **Input Schema** (Pydantic Model) - Define os parâmetros de entrada
2. **Método `_run()`** - Contém a lógica de execução
3. **Metadados** - Nome e descrição para o agente entender quando usar

### Ferramentas Disponíveis

#### 1. GetCashflowBalanceTool 💰

**Quando o agente usa:**
- Usuário pergunta: "Qual é o meu saldo atual?"
- Usuário pergunta: "Quanto dinheiro tenho disponível?"
- Usuário pergunta: "Como está minha situação financeira?"

**O que faz:**
- Consulta o saldo total do fluxo de caixa
- Retorna entradas, saídas e saldo líquido
- Mostra a data da última atualização

**Exemplo de uso pelo agente:**
```python
# O agente internamente chama:
result = GetCashflowBalanceTool()._run(
    user_id="empresa_123",
    period="current_month"
)
```

**Resposta:**
```
Saldo do Fluxo de Caixa - current_month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Entradas:  R$ 45,000.00
💸 Saídas:    R$ 32,500.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Saldo:     R$ 12,500.00

Última atualização: 2025-01-07T10:30:00
```

---

#### 2. GetCashflowCategoriesTool 📁

**Quando o agente usa:**
- Usuário pergunta: "Quais são as principais categorias de custos deste mês?"
- Usuário pergunta: "Onde estou gastando mais?"
- Usuário pergunta: "Qual a maior despesa?"

**O que faz:**
- Lista as categorias de custos ou receitas
- Ordena por valor (maior para menor)
- Calcula percentual de cada categoria
- Mostra gráfico de barras em ASCII

**Exemplo de uso pelo agente:**
```python
result = GetCashflowCategoriesTool()._run(
    user_id="empresa_123",
    period="2025-01",
    transaction_type="saida"  # ou "entrada"
)
```

**Resposta:**
```
Principais Categorias de Custos - 2025-01
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Fornecedores
   R$ 12,000.00 (36.9%)
   ███████

2. Salários
   R$ 8,000.00 (24.6%)
   ████

3. Aluguel
   R$ 3,500.00 (10.8%)
   ██

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: R$ 32,500.00
```

---

#### 3. AddCashflowTransactionTool ✍️

**Quando o agente usa:**
- Usuário diz: "Recebi R$ 5.000 de vendas hoje"
- Usuário diz: "Paguei R$ 3.000 de aluguel"
- Usuário diz: "Registrar despesa de R$ 1.500 com marketing"

**O que faz:**
- Adiciona uma nova transação ao banco de dados
- Valida os dados de entrada
- Retorna confirmação com ID da transação

**Exemplo de uso pelo agente:**
```python
result = AddCashflowTransactionTool()._run(
    user_id="empresa_123",
    transaction_type="saida",
    amount=3000.00,
    category="aluguel",
    description="Aluguel do escritório",
    date="2025-01-05"
)
```

**Resposta:**
```
✅ Transação Registrada com Sucesso!

💸 Tipo: Saída
💵 Valor: R$ 3,000.00
📁 Categoria: aluguel
📅 Data: 2025-01-05
📝 Descrição: Aluguel do escritório

ID da transação: txn_1736244600.123
```

---

#### 4. GetCashflowSummaryTool 📊

**Quando o agente usa:**
- Usuário pede: "Me dê um relatório completo"
- Usuário pede: "Análise completa das finanças"
- Usuário pede: "Resumo do mês"

**O que faz:**
- Gera relatório completo com múltiplas análises
- Mostra evolução do saldo
- Lista principais entradas e saídas
- Identifica alertas e tendências

**Exemplo de uso pelo agente:**
```python
result = GetCashflowSummaryTool()._run(
    user_id="empresa_123",
    period="2025-01"
)
```

**Resposta:**
```
📊 RESUMO COMPLETO DO FLUXO DE CAIXA
Período: 2025-01
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 RESUMO FINANCEIRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saldo Inicial:     R$ 8,000.00
(+) Entradas:      R$ 45,000.00
(-) Saídas:        R$ 32,500.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saldo Final:       R$ 20,500.00
Variação:          +156.25%

📈 PRINCIPAIS ENTRADAS
  • Vendas: R$ 40,000.00
  • Serviços: R$ 5,000.00

📉 PRINCIPAIS SAÍDAS
  • Fornecedores: R$ 12,000.00
  • Salários: R$ 8,000.00
  • Aluguel: R$ 3,500.00

🚨 ALERTAS E OBSERVAÇÕES
  ⚠️ Custos com fornecedores aumentaram 15% em relação ao mês anterior
  ✅ Saldo positivo e crescente - boa saúde financeira
```

---

## 🔄 Como o Agente Decide Qual Tool Usar

O CrewAI usa o **LLM** (GPT-4) para analisar:

1. **A pergunta do usuário**
2. **A descrição de cada tool**
3. **O contexto da conversa**

Então o agente **automaticamente escolhe** a tool mais adequada.

### Exemplo de Fluxo:

```
Usuário: "Qual é o meu saldo atual?"
    ↓
Agente analisa a pergunta
    ↓
Agente lê as descrições das tools disponíveis
    ↓
Agente decide: "Vou usar GetCashflowBalanceTool"
    ↓
Agente executa: GetCashflowBalanceTool()._run(user_id="...")
    ↓
Tool retorna os dados formatados
    ↓
Agente apresenta ao usuário de forma natural
```

---

## 🔌 Integração com Banco de Dados (Produção)

Atualmente as tools usam **dados simulados** para demonstração. Para integrar com o banco de dados real do Falachefe (PostgreSQL via Prisma), você deve:

### 1. Adicionar Cliente Prisma

```python
# No início do arquivo cashflow_tools.py
from prisma import Prisma

# Cliente global
db = Prisma()
```

### 2. Atualizar o Método `_run()`

**Antes (simulado):**
```python
def _run(self, user_id: str, period: str) -> str:
    # Dados simulados
    result = {
        "entradas": 45000.00,
        "saidas": 32500.00,
    }
    return format_response(result)
```

**Depois (real):**
```python
async def _run(self, user_id: str, period: str) -> str:
    await db.connect()
    
    # Query real no banco
    transactions = await db.cashflow_transaction.find_many(
        where={
            "user_id": user_id,
            "period": period
        }
    )
    
    # Calcular totais
    entradas = sum(t.amount for t in transactions if t.type == "entrada")
    saidas = sum(t.amount for t in transactions if t.type == "saida")
    
    result = {
        "entradas": entradas,
        "saidas": saidas,
        "saldo": entradas - saidas
    }
    
    await db.disconnect()
    return format_response(result)
```

### 3. Schema Prisma Sugerido

```prisma
model CashflowTransaction {
  id             String   @id @default(cuid())
  userId         String   @map("user_id")
  type           String   // "entrada" ou "saida"
  amount         Decimal  @db.Decimal(10, 2)
  category       String
  description    String?
  date           DateTime @db.Date
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  @@map("cashflow_transactions")
  @@index([userId, date])
}
```

---

## 🎯 Criando Novas Tools

Para criar uma nova tool, siga este template:

```python
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type

# 1. Definir Input Schema
class MyToolInput(BaseModel):
    """Descrição do input."""
    param1: str = Field(..., description="Descrição do parâmetro 1")
    param2: int = Field(default=10, description="Descrição do parâmetro 2")

# 2. Criar a Tool
class MyCustomTool(BaseTool):
    name: str = "Nome da Ferramenta"
    description: str = (
        "Descrição clara do que esta tool faz. "
        "O agente usa esta descrição para decidir quando usar a tool."
    )
    args_schema: Type[BaseModel] = MyToolInput
    
    def _run(self, param1: str, param2: int = 10) -> str:
        """Lógica da ferramenta."""
        # Seu código aqui
        result = f"Processado: {param1} com {param2}"
        return result
```

---

## 📚 Referências

- [Documentação Oficial CrewAI Tools](https://docs.crewai.com/concepts/tools)
- [Custom Tools Guide](https://docs.crewai.com/learn/create-custom-tools)
- [BaseTool API Reference](https://docs.crewai.com/api/tools/base-tool)

---

**Desenvolvido para o Falachefe** 🚀


