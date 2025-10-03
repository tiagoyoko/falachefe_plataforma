# 🚀 **Guia Completo de Implementação Agent Squad - Projeto Falachefe**

## 📋 **Índice**
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Análise de Requisitos](#análise-de-requisitos)
4. [Dependências e Premissas](#dependências-e-premissas)
5. [Design da Equipe de Agentes](#design-da-equipe-de-agentes)
6. [Implementação Passo a Passo](#implementação-passo-a-passo)
7. [Integração com UazAPI](#integração-com-uazapi)
8. [Sistema de Memória](#sistema-de-memória)
9. [Playground e Testes](#playground-e-testes)
10. [Deploy e Produção](#deploy-e-produção)
11. [Monitoramento e Manutenção](#monitoramento-e-manutenção)

---

## 🎯 **Visão Geral**

### **Objetivo**
Implementar um sistema de agentes de IA especializados para o projeto Falachefe, utilizando o framework Agent Squad da AWS Labs, com orquestração inteligente de múltiplos agentes especializados em diferentes domínios empresariais.

### **Equipe de Agentes Proposta**
- **🤖 Orquestrador Principal**: Coordena e roteia conversas
- **💰 Agente Financeiro**: Gestão financeira e análise de custos
- **📊 Agente Fluxo de Caixa**: Monitoramento de receitas e despesas
- **📈 Agente Marketing e Vendas**: Estratégias de marketing e conversão
- **👥 Agente RH**: Recursos humanos e gestão de pessoas

### **Stack Tecnológica**
- **Framework**: Agent Squad (AWS Labs)
- **LLM**: OpenAI GPT-4/GPT-3.5
- **Integração**: UazAPI (WhatsApp)
- **Backend**: Next.js + NestJS
- **Banco de Dados**: PostgreSQL + Drizzle ORM
- **Deploy**: AWS (Lambda, RDS, S3)

---

## 🏗️ **Arquitetura do Sistema**

### **Diagrama de Arquitetura**
```
┌─────────────────────────────────────────────────────────────┐
│                    FALACHEFE AGENT SQUAD                    │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp User  →  UazAPI  →  Webhook  →  Agent Orchestrator │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                ORCHESTRATOR                             │ │
│  │  • Intent Classification                               │ │
│  │  • Agent Routing                                       │ │
│  │  • Context Management                                  │ │
│  │  • Memory Coordination                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   AGENTE    │ │   AGENTE    │ │   AGENTE    │ │ AGENTE  │ │
│  │ FINANCEIRO  │ │ FLUXO CAIXA │ │MARKETING/   │ │   RH    │ │
│  │             │ │             │ │   VENDAS    │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              MEMORY SYSTEM                              │ │
│  │  • Individual Agent Memory                             │ │
│  │  • Shared Context Memory                               │ │
│  │  • Conversation History                                │ │
│  │  • User Preferences                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              STORAGE LAYER                              │ │
│  │  • PostgreSQL (Conversations, Users, Context)          │ │
│  │  • Redis (Session Cache)                               │ │
│  │  • S3 (File Storage)                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Comunicação**
1. **Usuário** envia mensagem via WhatsApp
2. **UazAPI** recebe e envia webhook para o sistema
3. **Webhook Handler** processa e valida a mensagem
4. **Orchestrator** classifica a intenção e roteia para agente apropriado
5. **Agente Especializado** processa com contexto e memória
6. **Resposta** é enviada de volta via UazAPI para o usuário

---

## 📊 **Análise de Requisitos**

### **Requisitos Funcionais**

#### **RF01 - Orquestração Inteligente**
- Sistema deve rotear automaticamente mensagens para agentes apropriados
- Suporte a transferência de contexto entre agentes
- Capacidade de escalação para supervisor humano

#### **RF02 - Agentes Especializados**
- **Agente Financeiro**: Análise de orçamentos, custos, ROI
- **Agente Fluxo de Caixa**: Projeções, alertas de vencimento
- **Agente Marketing**: Campanhas, métricas, estratégias
- **Agente Vendas**: Qualificação de leads, follow-up
- **Agente RH**: Recrutamento, avaliações, políticas

#### **RF03 - Memória Persistente**
- Histórico de conversas por usuário
- Contexto compartilhado entre agentes
- Preferências e perfil do usuário
- Aprendizado contínuo

#### **RF04 - Integração WhatsApp**
- Recebimento de mensagens via webhook
- Envio de respostas em tempo real
- Suporte a mídias (imagem, documento, áudio)
- Status de entrega e leitura

### **Requisitos Não-Funcionais**

#### **RNF01 - Performance**
- Tempo de resposta < 3 segundos
- Suporte a 1000+ conversas simultâneas
- Disponibilidade 99.9%

#### **RNF02 - Escalabilidade**
- Auto-scaling baseado em demanda
- Processamento assíncrono
- Cache inteligente

#### **RNF03 - Segurança**
- Criptografia end-to-end
- Autenticação de webhooks
- Logs de auditoria
- GDPR compliance

#### **RNF04 - Monitoramento**
- Métricas em tempo real
- Alertas automáticos
- Dashboard de performance
- Logs estruturados

---

## 🔧 **Dependências e Premissas**

### **Dependências Técnicas**

#### **Backend**
```json
{
  "dependencies": {
    "agent-squad": "^0.8.1",
    "openai": "^4.0.0",
    "anthropic": "^0.7.0",
    "langchain": "^0.1.0",
    "langchain-openai": "^0.0.8",
    "redis": "^4.6.0",
    "ioredis": "^5.3.0",
    "aws-sdk": "^3.400.0",
    "serverless": "^3.38.0",
    "serverless-python-requirements": "^6.0.0"
  }
}
```

#### **Frontend**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "shadcn/ui": "latest",
    "recharts": "^2.8.0",
    "socket.io-client": "^4.7.0"
  }
}
```

#### **Infraestrutura**
- **AWS Lambda**: Funções serverless
- **AWS RDS**: PostgreSQL gerenciado
- **AWS ElastiCache**: Redis para cache
- **AWS S3**: Armazenamento de arquivos
- **AWS CloudWatch**: Monitoramento
- **AWS API Gateway**: API REST

### **Premissas de Negócio**

#### **P01 - Domínio de Conhecimento**
- Agentes possuem conhecimento especializado em seus domínios
- Base de conhecimento é mantida atualizada
- Treinamento contínuo com dados reais

#### **P02 - Integração de Sistemas**
- UazAPI mantém estabilidade de conexão
- WhatsApp Business API disponível
- Sistemas legados são acessíveis via APIs

#### **P03 - Experiência do Usuário**
- Interface conversacional natural
- Respostas contextualizadas e relevantes
- Suporte multilíngue (PT-BR prioritário)

#### **P04 - Conformidade**
- LGPD compliance para dados pessoais
- Auditoria de todas as interações
- Backup e recuperação de dados

---

## 🤖 **Design da Equipe de Agentes**

### **Orquestrador Principal**

#### **Responsabilidades**
- Classificação de intenções
- Roteamento inteligente
- Gerenciamento de contexto
- Coordenação entre agentes
- Escalação para humanos

#### **Configuração**
```python
class FalachefeOrchestrator(Orchestrator):
    def __init__(self):
        super().__init__(
            name="falachefe_orchestrator",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é o orquestrador principal do sistema Falachefe.
            Sua função é classificar intenções e rotear mensagens para os agentes apropriados.
            
            Agentes disponíveis:
            - financial_agent: Questões financeiras, orçamentos, custos
            - cashflow_agent: Fluxo de caixa, projeções, alertas
            - marketing_agent: Marketing, campanhas, estratégias
            - sales_agent: Vendas, leads, follow-up
            - hr_agent: Recursos humanos, recrutamento, políticas
            
            Sempre mantenha o contexto da conversa e facilite transições suaves entre agentes.
            """
        )
```

### **Agente Financeiro**

#### **Responsabilidades**
- Análise de orçamentos
- Cálculo de custos e ROI
- Relatórios financeiros
- Projeções econômicas
- Aconselhamento fiscal

#### **Configuração**
```python
class FinancialAgent(OpenAIAgent):
    def __init__(self):
        super().__init__(
            name="financial_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista financeiro da empresa Falachefe.
            
            Suas competências incluem:
            - Análise de orçamentos e custos
            - Cálculo de ROI e métricas financeiras
            - Relatórios de performance financeira
            - Projeções e cenários econômicos
            - Aconselhamento em decisões financeiras
            
            Sempre forneça dados precisos e explique cálculos de forma clara.
            Use gráficos e visualizações quando apropriado.
            """
        )
```

### **Agente Fluxo de Caixa**

#### **Responsabilidades**
- Monitoramento de receitas
- Controle de despesas
- Projeções de fluxo
- Alertas de vencimento
- Análise de liquidez

#### **Configuração**
```python
class CashFlowAgent(OpenAIAgent):
    def __init__(self):
        super().__init__(
            name="cashflow_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em fluxo de caixa da empresa Falachefe.
            
            Suas competências incluem:
            - Monitoramento de receitas e despesas
            - Projeções de fluxo de caixa
            - Alertas de vencimentos e pagamentos
            - Análise de liquidez e solvência
            - Otimização de fluxo de caixa
            
            Foque em alertas proativos e insights acionáveis.
            """
        )
```

### **Agente Marketing e Vendas**

#### **Responsabilidades**
- Estratégias de marketing
- Campanhas e métricas
- Qualificação de leads
- Funil de vendas
- Análise de conversão

#### **Configuração**
```python
class MarketingSalesAgent(OpenAIAgent):
    def __init__(self):
        super().__init__(
            name="marketing_sales_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em marketing e vendas da empresa Falachefe.
            
            Suas competências incluem:
            - Estratégias de marketing digital
            - Gestão de campanhas e métricas
            - Qualificação e nutrição de leads
            - Otimização do funil de vendas
            - Análise de conversão e ROI de marketing
            
            Foque em estratégias data-driven e resultados mensuráveis.
            """
        )
```

### **Agente RH**

#### **Responsabilidades**
- Recrutamento e seleção
- Gestão de performance
- Políticas de RH
- Desenvolvimento de pessoas
- Cultura organizacional

#### **Configuração**
```python
class HRAgent(OpenAIAgent):
    def __init__(self):
        super().__init__(
            name="hr_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em recursos humanos da empresa Falachefe.
            
            Suas competências incluem:
            - Recrutamento e seleção de talentos
            - Gestão de performance e desenvolvimento
            - Políticas de RH e compliance
            - Cultura organizacional e engajamento
            - Planejamento de carreira
            
            Sempre considere aspectos legais e de compliance trabalhista.
            """
        )
```

---

## 🛠️ **Implementação Passo a Passo**

### **Fase 1: Setup e Configuração Inicial**

#### **Passo 1.1: Instalação do Agent Squad**
```bash
# Clone do repositório
git clone https://github.com/awslabs/agent-squad.git
cd agent-squad/python

# Instalação das dependências
pip install -e .
pip install -r requirements.txt

# Configuração do ambiente
cp .env.example .env
```

#### **Passo 1.2: Configuração do Ambiente**
```bash
# Variáveis de ambiente (.env)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
UAZ_API_KEY=your_uaz_api_key
UAZ_API_SECRET=your_uaz_api_secret
UAZ_BASE_URL=https://falachefe.uazapi.com
```

#### **Passo 1.3: Estrutura do Projeto**
```
falachefe-agent-squad/
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   ├── financial_agent.py
│   │   ├── cashflow_agent.py
│   │   ├── marketing_sales_agent.py
│   │   └── hr_agent.py
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── individual_memory.py
│   │   ├── shared_memory.py
│   │   └── conversation_memory.py
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── uazapi_client.py
│   │   └── database_client.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py
│   │   └── config.py
│   └── main.py
├── tests/
├── docs/
├── requirements.txt
├── pyproject.toml
└── README.md
```

### **Fase 2: Implementação dos Agentes**

#### **Passo 2.1: Orquestrador Principal**
```python
# src/agents/orchestrator.py
from agent_squad import Orchestrator
from agent_squad.classifiers import IntentClassifier
from .financial_agent import FinancialAgent
from .cashflow_agent import CashFlowAgent
from .marketing_sales_agent import MarketingSalesAgent
from .hr_agent import HRAgent

class FalachefeOrchestrator(Orchestrator):
    def __init__(self, config: dict):
        # Inicializar agentes
        self.financial_agent = FinancialAgent(config)
        self.cashflow_agent = CashFlowAgent(config)
        self.marketing_sales_agent = MarketingSalesAgent(config)
        self.hr_agent = HRAgent(config)
        
        # Classificador de intenções
        self.intent_classifier = IntentClassifier(
            model="gpt-4-1106-preview",
            intents=[
                "financial_analysis",
                "budget_planning", 
                "cost_optimization",
                "cashflow_monitoring",
                "revenue_projection",
                "marketing_strategy",
                "campaign_management",
                "lead_qualification",
                "sales_funnel",
                "hr_recruitment",
                "performance_management",
                "policy_consultation"
            ]
        )
        
        super().__init__(
            agents=[
                self.financial_agent,
                self.cashflow_agent, 
                self.marketing_sales_agent,
                self.hr_agent
            ],
            classifier=self.intent_classifier
        )
    
    async def process_message(self, message: str, context: dict) -> dict:
        """Processa mensagem e roteia para agente apropriado"""
        
        # Classificar intenção
        intent = await self.intent_classifier.classify(message)
        
        # Rotear para agente baseado na intenção
        agent = self._route_to_agent(intent)
        
        # Processar com contexto
        response = await agent.process(message, context)
        
        # Atualizar contexto compartilhado
        await self._update_shared_context(context, intent, response)
        
        return {
            "response": response,
            "agent": agent.name,
            "intent": intent,
            "confidence": intent.confidence
        }
    
    def _route_to_agent(self, intent: str) -> Agent:
        """Roteia intenção para agente apropriado"""
        routing_map = {
            "financial_analysis": self.financial_agent,
            "budget_planning": self.financial_agent,
            "cost_optimization": self.financial_agent,
            "cashflow_monitoring": self.cashflow_agent,
            "revenue_projection": self.cashflow_agent,
            "marketing_strategy": self.marketing_sales_agent,
            "campaign_management": self.marketing_sales_agent,
            "lead_qualification": self.marketing_sales_agent,
            "sales_funnel": self.marketing_sales_agent,
            "hr_recruitment": self.hr_agent,
            "performance_management": self.hr_agent,
            "policy_consultation": self.hr_agent
        }
        
        return routing_map.get(intent, self.financial_agent)  # Default
```

#### **Passo 2.2: Agente Financeiro**
```python
# src/agents/financial_agent.py
from agent_squad.agents import OpenAIAgent
from ..memory.individual_memory import IndividualMemory
from ..integrations.database_client import DatabaseClient

class FinancialAgent(OpenAIAgent):
    def __init__(self, config: dict):
        super().__init__(
            name="financial_agent",
            model="gpt-4-1106-preview",
            system_prompt=self._get_system_prompt(),
            tools=self._get_tools()
        )
        
        self.memory = IndividualMemory(
            agent_id="financial_agent",
            db_client=DatabaseClient(config)
        )
        
        self.db_client = DatabaseClient(config)
    
    def _get_system_prompt(self) -> str:
        return """
        Você é um especialista financeiro sênior da empresa Falachefe.
        
        Suas competências principais:
        1. Análise de Orçamentos e Custos
           - Revisão de orçamentos departamentais
           - Análise de custos operacionais
           - Identificação de oportunidades de economia
           
        2. Métricas Financeiras
           - Cálculo de ROI, NPV, IRR
           - Análise de margens e lucratividade
           - Indicadores de performance financeira
           
        3. Projeções e Cenários
           - Projeções de receita e despesas
           - Cenários de crescimento
           - Análise de sensibilidade
           
        4. Aconselhamento Estratégico
           - Decisões de investimento
           - Estruturação financeira
           - Gestão de riscos financeiros
        
        Sempre forneça:
        - Dados quantitativos quando possível
        - Explicações claras de cálculos
        - Recomendações acionáveis
        - Alertas sobre riscos identificados
        """
    
    def _get_tools(self) -> list:
        return [
            "calculate_roi",
            "analyze_budget",
            "project_cashflow", 
            "compare_scenarios",
            "generate_financial_report"
        ]
    
    async def process(self, message: str, context: dict) -> str:
        """Processa mensagem com contexto e memória"""
        
        # Recuperar contexto da memória
        memory_context = await self.memory.get_context(
            user_id=context.get("user_id"),
            conversation_id=context.get("conversation_id")
        )
        
        # Combinar contextos
        full_context = {**context, **memory_context}
        
        # Processar com LLM
        response = await super().process(message, full_context)
        
        # Salvar na memória
        await self.memory.save_interaction(
            user_id=context.get("user_id"),
            conversation_id=context.get("conversation_id"),
            message=message,
            response=response,
            metadata=context
        )
        
        return response
```

#### **Passo 2.3: Implementação dos Demais Agentes**
```python
# src/agents/cashflow_agent.py
class CashFlowAgent(OpenAIAgent):
    def __init__(self, config: dict):
        super().__init__(
            name="cashflow_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em fluxo de caixa da empresa Falachefe.
            
            Suas competências:
            - Monitoramento de receitas e despesas em tempo real
            - Projeções de fluxo de caixa de curto e longo prazo
            - Alertas de vencimentos e pagamentos
            - Análise de liquidez e solvência
            - Otimização de fluxo de caixa operacional
            
            Sempre foque em alertas proativos e insights acionáveis.
            """
        )

# src/agents/marketing_sales_agent.py  
class MarketingSalesAgent(OpenAIAgent):
    def __init__(self, config: dict):
        super().__init__(
            name="marketing_sales_agent",
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em marketing e vendas da empresa Falachefe.
            
            Suas competências:
            - Estratégias de marketing digital e inbound
            - Gestão de campanhas e análise de métricas
            - Qualificação e nutrição de leads
            - Otimização do funil de vendas
            - Análise de conversão e ROI de marketing
            
            Foque em estratégias data-driven e resultados mensuráveis.
            """
        )

# src/agents/hr_agent.py
class HRAgent(OpenAIAgent):
    def __init__(self, config: dict):
        super().__init__(
            name="hr_agent", 
            model="gpt-4-1106-preview",
            system_prompt="""
            Você é um especialista em recursos humanos da empresa Falachefe.
            
            Suas competências:
            - Recrutamento e seleção de talentos
            - Gestão de performance e desenvolvimento
            - Políticas de RH e compliance trabalhista
            - Cultura organizacional e engajamento
            - Planejamento de carreira e sucessão
            
            Sempre considere aspectos legais e de compliance trabalhista.
            """
        )
```

### **Fase 3: Sistema de Memória**

#### **Passo 3.1: Memória Individual**
```python
# src/memory/individual_memory.py
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ..integrations.database_client import DatabaseClient

class IndividualMemory:
    def __init__(self, agent_id: str, db_client: DatabaseClient):
        self.agent_id = agent_id
        self.db_client = db_client
        
    async def get_context(self, user_id: str, conversation_id: str) -> Dict:
        """Recupera contexto específico do agente para o usuário"""
        
        # Buscar histórico de interações
        interactions = await self.db_client.query(
            """
            SELECT message, response, metadata, created_at
            FROM agent_interactions 
            WHERE agent_id = %s AND user_id = %s AND conversation_id = %s
            ORDER BY created_at DESC 
            LIMIT 10
            """,
            (self.agent_id, user_id, conversation_id)
        )
        
        # Buscar preferências do usuário
        preferences = await self.db_client.query(
            """
            SELECT preferences
            FROM user_preferences
            WHERE user_id = %s AND agent_id = %s
            """,
            (user_id, self.agent_id)
        )
        
        # Buscar conhecimento específico do domínio
        domain_knowledge = await self.db_client.query(
            """
            SELECT knowledge_base
            FROM agent_knowledge
            WHERE agent_id = %s AND is_active = true
            """,
            (self.agent_id,)
        )
        
        return {
            "recent_interactions": interactions,
            "user_preferences": preferences[0] if preferences else {},
            "domain_knowledge": domain_knowledge[0] if domain_knowledge else {}
        }
    
    async def save_interaction(
        self, 
        user_id: str, 
        conversation_id: str, 
        message: str, 
        response: str, 
        metadata: Dict
    ) -> None:
        """Salva interação na memória individual"""
        
        await self.db_client.execute(
            """
            INSERT INTO agent_interactions 
            (agent_id, user_id, conversation_id, message, response, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                self.agent_id,
                user_id, 
                conversation_id,
                message,
                response,
                json.dumps(metadata),
                datetime.now()
            )
        )
        
        # Atualizar preferências se necessário
        if metadata.get("update_preferences"):
            await self._update_user_preferences(user_id, metadata)
    
    async def _update_user_preferences(self, user_id: str, metadata: Dict) -> None:
        """Atualiza preferências do usuário baseado na interação"""
        
        preferences = metadata.get("preferences", {})
        if preferences:
            await self.db_client.execute(
                """
                INSERT INTO user_preferences (user_id, agent_id, preferences, updated_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, agent_id) 
                DO UPDATE SET 
                    preferences = %s,
                    updated_at = %s
                """,
                (
                    user_id,
                    self.agent_id,
                    json.dumps(preferences),
                    datetime.now(),
                    json.dumps(preferences),
                    datetime.now()
                )
            )
```

#### **Passo 3.2: Memória Compartilhada**
```python
# src/memory/shared_memory.py
import json
from typing import Dict, List, Optional
from datetime import datetime
from ..integrations.database_client import DatabaseClient

class SharedMemory:
    def __init__(self, db_client: DatabaseClient):
        self.db_client = db_client
    
    async def get_conversation_context(self, conversation_id: str) -> Dict:
        """Recupera contexto compartilhado da conversa"""
        
        # Buscar contexto da conversa
        context = await self.db_client.query(
            """
            SELECT context, metadata, last_updated
            FROM conversation_context
            WHERE conversation_id = %s
            """,
            (conversation_id,)
        )
        
        # Buscar histórico de agentes envolvidos
        agent_history = await self.db_client.query(
            """
            SELECT DISTINCT agent_id, last_interaction
            FROM agent_interactions
            WHERE conversation_id = %s
            ORDER BY last_interaction DESC
            """,
            (conversation_id,)
        )
        
        return {
            "conversation_context": context[0] if context else {},
            "involved_agents": [row["agent_id"] for row in agent_history],
            "last_updated": context[0]["last_updated"] if context else None
        }
    
    async def update_conversation_context(
        self, 
        conversation_id: str, 
        context_update: Dict,
        agent_id: str
    ) -> None:
        """Atualiza contexto compartilhado da conversa"""
        
        # Buscar contexto atual
        current_context = await self.get_conversation_context(conversation_id)
        
        # Mesclar contextos
        merged_context = {
            **current_context.get("conversation_context", {}),
            **context_update,
            "last_agent": agent_id,
            "last_updated": datetime.now().isoformat()
        }
        
        # Salvar contexto atualizado
        await self.db_client.execute(
            """
            INSERT INTO conversation_context (conversation_id, context, metadata, last_updated)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (conversation_id)
            DO UPDATE SET 
                context = %s,
                metadata = %s,
                last_updated = %s
            """,
            (
                conversation_id,
                json.dumps(merged_context),
                json.dumps({"updated_by": agent_id}),
                datetime.now(),
                json.dumps(merged_context),
                json.dumps({"updated_by": agent_id}),
                datetime.now()
            )
        )
    
    async def share_insight(
        self, 
        from_agent: str, 
        to_agents: List[str], 
        insight: Dict,
        conversation_id: str
    ) -> None:
        """Compartilha insight entre agentes"""
        
        for agent_id in to_agents:
            await self.db_client.execute(
                """
                INSERT INTO shared_insights 
                (from_agent, to_agent, insight_data, conversation_id, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    from_agent,
                    agent_id,
                    json.dumps(insight),
                    conversation_id,
                    datetime.now()
                )
            )
```

### **Fase 4: Integração com UazAPI**

#### **Passo 4.1: Cliente UazAPI**
```python
# src/integrations/uazapi_client.py
import httpx
import json
from typing import Dict, Optional, List
from ..utils.logger import Logger

class UazAPIClient:
    def __init__(self, config: dict):
        self.api_key = config["UAZ_API_KEY"]
        self.api_secret = config["UAZ_API_SECRET"]
        self.base_url = config["UAZ_BASE_URL"]
        self.logger = Logger("UazAPIClient")
        
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    async def send_message(
        self, 
        number: str, 
        text: str, 
        message_type: str = "text",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Envia mensagem via UazAPI"""
        
        payload = {
            "number": number,
            "text": text,
            "type": message_type,
            "metadata": metadata or {}
        }
        
        try:
            response = await self.client.post("/send-message", json=payload)
            response.raise_for_status()
            
            result = response.json()
            self.logger.info(f"Message sent successfully: {result.get('id')}")
            
            return result
            
        except httpx.HTTPError as e:
            self.logger.error(f"Failed to send message: {e}")
            raise
    
    async def send_media(
        self, 
        number: str, 
        media_url: str, 
        media_type: str,
        caption: Optional[str] = None
    ) -> Dict:
        """Envia mídia via UazAPI"""
        
        payload = {
            "number": number,
            "media": media_url,
            "type": media_type,
            "caption": caption
        }
        
        try:
            response = await self.client.post("/send-media", json=payload)
            response.raise_for_status()
            
            result = response.json()
            self.logger.info(f"Media sent successfully: {result.get('id')}")
            
            return result
            
        except httpx.HTTPError as e:
            self.logger.error(f"Failed to send media: {e}")
            raise
    
    async def get_message_status(self, message_id: str) -> Dict:
        """Verifica status de entrega da mensagem"""
        
        try:
            response = await self.client.get(f"/message-status/{message_id}")
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPError as e:
            self.logger.error(f"Failed to get message status: {e}")
            raise
    
    async def close(self):
        """Fecha conexão HTTP"""
        await self.client.aclose()
```

#### **Passo 4.2: Webhook Handler**
```python
# src/integrations/webhook_handler.py
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from ..agents.orchestrator import FalachefeOrchestrator
from ..memory.shared_memory import SharedMemory
from ..integrations.database_client import DatabaseClient
from ..utils.logger import Logger

app = FastAPI(title="Falachefe Agent Squad API")

class WebhookPayload(BaseModel):
    EventType: str
    message: Optional[Dict]
    chat: Optional[Dict]
    owner: str
    token: str

class WebhookHandler:
    def __init__(self, config: dict):
        self.config = config
        self.orchestrator = FalachefeOrchestrator(config)
        self.shared_memory = SharedMemory(DatabaseClient(config))
        self.logger = Logger("WebhookHandler")
    
    async def process_webhook(self, payload: WebhookPayload) -> Dict:
        """Processa webhook do UazAPI"""
        
        try:
            if payload.EventType == "messages" and payload.message:
                return await self._handle_message(payload)
            elif payload.EventType == "messages_update":
                return await self._handle_message_update(payload)
            else:
                self.logger.warning(f"Unhandled event type: {payload.EventType}")
                return {"status": "ignored"}
                
        except Exception as e:
            self.logger.error(f"Error processing webhook: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _handle_message(self, payload: WebhookPayload) -> Dict:
        """Processa mensagem recebida"""
        
        message = payload.message
        chat = payload.chat
        
        # Extrair informações da mensagem
        user_id = message["sender"].replace("@s.whatsapp.net", "")
        conversation_id = f"whatsapp_{user_id}_{payload.owner}"
        message_text = message.get("content", message.get("text", ""))
        
        # Buscar contexto da conversa
        context = await self.shared_memory.get_conversation_context(conversation_id)
        
        # Adicionar informações da mensagem ao contexto
        context.update({
            "user_id": user_id,
            "conversation_id": conversation_id,
            "platform": "whatsapp",
            "chat_info": chat,
            "message_info": message,
            "timestamp": message.get("messageTimestamp")
        })
        
        # Processar com orquestrador
        result = await self.orchestrator.process_message(message_text, context)
        
        # Enviar resposta via UazAPI
        if result["response"]:
            await self._send_response(
                user_id, 
                result["response"], 
                payload.owner,
                result.get("metadata", {})
            )
        
        # Atualizar contexto compartilhado
        await self.shared_memory.update_conversation_context(
            conversation_id,
            {
                "last_agent": result["agent"],
                "last_intent": result["intent"],
                "last_response": result["response"]
            },
            result["agent"]
        )
        
        return {
            "status": "processed",
            "agent": result["agent"],
            "intent": result["intent"],
            "confidence": result["confidence"]
        }
    
    async def _send_response(
        self, 
        user_id: str, 
        response_text: str, 
        owner: str,
        metadata: Dict
    ) -> None:
        """Envia resposta para o usuário"""
        
        from .uazapi_client import UazAPIClient
        
        uaz_client = UazAPIClient(self.config)
        
        try:
            # Enviar mensagem de texto
            await uaz_client.send_message(
                number=user_id,
                text=response_text,
                message_type="text",
                metadata={
                    "owner": owner,
                    "agent_response": True,
                    **metadata
                }
            )
            
        finally:
            await uaz_client.close()

# Endpoint do webhook
@app.post("/webhook/uaz")
async def webhook_endpoint(request: Request):
    """Endpoint para receber webhooks do UazAPI"""
    
    try:
        payload_data = await request.json()
        payload = WebhookPayload(**payload_data)
        
        handler = WebhookHandler(app.state.config)
        result = await handler.process_webhook(payload)
        
        return result
        
    except Exception as e:
        logger = Logger("WebhookEndpoint")
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

*Continua na próxima parte do documento...*
