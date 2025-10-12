from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

# Importar ferramentas customizadas de fluxo de caixa
from .tools.cashflow_tools import (
    GetCashflowBalanceTool,
    GetCashflowCategoriesTool,
    AddCashflowTransactionTool,
    GetCashflowSummaryTool,
)

# Importar ferramentas de integração com uazapi (WhatsApp)
from .tools.uazapi_tools import (
    SendTextMessageTool,
    SendMenuMessageTool,
    SendMediaMessageTool,
    GetChatDetailsTool,
    UpdateLeadInfoTool,
    FormatResponseTool,
)

# Para executar código antes ou depois do crew iniciar, você pode usar os decorators
# @before_kickoff e @after_kickoff
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class FalachefeCrew():
    """
    FalachefeCrew - Plataforma de Consultoria Multi-Agente com IA
    
    Especialistas em Finanças, Marketing, Vendas e RH para
    Pequenos e Médios Empresários Brasileiros
    """

    agents: List[BaseAgent]
    tasks: List[Task]

    # Saiba mais sobre arquivos de configuração YAML aqui:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    
    # Se você quiser adicionar ferramentas aos seus agentes, saiba mais aqui:
    # https://docs.crewai.com/concepts/agents#agent-tools
    
    # ============================================
    # AGENTES ESPECIALISTAS
    # ============================================
    
    @agent
    def financial_expert(self) -> Agent:
        """
        Especialista Financeiro
        Responsável por fluxo de caixa, análise financeira e consultoria
        
        Ferramentas disponíveis:
        - Consultar saldo do fluxo de caixa
        - Consultar categorias de custos/receitas
        - Adicionar transações
        - Gerar resumos completos
        """
        return Agent(
            config=self.agents_config['financial_expert'], # type: ignore[index]
            verbose=True,
            tools=[
                GetCashflowBalanceTool(),
                GetCashflowCategoriesTool(),
                AddCashflowTransactionTool(),
                GetCashflowSummaryTool(),
            ],
            max_iter=15,  # Limita o número de iterações do agente
            allow_delegation=False,  # Impede que o agente delegue para outros
        )

    @agent
    def marketing_sales_expert(self) -> Agent:
        """
        Max - Especialista em Marketing Digital e Vendas
        Responsável por estratégias integradas de marketing e vendas focadas em performance
        
        Domina:
        - Marketing digital em todos os canais
        - Processos de vendas escaláveis
        - Métricas de performance (ROAS, CTR, CPL, Conversão)
        - Planos práticos de 90 dias
        """
        return Agent(
            config=self.agents_config['marketing_sales_expert'], # type: ignore[index]
            verbose=True,
            max_iter=15,
            allow_delegation=False,
        )
    
    @agent
    def hr_expert(self) -> Agent:
        """
        Especialista em Recursos Humanos
        Responsável por gestão de pessoas e questões trabalhistas
        """
        return Agent(
            config=self.agents_config['hr_expert'], # type: ignore[index]
            verbose=True,
            max_iter=15,
            allow_delegation=False,
        )
    
    # ============================================
    # AGENTES DE ORQUESTRAÇÃO E SUPORTE
    # ============================================
    
    @agent
    def orchestrator(self) -> Agent:
        """
        Agente Orquestrador
        Responsável por receber demandas e direcionar aos especialistas
        
        Função principal:
        - Analisar requisições dos usuários
        - Identificar qual especialista é mais adequado
        - Coordenar consultorias multi-disciplinares
        - Gerenciar o fluxo de trabalho entre especialistas
        """
        return Agent(
            config=self.agents_config['orchestrator'], # type: ignore[index]
            verbose=True,
            allow_delegation=True,  # IMPORTANTE: permite delegar para especialistas
            max_iter=10,
        )
    
    @agent
    def support_agent(self) -> Agent:
        """
        Agente de Suporte e Comunicação
        Responsável por formatar e enviar respostas via WhatsApp
        
        Ferramentas disponíveis:
        - Enviar mensagens de texto
        - Enviar menus interativos
        - Enviar mídia (documentos, imagens)
        - Formatar respostas
        - Obter detalhes do chat
        - Atualizar informações do lead
        """
        return Agent(
            config=self.agents_config['support_agent'], # type: ignore[index]
            verbose=True,
            tools=[
                SendTextMessageTool(),
                SendMenuMessageTool(),
                SendMediaMessageTool(),
                GetChatDetailsTool(),
                UpdateLeadInfoTool(),
                FormatResponseTool(),
            ],
            max_iter=15,
            allow_delegation=False,
        )

    # ============================================
    # TASKS - ÁREA FINANCEIRA
    # ============================================
    
    @task
    def create_cashflow(self) -> Task:
        """Task: Criar primeiro fluxo de caixa"""
        return Task(
            config=self.tasks_config['create_cashflow'], # type: ignore[index]
        )

    @task
    def update_cashflow(self) -> Task:
        """Task: Atualizar fluxo de caixa com movimentações"""
        return Task(
            config=self.tasks_config['update_cashflow'], # type: ignore[index]
        )
    
    @task
    def analyze_cashflow(self) -> Task:
        """Task: Analisar resultados do fluxo de caixa"""
        return Task(
            config=self.tasks_config['analyze_cashflow'], # type: ignore[index]
            output_file='cashflow_analysis.md'
        )
    
    @task
    def financial_advice(self) -> Task:
        """Task: Consultoria financeira"""
        return Task(
            config=self.tasks_config['financial_advice'], # type: ignore[index]
        )
    
    # ============================================
    # TASKS - ÁREA DE MARKETING E VENDAS (UNIFICADO)
    # ============================================
    
    @task
    def marketing_sales_plan(self) -> Task:
        """
        Task: Criar plano integrado de Marketing e Vendas
        
        Max entrega um plano prático de 90 dias com:
        - Estratégia por canal
        - Cronograma executável
        - Processos de vendas
        - KPIs e métricas
        """
        return Task(
            config=self.tasks_config['marketing_sales_plan'], # type: ignore[index]
            output_file='marketing_sales_plan.md'
        )
    
    # ============================================
    # TASKS - ÁREA DE RH
    # ============================================
    
    @task
    def hr_guidance(self) -> Task:
        """Task: Orientação sobre RH"""
        return Task(
            config=self.tasks_config['hr_guidance'], # type: ignore[index]
        )
    
    # ============================================
    # TASK - CONSULTORIA INTEGRADA
    # ============================================
    
    @task
    def business_consultation(self) -> Task:
        """Task: Consultoria empresarial multi-disciplinar"""
        return Task(
            config=self.tasks_config['business_consultation'], # type: ignore[index]
            output_file='business_consultation.md'
        )
    
    # ============================================
    # TASKS - ORQUESTRAÇÃO E SUPORTE
    # ============================================
    
    @task
    def orchestrate_request(self) -> Task:
        """Task: Orquestrar demanda do usuário para especialista correto"""
        return Task(
            config=self.tasks_config['orchestrate_request'], # type: ignore[index]
        )
    
    @task
    def format_and_send_response(self) -> Task:
        """Task: Formatar resposta e enviar via WhatsApp"""
        return Task(
            config=self.tasks_config['format_and_send_response'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """
        Cria o Falachefe Crew - Modo Sequencial (tasks específicas)
        
        Use este crew quando souber exatamente quais tasks executar.
        Para orquestração automática, use orchestrated_crew()
        """
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
    
    def orchestrated_crew(self) -> Crew:
        """
        Cria o Falachefe Crew - Modo Orquestrado (RECOMENDADO)
        
        Plataforma multi-agente de consultoria para PMEs brasileiras
        
        Arquitetura:
        - Processo HIERÁRQUICO com agente orquestrador
        - Orquestrador analisa demandas e delega para especialistas
        - Agente de suporte formata e envia respostas via WhatsApp
        - Especialistas focados em suas áreas (Finanças, Marketing, Vendas, RH)
        
        Use este crew para atendimento via WhatsApp com roteamento automático.
        """
        
        # IMPORTANTE: Em processo hierárquico, o manager_agent NÃO deve estar na lista agents
        # Apenas os agentes subordinados (especialistas + suporte)
        subordinate_agents = [
            self.financial_expert(),
            self.marketing_expert(),
            self.sales_expert(),
            self.hr_expert(),
            self.support_agent(),
        ]
        
        # Tasks de orquestração (apenas as relevantes para o fluxo orquestrado)
        orchestration_tasks = [
            self.orchestrate_request(),
            self.format_and_send_response(),
        ]

        return Crew(
            agents=subordinate_agents,  # Apenas agentes subordinados (SEM orchestrator)
            tasks=orchestration_tasks,  # Apenas tasks de orquestração
            process=Process.hierarchical,  # Processo hierárquico
            manager_agent=self.orchestrator(),  # Orquestrador como manager
            verbose=True,
            # Documentação do processo hierárquico:
            # https://docs.crewai.com/concepts/processes#hierarchical-process
        )
