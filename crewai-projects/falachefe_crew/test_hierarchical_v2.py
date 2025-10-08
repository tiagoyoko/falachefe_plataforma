#!/usr/bin/env python3
"""
Teste hierarchical com manager_llm (sem manager_agent custom)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from crewai import Agent, Crew, Task, Process
from falachefe_crew.tools.cashflow_tools import AddCashflowTransactionTool, GetCashflowBalanceTool

# Criar agentes especialistas
consultor = Agent(
    role="Consultor de Fluxo de Caixa",
    goal="Responder dúvidas sobre fluxo de caixa de forma didática",
    backstory="Você é um especialista em ensinar sobre fluxo de caixa.",
    allow_delegation=False,
    verbose=True
)

registrador = Agent(
    role="Registrador de Transações",
    goal="Registrar transações no fluxo de caixa",
    backstory="Você registra transações usando ferramentas.",
    allow_delegation=False,
    verbose=True,
    tools=[AddCashflowTransactionTool()]
)

# Criar task
task = Task(
    description="Responder ao usuário: {user_request}. User ID: {user_id}",
    expected_output="Resposta completa e útil ao usuário"
)

# Criar crew hierarchical com manager_llm
crew = Crew(
    agents=[consultor, registrador],
    tasks=[task],
    process=Process.hierarchical,
    manager_llm="gpt-4o",  # LLM para o manager (SEM manager_agent custom)
    verbose=True
)

print("\n" + "="*80)
print("🧪 TESTE: Hierarchical com manager_llm")
print("="*80 + "\n")

result = crew.kickoff(inputs={
    "user_request": "O que é fluxo de caixa?",
    "user_id": "test_user"
})

print("\n" + "="*80)
print("✅ RESULTADO:")
print("="*80)
print(result)

