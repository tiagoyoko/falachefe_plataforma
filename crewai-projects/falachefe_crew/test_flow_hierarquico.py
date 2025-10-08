#!/usr/bin/env python3
"""
Teste do Flow Hierarchical do Falachefe
Exemplos exatos do usuário
"""

import sys
import os

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.flows.main_flow import FalachefeFlow

def print_separator():
    print("\n" + "="*80 + "\n")

def test_example_1():
    """
    Teste 1: Adicionar transação
    "Quero adicionar 100,00 no fluxo de caixa de uma venda de ontem"
    
    Fluxo esperado:
    1. Flow Roteador → classifica como "cashflow"
    2. Cashflow Crew (manager) → delega para "Registrador de Transações"
    3. Registrador → usa tool AddCashflowTransactionTool
    4. Retorna confirmação
    """
    print_separator()
    print("🧪 TESTE 1: Adicionar Transação")
    print_separator()
    
    user_request = "Quero adicionar 100,00 no fluxo de caixa de uma venda de ontem"
    user_id = "usuario_teste_1"
    
    print(f"👤 Usuário: {user_id}")
    print(f"💬 Request: \"{user_request}\"")
    print(f"\n📋 Fluxo Esperado:")
    print(f"   1️⃣ Flow Roteador → 'cashflow'")
    print(f"   2️⃣ Cashflow Manager → delega para 'Registrador'")
    print(f"   3️⃣ Registrador → AddCashflowTransactionTool")
    print(f"   4️⃣ Retorna → Confirmação do registro")
    
    try:
        print_separator()
        print("🚀 Iniciando Flow...")
        print_separator()
        
        flow = FalachefeFlow()
        # Configurar state antes de kickoff
        flow.state.user_id = user_id
        flow.state.user_request = user_request
        
        # Kickoff sem argumentos
        result = flow.kickoff()
        
        print_separator()
        print("✅ TESTE 1 COMPLETADO")
        print_separator()
        print("📊 Resultado:")
        print(result)
        
        return True
        
    except Exception as e:
        print_separator()
        print("❌ TESTE 1 FALHOU")
        print_separator()
        print(f"Erro: {e}")
        
        import traceback
        traceback.print_exc()
        
        return False


def test_example_2():
    """
    Teste 2: Dúvida sobre fluxo de caixa
    "O que é fluxo de caixa?"
    
    Fluxo esperado:
    1. Flow Roteador → classifica como "cashflow"
    2. Cashflow Crew (manager) → delega para "Consultor"
    3. Consultor → responde a dúvida (SEM usar tools)
    4. Retorna explicação didática
    """
    print_separator()
    print("🧪 TESTE 2: Dúvida sobre Fluxo de Caixa")
    print_separator()
    
    user_request = "O que é fluxo de caixa?"
    user_id = "usuario_teste_2"
    
    print(f"👤 Usuário: {user_id}")
    print(f"💬 Request: \"{user_request}\"")
    print(f"\n📋 Fluxo Esperado:")
    print(f"   1️⃣ Flow Roteador → 'cashflow'")
    print(f"   2️⃣ Cashflow Manager → delega para 'Consultor'")
    print(f"   3️⃣ Consultor → Responde dúvida")
    print(f"   4️⃣ Retorna → Explicação didática")
    
    try:
        print_separator()
        print("🚀 Iniciando Flow...")
        print_separator()
        
        flow = FalachefeFlow()
        # Configurar state antes de kickoff
        flow.state.user_id = user_id
        flow.state.user_request = user_request
        
        # Kickoff sem argumentos
        result = flow.kickoff()
        
        print_separator()
        print("✅ TESTE 2 COMPLETADO")
        print_separator()
        print("📊 Resultado:")
        print(result)
        
        return True
        
    except Exception as e:
        print_separator()
        print("❌ TESTE 2 FALHOU")
        print_separator()
        print(f"Erro: {e}")
        
        import traceback
        traceback.print_exc()
        
        return False


def test_example_3():
    """
    Teste 3: Consultar saldo
    "Qual é o meu saldo atual?"
    
    Fluxo esperado:
    1. Flow Roteador → classifica como "cashflow"
    2. Cashflow Crew (manager) → delega para "Analista"
    3. Analista → usa GetCashflowBalanceTool
    4. Retorna saldo formatado
    """
    print_separator()
    print("🧪 TESTE 3: Consultar Saldo")
    print_separator()
    
    user_request = "Qual é o meu saldo atual?"
    user_id = "usuario_teste_3"
    
    print(f"👤 Usuário: {user_id}")
    print(f"💬 Request: \"{user_request}\"")
    print(f"\n📋 Fluxo Esperado:")
    print(f"   1️⃣ Flow Roteador → 'cashflow'")
    print(f"   2️⃣ Cashflow Manager → delega para 'Analista'")
    print(f"   3️⃣ Analista → GetCashflowBalanceTool")
    print(f"   4️⃣ Retorna → Saldo do usuário")
    
    try:
        print_separator()
        print("🚀 Iniciando Flow...")
        print_separator()
        
        flow = FalachefeFlow()
        # Configurar state antes de kickoff
        flow.state.user_id = user_id
        flow.state.user_request = user_request
        
        # Kickoff sem argumentos
        result = flow.kickoff()
        
        print_separator()
        print("✅ TESTE 3 COMPLETADO")
        print_separator()
        print("📊 Resultado:")
        print(result)
        
        return True
        
    except Exception as e:
        print_separator()
        print("❌ TESTE 3 FALHOU")
        print_separator()
        print(f"Erro: {e}")
        
        import traceback
        traceback.print_exc()
        
        return False


def main():
    """
    Executa todos os testes
    """
    print("\n" + "🚀 INICIANDO TESTES DO FLOW HIERARCHICAL".center(80, "="))
    
    results = {
        "Teste 1 - Adicionar Transação": test_example_1(),
        "Teste 2 - Dúvida sobre FC": test_example_2(),
        "Teste 3 - Consultar Saldo": test_example_3(),
    }
    
    # Resumo
    print_separator()
    print("📊 RESUMO DOS TESTES".center(80, "="))
    print_separator()
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{test_name:.<50} {status}")
    
    print_separator()
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    print(f"Total: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam")
        return 1


if __name__ == "__main__":
    sys.exit(main())

