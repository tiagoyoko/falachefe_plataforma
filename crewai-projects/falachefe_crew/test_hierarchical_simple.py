#!/usr/bin/env python3
"""
Teste simplificado de Hierarchical Process
Sem decorators, configuração direta
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from crewai import Agent, Crew, Task, Process
from falachefe_crew.tools.cashflow_tools import AddCashflowTransactionTool, GetCashflowBalanceTool

# Criar agentes especialistas
consultor = Agent(
    role="Consultor de Fluxo de Caixa",
    goal="Responder dúvidas sobre fluxo de caixa",
    backstory="Você é um especialista em ensinar sobre fluxo de caixa de forma didática.",
    allow_delegation=False,
    verbose=True
)

registrador = Agent(
    role="Registrador de Transações",
    goal="Registrar transações no fluxo de caixa",
    backstory="Você registra transações usando a ferramenta adequada.",
    allow_delegation=False,
    verbose=True,
    tools=[AddCashflowTransactionTool()]
)

analista = Agent(
    role="Analista de Fluxo de Caixa",
    goal="Consultar e analisar dados do fluxo de caixa",
    backstory="Você busca dados reais do fluxo de caixa usando ferramentas.",
    allow_delegation=False,
    verbose=True,
    tools=[GetCashflowBalanceTool()]
)

# Criar manager
manager = Agent(
    role="Gerente de Fluxo de Caixa",
    goal="Delegar requests aos especialistas adequados",
    backstory="""Você coordena especialistas em fluxo de caixa.
    
    Delegue para:
    - "Consultor de Fluxo de Caixa" para dúvidas
    - "Registrador de Transações" para adicionar
    - "Analista de Fluxo de Caixa" para consultar""",
    allow_delegation=True,
    verbose=True,
    llm="gpt-4o"
)

# Criar task
task = Task(
    description="""Atender o request do usuário: {user_request}
    
    User ID: {user_id}
    
    Se for dúvida → delegue ao Consultor de Fluxo de Caixa
    Se for adicionar → delegue ao Registrador de Transações  
    Se for consultar → delegue ao Analista de Fluxo de Caixa""",
    expected_output="Resposta completa do especialista que atendeu",
    agent=manager
)

# Criar crew hierarchical
crew = Crew(
    agents=[consultor, registrador, analista],  # Especialistas
    tasks=[task],
    process=Process.hierarchical,
    manager_agent=manager,  # Manager separado
    verbose=True
)

# TESTE 1: Dúvida
print("\n" + "="*80)
print("🧪 TESTE: O que é fluxo de caixa?")
print("="*80 + "\n")

result = crew.kickoff(inputs={
    "user_request": "O que é fluxo de caixa?",
    "user_id": "test_user"
})

print("\n" + "="*80)
print("✅ RESULTADO:")
print("="*80)
print(result)


