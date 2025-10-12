# Deploy: Tools Financeiras + Prompt Melhorado

**Data:** 12/10/2025  
**Status:** 🔄 Em Implementação

---

## 🎯 Problema Identificado

O agente `financial_expert` estava respondendo de forma **genérica/teórica** quando o usuário pedia para **adicionar valores no fluxo de caixa**, ao invés de **executar a ação** no banco de dados.

### Exemplo do problema:

**Usuário:** "Adicionar saldo inicial no fluxo de caixa de 50 mil reais"

**Resposta anterior (❌ ERRADA):**
```
Para adicionar um saldo inicial de 50 mil reais ao seu fluxo de caixa,
você pode seguir os seguintes passos práticos:

1. Registro da Transação: Você deve registrar essa entrada no sistema...
2. Verificação Mensal: É importante verificar mensalmente...
[... texto longo e genérico ...]
```

**Resposta esperada (✅ CORRETA):**
```
✅ Transação Registrada com Sucesso no Banco de Dados!

💰 Tipo: Entrada
💵 Valor: R$ 50.000,00
📁 Categoria: Saldo Inicial
📅 Data: 2025-10-12

🆔 ID da transação: abc-123-def
💾 Salvo em: PostgreSQL (financial_data)
```

---

## 🔧 Soluções Implementadas

### 1. **Prompt Melhorado do Agente**

Modificado `/crewai-projects/falachefe_crew/src/falachefe_crew/config/agents.yaml`:

```yaml
financial_expert:
  goal: >
    EXECUTAR ações no sistema de fluxo de caixa: registrar transações, consultar saldos.
    Quando o usuário pedir para adicionar/registrar/lançar valores, VOCÊ DEVE USAR 
    A FERRAMENTA para salvar no banco. Não dê apenas instruções ou teoria - EXECUTE A AÇÃO.
  
  backstory: >
    Você é um assistente financeiro EXECUTIVO com acesso direto ao PostgreSQL.
    REGRA CRÍTICA: Se o usuário pedir para ADICIONAR/REGISTRAR/LANÇAR qualquer valor,
    você DEVE usar a ferramenta "Adicionar Transação ao Fluxo de Caixa" IMEDIATAMENTE.
    Nunca dê apenas instruções teóricas quando pode executar a ação.
```

### 2. **Task Melhorada**

Modificado `/crewai-projects/falachefe_crew/src/falachefe_crew/config/tasks.yaml`:

```yaml
financial_advice:
  description: >
    IMPORTANTE - LEIA ATENTAMENTE:
    1. Se a solicitação é para ADICIONAR/REGISTRAR/LANÇAR qualquer valor:
       → VOCÊ DEVE USAR A FERRAMENTA "Adicionar Transação ao Fluxo de Caixa"
       → NÃO dê apenas instruções teóricas
       → EXECUTE A AÇÃO no banco de dados
    
    Você TEM ferramentas. USE-AS!
  
  expected_output: >
    Se executou ferramenta:
    - ✅ Confirmação da ação executada
    - 🆔 ID da transação no banco
    - 📊 Resultado da operação
    
    Tom: executivo e direto
    Formato: curto e objetivo (máximo 10 linhas)
```

### 3. **Tools Já Disponíveis**

O agente `financial_expert` já tem 4 ferramentas configuradas em `crew.py`:

```python
@agent
def financial_expert(self) -> Agent:
    return Agent(
        config=self.agents_config['financial_expert'],
        tools=[
            GetCashflowBalanceTool(),        # Consultar saldo
            GetCashflowCategoriesTool(),      # Análise por categoria
            AddCashflowTransactionTool(),     # ✅ ADICIONAR TRANSAÇÃO
            GetCashflowSummaryTool(),         # Resumo completo
        ]
    )
```

---

## ⚠️ Problema Técnico Identificado

A tool `AddCashflowTransactionTool` está configurada para chamar:
```
POST http://localhost:3000/api/financial/test
```

**Problemas:**
1. ❌ URL aponta para localhost (não funciona no Hetzner)
2. ❌ Endpoint `/api/financial/test` não existe
3. ❌ Endpoint `/api/financial/transactions` requer autenticação

---

## 🔄 Próximas Ações Necessárias

### Opção A: Criar endpoint `/api/financial/test` (MÁ PRÁTICA)
- Endpoint sem auth apenas para CrewAI
- ❌ Não recomendado (segurança)

### Opção B: Tool acessa Supabase diretamente (✅ RECOMENDADO)
- Modificar `cashflow_tools.py` para usar Supabase REST API
- Mesmo padrão do `api_server.py`:
  ```python
  response = requests.post(
      f"{supabase_url}/rest/v1/financial_data",
      json=payload,
      headers={
          "apikey": supabase_key,
          "Authorization": f"Bearer {supabase_key}",
          "Content-Type": "application/json"
      }
  )
  ```

### Opção C: Criar token de serviço para CrewAI
- Next.js API aceita header `X-CREWAI-TOKEN`
- ❌ Requer mudanças em múltiplos pontos

---

## 📋 Checklist

- [x] Melhorar prompt do agente financial_expert
- [x] Melhorar task financial_advice
- [ ] Atualizar `AddCashflowTransactionTool` para usar Supabase
- [ ] Testar com mensagem: "Adicionar 50 mil reais"
- [ ] Validar que transação é salva no PostgreSQL
- [ ] Deploy para Hetzner

---

## 🚀 Deploy

**Após completar:**
1. Deploy de `agents.yaml` e `tasks.yaml` ✅
2. Deploy de `cashflow_tools.py` (quando atualizado)
3. Rebuild Docker image no Hetzner
4. Update Docker Stack service

---

**Status Atual:** Prompts melhorados, aguardando atualização da tool para usar Supabase diretamente.

