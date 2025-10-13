# Contexto Real de Usuários - Integração Supabase

**Data:** 12/10/2025  
**Status:** ✅ Implementado e em Produção

---

## 🎯 Objetivo

Substituir dados genéricos/mockados por **dados REAIS** do usuário e empresa buscados diretamente do Supabase antes de enviar para os agentes CrewAI.

---

## 📊 Dados Buscados

### 1. **Dados do Usuário e Empresa** (`user_onboarding`)

**Endpoint:** `/rest/v1/user_onboarding?user_id=eq.{user_id}`

**Campos:**
- `first_name` + `last_name` → Nome completo
- `company_name` → Nome da empresa
- `industry` → Setor da empresa
- `company_size` → Porte (1-10, 11-50, etc)
- `position` → Cargo do usuário
- `whatsapp_phone` → Telefone WhatsApp

**Contexto gerado:**
```
Empresa: Padaria do João
Setor: Alimentação
Porte: 1-10
Contato: João Silva (Proprietário)
```

---

### 2. **Status Financeiro Real** (`financial_data`)

**Endpoint:** `/rest/v1/financial_data?user_id=eq.{user_id}&order=date.desc&limit=100`

**Campos:**
- `type` → receita/despesa
- `amount` → Valor em centavos (convertido para R$)
- `description` → Descrição da transação
- `category` → Categoria
- `date` → Data da transação

**Resumo gerado:**
```
Resumo Financeiro:
- Total Receitas: R$ 50000.00
- Total Despesas: R$ 12500.00
- Saldo Atual: R$ 37500.00
- Total de Transações: 15

Últimas Transações:
💰 R$ 5000.00 - Venda produto X (Vendas)
💸 R$ 2500.00 - Pagamento fornecedor (Despesas Fixas)
💰 R$ 3000.00 - Serviço prestado (Serviços)
```

---

## 🔧 Implementação

### Função: `get_user_company_data(user_id)`

```python
def get_user_company_data(user_id: str) -> dict:
    """
    Busca dados reais do usuário e empresa do Supabase
    """
    response = requests.get(
        f"{supabase_url}/rest/v1/user_onboarding?user_id=eq.{user_id}&select=first_name,last_name,whatsapp_phone,company_name,industry,company_size,position",
        headers=headers
    )
    
    data = response.json()[0]
    return {
        "company_name": data.get("company_name"),
        "company_sector": data.get("industry"),
        "company_size": data.get("company_size"),
        "user_name": f"{data['first_name']} {data['last_name']}",
        "user_role": data.get("position")
    }
```

### Função: `get_financial_status(user_id)`

```python
def get_financial_status(user_id: str) -> str:
    """
    Busca status financeiro real com cálculos de totais
    """
    response = requests.get(
        f"{supabase_url}/rest/v1/financial_data?user_id=eq.{user_id}&select=type,amount,description,category,date&order=date.desc&limit=100",
        headers=headers
    )
    
    transactions = response.json()
    
    # Calcular totais
    total_receitas = sum(t['amount'] for t in transactions if t['type'] == 'receita')
    total_despesas = sum(t['amount'] for t in transactions if t['type'] == 'despesa')
    saldo = total_receitas - total_despesas
    
    # Retornar resumo formatado
    return resumo_formatado
```

---

## 📦 Variáveis de Ambiente

### Configuradas no `.env` (Hetzner):

```bash
SUPABASE_URL=https://zpdartuyaergbxmbmtur.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔄 Fluxo Completo

```
1. Mensagem chega → /process

2. Classificador LLM detecta: "financial_task"

3. ANTES de chamar CrewAI:
   ├─ get_user_company_data(user_id)
   │  └─ Busca: João Silva | Padaria do João | Alimentação
   │
   └─ get_financial_status(user_id)
      └─ Busca transações e calcula saldo

4. Monta payload para CrewAI:
   {
     "user_id": "abc123",
     "question": "Adicionar 50 mil reais de saldo inicial",
     "company_context": "Empresa: Padaria do João\nSetor: Alimentação...",
     "financial_status": "Resumo Financeiro:\n- Total Receitas: R$ 50000.00..."
   }

5. CrewAI processa com contexto REAL

6. Responde via WhatsApp/Chat
```

---

## ✅ Benefícios

1. ✅ **Respostas Personalizadas**: Agentes sabem nome real, empresa, setor
2. ✅ **Consultoria Precisa**: Decisões baseadas em dados financeiros reais
3. ✅ **Sem Genéricos**: Nada de "Pequena empresa brasileira" genérico
4. ✅ **MVP Realista**: Pronto para testes com usuários finais
5. ✅ **Escalável**: Mesma lógica para todos usuários

---

## 📊 Casos de Uso

### Exemplo 1: Consultoria Financeira
```
Usuário: "Quero adicionar 50 mil reais de saldo inicial"

CrewAI recebe:
- Nome: João Silva
- Empresa: Padaria do João (Setor: Alimentação)
- Status atual: Sem transações ainda

Resposta: "João, vou registrar os R$ 50.000,00 como saldo inicial 
da Padaria do João. Como este é seu primeiro lançamento..."
```

### Exemplo 2: Análise de Fluxo
```
Usuário: "Analise meu fluxo de caixa"

CrewAI recebe:
- Receitas: R$ 85.000,00
- Despesas: R$ 42.000,00
- Saldo: R$ 43.000,00
- Últimas transações detalhadas

Resposta: "Analisando o fluxo da Padaria do João:
Você está com saldo positivo de R$ 43k...
Suas principais receitas vêm de..."
```

---

## 🔒 Segurança

- ✅ API Key do Supabase via variável de ambiente
- ✅ Autenticação Bearer Token
- ✅ Row Level Security no Supabase (se configurado)
- ✅ Logs de acesso aos dados

---

## 🚀 Deploy

**Servidor:** Hetzner (37.27.248.13)  
**Container:** Docker Stack  
**Status:** ✅ Rodando em produção

---

## 📝 Próximos Passos

1. **Cache de Dados**: Cachear dados de empresa (mudam pouco)
2. **Agregações**: Pré-calcular totais mensais/anuais
3. **Histórico**: Comparar períodos (mês atual vs anterior)
4. **Notificações**: Alertas de gastos/receitas incomuns

---

**Autor:** AI Assistant  
**Revisão:** Tiago Yokoyama  
**Deploy:** 12/10/2025 22:11 UTC



