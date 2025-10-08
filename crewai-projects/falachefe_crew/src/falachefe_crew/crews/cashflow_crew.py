"""
Crew Especialista em Fluxo de Caixa
Processo Hierarchical com Manager Agent que delega para especialistas
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from typing import List

# Importar ferramentas
from ..tools.cashflow_tools import (
    GetCashflowBalanceTool,
    GetCashflowCategoriesTool,
    AddCashflowTransactionTool,
    GetCashflowSummaryTool,
)

@CrewBase
class CashflowCrew:
    """
    Crew Especialista em Fluxo de Caixa
    
    Arquitetura Hierarchical:
    - Manager Agent: Analisa request e delega para especialista adequado
    - Agentes Especializados: Cada um focado em uma função específica
    """
    
    # ============================================
    # AGENTES ESPECIALIZADOS
    # ============================================
    
    @agent
    def cashflow_manager(self) -> Agent:
        """
        Manager da Crew - Analisa e delega
        Responsável por entender o request e delegá-lo ao especialista correto
        """
        return Agent(
            role="Gerente de Fluxo de Caixa",
            goal="Analisar requests sobre fluxo de caixa e delegar ao especialista adequado usando a ferramenta corretamente",
            backstory="""Você é um gerente experiente de fluxo de caixa que coordena
            uma equipe de especialistas. Sua função é entender exatamente o que o usuário
            precisa e delegar a tarefa ao especialista mais adequado:
            
            - Consultor de Fluxo de Caixa: Para dúvidas, explicações e orientações
            - Registrador de Transações: Para adicionar transações
            - Analista de Fluxo de Caixa: Para consultar saldo e relatórios
            - Editor de Transações: Para editar ou remover transações
            
            IMPORTANTE SOBRE DELEGAÇÃO:
            - Use a ferramenta "Delegate work to coworker" corretamente
            - Os parâmetros task e context devem ser STRINGS SIMPLES
            - Exemplo correto: task="Explicar o que é fluxo de caixa", context="Usuario tem dúvida"
            - NÃO envie objetos JSON ou dicionários
            - Você NÃO executa as tarefas, apenas delega.""",
            allow_delegation=True,
            verbose=True,
            max_iter=10,
            llm="gpt-4o",  # Usar modelo mais robusto para manager
        )
    
    @agent
    def cashflow_consultant(self) -> Agent:
        """
        Especialista em Consultoria
        Responde dúvidas sobre fluxo de caixa
        """
        return Agent(
            role="Consultor de Fluxo de Caixa",
            goal="Responder dúvidas e orientar sobre fluxo de caixa de forma didática",
            backstory="""Você é um consultor especializado em ensinar sobre fluxo de caixa.
            Você responde perguntas como:
            - "O que é fluxo de caixa?"
            - "Como organizar minhas categorias?"
            - "Por que o fluxo de caixa é importante?"
            
            Você explica de forma simples, com exemplos práticos para pequenos empresários.""",
            allow_delegation=False,
            verbose=True,
            max_iter=5,
        )
    
    @agent
    def transaction_recorder(self) -> Agent:
        """
        Especialista em Adicionar Transações
        Registra entradas e saídas no fluxo de caixa
        """
        return Agent(
            role="Registrador de Transações",
            goal="Registrar com precisão transações financeiras no fluxo de caixa",
            backstory="""Você é responsável por registrar transações financeiras.
            Você usa a ferramenta "Adicionar Transação" para salvar:
            - Entradas (vendas, recebimentos)
            - Saídas (despesas, pagamentos)
            
            Você SEMPRE confirma os dados antes de registrar e usa a ferramenta APENAS UMA VEZ.""",
            allow_delegation=False,
            verbose=True,
            max_iter=10,
            tools=[AddCashflowTransactionTool()],
        )
    
    @agent
    def cashflow_analyst(self) -> Agent:
        """
        Especialista em Consultas e Análises
        Consulta saldo, categorias e gera relatórios
        """
        return Agent(
            role="Analista de Fluxo de Caixa",
            goal="Fornecer análises e consultas precisas sobre o fluxo de caixa",
            backstory="""Você é um analista especializado em consultar e analisar dados
            do fluxo de caixa. Você responde perguntas como:
            - "Qual é o meu saldo atual?"
            - "Quanto gastei este mês?"
            - "Quais são minhas principais despesas?"
            
            Você usa ferramentas de consulta para buscar dados reais do banco.""",
            allow_delegation=False,
            verbose=True,
            max_iter=10,
            tools=[
                GetCashflowBalanceTool(),
                GetCashflowCategoriesTool(),
                GetCashflowSummaryTool(),
            ],
        )
    
    @agent
    def transaction_editor(self) -> Agent:
        """
        Especialista em Editar/Remover Transações
        Edita ou remove transações existentes
        """
        return Agent(
            role="Editor de Transações",
            goal="Editar ou remover transações do fluxo de caixa com segurança",
            backstory="""Você é responsável por modificar ou excluir transações.
            Você sempre pede confirmação antes de fazer alterações.
            
            IMPORTANTE: Por enquanto, você informa que a funcionalidade de edição/remoção
            está em desenvolvimento e sugere alternativas.""",
            allow_delegation=False,
            verbose=True,
            max_iter=5,
        )
    
    # ============================================
    # TASK PRINCIPAL - Manager Delega
    # ============================================
    
    @task
    def handle_cashflow_request(self) -> Task:
        """
        Task principal que o manager recebe e delega
        """
        return Task(
            description="""Analisar o request do usuário sobre fluxo de caixa e delegar
            ao especialista adequado.
            
            Request do usuário: {user_request}
            User ID: {user_id}
            
            Analise o request e determine:
            
            1. Se é uma DÚVIDA/CONSULTA → Delegue ao "Consultor de Fluxo de Caixa"
               Exemplos: "O que é fluxo de caixa?", "Como funciona?", "Por que usar?"
            
            2. Se é para ADICIONAR transação → Delegue ao "Registrador de Transações"
               Exemplos: "Adicionar 100 de vendas", "Registrar despesa de 500"
            
            3. Se é para CONSULTAR saldo/dados → Delegue ao "Analista de Fluxo de Caixa"
               Exemplos: "Qual meu saldo?", "Quanto gastei?", "Principais despesas?"
            
            4. Se é para EDITAR/REMOVER → Delegue ao "Editor de Transações"
               Exemplos: "Remover transação X", "Corrigir valor de Y"
            
            IMPORTANTE: Delegue para APENAS UM especialista. Não tente fazer tudo sozinho.""",
            expected_output="""Resposta completa do especialista que atendeu o request.
            
            A resposta deve incluir:
            - Confirmação do que foi feito (se aplicável)
            - Informações solicitadas (se aplicável)
            - Próximos passos ou sugestões""",
            agent=self.cashflow_manager()
        )
    
    # ============================================
    # CREW COM PROCESSO HIERARCHICAL
    # ============================================
    
    @crew
    def crew(self) -> Crew:
        """
        Cria a Crew de Fluxo de Caixa com processo hierarchical
        
        O manager (criado automaticamente pelo LLM) delega ao especialista adequado
        
        IMPORTANTE: Usar manager_llm ao invés de manager_agent custom
        Isso permite melhor delegação automática
        """
        # Agentes especialistas - O manager é criado automaticamente
        specialist_agents = [
            self.cashflow_consultant(),
            self.transaction_recorder(),
            self.cashflow_analyst(),
            self.transaction_editor(),
        ]
        
        return Crew(
            agents=specialist_agents,    # Apenas especialistas
            tasks=self.tasks,             # Task principal
            process=Process.hierarchical, # Manager delega automaticamente
            manager_llm="gpt-4o",         # LLM para o manager automático
            verbose=True,
        )

