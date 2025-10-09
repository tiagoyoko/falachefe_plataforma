# 🏗️ Arquitetura Hierárquica CrewAI - Fluxo de Caixa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Problema Identificado](#problema-identificado)
3. [Arquitetura Implementada](#arquitetura-implementada)
4. [Testes e Validações](#testes-e-validações)
5. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

### Objetivo Original
Criar uma crew especialista em fluxo de caixa onde:
- Um **roteador principal** classifica o request do usuário
- A **crew de fluxo de caixa** recebe apenas requests relevantes
- Um **manager** dentro da crew delega para o agente especializado correto
- O **agente especializado** executa a ação (adicionar, consultar, editar, etc.)

### Exemplo de Fluxo Desejado

**Exemplo 1: Adicionar Transação**
```
Usuário: "Quero adicionar 100,00 no fluxo de caixa de uma venda de ontem"
    ↓
Flow Roteador: Classifica como "cashflow"
    ↓
Cashflow Manager: Identifica necessidade de "adicionar transação"
    ↓
Registrador: Executa tool AddCashflowTransactionTool
    ↓
PostgreSQL: Transação salva com sucesso
    ↓
Usuário: "Transação #abc123 adicionada com sucesso"
```

**Exemplo 2: Dúvida Geral**
```
Usuário: "O que é fluxo de caixa?"
    ↓
Flow Roteador: Classifica como "cashflow"
    ↓
Cashflow Manager: Identifica como "dúvida conceitual"
    ↓
Consultor: Responde com explicação didática
    ↓
Usuário: "Fluxo de caixa é o controle de entradas e saídas..."
```

---

## ❌ Problema Identificado

### 🔍 Descoberta Crítica

Após implementação e testes extensivos, identificamos que:

**❌ O processo `Process.hierarchical` NÃO executa tools corretamente**

#### Evidências:

1. **Teste com Hierarchical Process**
   - Manager delegou corretamente para "Registrador de Transações"
   - Registrador respondeu: "Transação adicionada com sucesso"
   - ❌ **Tool não foi executada**
   - ❌ **Nenhuma transação no banco de dados**
   - ❌ **Nenhum log de chamada HTTP para API**

2. **Teste com Agente Direto (sem manager)**
   - Agente executou a tool imediatamente
   - ✅ **Transação salva no PostgreSQL**
   - ✅ **Logs HTTP confirmados**
   - ✅ **ID retornado: `02c52d1d-32fc-4a83-9998-34457866b4dd`**

#### Consulta ao Banco Confirma

```sql
-- Buscar transações dos testes
SELECT 
  id,
  user_id,
  amount / 100.0 as valor_reais,
  category,
  description,
  created_at
FROM public.financial_data
WHERE created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;
```

**Resultado:**
| User ID | Valor | Descrição | Criado |
|---------|-------|-----------|--------|
| usuario_teste_direto | R$ 100 | Teste direto | ✅ 23:59:31 |
| real_test_user | R$ 100 | Transação entrada | ✅ 23:40:29 |
| real_test_user | R$ 100 | Transação entrada | ✅ 23:39:52 |
| ❌ **usuario_teste_1** | - | **AUSENTE** | - |

**Conclusão:** O processo hierarchical delega, mas o agente delegado **não executa tools**.

---

## 🏗️ Arquitetura Implementada

### Estrutura de Diretórios

```
crewai-projects/falachefe_crew/src/falachefe_crew/
├── flows/
│   ├── __init__.py
│   └── main_flow.py              # Flow roteador principal
├── crews/
│   ├── __init__.py
│   ├── cashflow_crew.py          # ❌ Hierarchical (não funciona)
│   └── cashflow_crew_sequential.py  # ✅ Sequential (funciona)
├── tools/
│   └── cashflow_tools.py         # Tools de integração com API
└── config/
    ├── agents.yaml
    └── tasks.yaml
```

### 1. Flow Roteador Principal

**Arquivo:** `flows/main_flow.py`

```python
from crewai.flow.flow import Flow, listen, start, router
from pydantic import BaseModel

class FalachefeState(BaseModel):
    user_id: str
    user_request: str
    request_type: str = ""
    final_response: str = ""

class FalachefeFlow(Flow[FalachefeState]):
    
    @start()
    def receive_request(self):
        """Recebe o request do usuário"""
        print(f"📥 Request: {self.state.user_request}")
        return "request_received"
    
    @router(receive_request)
    def classify_request(self):
        """Classifica o tipo de request"""
        request = self.state.user_request.lower()
        
        if any(word in request for word in ["fluxo", "caixa", "venda", "custo", "transação"]):
            self.state.request_type = "cashflow"
            return "cashflow"
        # ... outros tipos
        
        return "unknown"
    
    @listen("cashflow")
    def execute_cashflow_crew(self):
        """Executa a Crew de Fluxo de Caixa"""
        # ❌ VERSÃO HIERARCHICAL (não executa tools)
        # cashflow_crew = CashflowCrew().crew()
        
        # ✅ VERSÃO SEQUENTIAL (executa tools)
        from ..crews.cashflow_crew_sequential import CashflowCrewSequential
        crew = CashflowCrewSequential()
        
        result = crew.adicionar_transacao(
            user_id=self.state.user_id,
            amount=100.00,
            category="vendas",
            transaction_type="entrada"
        )
        
        self.state.final_response = str(result)
        return "cashflow_executed"
```

### 2. Crew Hierarchical (❌ Não Funciona com Tools)

**Arquivo:** `crews/cashflow_crew.py`

```python
from crewai import Agent, Crew, Process, Task

class CashflowCrew:
    
    def cashflow_manager(self) -> Agent:
        """Manager que delega tasks"""
        return Agent(
            role="Gerente de Fluxo de Caixa",
            goal="Coordenar especialistas de fluxo de caixa",
            backstory="Você é um gerente que delega para especialistas.",
            allow_delegation=True,  # ✅ Permite delegação
            verbose=True,
            llm="gpt-4o"
        )
    
    def transaction_recorder(self) -> Agent:
        """Especialista em adicionar transações"""
        return Agent(
            role="Registrador de Transações",
            goal="Adicionar transações no banco de dados",
            backstory="Use a tool 'Adicionar Transação' SEMPRE.",
            allow_delegation=False,
            verbose=True,
            tools=[AddCashflowTransactionTool()],  # ❌ Tool não é executada
            llm="gpt-4o-mini"
        )
    
    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[
                self.transaction_recorder(),
                # ... outros especialistas
            ],
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_llm="gpt-4o",  # Manager automático
            verbose=True
        )
```

**❌ Problema:** Quando o manager delega, o agente especializado recebe uma task genérica em texto natural e **não extrai parâmetros estruturados** para executar a tool.

### 3. Crew Sequential (✅ Funciona!)

**Arquivo:** `crews/cashflow_crew_sequential.py`

```python
from crewai import Agent, Crew, Process, Task

class CashflowCrewSequential:
    
    def adicionar_transacao(
        self, 
        user_id: str,
        amount: float,
        category: str,
        transaction_type: str = "entrada",
        date: str = None,
        description: str = None
    ) -> Any:
        """
        Adiciona transação com parâmetros estruturados
        
        ✅ Parâmetros explícitos garantem que a tool seja executada
        """
        
        registrador = Agent(
            role="Registrador de Transações",
            goal="Registrar transações usando a ferramenta",
            backstory="Use a tool 'Adicionar Transação' APENAS UMA VEZ.",
            allow_delegation=False,
            verbose=True,
            tools=[AddCashflowTransactionTool()],
            llm="gpt-4o-mini"
        )
        
        task = Task(
            description=f"""Registrar a seguinte transação:
            
            User ID: {user_id}
            Tipo: {transaction_type}
            Valor: R$ {amount:.2f}
            Categoria: {category}
            Data: {date or "ontem"}
            Descrição: {description or f"{transaction_type} - {category}"}
            
            Use a tool "Adicionar Transação ao Fluxo de Caixa" com estes parâmetros EXATOS.
            """,
            expected_output="Confirmação com ID da transação",
            agent=registrador
        )
        
        crew = Crew(
            agents=[registrador],
            tasks=[task],
            process=Process.sequential,  # ✅ Sequential funciona
            verbose=True
        )
        
        return crew.kickoff()
```

**✅ Vantagens:**
1. Parâmetros estruturados (user_id, amount, category, etc.)
2. Task específica com instruções claras
3. Tool é executada corretamente
4. Transação salva no PostgreSQL

### 4. Tools de Integração com API

**Arquivo:** `tools/cashflow_tools.py`

```python
import requests
import os
from crewai_tools import BaseTool

API_BASE_URL = os.getenv("FALACHEFE_API_URL", "http://localhost:3000")
USE_TEST_MODE = os.getenv("FALACHEFE_TEST_MODE", "true").lower() == "true"

class AddCashflowTransactionTool(BaseTool):
    name: str = "Adicionar Transação ao Fluxo de Caixa"
    description: str = """Adiciona uma transação ao banco de dados.
    
    Parâmetros:
    - user_id: ID do usuário (obrigatório)
    - type: "entrada" ou "saida"
    - amount: valor em reais (ex: 100.50)
    - category: categoria (ex: "vendas", "salários")
    - date: data no formato YYYY-MM-DD
    - description: descrição da transação
    """
    
    def _run(
        self,
        user_id: str,
        type: str,
        amount: float,
        category: str,
        date: str,
        description: str = ""
    ) -> str:
        """Executa chamada HTTP POST para API Next.js"""
        
        payload = {
            "userId": user_id,
            "type": type,
            "amount": amount,
            "category": category,
            "date": date,
            "description": description or f"{type} - {category}"
        }
        
        endpoint = "test" if USE_TEST_MODE else "transactions"
        api_url = f"{API_BASE_URL}/api/financial/{endpoint}"
        
        print(f"📤 POST {api_url}")
        print(f"📦 {payload}")
        
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            transaction_id = data.get("data", {}).get("id", "unknown")
            
            print(f"✅ Transação criada: {transaction_id}")
            
            return f"""✅ Transação adicionada com sucesso!

ID da transação: {transaction_id}
Tipo: {type}
Valor: R$ {amount:.2f}
Categoria: {category}
Data: {date}

Impacto: Esta {type} de R$ {amount:.2f} foi registrada em {category}."""
        else:
            error = response.json().get("error", "Erro desconhecido")
            print(f"❌ Erro: {error}")
            return f"❌ Erro ao adicionar transação: {error}"
```

---

## 🧪 Testes e Validações

### Teste 1: Hierarchical Process (❌ Falhou)

**Arquivo:** `test_flow_hierarquico.py`

```python
def test_example_1():
    user_id = "usuario_teste_1"
    user_request = "Quero adicionar 100,00 no fluxo de caixa de uma venda de ontem."
    
    flow = FalachefeFlow()
    flow.state.user_id = user_id
    flow.state.user_request = user_request
    
    result = flow.kickoff()
```

**Resultado:**
- ✅ Flow roteou para "cashflow"
- ✅ Manager delegou para "Registrador"
- ❌ Tool NÃO foi executada
- ❌ Nenhuma transação no banco
- ❌ Resposta genérica sem ID

### Teste 2: Agente Direto (✅ Sucesso)

**Arquivo:** `test_registrador_direto.py`

```python
def test_registrador_direto():
    registrador = Agent(
        role="Registrador",
        tools=[AddCashflowTransactionTool()],
        # ... config
    )
    
    task = Task(
        description=f"""Adicionar R$ 100 de vendas
        User: usuario_teste_direto
        Data: 2025-10-06
        """,
        agent=registrador
    )
    
    crew = Crew(agents=[registrador], tasks=[task], process=Process.sequential)
    result = crew.kickoff()
```

**Resultado:**
- ✅ Tool executada imediatamente
- ✅ Transação salva no PostgreSQL
- ✅ ID retornado: `02c52d1d-32fc-4a83-9998-34457866b4dd`
- ✅ Confirmado via query SQL

**Evidência SQL:**
```sql
SELECT * FROM financial_data 
WHERE user_id = 'usuario_teste_direto';

-- Resultado:
-- id: 02c52d1d-32fc-4a83-9998-34457866b4dd
-- amount: 10000 (centavos)
-- category: vendas
-- created_at: 2025-10-07 23:59:31
```

### Teste 3: Sequential Crew (✅ Funciona)

**Arquivo:** `test_adicionar_real.py`

```python
def main():
    test_user = f"test_confirma_{int(datetime.now().timestamp())}"
    
    crew = CashflowCrewSequential()
    
    result = crew.adicionar_transacao(
        user_id=test_user,
        amount=250.00,
        category="vendas",
        transaction_type="entrada",
        description="Venda de produtos - TESTE CONFIRMAÇÃO"
    )
    
    print(result)
```

**Resultado Esperado:**
- ✅ Tool executada
- ✅ Transação no PostgreSQL
- ✅ ID retornado na resposta

---

## 📊 Comparação: Hierarchical vs Sequential

| Aspecto | Hierarchical | Sequential |
|---------|-------------|------------|
| **Manager** | ✅ Automático via LLM | ❌ Não existe |
| **Delegação** | ✅ Inteligente | ❌ Manual |
| **Parâmetros** | ❌ Texto genérico | ✅ Estruturados |
| **Tools** | ❌ Não executa | ✅ Executa |
| **Flexibilidade** | ✅ Alta | ⚠️ Média |
| **Confiabilidade** | ❌ Baixa (tools) | ✅ Alta |

---

## 🎯 Solução Recomendada

### Arquitetura Híbrida: Flow + Sequential

```
┌─────────────────────────────────────────────────────────────┐
│                    FALACHEFE FLOW                           │
│                   (Router Principal)                        │
│                                                             │
│  @router classify_request()                                 │
│    ├─ "cashflow" → execute_cashflow()                       │
│    ├─ "whatsapp" → execute_whatsapp()                       │
│    └─ "unknown"  → handle_unknown()                         │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
         ┌──────────▼──────┐   ┌───▼─────────────┐
         │ CASHFLOW CREW   │   │ WHATSAPP CREW   │
         │  (Sequential)   │   │  (Sequential)   │
         │                 │   │                 │
         │ Métodos:        │   │ Métodos:        │
         │ • adicionar()   │   │ • enviar()      │
         │ • consultar()   │   │ • agendar()     │
         │ • editar()      │   │ • validar()     │
         │ • remover()     │   │                 │
         └─────────────────┘   └─────────────────┘
```

### Implementação

**1. Flow extrai intenção do usuário**
```python
def classify_request(self):
    request = self.state.user_request.lower()
    
    # Extrair parâmetros usando LLM
    if "adicionar" in request and "fluxo" in request:
        self.state.request_type = "cashflow_add"
        self.state.extracted_params = extract_transaction_params(request)
        return "cashflow_add"
```

**2. Flow chama método específico da Crew**
```python
@listen("cashflow_add")
def execute_cashflow_add(self):
    crew = CashflowCrewSequential()
    
    result = crew.adicionar_transacao(
        user_id=self.state.user_id,
        **self.state.extracted_params  # Parâmetros estruturados
    )
    
    self.state.final_response = result
```

**3. Crew executa com parâmetros estruturados**
```python
def adicionar_transacao(self, user_id, amount, category, ...):
    task = Task(
        description=f"""Registrar:
        User: {user_id}
        Valor: R$ {amount}
        Categoria: {category}
        """,
        agent=self.registrador
    )
    
    crew = Crew(
        agents=[self.registrador],
        tasks=[task],
        process=Process.sequential
    )
    
    return crew.kickoff()
```

---

## 📁 Arquivos Criados

### Código Principal
- ✅ `flows/main_flow.py` - Flow roteador
- ✅ `crews/cashflow_crew.py` - Hierarchical (referência)
- ✅ `crews/cashflow_crew_sequential.py` - Sequential (funcional)
- ✅ `tools/cashflow_tools.py` - Integração com API

### Testes
- ✅ `test_flow_hierarquico.py` - Teste hierarchical
- ✅ `test_registrador_direto.py` - Teste agente direto
- ✅ `test_adicionar_real.py` - Teste sequential

### Documentação
- ✅ `LGPD-COMPLIANCE.md` - Compliance de dados
- ✅ `README-INTEGRACAO-API.md` - Integração com API
- ✅ `ARQUITETURA-FINAL.md` - Visão geral
- ✅ `ARQUITETURA-HIERARQUICA-COMPLETA.md` - Este documento

### API Next.js
- ✅ `src/app/api/financial/transactions/route.ts` - Endpoint com auth
- ✅ `src/app/api/financial/test/route.ts` - Endpoint teste (deletado)

---

## 🚀 Próximos Passos

### 1. Implementar Extração de Parâmetros no Flow

Criar função LLM que extrai parâmetros estruturados do texto natural:

```python
def extract_transaction_params(user_request: str) -> dict:
    """
    Entrada: "Quero adicionar 100,00 no fluxo de caixa de uma venda de ontem"
    
    Saída: {
        "amount": 100.00,
        "category": "vendas",
        "transaction_type": "entrada",
        "date": "2025-10-06"
    }
    """
    # Usar LLM para extrair
    pass
```

### 2. Completar CashflowCrewSequential

Adicionar todos os métodos:

```python
class CashflowCrewSequential:
    def adicionar_transacao(...)      # ✅ Implementado
    def consultar_saldo(...)           # ⏳ Pendente
    def consultar_categorias(...)      # ⏳ Pendente
    def editar_transacao(...)          # ⏳ Pendente
    def remover_transacao(...)         # ⏳ Pendente
    def responder_duvida(...)          # ⏳ Pendente
```

### 3. Integrar com WhatsApp

Criar `WhatsAppCrew` com métodos:
- `enviar_mensagem()`
- `agendar_mensagem()`
- `validar_numero()`
- `consultar_status()`

### 4. Criar Interface de Teste

Dashboard web para testar flows:
- Input: mensagem do usuário
- Output: response completo
- Debug: logs de cada etapa
- Validação: confirmação no banco

### 5. Monitoramento e Logs

- Logs estruturados (JSON)
- Métricas de execução
- Alertas de falhas
- Dashboard de performance

---

## 💡 Lições Aprendidas

### ✅ O que Funciona

1. **Sequential Process + Parâmetros Estruturados**
   - Confiável para execução de tools
   - Previsível e testável
   - Fácil debug

2. **Flow para Roteamento**
   - Centraliza lógica de classificação
   - Permite múltiplas crews especializadas
   - Estado compartilhado entre etapas

3. **API REST como Intermediário**
   - Compliance com LGPD
   - Auditoria completa
   - Validações centralizadas

### ❌ O que Não Funciona

1. **Hierarchical Process com Tools**
   - Manager delega mas especialista não executa tool
   - Parâmetros não são extraídos corretamente
   - Respostas genéricas sem ação real

2. **Delegação Automática para Tasks Complexas**
   - LLM manager não entende contexto de tools
   - Precisa de estrutura explícita

### 🎓 Melhores Práticas

1. **Use Hierarchical para:** Decisões, planejamento, orquestração de texto
2. **Use Sequential para:** Execução de tools, operações de banco, APIs externas
3. **Use Flow para:** Roteamento de alto nível, estado global, múltiplas crews
4. **Sempre valide:** Confirme operações no banco de dados, não confie apenas no output do LLM

---

## 📞 Suporte

Para dúvidas sobre esta implementação:
1. Consultar `ARQUITETURA-FINAL.md` para visão geral
2. Ver `README-INTEGRACAO-API.md` para detalhes de API
3. Verificar `LGPD-COMPLIANCE.md` para questões de compliance
4. Rodar testes em `test_*.py` para validar funcionamento

---

**Última Atualização:** 09/10/2025 00:15 BRT
**Versão:** 1.0
**Status:** ✅ Funcional (Sequential) / ⚠️ Hierarchical não recomendado para tools

