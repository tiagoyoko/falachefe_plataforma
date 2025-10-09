"""
Crew Especialista em Fluxo de Caixa - Sequential Process
Cada tipo de request tem sua task específica com parâmetros estruturados
"""

from crewai import Agent, Crew, Process, Task
from typing import Dict, Any
from datetime import datetime, timedelta

# Importar ferramentas
from ..tools.cashflow_tools import (
    GetCashflowBalanceTool,
    GetCashflowCategoriesTool,
    AddCashflowTransactionTool,
    GetCashflowSummaryTool,
)


class CashflowCrewSequential:
    """
    Crew Especialista em Fluxo de Caixa - Abordagem Sequential
    
    Cada agente tem sua task específica
    O Flow decide QUAL task executar baseado no tipo de request
    """
    
    def __init__(self):
        """Inicializa agentes"""
        self._init_agents()
    
    def _init_agents(self):
        """Cria todos os agentes especializados"""
        
        self.consultor = Agent(
            role="Consultor de Fluxo de Caixa",
            goal="Responder dúvidas sobre fluxo de caixa de forma didática",
            backstory="Você é especialista em ensinar sobre fluxo de caixa para pequenos empresários.",
            allow_delegation=False,
            verbose=True,
            llm="gpt-4o-mini"
        )
        
        self.registrador = Agent(
            role="Registrador de Transações",
            goal="Registrar transações no banco de dados usando a ferramenta",
            backstory="""Você registra transações financeiras no fluxo de caixa.
            SEMPRE use a ferramenta "Adicionar Transação ao Fluxo de Caixa" para salvar.
            Use a ferramenta APENAS UMA VEZ por transação.""",
            allow_delegation=False,
            verbose=True,
            tools=[AddCashflowTransactionTool()],
            llm="gpt-4o-mini"
        )
        
        self.analista = Agent(
            role="Analista de Fluxo de Caixa",
            goal="Consultar e analisar dados do fluxo de caixa",
            backstory="Você busca dados reais do banco usando ferramentas de consulta.",
            allow_delegation=False,
            verbose=True,
            tools=[
                GetCashflowBalanceTool(),
                GetCashflowCategoriesTool(),
                GetCashflowSummaryTool(),
            ],
            llm="gpt-4o-mini"
        )
    
    # ============================================
    # CREWS ESPECÍFICAS POR TIPO DE REQUEST
    # ============================================
    
    def responder_duvida(self, user_request: str, user_id: str) -> Any:
        """Crew para responder dúvidas sobre fluxo de caixa"""
        
        task = Task(
            description=f"""Responder a dúvida do usuário sobre fluxo de caixa.
            
            Dúvida: {user_request}
            User ID: {user_id}
            
            Forneça uma explicação clara, didática e prática.""",
            expected_output="Explicação completa e didática",
            agent=self.consultor
        )
        
        crew = Crew(
            agents=[self.consultor],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        return crew.kickoff()
    
    def adicionar_transacao(
        self, 
        user_id: str,
        amount: float,
        category: str,
        transaction_type: str = "entrada",
        date: str = None,
        description: str = None
    ) -> Any:
        """Crew para adicionar transação com parâmetros estruturados"""
        
        if not date:
            date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        if not description:
            description = f"{transaction_type.capitalize()} - {category}"
        
        task = Task(
            description=f"""Registrar a seguinte transação no fluxo de caixa:
            
            User ID: {user_id}
            Tipo: {transaction_type}
            Valor: R$ {amount:.2f}
            Categoria: {category}
            Data: {date}
            Descrição: {description}
            
            Use a ferramenta "Adicionar Transação ao Fluxo de Caixa" com estes parâmetros EXATOS.""",
            expected_output="Confirmação do registro com ID da transação",
            agent=self.registrador
        )
        
        crew = Crew(
            agents=[self.registrador],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        return crew.kickoff()
    
    def consultar_saldo(self, user_id: str, period: str = "current_month") -> Any:
        """Crew para consultar saldo"""
        
        task = Task(
            description=f"""Consultar o saldo do fluxo de caixa.
            
            User ID: {user_id}
            Período: {period}
            
            Use a ferramenta "Consultar Saldo do Fluxo de Caixa".""",
            expected_output="Saldo detalhado com entradas, saídas e saldo final",
            agent=self.analista
        )
        
        crew = Crew(
            agents=[self.analista],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        return crew.kickoff()
    
    def consultar_categorias(
        self, 
        user_id: str, 
        period: str = "current_month",
        transaction_type: str = "saida"
    ) -> Any:
        """Crew para consultar categorias"""
        
        task = Task(
            description=f"""Consultar as principais categorias de {transaction_type}.
            
            User ID: {user_id}
            Período: {period}
            
            Use a ferramenta "Consultar Categorias do Fluxo de Caixa".""",
            expected_output="Lista de categorias ordenadas por valor",
            agent=self.analista
        )
        
        crew = Crew(
            agents=[self.analista],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        return crew.kickoff()


