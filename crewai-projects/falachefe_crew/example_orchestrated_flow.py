#!/usr/bin/env python3
"""
Exemplo de Fluxo Completo: Sistema Orquestrado Falachefe + uazapi

Este script demonstra como usar o sistema completo:
1. Usuário envia mensagem via WhatsApp
2. Orquestrador analisa e roteia para especialista
3. Especialista processa e responde
4. Agente de suporte formata e envia via WhatsApp

ANTES DE EXECUTAR:
- Configure UAZAPI_TOKEN no arquivo .env
- Configure OPENAI_API_KEY (ou outro LLM) no .env
- Ajuste TEST_WHATSAPP_NUMBER para seu número de teste
"""

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

from src.falachefe_crew.crew import FalachefeCrew


def example_financial_consultation():
    """
    Exemplo 1: Consultoria Financeira
    
    Cenário: Cliente precisa de ajuda com fluxo de caixa
    Especialista esperado: financial_expert
    """
    print("\n" + "="*70)
    print("💰 EXEMPLO 1: CONSULTORIA FINANCEIRA - FLUXO DE CAIXA")
    print("="*70)
    
    crew = FalachefeCrew()
    
    inputs = {
        "user_request": "Preciso urgente organizar o financeiro da minha padaria. Como fazer um fluxo de caixa?",
        "user_context": "Padaria de bairro, 3 funcionários, faturamento ~R$ 20mil/mês",
        "whatsapp_number": os.getenv("TEST_WHATSAPP_NUMBER", "5511999999999"),
        "user_id": "padaria_silva_123",
        "company_context": "Padaria de bairro familiar"
    }
    
    print("\n📝 Input:")
    print(f"   Request: {inputs['user_request']}")
    print(f"   Context: {inputs['user_context']}")
    print(f"   WhatsApp: {inputs['whatsapp_number']}")
    
    print("\n⏳ Processando com crew orquestrado...\n")
    
    result = crew.crew().kickoff(inputs=inputs)
    
    print("\n✅ Resultado:")
    print(result)
    
    return result


def example_marketing_consultation():
    """
    Exemplo 2: Consultoria de Marketing
    
    Cenário: Cliente quer melhorar presença digital
    Especialista esperado: marketing_expert
    """
    print("\n" + "="*70)
    print("📱 EXEMPLO 2: CONSULTORIA DE MARKETING - REDES SOCIAIS")
    print("="*70)
    
    crew = FalachefeCrew()
    
    inputs = {
        "user_request": "Tenho uma loja de roupas e quero vender mais pelo Instagram. Orçamento de R$ 500/mês.",
        "user_context": "Loja de roupas femininas, Instagram com 1.5k seguidores, vendas esporádicas online",
        "whatsapp_number": os.getenv("TEST_WHATSAPP_NUMBER", "5511999999999"),
        "user_id": "loja_estilo_456",
        "marketing_goal": "Aumentar vendas online via Instagram",
        "budget": "R$ 500/mês",
        "company_info": "Loja de roupas femininas, público 25-45 anos"
    }
    
    print("\n📝 Input:")
    print(f"   Request: {inputs['user_request']}")
    print(f"   Context: {inputs['user_context']}")
    print(f"   Goal: {inputs['marketing_goal']}")
    
    print("\n⏳ Processando com crew orquestrado...\n")
    
    result = crew.crew().kickoff(inputs=inputs)
    
    print("\n✅ Resultado:")
    print(result)
    
    return result


def example_complex_consultation():
    """
    Exemplo 3: Consultoria Complexa Multi-disciplinar
    
    Cenário: Problema que envolve múltiplas áreas
    Especialistas esperados: Múltiplos (financeiro + vendas + rh)
    """
    print("\n" + "="*70)
    print("💼 EXEMPLO 3: CONSULTORIA INTEGRADA - PROBLEMA COMPLEXO")
    print("="*70)
    
    crew = FalachefeCrew()
    
    inputs = {
        "user_request": "Minha empresa está com problemas: caixa apertado, vendas caindo e equipe desmotivada. Preciso de ajuda!",
        "user_context": "Restaurante, 8 funcionários, faturamento R$ 50k/mês mas custos altos",
        "whatsapp_number": os.getenv("TEST_WHATSAPP_NUMBER", "5511999999999"),
        "user_id": "restaurante_sabor_789",
        "business_challenge": "Crise integrada: financeiro + vendas + gestão de pessoas",
        "company_context": "Restaurante com 2 anos de operação, localização boa mas resultados caindo"
    }
    
    print("\n📝 Input:")
    print(f"   Request: {inputs['user_request']}")
    print(f"   Context: {inputs['user_context']}")
    print(f"   Challenge: {inputs['business_challenge']}")
    
    print("\n⏳ Processando com crew orquestrado (consultoria integrada)...\n")
    
    result = crew.crew().kickoff(inputs=inputs)
    
    print("\n✅ Resultado:")
    print(result)
    
    return result


def example_needs_clarification():
    """
    Exemplo 4: Demanda Vaga que Precisa Esclarecimento
    
    Cenário: Pergunta muito genérica
    Esperado: Orquestrador pede esclarecimentos
    """
    print("\n" + "="*70)
    print("❓ EXEMPLO 4: DEMANDA VAGA - NECESSITA ESCLARECIMENTO")
    print("="*70)
    
    crew = FalachefeCrew()
    
    inputs = {
        "user_request": "Preciso de ajuda para melhorar minha empresa",
        "user_context": "Pequena empresa",
        "whatsapp_number": os.getenv("TEST_WHATSAPP_NUMBER", "5511999999999"),
        "user_id": "empresa_xyz_000"
    }
    
    print("\n📝 Input:")
    print(f"   Request: {inputs['user_request']}")
    print(f"   Context: {inputs['user_context']}")
    
    print("\n⏳ Processando...\n")
    print("   Esperado: Orquestrador deve identificar que precisa de esclarecimento")
    print("   Support Agent deve enviar menu interativo com opções")
    
    result = crew.crew().kickoff(inputs=inputs)
    
    print("\n✅ Resultado:")
    print(result)
    
    return result


def run_all_examples():
    """Executa todos os exemplos em sequência"""
    
    print("\n" + "🌟"*35)
    print("  SISTEMA DE ORQUESTRAÇÃO FALACHEFE - EXEMPLOS COMPLETOS")
    print("🌟"*35)
    
    # Verificar configuração
    print("\n🔍 Verificando configuração...")
    
    required_vars = {
        "UAZAPI_TOKEN": os.getenv("UAZAPI_TOKEN"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"),
    }
    
    all_configured = True
    for var_name, var_value in required_vars.items():
        status = "✅ Configurado" if var_value else "❌ NÃO configurado"
        print(f"   {var_name}: {status}")
        if not var_value:
            all_configured = False
    
    if not all_configured:
        print("\n⚠️  AVISO: Algumas variáveis de ambiente não estão configuradas")
        print("   O sistema funcionará em modo de demonstração limitado")
        print("\n   Para testes completos, configure:")
        print("   - UAZAPI_TOKEN (para envio via WhatsApp)")
        print("   - OPENAI_API_KEY ou ANTHROPIC_API_KEY (para os agentes IA)")
        
        response = input("\n❓ Continuar mesmo assim? (s/n): ")
        if response.lower() != 's':
            print("   Teste cancelado pelo usuário")
            return
    
    # Menu de exemplos
    print("\n📋 Exemplos disponíveis:")
    print("   1. Consultoria Financeira (Fluxo de Caixa)")
    print("   2. Consultoria de Marketing (Instagram)")
    print("   3. Consultoria Integrada (Problema Complexo)")
    print("   4. Demanda Vaga (Necessita Esclarecimento)")
    print("   5. Executar TODOS os exemplos")
    print("   0. Sair")
    
    choice = input("\n🎯 Escolha um exemplo (0-5): ").strip()
    
    try:
        if choice == "1":
            example_financial_consultation()
        elif choice == "2":
            example_marketing_consultation()
        elif choice == "3":
            example_complex_consultation()
        elif choice == "4":
            example_needs_clarification()
        elif choice == "5":
            print("\n🔄 Executando todos os exemplos sequencialmente...\n")
            example_financial_consultation()
            input("\n⏸️  Pressione ENTER para próximo exemplo...")
            example_marketing_consultation()
            input("\n⏸️  Pressione ENTER para próximo exemplo...")
            example_complex_consultation()
            input("\n⏸️  Pressione ENTER para próximo exemplo...")
            example_needs_clarification()
        elif choice == "0":
            print("\n👋 Saindo...")
            return
        else:
            print("\n❌ Opção inválida!")
            return
        
        print("\n" + "="*70)
        print("🎉 TESTES CONCLUÍDOS!")
        print("="*70)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ ERRO durante execução: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Executar exemplos
    run_all_examples()

