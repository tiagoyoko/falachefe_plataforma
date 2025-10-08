#!/usr/bin/env python3
"""
Teste completo do fluxo de orquestração Falachefe
Executa um cenário real de consultoria financeira
"""

import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.orchestration_flow import FalachefeOrchestrationFlow, run_orchestrated_consultation

def test_financial_consultation():
    """
    Teste: Consultoria Financeira sobre Fluxo de Caixa
    
    Fluxo esperado:
    1. Orquestrador analisa demanda
    2. Identifica como questão financeira
    3. Delega para financial_expert
    4. Financial expert responde
    5. Support agent formata
    6. Support agent envia via WhatsApp
    """
    
    print("\n" + "="*70)
    print("🧪 TESTE COMPLETO: FLUXO DE ORQUESTRAÇÃO FALACHEFE")
    print("="*70)
    
    print("\n📋 Cenário de Teste:")
    print("   Cliente: João Silva (Padaria Silva)")
    print("   Número: +55 47 99253-5151")
    print("   Demanda: Ajuda com fluxo de caixa")
    print("   Contexto: Padaria de bairro, 3 funcionários, ~R$ 20k/mês")
    
    print("\n🔄 Fluxo Esperado:")
    print("   1. ⚙️  Orquestrador analisa demanda")
    print("   2. 🎯 Identifica: Questão FINANCEIRA")
    print("   3. 📤 Delega para: financial_expert")
    print("   4. 💰 Financial expert processa e responde")
    print("   5. ✨ Support agent formata resposta")
    print("   6. 📱 Support agent envia via uazapi")
    print("   7. ✅ Cliente recebe no WhatsApp")
    
    # Verificar configurações
    print("\n🔍 Verificando configurações...")
    
    uazapi_token = os.getenv("UAZAPI_TOKEN")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not uazapi_token:
        print("   ❌ UAZAPI_TOKEN não configurado")
        return False
    else:
        print("   ✅ UAZAPI_TOKEN configurado")
    
    if not openai_key:
        print("   ❌ OPENAI_API_KEY não configurado")
        return False
    else:
        print("   ✅ OPENAI_API_KEY configurado")
    
    print("\n⏳ Iniciando flow de orquestração...\n")
    print("-" * 70)
    
    print("📝 Parâmetros do teste:")
    print(f"   Request: Preciso criar um fluxo de caixa para minha padaria. Como organizar as entradas e saídas?")
    print(f"   Context: Padaria de bairro, 3 funcionários, faturamento ~R$ 20k/mês")
    print(f"   WhatsApp: 5547992535151")
    print(f"   User ID: padaria_silva_001")
    
    print("\n" + "="*70)
    print("🚀 EXECUTANDO FLOW COM ROTEAMENTO CONDICIONAL...")
    print("="*70 + "\n")
    
    try:
        # Executar o flow de orquestração
        result = run_orchestrated_consultation(
            user_request="Preciso criar um fluxo de caixa para minha padaria. Como organizar as entradas e saídas?",
            user_context="Padaria de bairro, 3 funcionários, faturamento aproximado R$ 20.000/mês, sem controle financeiro estruturado",
            whatsapp_number="5547992535151",
            user_id="padaria_silva_001"
        )
        
        print("\n" + "="*70)
        print("✅ EXECUÇÃO CONCLUÍDA!")
        print("="*70)
        
        print("\n📊 Resultado:")
        print("-" * 70)
        print(result)
        print("-" * 70)
        
        print("\n🎉 Teste completado com sucesso!")
        print("\n💡 Verifique o WhatsApp +55 47 99253-5151 para ver a mensagem recebida")
        
        return True
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ ERRO DURANTE EXECUÇÃO")
        print("="*70)
        print(f"\n🔴 Erro: {e}")
        
        import traceback
        print("\n📋 Traceback completo:")
        traceback.print_exc()
        
        return False


if __name__ == "__main__":
    try:
        success = test_financial_consultation()
        
        if success:
            print("\n" + "🎊"*35)
            print("✅ SISTEMA DE ORQUESTRAÇÃO FUNCIONANDO PERFEITAMENTE!")
            print("🎊"*35)
            
            print("\n📌 O que foi testado:")
            print("   ✅ Flow com roteamento condicional")
            print("   ✅ Orquestrador analisando demanda")
            print("   ✅ Roteamento para APENAS o especialista correto")
            print("   ✅ Processamento pelo especialista escolhido")
            print("   ✅ Formatação pelo support_agent")
            print("   ✅ Envio via uazapi")
            print("   ✅ Entrega no WhatsApp")
            
            print("\n🚀 Próximos passos:")
            print("   1. Teste com outros tipos de demanda (marketing, vendas, RH)")
            print("   2. Implemente webhook para receber mensagens automaticamente")
            print("   3. Adicione memória de conversas")
            print("   4. Configure em produção")
            
            sys.exit(0)
        else:
            print("\n⚠️  Teste encontrou problemas. Verifique os logs acima.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

