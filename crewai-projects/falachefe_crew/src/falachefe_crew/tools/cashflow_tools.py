"""
Ferramentas (Tools) para gerenciamento de Fluxo de Caixa
Permite ao agente financeiro interagir com o banco de dados do Falachefe
"""

from typing import Type, Optional, Dict, List, Any
from datetime import datetime, timedelta
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import json
import requests
import os

# ============================================
# CONFIGURAÇÃO DA API
# ============================================

# URL base da API do Falachefe (pode ser configurada via variável de ambiente)
API_BASE_URL = os.getenv("FALACHEFE_API_URL", "http://localhost:3000")
API_TIMEOUT = 30  # segundos
USE_TEST_MODE = os.getenv("FALACHEFE_TEST_MODE", "true").lower() == "true"  # Usar rota de teste sem auth

# ============================================
# SCHEMAS DE INPUT (Pydantic Models)
# ============================================

class GetCashflowBalanceInput(BaseModel):
    """Input para consultar saldo do fluxo de caixa."""
    user_id: str = Field(..., description="ID do usuário/empresa")
    period: Optional[str] = Field(None, description="Período a consultar (ex: '2025-01', 'current_month')")


class GetCashflowCategoriesInput(BaseModel):
    """Input para consultar categorias de custos."""
    user_id: str = Field(..., description="ID do usuário/empresa")
    period: str = Field(..., description="Período a analisar (ex: '2025-01', 'current_month')")
    transaction_type: Optional[str] = Field("saida", description="Tipo de transação: 'entrada' ou 'saida'")


class AddCashflowTransactionInput(BaseModel):
    """Input para adicionar transação ao fluxo de caixa."""
    user_id: str = Field(..., description="ID do usuário/empresa")
    transaction_type: str = Field(..., description="Tipo: 'entrada' ou 'saida'")
    amount: float = Field(..., description="Valor da transação")
    category: str = Field(..., description="Categoria (ex: 'vendas', 'aluguel', 'salarios')")
    description: Optional[str] = Field(None, description="Descrição adicional")
    date: Optional[str] = Field(None, description="Data da transação (formato: YYYY-MM-DD)")


class GetCashflowSummaryInput(BaseModel):
    """Input para obter resumo completo do fluxo de caixa."""
    user_id: str = Field(..., description="ID do usuário/empresa")
    period: str = Field(..., description="Período a analisar (ex: '2025-01', 'last_3_months')")


# ============================================
# TOOLS - Ferramentas para o Agente
# ============================================

class GetCashflowBalanceTool(BaseTool):
    """
    Ferramenta para consultar o saldo atual do fluxo de caixa.
    
    Permite que o agente responda perguntas como:
    - "Qual é o meu saldo atual?"
    - "Quanto dinheiro tenho disponível?"
    - "Qual o saldo da minha empresa?"
    """
    name: str = "Consultar Saldo do Fluxo de Caixa"
    description: str = (
        "Consulta o saldo atual do fluxo de caixa de uma empresa. "
        "Retorna o saldo total, entradas e saídas do período. "
        "Use quando o usuário perguntar sobre saldo, dinheiro disponível ou situação financeira atual."
    )
    args_schema: Type[BaseModel] = GetCashflowBalanceInput

    def _run(self, user_id: str, period: Optional[str] = None) -> str:
        """
        Implementação da consulta de saldo.
        
        Faz uma requisição GET para a API do Falachefe para buscar do banco PostgreSQL.
        """
        try:
            # Calcular datas baseado no período
            end_date = datetime.now()
            
            if period == "current_month":
                start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif period and period.count('-') == 1:  # Formato: "2025-01"
                year, month = map(int, period.split('-'))
                start_date = datetime(year, month, 1)
                # Último dia do mês
                if month == 12:
                    end_date = datetime(year + 1, 1, 1)
                else:
                    end_date = datetime(year, month + 1, 1)
            else:
                # Padrão: último mês
                start_date = (end_date.replace(day=1) - timedelta(days=1)).replace(day=1)
            
            # Fazer requisição GET para a API
            endpoint = "test" if USE_TEST_MODE else "transactions"
            api_url = f"{API_BASE_URL}/api/financial/{endpoint}"
            params = {
                "userId": user_id,
                "startDate": start_date.strftime("%Y-%m-%d"),
                "endDate": end_date.strftime("%Y-%m-%d")
            }
            
            print(f"📤 Consultando saldo na API: {api_url}")
            print(f"   Params: {params}")
            
            response = requests.get(
                api_url,
                params=params,
                timeout=API_TIMEOUT
            )
            
            if response.status_code != 200:
                error_detail = response.json().get('error', 'Erro desconhecido')
                return f"❌ Erro ao consultar saldo: {error_detail} (Status: {response.status_code})"
            
            # Parsear resposta da API
            result = response.json()
            data = result.get('data', {})
            summary = data.get('summary', {})
            
            # Formatar resposta para o agente
            response_text = f"""
Saldo do Fluxo de Caixa - {period or 'current_month'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Entradas:  R$ {summary.get('entradas', 0):,.2f}
💸 Saídas:    R$ {summary.get('saidas', 0):,.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Saldo:     R$ {summary.get('saldo', 0):,.2f}

📈 Total de transações: {summary.get('total', 0)}
🗓️  Período: {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}
💾 Fonte: PostgreSQL (financial_data)
            """.strip()
            
            print(f"✅ Saldo consultado com sucesso")
            
            return response_text
            
        except requests.exceptions.ConnectionError:
            return f"❌ Erro de conexão: Não foi possível conectar à API em {API_BASE_URL}. Verifique se o servidor está rodando."
        except requests.exceptions.Timeout:
            return f"❌ Timeout: A API não respondeu em {API_TIMEOUT} segundos."
        except Exception as e:
            return f"❌ Erro ao consultar saldo: {str(e)}"


class GetCashflowCategoriesTool(BaseTool):
    """
    Ferramenta para consultar principais categorias de custos/receitas.
    
    Permite que o agente responda perguntas como:
    - "Quais são as principais categorias de custos deste mês?"
    - "Onde estou gastando mais?"
    - "Quais as maiores despesas?"
    """
    name: str = "Consultar Categorias do Fluxo de Caixa"
    description: str = (
        "Consulta e analisa as categorias de custos ou receitas do fluxo de caixa. "
        "Retorna as principais categorias ordenadas por valor. "
        "Use quando o usuário perguntar sobre categorias de gastos, onde está gastando mais, "
        "ou análise de custos por categoria."
    )
    args_schema: Type[BaseModel] = GetCashflowCategoriesInput

    def _run(
        self, 
        user_id: str, 
        period: str, 
        transaction_type: Optional[str] = "saida"
    ) -> str:
        """
        Implementação da consulta de categorias.
        
        Em produção, isso faria uma query no banco:
        SELECT category, SUM(amount) as total FROM cashflow_transactions 
        WHERE user_id = ? AND period = ? AND type = ?
        GROUP BY category ORDER BY total DESC
        """
        try:
            # EXEMPLO - Em produção, substituir por query real
            tipo_label = "Custos" if transaction_type == "saida" else "Receitas"
            
            # Simulação de dados do banco
            categories = [
                {"name": "Fornecedores", "amount": 12000.00, "percentage": 36.9},
                {"name": "Salários", "amount": 8000.00, "percentage": 24.6},
                {"name": "Aluguel", "amount": 3500.00, "percentage": 10.8},
                {"name": "Contas (água, luz, internet)", "amount": 2500.00, "percentage": 7.7},
                {"name": "Marketing", "amount": 2000.00, "percentage": 6.2},
                {"name": "Outros", "amount": 4500.00, "percentage": 13.8},
            ]
            
            total = sum(c["amount"] for c in categories)
            
            # Formatar resposta
            response = f"""
Principais Categorias de {tipo_label} - {period}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
            for i, cat in enumerate(categories, 1):
                bar = "█" * int(cat["percentage"] / 5)
                response += f"{i}. {cat['name']}\n"
                response += f"   R$ {cat['amount']:,.2f} ({cat['percentage']:.1f}%)\n"
                response += f"   {bar}\n\n"
            
            response += f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            response += f"Total: R$ {total:,.2f}"
            
            return response
            
        except Exception as e:
            return f"Erro ao consultar categorias: {str(e)}"


class AddCashflowTransactionTool(BaseTool):
    """
    Ferramenta para adicionar uma nova transação ao fluxo de caixa.
    
    Permite que o agente registre movimentações quando o usuário informar:
    - "Recebi R$ 5.000 de vendas hoje"
    - "Paguei R$ 3.000 de aluguel"
    - "Registrar despesa de R$ 1.500 com marketing"
    """
    name: str = "Adicionar Transação ao Fluxo de Caixa"
    description: str = (
        "Registra uma nova transação (entrada ou saída) no fluxo de caixa. "
        "Use quando o usuário quiser registrar uma receita, despesa, pagamento ou recebimento. "
        "Requer: tipo (entrada/saída), valor, categoria e opcionalmente descrição e data."
    )
    args_schema: Type[BaseModel] = AddCashflowTransactionInput

    def _run(
        self,
        user_id: str,
        transaction_type: str,
        amount: float,
        category: str,
        description: Optional[str] = None,
        date: Optional[str] = None
    ) -> str:
        """
        Implementação do registro de transação.
        
        Faz uma requisição POST para a API do Falachefe para salvar no banco PostgreSQL.
        """
        try:
            transaction_date = date or datetime.now().strftime("%Y-%m-%d")
            
            # Preparar dados para enviar à API
            payload = {
                "userId": user_id,
                "type": transaction_type,
                "amount": amount,
                "description": description or f"Transação de {transaction_type}",
                "category": category,
                "date": transaction_date,
                "metadata": {
                    "source": "crewai",
                    "agent": "financial_expert",
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            # Fazer requisição POST para a API
            endpoint = "test" if USE_TEST_MODE else "transactions"
            api_url = f"{API_BASE_URL}/api/financial/{endpoint}"
            
            print(f"📤 Enviando transação para API: {api_url}")
            print(f"   Dados: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=API_TIMEOUT
            )
            
            # Verificar resposta
            if response.status_code not in [200, 201]:
                error_detail = response.json().get('error', 'Erro desconhecido')
                return f"❌ Erro ao registrar transação: {error_detail} (Status: {response.status_code})"
            
            # Parsear resposta da API
            result = response.json()
            transaction = result.get('data', {})
            
            # Formatar resposta de confirmação
            tipo_emoji = "💰" if transaction_type == "entrada" else "💸"
            tipo_label = "Entrada" if transaction_type == "entrada" else "Saída"
            
            response_text = f"""
✅ Transação Registrada com Sucesso no Banco de Dados!

{tipo_emoji} Tipo: {tipo_label}
💵 Valor: R$ {amount:,.2f}
📁 Categoria: {category}
📅 Data: {transaction_date}
"""
            if description:
                response_text += f"📝 Descrição: {description}\n"
            
            response_text += f"\n🆔 ID da transação: {transaction.get('id', 'N/A')}"
            response_text += f"\n💾 Salvo em: PostgreSQL (financial_data)"
            
            print(f"✅ Transação registrada com sucesso: {transaction.get('id')}")
            
            return response_text
            
        except requests.exceptions.ConnectionError:
            return f"❌ Erro de conexão: Não foi possível conectar à API em {API_BASE_URL}. Verifique se o servidor está rodando."
        except requests.exceptions.Timeout:
            return f"❌ Timeout: A API não respondeu em {API_TIMEOUT} segundos."
        except Exception as e:
            return f"❌ Erro ao registrar transação: {str(e)}"


class GetCashflowSummaryTool(BaseTool):
    """
    Ferramenta para obter resumo completo do fluxo de caixa.
    
    Fornece análise detalhada incluindo:
    - Saldo total
    - Entradas e saídas por categoria
    - Tendências
    - Alertas importantes
    """
    name: str = "Obter Resumo Completo do Fluxo de Caixa"
    description: str = (
        "Gera um resumo completo e detalhado do fluxo de caixa incluindo saldos, "
        "análise por categoria, tendências e alertas. Use quando o usuário pedir "
        "uma análise completa, relatório ou visão geral da situação financeira."
    )
    args_schema: Type[BaseModel] = GetCashflowSummaryInput

    def _run(self, user_id: str, period: str) -> str:
        """
        Implementação do resumo completo.
        
        Em produção, faria múltiplas queries para agregar dados.
        """
        try:
            # EXEMPLO - Em produção, fazer queries reais
            summary = {
                "period": period,
                "saldo_inicial": 8000.00,
                "total_entradas": 45000.00,
                "total_saidas": 32500.00,
                "saldo_final": 20500.00,
                "variacao": "+156.25%",
                "top_categorias_entrada": [
                    {"name": "Vendas", "amount": 40000.00},
                    {"name": "Serviços", "amount": 5000.00}
                ],
                "top_categorias_saida": [
                    {"name": "Fornecedores", "amount": 12000.00},
                    {"name": "Salários", "amount": 8000.00},
                    {"name": "Aluguel", "amount": 3500.00}
                ],
                "alertas": [
                    "⚠️ Custos com fornecedores aumentaram 15% em relação ao mês anterior",
                    "✅ Saldo positivo e crescente - boa saúde financeira"
                ]
            }
            
            # Formatar resposta detalhada
            response = f"""
📊 RESUMO COMPLETO DO FLUXO DE CAIXA
Período: {summary['period']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 RESUMO FINANCEIRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saldo Inicial:     R$ {summary['saldo_inicial']:,.2f}
(+) Entradas:      R$ {summary['total_entradas']:,.2f}
(-) Saídas:        R$ {summary['total_saidas']:,.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saldo Final:       R$ {summary['saldo_final']:,.2f}
Variação:          {summary['variacao']}

📈 PRINCIPAIS ENTRADAS
"""
            for cat in summary['top_categorias_entrada']:
                response += f"  • {cat['name']}: R$ {cat['amount']:,.2f}\n"
            
            response += f"\n📉 PRINCIPAIS SAÍDAS\n"
            for cat in summary['top_categorias_saida']:
                response += f"  • {cat['name']}: R$ {cat['amount']:,.2f}\n"
            
            response += f"\n🚨 ALERTAS E OBSERVAÇÕES\n"
            for alerta in summary['alertas']:
                response += f"  {alerta}\n"
            
            return response
            
        except Exception as e:
            return f"Erro ao gerar resumo: {str(e)}"


# ============================================
# EXPORTAR TODAS AS TOOLS
# ============================================

# Lista de todas as ferramentas disponíveis
ALL_CASHFLOW_TOOLS = [
    GetCashflowBalanceTool(),
    GetCashflowCategoriesTool(),
    AddCashflowTransactionTool(),
    GetCashflowSummaryTool(),
]

__all__ = [
    'GetCashflowBalanceTool',
    'GetCashflowCategoriesTool',
    'AddCashflowTransactionTool',
    'GetCashflowSummaryTool',
    'ALL_CASHFLOW_TOOLS',
]

