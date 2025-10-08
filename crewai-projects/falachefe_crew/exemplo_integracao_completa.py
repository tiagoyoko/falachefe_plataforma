#!/usr/bin/env python
"""
Exemplo Completo de Integração CrewAI + Falachefe
==================================================

Este script demonstra como usar a integração completa entre
o CrewAI e a plataforma Falachefe para criar um assistente
financeiro inteligente.

Uso:
    python exemplo_integracao_completa.py
"""

import os
from dotenv import load_dotenv
from falachefe_crew.crew import FalachefeCrew

# Carregar variáveis de ambiente
load_dotenv()

def exemplo_consulta_financeira():
    """
    Exemplo 1: Consulta de Saldo
    
    O agente financeiro irá consultar o saldo atual
    e fornecer uma análise.
    """
    print("\n" + "="*60)
    print("EXEMPLO 1: Consulta de Saldo Financeiro")
    print("="*60 + "\n")
    
    # Criar instância do crew
    crew = FalachefeCrew()
    
    # Usar o crew orquestrado (hierárquico)
    # O orchestrator irá direcionar para o financial_expert
    orchestrated = crew.orchestrated_crew()
    
    # Input do usuário
    user_input = {
        "user_message": "Qual é o meu saldo atual no fluxo de caixa?",
        "user_id": "test_empresa",
        "phone_number": "+5511999999999"
    }
    
    # Executar
    result = orchestrated.kickoff(inputs=user_input)
    
    print(f"\n✅ Resultado:\n{result}")
    return result


def exemplo_registrar_despesa():
    """
    Exemplo 2: Registrar Despesa
    
    O agente financeiro irá registrar uma nova despesa
    no banco de dados através da API.
    """
    print("\n" + "="*60)
    print("EXEMPLO 2: Registrar Nova Despesa")
    print("="*60 + "\n")
    
    crew = FalachefeCrew()
    orchestrated = crew.orchestrated_crew()
    
    user_input = {
        "user_message": """
        Preciso registrar uma despesa:
        - Valor: R$ 5.000,00
        - Categoria: Aluguel
        - Descrição: Aluguel do escritório - Outubro 2025
        """,
        "user_id": "test_empresa",
        "phone_number": "+5511999999999"
    }
    
    result = orchestrated.kickoff(inputs=user_input)
    
    print(f"\n✅ Resultado:\n{result}")
    return result


def exemplo_analise_completa():
    """
    Exemplo 3: Análise Financeira Completa
    
    O agente financeiro irá fazer uma análise completa
    do fluxo de caixa com recomendações.
    """
    print("\n" + "="*60)
    print("EXEMPLO 3: Análise Financeira Completa")
    print("="*60 + "\n")
    
    crew = FalachefeCrew()
    orchestrated = crew.orchestrated_crew()
    
    user_input = {
        "user_message": """
        Faça uma análise completa do meu fluxo de caixa:
        1. Qual é o saldo atual?
        2. Quais são as principais categorias de despesa?
        3. Me dê 3 recomendações para melhorar minha saúde financeira
        """,
        "user_id": "test_empresa",
        "phone_number": "+5511999999999"
    }
    
    result = orchestrated.kickoff(inputs=user_input)
    
    print(f"\n✅ Resultado:\n{result}")
    return result


def exemplo_consultoria_multiagente():
    """
    Exemplo 4: Consultoria Multi-Agente
    
    Demonstra o poder da orquestração hierárquica,
    onde múltiplos especialistas podem ser acionados.
    """
    print("\n" + "="*60)
    print("EXEMPLO 4: Consultoria Multi-Disciplinar")
    print("="*60 + "\n")
    
    crew = FalachefeCrew()
    orchestrated = crew.orchestrated_crew()
    
    user_input = {
        "user_message": """
        Preciso de ajuda para expandir meu negócio:
        - Tenho R$ 50.000 em caixa
        - Quero contratar 2 pessoas
        - Preciso aumentar vendas em 30%
        
        Me ajude com:
        1. Análise financeira da viabilidade
        2. Estratégia de marketing para aumentar vendas
        3. Processo de contratação adequado
        """,
        "user_id": "test_empresa",
        "phone_number": "+5511999999999"
    }
    
    # Neste caso, o orchestrator irá:
    # 1. Analisar a demanda
    # 2. Delegar para financial_expert (análise financeira)
    # 3. Delegar para marketing_expert (estratégia)
    # 4. Delegar para hr_expert (contratação)
    # 5. Compilar todas as respostas
    
    result = orchestrated.kickoff(inputs=user_input)
    
    print(f"\n✅ Resultado:\n{result}")
    return result


def exemplo_uso_direto_tool():
    """
    Exemplo 5: Uso Direto da Tool (Sem Crew)
    
    Para casos onde você só precisa executar uma ação
    específica sem todo o contexto do crew.
    """
    print("\n" + "="*60)
    print("EXEMPLO 5: Uso Direto da Tool")
    print("="*60 + "\n")
    
    from falachefe_crew.tools.cashflow_tools import (
        AddCashflowTransactionTool,
        GetCashflowBalanceTool
    )
    
    # 1. Adicionar transação
    print("📝 Adicionando transação...")
    add_tool = AddCashflowTransactionTool()
    
    result_add = add_tool._run(
        user_id="test_empresa",
        transaction_type="entrada",
        amount=10000.00,
        category="vendas",
        description="Venda de produtos - Cliente XYZ"
    )
    
    print(f"\n✅ Transação adicionada:\n{result_add}\n")
    
    # 2. Consultar saldo
    print("💰 Consultando saldo...")
    balance_tool = GetCashflowBalanceTool()
    
    result_balance = balance_tool._run(
        user_id="test_empresa",
        period="month"
    )
    
    print(f"\n✅ Saldo consultado:\n{result_balance}")


def main():
    """
    Menu principal para executar os exemplos
    """
    print("\n" + "="*60)
    print("EXEMPLOS DE INTEGRAÇÃO CREWAI + FALACHEFE")
    print("="*60)
    
    print("\nEscolha um exemplo para executar:")
    print("1. Consulta de Saldo")
    print("2. Registrar Despesa")
    print("3. Análise Financeira Completa")
    print("4. Consultoria Multi-Agente")
    print("5. Uso Direto da Tool")
    print("0. Sair")
    
    choice = input("\nOpção: ").strip()
    
    if choice == "1":
        exemplo_consulta_financeira()
    elif choice == "2":
        exemplo_registrar_despesa()
    elif choice == "3":
        exemplo_analise_completa()
    elif choice == "4":
        exemplo_consultoria_multiagente()
    elif choice == "5":
        exemplo_uso_direto_tool()
    elif choice == "0":
        print("\n👋 Até logo!")
        return
    else:
        print("\n❌ Opção inválida!")
    
    # Perguntar se quer executar outro exemplo
    again = input("\n\nExecutar outro exemplo? (s/n): ").strip().lower()
    if again == "s":
        main()


if __name__ == "__main__":
    # Verificar se o servidor está rodando
    import requests
    
    try:
        response = requests.get("http://localhost:3000/api/health", timeout=2)
        print("✅ Servidor Falachefe está online!")
    except:
        print("⚠️  ATENÇÃO: O servidor Falachefe não está rodando!")
        print("   Execute 'npm run dev' em outra janela do terminal.")
        print("   Alguns exemplos podem não funcionar sem o servidor.\n")
    
    main()

