#!/usr/bin/env python
import sys
import warnings

from datetime import datetime

from falachefe_crew.crew import FalachefeCrew

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# Este arquivo main é destinado a ser uma forma de executar sua
# crew localmente, então evite adicionar lógica desnecessária neste arquivo.
# Substitua com inputs que você deseja testar, ele automaticamente
# interpolará qualquer informação de tasks e agents

def run():
    """
    Executar a crew com um exemplo de análise de fluxo de caixa.
    
    Exemplo: Empresário quer criar seu primeiro fluxo de caixa
    """
    inputs = {
        # Dados do usuário/empresa
        'user_id': 'empresa_123',
        'company_context': 'Pequena loja de roupas em São Paulo, 3 funcionários, faturamento mensal médio de R$ 30.000',
        'company_info': 'Loja de roupas femininas, público jovem 18-35 anos',
        
        # Fluxo de Caixa
        'transaction_type': 'saída',
        'transaction_data': '{"valor": 1500, "categoria": "aluguel", "data": "2025-01-05"}',
        'period': 'Janeiro 2025',
        'cashflow_data': '''{
            "entradas": {
                "vendas": 28500,
                "outros": 1500
            },
            "saidas": {
                "aluguel": 3000,
                "salarios": 6000,
                "fornecedores": 12000,
                "contas": 2500,
                "outros": 1800
            }
        }''',
        
        # Perguntas e objetivos
        'question': 'Como posso melhorar meu fluxo de caixa e ter mais previsibilidade financeira?',
        'financial_status': 'Faturamento irregular, dificuldade em pagar contas em dia',
        
        # Marketing
        'marketing_goal': 'Aumentar vendas em 30% nos próximos 3 meses',
        'budget': 'R$ 1.000 por mês',
        
        # Vendas
        'sales_type': 'Varejo presencial e online',
        'product_info': 'Roupas femininas, ticket médio R$ 150',
        'current_challenge': 'Poucas vendas online, dependência do tráfego da loja física',
        
        # RH
        'hr_question': 'Como devo formalizar a contratação de um novo vendedor?',
        'employee_count': '3',
        
        # Consultoria geral
        'business_challenge': 'Empresa crescendo mas sem controle financeiro adequado'
    }
    
    try:
        result = FalachefeCrew().crew().kickoff(inputs=inputs)
        print("\n" + "="*60)
        print("RESULTADO DA CONSULTORIA FALACHEFE")
        print("="*60)
        print(result)
        print("="*60 + "\n")
        return result
    except Exception as e:
        raise Exception(f"Um erro ocorreu ao executar a crew: {e}")


def train():
    """
    Treinar a crew por um número determinado de iterações.
    """
    inputs = {
        'user_id': 'training_empresa',
        'company_context': 'Empresa de exemplo para treinamento',
        'company_info': 'Comércio varejista',
        'question': 'Pergunta de treinamento sobre gestão financeira',
        'cashflow_data': '{"entradas": {"vendas": 10000}, "saidas": {"custos": 6000}}',
        'period': 'mes_atual',
        'financial_status': 'Estável',
        'marketing_goal': 'Objetivo de exemplo',
        'budget': 'R$ 500',
        'sales_type': 'Varejo',
        'product_info': 'Produto exemplo',
        'current_challenge': 'Desafio exemplo',
        'hr_question': 'Questão exemplo',
        'employee_count': '5',
        'business_challenge': 'Desafio empresarial exemplo',
        'transaction_type': 'entrada',
        'transaction_data': '{"valor": 1000, "categoria": "vendas"}'
    }
    
    try:
        FalachefeCrew().crew().train(
            n_iterations=int(sys.argv[1]), 
            filename=sys.argv[2], 
            inputs=inputs
        )

    except Exception as e:
        raise Exception(f"Um erro ocorreu ao treinar a crew: {e}")

def replay():
    """
    Replay da execução da crew a partir de uma task específica.
    """
    try:
        FalachefeCrew().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"Um erro ocorreu ao fazer replay da crew: {e}")

def test():
    """
    Testar a execução da crew e retornar os resultados.
    """
    inputs = {
        'user_id': 'test_empresa',
        'company_context': 'Restaurante pequeno, 2 anos de mercado, 5 funcionários',
        'company_info': 'Restaurante italiano, almoço e jantar',
        'question': 'Como organizar melhor minhas finanças?',
        'cashflow_data': '''{
            "entradas": {"vendas": 45000},
            "saidas": {
                "aluguel": 5000,
                "salarios": 12000,
                "fornecedores": 18000,
                "contas": 4000
            }
        }''',
        'period': 'Dezembro 2024',
        'financial_status': 'Lucro pequeno mas inconsistente',
        'marketing_goal': 'Atrair mais clientes no almoço',
        'budget': 'R$ 800',
        'sales_type': 'Presencial',
        'product_info': 'Pratos italianos, ticket médio R$ 45',
        'current_challenge': 'Baixo movimento no almoço',
        'hr_question': 'Preciso contratar mais um garçom',
        'employee_count': '5',
        'business_challenge': 'Como aumentar lucratividade sem aumentar preços',
        'transaction_type': 'saída',
        'transaction_data': '{"valor": 5000, "categoria": "aluguel"}'
    }
    
    try:
        FalachefeCrew().crew().test(
            n_iterations=int(sys.argv[1]), 
            eval_llm=sys.argv[2], 
            inputs=inputs
        )

    except Exception as e:
        raise Exception(f"Um erro ocorreu ao testar a crew: {e}")
