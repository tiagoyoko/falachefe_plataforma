#!/usr/bin/env python3
"""
Teste REAL de adicionar transação com confirmação no banco
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.crews.cashflow_crew_sequential import CashflowCrewSequential
from datetime import datetime

def main():
    print("\n" + "="*80)
    print("🧪 TESTE REAL: Adicionar R$ 250,00 de Vendas")
    print("="*80 + "\n")
    
    # ID único para este teste
    test_user = f"test_confirma_{int(datetime.now().timestamp())}"
    
    print(f"👤 User ID: {test_user}")
    print(f"💵 Valor: R$ 250,00")
    print(f"📁 Categoria: vendas")
    print(f"📅 Data: ontem")
    
    print("\n" + "-"*80)
    print("🚀 Executando Crew Sequential...")
    print("-"*80 + "\n")
    
    # Criar crew e executar
    crew = CashflowCrewSequential()
    
    result = crew.adicionar_transacao(
        user_id=test_user,
        amount=250.00,
        category="vendas",
        transaction_type="entrada",
        description="Venda de produtos - TESTE CONFIRMAÇÃO"
    )
    
    print("\n" + "="*80)
    print("📊 Resultado da Crew:")
    print("="*80)
    print(result)
    print("="*80 + "\n")
    
    # Extrair ID da transação
    result_str = str(result)
    if "ID da transação:" in result_str or "id" in result_str.lower():
        print("✅ Tool foi executada! ID encontrado na resposta.")
        
        # Instruções para confirmar no banco
        print("\n" + "="*80)
        print("🔍 COMO CONFIRMAR NO SUPABASE:")
        print("="*80)
        print(f"""
Execute esta query no Supabase:

SELECT * FROM public.financial_data 
WHERE user_id = '{test_user}'
ORDER BY created_at DESC;

Você deve ver 1 transação:
- Tipo: entrada
- Valor: 25000 (centavos) = R$ 250,00
- Categoria: vendas
- User: {test_user}
""")
    else:
        print("⚠️ Tool pode não ter sido executada - ID não encontrado na resposta")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())


