from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.memory import LongTermMemory
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

# Importar storage customizado do Supabase
from .storage.supabase_storage import SupabaseVectorStorage

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
            memory=True,  # Habilita memória individual do agente
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
            memory=True,  # Habilita memória individual do agente
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
            memory=True,  # Habilita memória individual do agente
            max_iter=15,
            allow_delegation=False,
        )
    
    # ============================================
    # AGENTE DE SUPORTE
    # ============================================
    
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
            memory=True,  # Habilita memória individual do agente
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
    # TASK - SUPORTE
    # ============================================
    
    @task
    def format_and_send_response(self) -> Task:
        """Task: Formatar resposta e enviar via WhatsApp"""
        return Task(
            config=self.tasks_config['format_and_send_response'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """
        Cria o Falachefe Crew - Modo Sequencial
        
        Plataforma multi-agente de consultoria para PMEs brasileiras.
        
        Arquitetura:
        - Processo SEQUENCIAL com tasks específicas
        - Classificador decide qual agente deve responder (externo ao crew)
        - Especialistas focados em suas áreas (Finanças, Marketing/Vendas, RH)
        - Agente de suporte formata e envia respostas via WhatsApp
        """
        # Configurar storage Supabase Vector
        supabase_storage = SupabaseVectorStorage()
        
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            memory=True,  # Habilita memória de longo prazo
            long_term_memory=LongTermMemory(
                storage=supabase_storage  # Usa Supabase ao invés de SQLite
            )
        )
