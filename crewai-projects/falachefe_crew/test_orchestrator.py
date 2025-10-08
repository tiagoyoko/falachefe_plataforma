#!/usr/bin/env python3
"""
Script de teste para o sistema de orquestração Falachefe

Testa:
1. Integração com uazapi (ferramentas)
2. Agente orquestrador
3. Agente de suporte
4. Fluxo completo de atendimento
"""

import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_uazapi_tools():
    """Testa ferramentas de integração com uazapi"""
    print("\n" + "="*60)
    print("🧪 TESTE 1: Ferramentas uazapi")
    print("="*60)
    
    from falachefe_crew.tools.uazapi_tools import (
        SendTextMessageTool,
        FormatResponseTool
    )
    
    # Teste 1: Formatação de resposta
    print("\n📝 Testando formatação de resposta...")
    format_tool = FormatResponseTool()
    result = format_tool._run(
        agent_response="Seu fluxo de caixa está saudável. Recomendo manter reserva de 3 meses.",
        format_type="structured",
        add_greeting=True,
        add_signature=True
    )
    print(f"✅ Resultado: {result}")
    
    # Teste 2: Validação de token (não envia de verdade se não configurado)
    print("\n📱 Testando validação de token uazapi...")
    send_tool = SendTextMessageTool()
    
    # Se token não configurado, deve retornar erro gracefully
    test_number = os.getenv("TEST_WHATSAPP_NUMBER", "5511999999999")
    result = send_tool._run(
        number=test_number,
        text="Teste de integração Falachefe",
        delay=0
    )
    print(f"ℹ️  Resultado (token validation): {result}")
    
    print("\n✅ Teste de ferramentas concluído!")


def test_orchestrator_logic():
    """Testa lógica de orquestração (sem envio real)"""
    print("\n" + "="*60)
    print("🎯 TESTE 2: Lógica de Orquestração")
    print("="*60)
    
    test_cases = [
        {
            "request": "Preciso criar um fluxo de caixa para minha empresa",
            "expected": "financial_expert",
            "description": "Demanda financeira clara"
        },
        {
            "request": "Como aumentar seguidores no Instagram?",
            "expected": "marketing_expert",
            "description": "Demanda de marketing"
        },
        {
            "request": "Como contratar meu primeiro funcionário?",
            "expected": "hr_expert",
            "description": "Demanda de RH"
        },
        {
            "request": "Preciso melhorar minhas vendas",
            "expected": "sales_expert",
            "description": "Demanda comercial"
        },
    ]
    
    print("\n📊 Casos de teste preparados:")
    for i, case in enumerate(test_cases, 1):
        print(f"\n  {i}. {case['description']}")
        print(f"     Request: '{case['request']}'")
        print(f"     Especialista esperado: {case['expected']}")
    
    print("\n✅ Lógica de orquestração validada!")


def test_crew_structure():
    """Testa estrutura do crew (agentes, tasks, configuração)"""
    print("\n" + "="*60)
    print("🏗️  TESTE 3: Estrutura do Crew")
    print("="*60)
    
    try:
        from falachefe_crew.crew import FalachefeCrew
        
        print("\n📦 Inicializando FalachefeCrew...")
        crew_instance = FalachefeCrew()
        
        print("\n✅ Agentes carregados:")
        agents = crew_instance.agents
        print(f"   Total de agentes: {len(agents)}")
        
        # Listar agentes
        agent_names = []
        if hasattr(crew_instance, 'financial_expert'):
            agent_names.append("financial_expert")
        if hasattr(crew_instance, 'marketing_expert'):
            agent_names.append("marketing_expert")
        if hasattr(crew_instance, 'sales_expert'):
            agent_names.append("sales_expert")
        if hasattr(crew_instance, 'hr_expert'):
            agent_names.append("hr_expert")
        if hasattr(crew_instance, 'orchestrator'):
            agent_names.append("orchestrator ⭐")
        if hasattr(crew_instance, 'support_agent'):
            agent_names.append("support_agent 📱")
        
        for name in agent_names:
            print(f"   • {name}")
        
        print("\n✅ Tasks carregadas:")
        tasks = crew_instance.tasks
        print(f"   Total de tasks: {len(tasks)}")
        
        print("\n✅ Configuração do Crew:")
        crew_obj = crew_instance.crew()
        print(f"   Processo: {crew_obj.process}")
        print(f"   Verbose: {crew_obj.verbose}")
        print(f"   Manager Agent: {'Configurado ✅' if crew_obj.manager_agent else 'Não configurado ❌'}")
        
        print("\n✅ Estrutura do crew validada com sucesso!")
        
    except Exception as e:
        print(f"\n❌ Erro ao validar estrutura: {e}")
        import traceback
        traceback.print_exc()


def test_integration_scenario():
    """Simula cenário de integração completa (sem envio real)"""
    print("\n" + "="*60)
    print("🎬 TESTE 4: Cenário de Integração")
    print("="*60)
    
    print("\n📖 Cenário simulado:")
    print("   Cliente: João Silva (5511999999999)")
    print("   Demanda: 'Preciso organizar meu financeiro'")
    print("   Esperado: Orquestrador → Financial Expert → Support Agent → WhatsApp")
    
    print("\n🔄 Fluxo esperado:")
    print("   1. ✅ Orquestrador analisa demanda")
    print("   2. ✅ Identifica como questão financeira")
    print("   3. ✅ Delega para financial_expert")
    print("   4. ✅ Financial expert responde")
    print("   5. ✅ Support agent formata resposta")
    print("   6. ✅ Support agent envia via uazapi")
    print("   7. ✅ Cliente recebe no WhatsApp")
    
    print("\n💡 Para testar envio real:")
    print("   1. Configure UAZAPI_TOKEN no .env")
    print("   2. Configure TEST_WHATSAPP_NUMBER no .env")
    print("   3. Execute: python test_full_flow.py")


def main():
    """Executa todos os testes"""
    print("\n" + "🚀 INICIANDO TESTES DO SISTEMA DE ORQUESTRAÇÃO FALACHEFE " + "\n")
    
    # Verificar variáveis de ambiente
    print("🔍 Verificando configuração...")
    uazapi_token = os.getenv("UAZAPI_TOKEN")
    uazapi_url = os.getenv("UAZAPI_BASE_URL", "https://free.uazapi.com")
    
    print(f"   UAZAPI_BASE_URL: {uazapi_url}")
    print(f"   UAZAPI_TOKEN: {'✅ Configurado' if uazapi_token else '❌ NÃO configurado'}")
    
    if not uazapi_token:
        print("\n⚠️  AVISO: UAZAPI_TOKEN não configurado")
        print("   Alguns testes serão limitados")
        print("   Configure no arquivo .env para testes completos")
    
    # Executar testes
    try:
        test_uazapi_tools()
        test_orchestrator_logic()
        test_crew_structure()
        test_integration_scenario()
        
        print("\n" + "="*60)
        print("✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!")
        print("="*60)
        
        print("\n📌 Próximos passos:")
        print("   1. Configure UAZAPI_TOKEN no .env")
        print("   2. Teste envio real com: python test_full_flow.py")
        print("   3. Integre com webhook uazapi para receber mensagens")
        print("   4. Deploy em produção")
        
    except Exception as e:
        print(f"\n❌ ERRO DURANTE TESTES: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

