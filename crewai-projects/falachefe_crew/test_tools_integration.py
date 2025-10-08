#!/usr/bin/env python3
"""
Script de teste para verificar a integração das tools com a API do Falachefe
"""

import sys
import os

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.tools.cashflow_tools import (
    AddCashflowTransactionTool,
    GetCashflowBalanceTool,
    GetCashflowCategoriesTool,
    GetCashflowSummaryTool
)

def print_separator():
    print("\n" + "="*80 + "\n")

def test_add_transaction():
    """Testa a criação de uma transação"""
    print("🧪 Teste 1: Adicionar Transação")
    print_separator()
    
    tool = AddCashflowTransactionTool()
    
    try:
        result = tool._run(
            user_id="test_user_123",
            transaction_type="saida",
            amount=5000.00,
            category="aluguel",
            description="Pagamento aluguel outubro - TESTE",
            date="2025-10-07"
        )
        
        print("✅ Tool executada com sucesso!")
        print("\nResultado:")
        print(result)
        
        # Verificar se há indicadores de sucesso
        if "❌" in result:
            print("\n⚠️  ATENÇÃO: A tool retornou um erro!")
            return False
        elif "✅" in result:
            print("\n✅ Transação registrada com sucesso!")
            return True
        else:
            print("\n⚠️  Resposta inesperada")
            return False
            
    except Exception as e:
        print(f"\n❌ Erro ao executar tool: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_get_balance():
    """Testa a consulta de saldo"""
    print("🧪 Teste 2: Consultar Saldo")
    print_separator()
    
    tool = GetCashflowBalanceTool()
    
    try:
        result = tool._run(
            user_id="test_user_123",
            period="current_month"
        )
        
        print("✅ Tool executada com sucesso!")
        print("\nResultado:")
        print(result)
        
        # Verificar se há indicadores de sucesso
        if "❌" in result:
            print("\n⚠️  ATENÇÃO: A tool retornou um erro!")
            return False
        elif "Saldo do Fluxo de Caixa" in result:
            print("\n✅ Saldo consultado com sucesso!")
            return True
        else:
            print("\n⚠️  Resposta inesperada")
            return False
            
    except Exception as e:
        print(f"\n❌ Erro ao executar tool: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_configuration():
    """Testa a configuração da API"""
    print("🧪 Teste 0: Configuração da API")
    print_separator()
    
    from falachefe_crew.tools.cashflow_tools import API_BASE_URL, API_TIMEOUT
    
    print(f"API_BASE_URL: {API_BASE_URL}")
    print(f"API_TIMEOUT: {API_TIMEOUT} segundos")
    
    # Tentar fazer uma requisição simples
    import requests
    
    try:
        print(f"\n🔍 Testando conexão com {API_BASE_URL}...")
        response = requests.get(f"{API_BASE_URL}/api/chat", timeout=5)
        
        if response.status_code == 200:
            print("✅ Servidor está ONLINE e respondendo!")
            return True
        else:
            print(f"⚠️  Servidor respondeu com status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor!")
        print(f"   Verifique se o Next.js está rodando em {API_BASE_URL}")
        print("\n📝 Para iniciar o servidor:")
        print("   cd /Users/tiagoyokoyama/Falachefe")
        print("   npm run dev")
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def main():
    """Executa todos os testes"""
    print("\n" + "🚀 INICIANDO TESTES DE INTEGRAÇÃO".center(80, "="))
    print("\n📋 Testando integração das tools do CrewAI com a API do Falachefe")
    
    results = {
        "Configuração da API": test_api_configuration(),
    }
    
    # Só testa as outras tools se a API estiver online
    if results["Configuração da API"]:
        results["Adicionar Transação"] = test_add_transaction()
        results["Consultar Saldo"] = test_get_balance()
    else:
        print("\n⚠️  Pulando testes de integração (servidor offline)")
        results["Adicionar Transação"] = None
        results["Consultar Saldo"] = None
    
    # Resumo
    print_separator()
    print("📊 RESUMO DOS TESTES".center(80, "="))
    print_separator()
    
    for test_name, result in results.items():
        if result is True:
            status = "✅ PASSOU"
        elif result is False:
            status = "❌ FALHOU"
        else:
            status = "⏭️  PULADO"
        
        print(f"{test_name:.<50} {status}")
    
    # Conclusão
    print_separator()
    
    passed = sum(1 for r in results.values() if r is True)
    failed = sum(1 for r in results.values() if r is False)
    skipped = sum(1 for r in results.values() if r is None)
    
    print(f"Total: {passed} passou, {failed} falhou, {skipped} pulado")
    
    if failed == 0 and passed > 0:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        return 0
    elif results["Configuração da API"] is False:
        print("\n⚠️  SERVIDOR OFFLINE - Inicie o Next.js para testar a integração completa")
        return 1
    else:
        print("\n❌ ALGUNS TESTES FALHARAM")
        return 1

if __name__ == "__main__":
    sys.exit(main())

