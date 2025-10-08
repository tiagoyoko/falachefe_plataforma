#!/usr/bin/env python3
"""
Teste da integração completa com mensagem real do usuário
"""

import sys
import os
from datetime import datetime, timedelta

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.crew import FalachefeCrew

def main():
    print("\n" + "="*80)
    print("🧪 TESTE DE INTEGRAÇÃO COMPLETA - CrewAI + API + PostgreSQL")
    print("="*80 + "\n")
    
    # Mensagem real do usuário
    user_message = "Quero adicionar 100 reais de vendas da data de ontem no meu fluxo de caixa"
    user_id = "real_test_user"
    
    print(f"👤 Usuário: {user_id}")
    print(f"💬 Mensagem: \"{user_message}\"")
    print("\n" + "-"*80 + "\n")
    
    # Calcular data de ontem
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Preparar inputs completos para todas as tasks
    inputs = {
        # Task: create_cashflow
        "user_id": user_id,
        "company_context": "Empresa de teste, pequeno negócio, comércio local",
        
        # Task: update_cashflow  
        "transaction_type": "entrada",
        "transaction_data": {
            "valor": 100.00,
            "categoria": "vendas",
            "data": yesterday
        },
        
        # Task: analyze_cashflow
        "period": "2025-10",
        "cashflow_data": {},
        
        # Task: financial_advice
        "question": "Como melhorar meu fluxo de caixa?",
        "financial_status": "Estável",
        
        # Task: marketing_strategy
        "company_info": "Comércio local",
        "marketing_goal": "Aumentar vendas",
        "budget": "R$ 500",
        
        # Task: sales_process
        "sales_type": "Varejo",
        "product_info": "Produtos diversos",
        "current_challenge": "Aumentar conversão",
        
        # Task: hr_guidance
        "hr_question": "Como contratar?",
        "employee_count": "5",
        
        # Task: business_consultation
        "business_challenge": "Crescimento sustentável",
        
        # Task: whatsapp_integration (se existir)
        "user_request": user_message,
        "user_context": "Cliente teste do sistema",
        "whatsapp_number": "5511999999999",
        
        # Task: send_whatsapp_message (se existir)
        "specialist_response": "Resposta do especialista",
        "specialist_type": "financial",
        "conversation_context": "Contexto da conversa"
    }
    
    print("📋 Inputs preparados:")
    print(f"   - user_id: {user_id}")
    print(f"   - transaction_type: entrada")
    print(f"   - valor: R$ 100,00")
    print(f"   - categoria: vendas")
    print(f"   - data: {yesterday}")
    print("\n" + "-"*80 + "\n")
    
    try:
        print("🚀 Executando FalachefeCrew...\n")
        
        # Criar e executar a crew
        crew = FalachefeCrew().crew()
        result = crew.kickoff(inputs=inputs)
        
        print("\n" + "="*80)
        print("✅ CREW EXECUTADA COM SUCESSO!")
        print("="*80 + "\n")
        
        print("📊 Resultado Final:")
        print(result)
        
        print("\n" + "="*80)
        print("🎉 TESTE COMPLETO - INTEGRAÇÃO FUNCIONANDO!")
        print("="*80 + "\n")
        
        return 0
        
    except Exception as e:
        print("\n" + "="*80)
        print("❌ ERRO NA EXECUÇÃO")
        print("="*80 + "\n")
        print(f"Erro: {e}")
        
        import traceback
        traceback.print_exc()
        
        return 1

if __name__ == "__main__":
    sys.exit(main())

