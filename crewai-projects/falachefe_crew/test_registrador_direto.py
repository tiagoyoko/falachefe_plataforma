#!/usr/bin/env python3
"""
Teste direto do Registrador de Transações
"""

import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from crewai import Agent, Crew, Task, Process
from falachefe_crew.tools.cashflow_tools import AddCashflowTransactionTool

# Agente Registrador
registrador = Agent(
    role="Registrador de Transações",
    goal="Registrar transações no fluxo de caixa usando a ferramenta corretamente",
    backstory="Você usa a ferramenta 'Adicionar Transação ao Fluxo de Caixa' para salvar dados no banco.",
    allow_delegation=False,
    verbose=True,
    tools=[AddCashflowTransactionTool()],
    llm="gpt-4o-mini"
)

# Data de ontem
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

# Task específica
task = Task(
    description=f"""Registrar uma transação no fluxo de caixa:
    
    - User ID: usuario_teste_direto
    - Tipo: entrada
    - Valor: R$ 100,00
    - Categoria: vendas
    - Data: {yesterday} (ontem)
    - Descrição: Venda de produtos - teste direto
    
    Use a ferramenta "Adicionar Transação ao Fluxo de Caixa" para registrar.""",
    expected_output="Confirmação do registro com ID da transação",
    agent=registrador
)

# Crew simples
crew = Crew(
    agents=[registrador],
    tasks=[task],
    process=Process.sequential,
    verbose=True
)

print("\n" + "="*80)
print("🧪 TESTE DIRETO: Registrador de Transações")
print("="*80 + "\n")

result = crew.kickoff()

print("\n" + "="*80)
print("✅ RESULTADO:")
print("="*80)
print(result)


