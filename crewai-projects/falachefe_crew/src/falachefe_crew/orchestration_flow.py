"""
Fluxo de Orquestração Falachefe com Roteamento Condicional

Este flow implementa o roteamento inteligente onde:
1. Orquestrador analisa a demanda
2. Roteia para APENAS o especialista apropriado
3. Support agent formata e envia a resposta

Usa CrewAI Flows para roteamento condicional.
"""

from crewai.flow.flow import Flow, listen, start, router, or_
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel
from typing import Optional, Literal
import json

# Importar ferramentas
from .tools.cashflow_tools import (
    GetCashflowBalanceTool,
    GetCashflowCategoriesTool,
    AddCashflowTransactionTool,
    GetCashflowSummaryTool,
)

from .tools.uazapi_tools import (
    SendTextMessageTool,
    SendMenuMessageTool,
    SendMediaMessageTool,
    GetChatDetailsTool,
    UpdateLeadInfoTool,
    FormatResponseTool,
)


class OrchestrationState(BaseModel):
    """Estado do fluxo de orquestração"""
    user_request: str = ""
    user_context: str = ""
    whatsapp_number: str = ""
    user_id: str = ""
    
    # Decisão do orquestrador
    chosen_specialist: Optional[str] = None
    confidence: Optional[str] = None
    reasoning: Optional[str] = None
    
    # Resposta do especialista
    specialist_response: Optional[str] = None
    
    # Status de envio
    message_sent: bool = False
    message_id: Optional[str] = None


class FalachefeOrchestrationFlow(Flow[OrchestrationState]):
    """
    Flow de orquestração com roteamento condicional
    
    Fluxo:
    1. analyze_request → Orquestrador decide qual especialista
    2. route_to_specialist → Router direciona para o especialista certo
    3. [financial/marketing/sales/hr]_consultation → Especialista responde
    4. format_and_send → Support agent envia via WhatsApp
    """
    
    @start()
    def analyze_request(self):
        """
        Passo 1: Orquestrador analisa a demanda e decide qual especialista
        """
        print("\n🎯 PASSO 1: Analisando demanda com orquestrador...")
        
        # Criar agente orquestrador
        orchestrator = Agent(
            role="Gerente de Atendimento e Orquestrador de Especialistas",
            goal="Analisar demandas e identificar qual especialista deve atender",
            backstory="""Você é um gerente experiente com visão holística de negócios. 
            Você identifica rapidamente qual especialista (Financeiro, Marketing, Vendas ou RH) 
            é mais adequado para cada demanda.""",
            allow_delegation=False,
            verbose=True
        )
        
        # Task de análise
        analysis_task = Task(
            description=f"""Analise esta demanda e decida qual especialista deve atender:

Demanda: {self.state.user_request}
Contexto: {self.state.user_context}

Especialistas disponíveis:
- financial: Fluxo de caixa, custos, precificação, análise financeira, DRE
- marketing: Estratégias digitais, redes sociais, campanhas, SEO, branding
- sales: Processos comerciais, prospecção, fechamento, CRM, funil
- hr: Contratação, legislação trabalhista, gestão de pessoas, folha

Retorne APENAS um JSON neste formato exato:
{{
    "specialist": "financial|marketing|sales|hr",
    "confidence": "high|medium|low",
    "reasoning": "Breve explicação da escolha"
}}""",
            expected_output="JSON com a decisão do especialista",
            agent=orchestrator
        )
        
        # Executar análise
        crew = Crew(
            agents=[orchestrator],
            tasks=[analysis_task],
            verbose=False
        )
        
        result = crew.kickoff()
        
        # Parse do resultado
        try:
            # Tentar extrair JSON da resposta
            result_text = str(result.raw) if hasattr(result, 'raw') else str(result)
            
            # Procurar por JSON no texto
            import re
            json_match = re.search(r'\{[^}]+\}', result_text)
            if json_match:
                decision = json.loads(json_match.group())
            else:
                # Fallback: tentar parsear tudo
                decision = json.loads(result_text)
            
            self.state.chosen_specialist = decision.get("specialist", "financial")
            self.state.confidence = decision.get("confidence", "medium")
            self.state.reasoning = decision.get("reasoning", "Análise automática")
            
        except:
            # Fallback: usar financial como padrão
            print("⚠️  Não conseguiu parsear decisão, usando financial como padrão")
            self.state.chosen_specialist = "financial"
            self.state.confidence = "low"
            self.state.reasoning = "Fallback para financial expert"
        
        print(f"   ✅ Decisão: {self.state.chosen_specialist}")
        print(f"   📊 Confiança: {self.state.confidence}")
        print(f"   💡 Razão: {self.state.reasoning}")
        
        return self.state.chosen_specialist
    
    @router(analyze_request)
    def route_to_specialist(self):
        """
        Passo 2: Router que direciona para o especialista escolhido
        """
        print(f"\n🔀 PASSO 2: Roteando para {self.state.chosen_specialist}...")
        return self.state.chosen_specialist
    
    @listen("financial")
    def financial_consultation(self):
        """Passo 3a: Especialista Financeiro responde"""
        print("\n💰 PASSO 3: Processando com Especialista Financeiro...")
        
        financial_expert = Agent(
            role="Especialista Financeiro para PMEs",
            goal="Ajudar empresários com gestão financeira, fluxo de caixa e análise",
            backstory="""Você é um contador experiente especializado em pequenas empresas.
            Você explica conceitos financeiros de forma simples e prática.""",
            verbose=True,
            tools=[
                GetCashflowBalanceTool(),
                GetCashflowCategoriesTool(),
                AddCashflowTransactionTool(),
                GetCashflowSummaryTool(),
            ]
        )
        
        task = Task(
            description=f"""Responda a esta demanda financeira:

Pergunta: {self.state.user_request}
Contexto: {self.state.user_context}

Forneça uma resposta prática, clara e objetiva adequada para WhatsApp (máximo 800 caracteres).
Foque em ações práticas que o empresário pode implementar.""",
            expected_output="Resposta clara e objetiva sobre a questão financeira",
            agent=financial_expert
        )
        
        crew = Crew(agents=[financial_expert], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        self.state.specialist_response = str(result.raw) if hasattr(result, 'raw') else str(result)
        print(f"   ✅ Resposta gerada ({len(self.state.specialist_response)} caracteres)")
    
    @listen("marketing")
    def marketing_consultation(self):
        """Passo 3b: Especialista Marketing responde"""
        print("\n📱 PASSO 3: Processando com Especialista Marketing...")
        
        marketing_expert = Agent(
            role="Especialista em Marketing Digital para PMEs",
            goal="Ajudar empresários com estratégias de marketing e presença online",
            backstory="""Você é especialista em marketing digital para pequenas empresas.
            Você cria estratégias econômicas e eficazes.""",
            verbose=True
        )
        
        task = Task(
            description=f"""Responda a esta demanda de marketing:

Pergunta: {self.state.user_request}
Contexto: {self.state.user_context}

Forneça uma resposta prática adequada para WhatsApp (máximo 800 caracteres).""",
            expected_output="Resposta clara sobre estratégia de marketing",
            agent=marketing_expert
        )
        
        crew = Crew(agents=[marketing_expert], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        self.state.specialist_response = str(result.raw) if hasattr(result, 'raw') else str(result)
        print(f"   ✅ Resposta gerada ({len(self.state.specialist_response)} caracteres)")
    
    @listen("sales")
    def sales_consultation(self):
        """Passo 3c: Especialista Vendas responde"""
        print("\n📊 PASSO 3: Processando com Especialista Vendas...")
        
        sales_expert = Agent(
            role="Especialista em Vendas e Gestão Comercial",
            goal="Auxiliar empresários a estruturar processos de vendas",
            backstory="""Você é profissional de vendas com experiência em estruturação comercial.
            Você ajuda empresários a criarem processos de vendas escaláveis.""",
            verbose=True
        )
        
        task = Task(
            description=f"""Responda a esta demanda comercial:

Pergunta: {self.state.user_request}
Contexto: {self.state.user_context}

Forneça uma resposta prática adequada para WhatsApp (máximo 800 caracteres).""",
            expected_output="Resposta clara sobre processo de vendas",
            agent=sales_expert
        )
        
        crew = Crew(agents=[sales_expert], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        self.state.specialist_response = str(result.raw) if hasattr(result, 'raw') else str(result)
        print(f"   ✅ Resposta gerada ({len(self.state.specialist_response)} caracteres)")
    
    @listen("hr")
    def hr_consultation(self):
        """Passo 3d: Especialista RH responde"""
        print("\n👥 PASSO 3: Processando com Especialista RH...")
        
        hr_expert = Agent(
            role="Especialista em Recursos Humanos",
            goal="Apoiar empresários com gestão de pessoas e questões trabalhistas",
            backstory="""Você é especialista em RH com conhecimento da legislação brasileira.
            Você fornece soluções práticas em conformidade com a lei.""",
            verbose=True
        )
        
        task = Task(
            description=f"""Responda a esta demanda de RH:

Pergunta: {self.state.user_request}
Contexto: {self.state.user_context}

Forneça uma resposta prática adequada para WhatsApp (máximo 800 caracteres).""",
            expected_output="Resposta clara sobre gestão de pessoas",
            agent=hr_expert
        )
        
        crew = Crew(agents=[hr_expert], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        self.state.specialist_response = str(result.raw) if hasattr(result, 'raw') else str(result)
        print(f"   ✅ Resposta gerada ({len(self.state.specialist_response)} caracteres)")
    
    @listen(or_("financial", "marketing", "sales", "hr"))
    def format_and_send(self):
        """
        Passo 4: Support agent formata e envia via WhatsApp
        """
        print("\n📱 PASSO 4: Formatando e enviando via WhatsApp...")
        
        support_agent = Agent(
            role="Agente de Suporte e Comunicação via WhatsApp",
            goal="Formatar respostas e enviar via WhatsApp de forma profissional",
            backstory="""Você é especialista em comunicação digital via WhatsApp.
            Você formata mensagens de forma clara, amigável e profissional.""",
            verbose=True,
            tools=[
                SendTextMessageTool(),
                FormatResponseTool(),
            ]
        )
        
        task = Task(
            description=f"""Formate e envie esta resposta via WhatsApp:

Resposta do especialista:
{self.state.specialist_response}

Número WhatsApp: {self.state.whatsapp_number}

INSTRUÇÕES:
1. Use a ferramenta FormatResponseTool para formatar a resposta
2. Use a ferramenta SendTextMessageTool para enviar
3. A mensagem deve ser clara, com saudação e assinatura Falachefe
4. Máximo 1000 caracteres
5. Use emojis moderadamente""",
            expected_output="Confirmação de envio com message_id",
            agent=support_agent
        )
        
        crew = Crew(agents=[support_agent], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        print(f"   ✅ Mensagem enviada!")
        
        # Tentar extrair message_id do resultado
        result_text = str(result.raw) if hasattr(result, 'raw') else str(result)
        try:
            if "message_id" in result_text:
                import re
                match = re.search(r'"message_id":\s*"([^"]+)"', result_text)
                if match:
                    self.state.message_id = match.group(1)
        except:
            pass
        
        self.state.message_sent = True
        
        return {
            "status": "sent",
            "specialist": self.state.chosen_specialist,
            "message_sent": True
        }


def run_orchestrated_consultation(
    user_request: str,
    user_context: str,
    whatsapp_number: str,
    user_id: str = "default_user"
):
    """
    Executa uma consultoria orquestrada completa
    
    Args:
        user_request: Pergunta/demanda do usuário
        user_context: Contexto da empresa/situação
        whatsapp_number: Número WhatsApp para envio
        user_id: ID do usuário
    
    Returns:
        Estado final do flow com resultado
    """
    
    # Criar flow com estado inicial
    flow = FalachefeOrchestrationFlow()
    
    # Configurar estado inicial
    flow.state.user_request = user_request
    flow.state.user_context = user_context
    flow.state.whatsapp_number = whatsapp_number
    flow.state.user_id = user_id
    
    # Executar flow
    result = flow.kickoff()
    
    return result

