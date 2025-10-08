"""
Flow Principal do Falachefe
Roteia requests do usuário para a crew especializada adequada
"""

from crewai.flow.flow import Flow, listen, router, start
from pydantic import BaseModel
from typing import Literal

# Importar crews especializadas
from ..crews.cashflow_crew import CashflowCrew


# ============================================
# STATE DO FLOW
# ============================================

class FalachefeState(BaseModel):
    """Estado compartilhado entre todas as etapas do flow"""
    user_id: str = ""
    user_request: str = ""
    request_type: Literal["cashflow", "marketing", "sales", "hr", "general"] = "general"
    result: str = ""


# ============================================
# FLOW PRINCIPAL
# ============================================

class FalachefeFlow(Flow[FalachefeState]):
    """
    Flow Principal do Falachefe
    
    Fluxo:
    1. receive_request - Recebe mensagem do usuário
    2. classify_request - Classifica tipo de request (roteador)
    3. route_to_crew - Roteia para crew especializada
    4. format_response - Formata resposta final
    """
    
    @start()
    def receive_request(self):
        """
        Ponto de entrada - Recebe request do usuário
        Estado deve ser configurado ANTES de chamar kickoff
        """
        print(f"\n{'='*80}")
        print(f"📨 REQUEST RECEBIDO")
        print(f"{'='*80}")
        print(f"👤 User ID: {self.state.user_id}")
        print(f"💬 Mensagem: {self.state.user_request}")
        print(f"{'='*80}\n")
        
        return self.state.user_request
    
    @router(receive_request)
    def classify_request(self):
        """
        Classificador/Roteador - Identifica tipo de request
        
        Usa palavras-chave simples para classificar
        """
        request_lower = self.state.user_request.lower()
        
        print(f"\n{'='*80}")
        print(f"🔍 CLASSIFICANDO REQUEST")
        print(f"{'='*80}\n")
        
        # Palavras-chave para fluxo de caixa
        cashflow_keywords = [
            "fluxo de caixa", "fluxo", "caixa",
            "adicionar", "registrar", "lançar",
            "entrada", "saida", "receita", "despesa",
            "saldo", "quanto", "gastei", "recebi",
            "transação", "transacao", "movimentação",
            "vendas", "compras", "pagamento", "recebimento",
            "consultar", "ver", "mostrar", "listar"
        ]
        
        # Verificar se é sobre fluxo de caixa
        if any(keyword in request_lower for keyword in cashflow_keywords):
            self.state.request_type = "cashflow"
            print(f"✅ Classificado como: FLUXO DE CAIXA")
            print(f"   Será roteado para: Cashflow Crew\n")
            return "cashflow"
        
        # Palavras-chave para marketing
        elif any(word in request_lower for word in ["marketing", "campanha", "divulgação", "publicidade"]):
            self.state.request_type = "marketing"
            print(f"✅ Classificado como: MARKETING\n")
            return "marketing"
        
        # Palavras-chave para vendas
        elif any(word in request_lower for word in ["vendas", "vender", "cliente", "prospecção"]):
            self.state.request_type = "sales"
            print(f"✅ Classificado como: VENDAS\n")
            return "sales"
        
        # Palavras-chave para RH
        elif any(word in request_lower for word in ["rh", "contratar", "funcionário", "folha"]):
            self.state.request_type = "hr"
            print(f"✅ Classificado como: RH\n")
            return "hr"
        
        # Geral
        else:
            self.state.request_type = "general"
            print(f"⚠️  Classificado como: GERAL (não especializado)\n")
            return "general"
    
    @listen("cashflow")
    def execute_cashflow_crew(self):
        """
        Executa a Crew de Fluxo de Caixa (Hierarchical)
        
        O manager da crew irá delegar para o agente especializado
        """
        print(f"\n{'='*80}")
        print(f"💼 EXECUTANDO CASHFLOW CREW")
        print(f"{'='*80}\n")
        
        # Criar inputs para a crew
        inputs = {
            "user_request": self.state.user_request,
            "user_id": self.state.user_id
        }
        
        # Executar crew hierarchical
        cashflow_crew_instance = CashflowCrew()
        result = cashflow_crew_instance.crew().kickoff(inputs=inputs)
        
        # Armazenar resultado no state
        self.state.result = str(result.raw if hasattr(result, 'raw') else result)
        
        print(f"\n{'='*80}")
        print(f"✅ CASHFLOW CREW COMPLETOU")
        print(f"{'='*80}\n")
        
        return self.state.result
    
    @listen("marketing")
    def execute_marketing_crew(self):
        """Placeholder para crew de marketing"""
        self.state.result = "🚧 Crew de Marketing em desenvolvimento. Por enquanto, posso ajudar com fluxo de caixa!"
        return self.state.result
    
    @listen("sales")
    def execute_sales_crew(self):
        """Placeholder para crew de vendas"""
        self.state.result = "🚧 Crew de Vendas em desenvolvimento. Por enquanto, posso ajudar com fluxo de caixa!"
        return self.state.result
    
    @listen("hr")
    def execute_hr_crew(self):
        """Placeholder para crew de RH"""
        self.state.result = "🚧 Crew de RH em desenvolvimento. Por enquanto, posso ajudar com fluxo de caixa!"
        return self.state.result
    
    @listen("general")
    def handle_general(self):
        """Resposta para requests não classificados"""
        self.state.result = """Olá! Sou o assistente do Falachefe. 
        
        Posso ajudar você com:
        💰 Fluxo de Caixa - Adicionar, consultar, analisar transações
        
        Em breve também terei especialistas em:
        📢 Marketing (em desenvolvimento)
        💼 Vendas (em desenvolvimento)  
        👥 RH (em desenvolvimento)
        
        Como posso ajudar você hoje?"""
        return self.state.result


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def run_falachefe_flow(user_id: str, user_request: str) -> str:
    """
    Função helper para executar o flow facilmente
    
    Args:
        user_id: ID do usuário
        user_request: Mensagem/request do usuário
    
    Returns:
        str: Resposta final do flow
    """
    flow = FalachefeFlow()
    
    # Configurar state ANTES de kickoff
    flow.state.user_id = user_id
    flow.state.user_request = user_request
    
    # Kickoff sem argumentos (state já configurado)
    result = flow.kickoff()
    
    print(f"\n{'='*80}")
    print(f"🎯 RESULTADO FINAL")
    print(f"{'='*80}")
    print(result)
    print(f"{'='*80}\n")
    
    return result


if __name__ == "__main__":
    # Teste local
    result = run_falachefe_flow(
        user_id="test_user",
        user_request="O que é fluxo de caixa?"
    )

