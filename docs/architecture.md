# Falachefe CrewAI Architecture Document

## Introduction

Este documento define a arquitetura geral do projeto de integração CrewAI no sistema Falachefe, incluindo sistemas backend, serviços compartilhados e preocupações não específicas de UI. Seu objetivo principal é servir como o blueprint arquitetural guia para desenvolvimento orientado por IA, garantindo consistência e aderência aos padrões e tecnologias escolhidas.

**Relacionamento com Arquitetura Frontend:**
O projeto inclui uma interface de usuário significativa (chat interface, dashboard). Um documento separado de Arquitetura Frontend detalhará o design específico do frontend e DEVE ser usado em conjunto com este documento. As escolhas da stack tecnológica central documentadas aqui (ver "Tech Stack") são definitivas para todo o projeto, incluindo componentes frontend.

### Starter Template ou Projeto Existente

Baseado na análise dos documentos fornecidos, este é um projeto **brownfield** que está integrando CrewAI ao sistema Falachefe existente. O projeto atual possui:

- **Stack Existente:** Next.js, TypeScript, Supabase, Redis
- **Arquitetura Atual:** Sistema de agentes legado que será substituído por CrewAI
- **Integração:** UAZ API para WhatsApp, sistema de chat existente
- **Banco de Dados:** Estrutura Supabase já estabelecida

**Decisão Documentada:** N/A - Este é um projeto de migração/integração, não um starter template.

### Risk Assessment Summary

**Riscos Críticos Identificados:**
- **Performance Multi-tenancy:** 20 empresas simultâneas podem sobrecarregar CrewAI (Prob: 70%, Impacto: Alto)
- **Incompatibilidade com Sistema Legado:** CrewAI pode não integrar perfeitamente (Prob: 40%, Impacto: Alto)
- **Dependências Instáveis:** CrewAI v0.80+ em desenvolvimento ativo (Prob: 50%, Impacto: Médio)

**Estratégias de Mitigação:**
- Implementação gradual com fallback para sistema legado
- Load testing extensivo e otimização de Redis cache
- Version pinning e testes de regressão
- Monitoramento proativo desde o início
- PoC limitado (1 empresa, 1 agente) antes da expansão

### Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2025-01-29 | 1.0 | Criação inicial do documento de arquitetura CrewAI | BMad Master |

## High Level Architecture

### Technical Summary

O sistema Falachefe CrewAI implementa uma arquitetura de **multi-agent orchestration** baseada no framework CrewAI, integrada ao sistema existente Next.js/Supabase. A arquitetura utiliza **Redis para coordenação distribuída**, **OpenAI como LLM principal** e mantém **isolamento rigoroso por tenant** para suportar 20 empresas simultâneas. O sistema segue um **padrão de microservices** com **event-driven communication** para handoff entre agentes, garantindo escalabilidade e resiliência.

### High Level Overview

1. **Estilo Arquitetural:** Microservices com orquestração de agentes IA
2. **Estrutura de Repositório:** Monorepo (baseado na estrutura atual)
3. **Arquitetura de Serviços:** CrewAI Orquestrador + Agentes Especializados + Sistema de Memória
4. **Fluxo Principal:** UAZ Webhook → CrewAI Router → Agent Selection → Task Execution → Response via UAZ
5. **Decisões Arquiteturais:** CrewAI para orquestração, Redis para coordenação, Supabase para persistência

### High Level Project Diagram

```mermaid
graph TB
    subgraph "External Systems"
        UAZ[UAZ API<br/>WhatsApp Integration]
        OPENAI[OpenAI<br/>LLM Provider]
    end
    
    subgraph "Falachefe CrewAI System"
        WEBHOOK[Webhook Handler<br/>UAZ Integration]
        ORCHESTRATOR[CrewAI Orchestrator<br/>Message Router]
        
        subgraph "Agent Layer"
            FINANCIAL[Financial Agent<br/>Expense Management]
            MARKETING[Marketing Agent<br/>Campaign Support]
            HR[HR Agent<br/>Employee Support]
        end
        
        HANDOFF[Handoff System<br/>Context Transfer]
        MEMORY[CrewAI Memory<br/>Tenant Isolation]
        
        subgraph "Data Layer"
            REDIS[(Redis Cache<br/>Coordination)]
            SUPABASE[(Supabase DB<br/>Persistent Storage)]
        end
        
        subgraph "Monitoring"
            METRICS[Metrics Collector<br/>Performance Tracking]
            DASHBOARD[Dashboard<br/>Admin Interface]
        end
    end
    
    subgraph "Client Layer"
        CHAT[Chat Interface<br/>User Interaction]
        ADMIN[Admin Dashboard<br/>Management]
    end
    
    %% Data Flow
    UAZ --> WEBHOOK
    WEBHOOK --> ORCHESTRATOR
    ORCHESTRATOR --> FINANCIAL
    ORCHESTRATOR --> MARKETING
    ORCHESTRATOR --> HR
    
    FINANCIAL --> HANDOFF
    MARKETING --> HANDOFF
    HR --> HANDOFF
    
    HANDOFF --> MEMORY
    MEMORY --> REDIS
    MEMORY --> SUPABASE
    
    ORCHESTRATOR --> METRICS
    METRICS --> DASHBOARD
    
    CHAT --> ORCHESTRATOR
    ADMIN --> DASHBOARD
    
    OPENAI --> FINANCIAL
    OPENAI --> MARKETING
    OPENAI --> HR
```

### Architectural and Design Patterns

**1. Multi-Agent Orchestration Pattern:**
- **Descrição:** CrewAI gerencia múltiplos agentes especializados com coordenação centralizada
- **Rationale:** Permite especialização por domínio (financeiro, marketing, HR) mantendo coordenação eficiente

**2. Event-Driven Communication:**
- **Descrição:** Handoff entre agentes via eventos assíncronos com preservação de contexto
- **Rationale:** Desacopla agentes e permite escalabilidade horizontal com resiliência

**3. Repository Pattern com Tenant Isolation:**
- **Descrição:** Abstração de acesso a dados com isolamento rigoroso por empresa
- **Rationale:** Garante segurança multi-tenant e facilita testes e manutenção

**4. Circuit Breaker Pattern:**
- **Descrição:** Proteção contra falhas em cascata em integrações externas (UAZ API, OpenAI)
- **Rationale:** Mantém sistema resiliente durante picos de tráfego ou falhas externas

**5. CQRS (Command Query Responsibility Segregation):**
- **Descrição:** Separação de operações de leitura (queries) e escrita (commands) para métricas e auditoria
- **Rationale:** Otimiza performance e permite escalabilidade independente de leitura/escrita

### Constraint Analysis Summary

**Limitações Críticas Identificadas:**
- **Arquitetura Monolítica Atual:** Sistema de agentes atual é acoplado e dificulta migração gradual
- **Dependências de Sistema Legado:** Incompatibilidade potencial com CrewAI e dependências modernas
- **Estrutura de Banco Rígida:** Schema atual não suporta conceitos CrewAI (crews, tasks, memories)

**Estratégias de Mitigação:**
- Refatoração incremental com interfaces de abstração
- Criação de adaptadores e wrappers de compatibilidade
- Extensão de schema com backward compatibility
- Migração gradual com coexistência de sistemas
- Sistema legado como fallback automático durante transição

## Tech Stack

### Cloud Infrastructure
- **Provider:** Vercel + Supabase + Redis Cloud
- **Key Services:** Edge Functions, Database, Cache, Storage
- **Deployment Regions:** us-east-1 (primary), eu-west-1 (backup)

### Technology Stack Table

| Categoria | Tecnologia | Versão | Propósito | Rationale |
|-----------|------------|---------|-----------|-----------|
| **Language** | TypeScript | 5.3.3 | Linguagem principal | Tipagem forte, compatibilidade CrewAI, stack existente |
| **Runtime** | Node.js | 20.11.0 LTS | Runtime JavaScript | Versão LTS estável, suporte CrewAI |
| **Framework** | Next.js | 14.1.0 | Framework web | SSR/SSG, API routes, stack atual |
| **AI Framework** | CrewAI | 0.80.0+ | Orquestração de agentes | Framework principal, 38k+ stars, multi-agent |
| **LLM Integration** | LangChain | 0.2.0+ | Integração LLM | Compatibilidade CrewAI, OpenAI integration |
| **LLM Provider** | OpenAI | 4.0.0+ | Provedor de IA | GPT-4, API estável, rate limits conhecidos |
| **Database** | PostgreSQL | 15+ | Banco principal | Supabase, ACID, suporte JSONB |
| **Cache/Coordination** | Redis | 7.2+ | Cache e coordenação | CrewAI coordination, session management |
| **Authentication** | Better Auth | Latest | Autenticação | Stack atual, multi-tenant support |
| **ORM** | Drizzle | 0.30+ | Mapeamento objeto-relacional | Type-safe, stack atual |
| **API Integration** | UAZ API | Latest | WhatsApp integration | Stack atual, webhook handling |
| **Testing** | Jest | 29+ | Testes unitários | Stack atual, mocking robusto |
| **E2E Testing** | Playwright | 1.40+ | Testes end-to-end | Stack atual, multi-browser |
| **Linting** | ESLint | 8.57+ | Análise de código | Stack atual, TypeScript support |
| **Formatting** | Prettier | 3.2+ | Formatação código | Stack atual, consistência |
| **Deployment** | Vercel | Latest | Plataforma deploy | Stack atual, edge functions |
| **Monitoring** | Vercel Analytics | Latest | Métricas performance | Stack atual, integration nativa |
| **Error Tracking** | Sentry | 7.90+ | Rastreamento erros | Stack atual, error monitoring |
| **Package Manager** | pnpm | 8.15+ | Gerenciador pacotes | Stack atual, performance |

## Data Models

### Crew
**Purpose:** Representa uma equipe de agentes IA configurada para uma empresa específica, contendo todos os agentes especializados e suas configurações.

**Key Attributes:**
- `id`: UUID - Identificador único da crew
- `company_id`: UUID - Referência para empresa proprietária
- `name`: VARCHAR(255) - Nome da crew (ex: "Falachefe Finance Crew")
- `description`: TEXT - Descrição da crew e seus objetivos
- `status`: ENUM - Estado da crew (active, paused, disabled, maintenance)
- `config`: JSONB - Configurações específicas da crew
- `llm_config`: JSONB - Configurações do LLM (modelo, temperatura, etc.)
- `memory_config`: JSONB - Configurações de memória CrewAI
- `created_at`: TIMESTAMP - Data de criação
- `updated_at`: TIMESTAMP - Última atualização

**Relationships:**
- One-to-Many com `CrewAgent` (uma crew tem múltiplos agentes)
- One-to-Many com `CrewTask` (uma crew executa múltiplas tarefas)
- One-to-Many com `CrewMemory` (uma crew armazena múltiplas memórias)
- Many-to-One com `Company` (múltiplas crews pertencem a uma empresa)

### CrewAgent
**Purpose:** Representa um agente IA especializado dentro de uma crew, com role específico, ferramentas e configurações personalizadas.

**Key Attributes:**
- `id`: UUID - Identificador único do agente
- `crew_id`: UUID - Referência para crew pai
- `name`: VARCHAR(255) - Nome do agente (ex: "Financial Advisor")
- `role`: ENUM - Papel do agente (orchestrator, financial, marketing, hr, support)
- `goal`: TEXT - Objetivo principal do agente
- `backstory`: TEXT - Contexto e personalidade do agente
- `tools`: JSONB - Lista de ferramentas disponíveis
- `status`: ENUM - Estado do agente (active, inactive, maintenance)
- `config`: JSONB - Configurações específicas do agente
- `performance_metrics`: JSONB - Métricas de performance
- `created_at`: TIMESTAMP - Data de criação
- `updated_at`: TIMESTAMP - Última atualização

**Relationships:**
- Many-to-One com `Crew` (múltiplos agentes pertencem a uma crew)
- One-to-Many com `CrewTask` (um agente executa múltiplas tarefas)
- One-to-Many com `CrewMetrics` (um agente gera múltiplas métricas)

### CrewTask
**Purpose:** Representa uma tarefa específica executada por um agente em uma conversa, incluindo resultado, métricas e contexto.

**Key Attributes:**
- `id`: UUID - Identificador único da tarefa
- `crew_id`: UUID - Referência para crew
- `agent_id`: UUID - Referência para agente executor
- `conversation_id`: UUID - Referência para conversa
- `parent_task_id`: UUID - Referência para tarefa pai (subtarefas)
- `description`: TEXT - Descrição da tarefa
- `expected_output`: TEXT - Resultado esperado
- `status`: ENUM - Estado da tarefa (pending, in_progress, completed, failed, cancelled)
- `result`: JSONB - Resultado da execução
- `error_message`: TEXT - Mensagem de erro se falhou
- `execution_time_ms`: INTEGER - Tempo de execução em milissegundos
- `token_usage`: JSONB - Uso de tokens (input, output, total)
- `cost_usd`: DECIMAL(10,6) - Custo em USD
- `metadata`: JSONB - Metadados adicionais
- `created_at`: TIMESTAMP - Data de criação
- `started_at`: TIMESTAMP - Início da execução
- `completed_at`: TIMESTAMP - Conclusão da execução

**Relationships:**
- Many-to-One com `Crew` (múltiplas tarefas pertencem a uma crew)
- Many-to-One com `CrewAgent` (múltiplas tarefas são executadas por um agente)
- Many-to-One com `Conversation` (múltiplas tarefas pertencem a uma conversa)
- One-to-Many com `CrewTask` (tarefa pai para subtarefas)

### CrewMemory
**Purpose:** Representa memórias armazenadas pelo sistema CrewAI, organizadas por tipo, categoria e importância para recuperação contextual.

**Key Attributes:**
- `id`: UUID - Identificador único da memória
- `company_id`: UUID - Referência para empresa
- `user_id`: VARCHAR(100) - Identificador do usuário
- `conversation_id`: UUID - Referência para conversa (opcional)
- `memory_type`: ENUM - Tipo de memória (fact, preference, context, learning, pattern)
- `category`: VARCHAR(100) - Categoria da memória (financial, personal, business, etc.)
- `content`: TEXT - Conteúdo da memória
- `summary`: TEXT - Resumo da memória
- `importance_score`: INTEGER - Pontuação de importância (1-10)
- `access_count`: INTEGER - Número de acessos
- `last_accessed_at`: TIMESTAMP - Último acesso
- `metadata`: JSONB - Metadados adicionais
- `created_at`: TIMESTAMP - Data de criação
- `updated_at`: TIMESTAMP - Última atualização

**Relationships:**
- Many-to-One com `Company` (múltiplas memórias pertencem a uma empresa)
- Many-to-One com `Conversation` (múltiplas memórias podem estar associadas a uma conversa)

### CrewMetrics
**Purpose:** Representa métricas de performance coletadas para crews e agentes, permitindo monitoramento e otimização.

**Key Attributes:**
- `id`: UUID - Identificador único da métrica
- `crew_id`: UUID - Referência para crew
- `agent_id`: UUID - Referência para agente (opcional)
- `metric_type`: VARCHAR(100) - Tipo da métrica (response_time, token_usage, success_rate, cost, etc.)
- `metric_name`: VARCHAR(255) - Nome específico da métrica
- `value`: DECIMAL(15,6) - Valor da métrica
- `unit`: VARCHAR(50) - Unidade (ms, tokens, USD, %, etc.)
- `metadata`: JSONB - Metadados adicionais
- `recorded_at`: TIMESTAMP - Data de registro

**Relationships:**
- Many-to-One com `Crew` (múltiplas métricas pertencem a uma crew)
- Many-to-One com `CrewAgent` (múltiplas métricas podem estar associadas a um agente)

## Components

### CrewAI Orchestrator
**Responsibility:** Coordena a execução de agentes IA, gerencia handoff entre agentes e mantém contexto de conversação.

**Key Interfaces:**
- `processMessage(message: string, context: ConversationContext): Promise<CrewResponse>`
- `selectAgent(messageAnalysis: MessageAnalysis): Promise<CrewAgent>`
- `executeHandoff(fromAgent: CrewAgent, toAgent: CrewAgent, context: ConversationContext): Promise<HandoffResult>`
- `getCrewMetrics(crewId: string, timeRange: DateRange): Promise<CrewMetrics>`

**Dependencies:** Redis (coordenação), Supabase (persistência), OpenAI (LLM), CrewMemorySystem (contexto)

**Technology Stack:** CrewAI 0.80+, TypeScript, Redis, LangChain

### Message Router
**Responsibility:** Analisa mensagens recebidas, extrai intenções e determina complexidade para roteamento apropriado.

**Key Interfaces:**
- `analyzeMessage(message: string): Promise<MessageAnalysis>`
- `extractIntent(message: string): Promise<IntentResult>`
- `determineComplexity(analysis: MessageAnalysis): Promise<ComplexityLevel>`
- `requiresHumanApproval(analysis: MessageAnalysis): Promise<boolean>`

**Dependencies:** OpenAI (análise de linguagem natural), CrewMemorySystem (contexto histórico)

**Technology Stack:** LangChain, OpenAI GPT-4, TypeScript

### Financial Agent
**Responsibility:** Especializado em operações financeiras, gestão de despesas, análise de fluxo de caixa e planejamento orçamentário.

**Key Interfaces:**
- `processFinancialRequest(request: FinancialRequest): Promise<FinancialResponse>`
- `addExpense(expenseData: ExpenseData): Promise<ExpenseResult>`
- `generateCashFlowReport(period: DateRange): Promise<CashFlowReport>`
- `createBudgetPlan(budgetData: BudgetData): Promise<BudgetPlan>`
- `analyzeFinancialTrends(data: FinancialData): Promise<TrendAnalysis>`

**Dependencies:** Supabase (dados financeiros), CrewMemorySystem (histórico), OpenAI (análise)

**Technology Stack:** CrewAI Agent, Financial Tools, Drizzle ORM, TypeScript

### Handoff System
**Responsibility:** Gerencia transferência de contexto entre agentes, preserva estado da conversa e coordena handoffs assíncronos.

**Key Interfaces:**
- `transferContext(fromAgent: string, toAgent: string, context: ConversationContext): Promise<TransferResult>`
- `preserveConversationState(conversationId: string, state: ConversationState): Promise<void>`
- `notifyUserOfHandoff(handoff: HandoffEvent): Promise<void>`
- `validateHandoffFeasibility(fromAgent: CrewAgent, toAgent: CrewAgent): Promise<boolean>`

**Dependencies:** Redis (estado temporário), Supabase (persistência), CrewMemorySystem (contexto)

**Technology Stack:** Redis, TypeScript, Event-driven architecture

### Crew Memory System
**Responsibility:** Gerencia memória contextual do CrewAI, armazena e recupera informações relevantes por tenant.

**Key Interfaces:**
- `storeMemory(memory: MemoryData): Promise<void>`
- `retrieveRelevantMemories(query: string, context: MemoryContext): Promise<Memory[]>`
- `updateMemoryImportance(memoryId: string, importance: number): Promise<void>`
- `cleanupExpiredMemories(companyId: string): Promise<void>`

**Dependencies:** Supabase (armazenamento persistente), Redis (cache), OpenAI (indexação semântica)

**Technology Stack:** CrewAI Memory, Supabase, Redis, LangChain embeddings

### Metrics Collector
**Responsibility:** Coleta métricas de performance, custos e qualidade dos agentes e crews para monitoramento e otimização.

**Key Interfaces:**
- `recordMetric(metric: MetricData): Promise<void>`
- `getAgentPerformance(agentId: string, period: DateRange): Promise<PerformanceMetrics>`
- `getCrewCostAnalysis(crewId: string, period: DateRange): Promise<CostAnalysis>`
- `generatePerformanceReport(crewId: string): Promise<PerformanceReport>`

**Dependencies:** Supabase (armazenamento de métricas), Redis (métricas em tempo real)

**Technology Stack:** TypeScript, Drizzle ORM, Prometheus (futuro)

### UAZ Integration Handler
**Responsibility:** Gerencia integração com UAZ API para WhatsApp, processa webhooks e coordena comunicação bidirecional.

**Key Interfaces:**
- `processWebhook(webhookData: UAZWebhookData): Promise<void>`
- `sendMessage(message: WhatsAppMessage): Promise<MessageResult>`
- `handleDeliveryStatus(status: DeliveryStatus): Promise<void>`
- `validateWebhookSignature(payload: string, signature: string): Promise<boolean>`

**Dependencies:** UAZ API (WhatsApp), CrewAI Orchestrator (processamento), Redis (rate limiting)

**Technology Stack:** Next.js API Routes, TypeScript, UAZ SDK

### Tenant Isolation Manager
**Responsibility:** Garante isolamento rigoroso entre empresas, gerencia contextos separados e previne vazamento de dados.

**Key Interfaces:**
- `createTenantContext(companyId: string): Promise<TenantContext>`
- `validateTenantAccess(userId: string, companyId: string): Promise<boolean>`
- `isolateCrewData(crewId: string, companyId: string): Promise<void>`
- `auditTenantAccess(companyId: string): Promise<AccessAudit>`

**Dependencies:** Better Auth (autenticação), Supabase (isolamento de dados), Redis (contexto isolado)

**Technology Stack:** Better Auth, TypeScript, Row Level Security (Supabase)

### Configuration Manager
**Responsibility:** Gerencia configurações dinâmicas de crews e agentes, permite customização por empresa sem deploy.

**Key Interfaces:**
- `getCrewConfig(crewId: string): Promise<CrewConfig>`
- `updateAgentConfig(agentId: string, config: AgentConfig): Promise<void>`
- `validateConfiguration(config: any): Promise<ValidationResult>`
- `applyConfigurationChanges(crewId: string): Promise<void>`

**Dependencies:** Supabase (configurações), Redis (cache de config), CrewAI Orchestrator (aplicação)

**Technology Stack:** TypeScript, JSON Schema validation, Redis

### Error Handling & Recovery
**Responsibility:** Gerencia erros, implementa circuit breakers e coordena recuperação automática de falhas.

**Key Interfaces:**
- `handleAgentError(error: AgentError, context: ErrorContext): Promise<RecoveryAction>`
- `executeCircuitBreaker(service: string, operation: () => Promise<any>): Promise<any>`
- `fallbackToLegacySystem(context: FallbackContext): Promise<LegacyResponse>`
- `notifyErrorToAdmins(error: SystemError): Promise<void>`

**Dependencies:** Sentry (error tracking), Redis (circuit breaker state), Legacy System (fallback)

**Technology Stack:** Sentry, TypeScript, Circuit Breaker pattern

### Component Diagrams

```mermaid
graph TB
    subgraph "API Layer"
        UAZ[UAZ Integration Handler]
        CHAT[Chat Interface]
        ADMIN[Admin Dashboard]
    end
    
    subgraph "Orchestration Layer"
        ORCH[CrewAI Orchestrator]
        ROUTER[Message Router]
        HANDOFF[Handoff System]
    end
    
    subgraph "Agent Layer"
        FIN[Financial Agent]
        MKT[Marketing Agent]
        HR[HR Agent]
    end
    
    subgraph "Infrastructure Layer"
        MEMORY[Crew Memory System]
        METRICS[Metrics Collector]
        CONFIG[Configuration Manager]
        TENANT[Tenant Isolation Manager]
        ERROR[Error Handling & Recovery]
    end
    
    subgraph "Data Layer"
        REDIS[(Redis Cache)]
        SUPABASE[(Supabase DB)]
    end
    
    %% API Layer connections
    UAZ --> ORCH
    CHAT --> ORCH
    ADMIN --> METRICS
    
    %% Orchestration Layer connections
    ORCH --> ROUTER
    ORCH --> HANDOFF
    ORCH --> FIN
    ORCH --> MKT
    ORCH --> HR
    
    %% Infrastructure Layer connections
    MEMORY --> REDIS
    MEMORY --> SUPABASE
    METRICS --> SUPABASE
    CONFIG --> SUPABASE
    CONFIG --> REDIS
    TENANT --> SUPABASE
    TENANT --> REDIS
    ERROR --> REDIS
    
    %% Agent Layer connections
    FIN --> MEMORY
    FIN --> METRICS
    MKT --> MEMORY
    MKT --> METRICS
    HR --> MEMORY
    HR --> METRICS
    
    %% Cross-layer connections
    ORCH --> MEMORY
    ORCH --> METRICS
    ORCH --> CONFIG
    ORCH --> TENANT
    ORCH --> ERROR
```

### Technology Trend Analysis Summary

**Tendências Emergentes 2025:**
- **Consolidação do Ecossistema:** CrewAI integrando com IBM watsonx.ai, Amazon Bedrock, Microsoft Azure
- **Enterprise-Ready Platforms:** Frameworks evoluindo para suportar necessidades empresariais com segurança e compliance
- **Real-time Collaboration:** Agentes trabalhando em tempo real com sincronização via WebSockets

**Análise Competitiva:**
- **CrewAI:** Líder emergente (38k+ stars, 2M+ downloads/mês, partnerships IBM/Amazon/Microsoft)
- **AutoGen:** Competidor direto com backing Microsoft, foco em conversational AI
- **LangGraph:** Crescimento rápido no ecossistema LangChain, foco em workflow orchestration

**Recomendações Estratégicas:**
- **Curto Prazo:** Implementar CrewAI 0.80+ com version pinning e monitoring
- **Médio Prazo:** Avaliar integrações com IBM watsonx.ai e Amazon Bedrock
- **Longo Prazo:** Monitorar evolução de competidores e preparar para migração se necessário

---

### **Rationale Detalhada:**

**Decisões de Componentização:**
1. **Separação de Responsabilidades:** Cada componente tem uma responsabilidade única e bem definida
2. **Interface-Based Design:** Componentes comunicam via interfaces bem definidas
3. **Dependency Injection:** Dependências são injetadas para facilitar testes e manutenção
4. **Event-Driven Architecture:** Componentes se comunicam via eventos para desacoplamento

**Considerações de Escalabilidade:**
- Componentes podem ser escalados independentemente
- Redis permite coordenação distribuída
- Circuit breakers protegem contra falhas em cascata
- Preparação para edge deployment e real-time collaboration

**Considerações de Manutenibilidade:**
- Interfaces claras facilitam mudanças internas
- Componentes isolados reduzem impacto de mudanças
- Error handling centralizado simplifica debugging
- Abstrações facilitam migração futura para frameworks alternativos

## External APIs

### UAZ API
- **Purpose:** Integração com WhatsApp para comunicação bidirecional com usuários
- **Documentation:** [UAZ API Documentation](https://docs.uazapi.com)
- **Base URL(s):** `https://api.uazapi.com/v1`
- **Authentication:** Bearer Token (API Key)
- **Rate Limits:** 1000 requests/minute per company

**Key Endpoints Used:**
- `POST /messages/send` - Enviar mensagem via WhatsApp
- `GET /messages/{messageId}/status` - Verificar status de entrega
- `POST /webhooks/configure` - Configurar webhook para receber mensagens
- `GET /contacts/{contactId}` - Obter informações do contato

**Integration Notes:** 
- Webhook handler deve validar assinatura para segurança
- Rate limiting implementado por empresa para evitar exceder limites
- Retry automático para falhas temporárias com backoff exponencial
- Circuit breaker para proteger contra falhas em cascata

### OpenAI API
- **Purpose:** Provedor principal de LLM para agentes CrewAI (GPT-4, GPT-3.5-turbo)
- **Documentation:** [OpenAI API Documentation](https://platform.openai.com/docs)
- **Base URL(s):** `https://api.openai.com/v1`
- **Authentication:** Bearer Token (API Key)
- **Rate Limits:** Varia por modelo (GPT-4: 500 requests/minute, GPT-3.5: 3500 requests/minute)

**Key Endpoints Used:**
- `POST /chat/completions` - Completar conversas com agentes
- `POST /embeddings` - Gerar embeddings para sistema de memória
- `GET /models` - Listar modelos disponíveis
- `POST /moderations` - Moderar conteúdo se necessário

**Integration Notes:**
- Controle rigoroso de tokens para controle de custos
- Fallback para modelos alternativos em caso de indisponibilidade
- Cache de respostas similares para otimizar custos
- Logging detalhado de uso de tokens por empresa

### Supabase API
- **Purpose:** Banco de dados principal e autenticação para o sistema
- **Documentation:** [Supabase Documentation](https://supabase.com/docs)
- **Base URL(s):** `https://{project-ref}.supabase.co`
- **Authentication:** JWT Token (Better Auth integration)
- **Rate Limits:** 1000 requests/minute (plano atual)

**Key Endpoints Used:**
- `POST /rest/v1/{table}` - Inserir dados (crews, agents, tasks, etc.)
- `GET /rest/v1/{table}` - Consultar dados com filtros
- `PATCH /rest/v1/{table}` - Atualizar dados
- `DELETE /rest/v1/{table}` - Deletar dados
- `POST /auth/v1/token` - Autenticação de usuários

**Integration Notes:**
- Row Level Security (RLS) implementado para isolamento por empresa
- Connection pooling configurado para otimizar performance
- Backup automático e replicação para alta disponibilidade
- Migrations versionadas para evolução do schema

### Redis API (Redis Cloud)
- **Purpose:** Cache distribuído e coordenação entre agentes CrewAI
- **Documentation:** [Redis Cloud Documentation](https://docs.redis.com)
- **Base URL(s):** `redis://{endpoint}:{port}` (connection string)
- **Authentication:** AUTH token
- **Rate Limits:** Baseado no plano (atualmente 1000 operations/second)

**Key Operations Used:**
- `SET {key} {value} EX {seconds}` - Armazenar dados temporários
- `GET {key}` - Recuperar dados do cache
- `HSET {key} {field} {value}` - Armazenar dados estruturados
- `LPUSH/RPOP {queue}` - Implementar filas para handoff
- `PUBLISH {channel} {message}` - Comunicação entre agentes

**Integration Notes:**
- Clustering configurado para alta disponibilidade
- TTL apropriado para diferentes tipos de dados
- Monitoramento de memória e performance
- Backup automático para dados críticos

### Sentry API
- **Purpose:** Rastreamento de erros e monitoramento de performance
- **Documentation:** [Sentry API Documentation](https://docs.sentry.io/api/)
- **Base URL(s):** `https://sentry.io/api/0`
- **Authentication:** Bearer Token (DSN)
- **Rate Limits:** 1000 events/minute (plano atual)

**Key Endpoints Used:**
- `POST /api/0/projects/{org}/{project}/events/` - Enviar eventos de erro
- `GET /api/0/projects/{org}/{project}/issues/` - Listar issues
- `POST /api/0/projects/{org}/{project}/releases/` - Criar releases

**Integration Notes:**
- Configuração de alertas para erros críticos
- Filtros para evitar spam de logs
- Integração com Slack para notificações
- Performance monitoring para APIs externas

### Vercel Analytics API
- **Purpose:** Métricas de performance e uso da aplicação
- **Documentation:** [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- **Base URL(s):** `https://vercel.com/api/analytics`
- **Authentication:** Vercel Token
- **Rate Limits:** 1000 requests/minute

**Key Endpoints Used:**
- `GET /analytics/events` - Obter eventos de uso
- `GET /analytics/performance` - Métricas de performance
- `GET /analytics/usage` - Estatísticas de uso

**Integration Notes:**
- Métricas automáticas para todas as páginas
- Custom events para tracking de agentes
- Dashboard integrado para monitoramento
- Export de dados para análise externa

## Core Workflows

### Workflow 1: Processamento de Mensagem WhatsApp

```mermaid
sequenceDiagram
    participant User as Usuário WhatsApp
    participant UAZ as UAZ API
    participant Webhook as Webhook Handler
    participant Router as Message Router
    participant Orchestrator as CrewAI Orchestrator
    participant Agent as Financial Agent
    participant Memory as Crew Memory
    participant Redis as Redis Cache
    participant DB as Supabase DB
    participant OpenAI as OpenAI API

    User->>UAZ: Envia mensagem WhatsApp
    UAZ->>Webhook: POST /webhook (mensagem)
    Webhook->>Webhook: Validar assinatura
    Webhook->>Redis: Verificar rate limit
    Webhook->>Router: analyzeMessage(message)
    
    Router->>OpenAI: Analisar intenção da mensagem
    OpenAI-->>Router: Intent + Complexity
    Router->>Memory: Buscar contexto relevante
    Memory->>DB: Query memórias do usuário
    DB-->>Memory: Memórias relevantes
    Memory-->>Router: Contexto histórico
    
    Router-->>Orchestrator: MessageAnalysis + Context
    Orchestrator->>Orchestrator: selectAgent(analysis)
    Orchestrator->>Agent: processFinancialRequest(request)
    
    Agent->>Memory: Atualizar contexto
    Agent->>OpenAI: Processar solicitação financeira
    OpenAI-->>Agent: Resposta estruturada
    Agent->>DB: Salvar resultado da tarefa
    Agent-->>Orchestrator: FinancialResponse
    
    Orchestrator->>Redis: Cache resposta
    Orchestrator-->>Webhook: CrewResponse
    Webhook->>UAZ: Enviar resposta WhatsApp
    UAZ->>User: Mensagem de resposta
    
    Note over Orchestrator,DB: Métricas coletadas em background
    Orchestrator->>DB: Salvar métricas de performance
```

### Workflow 2: Handoff entre Agentes

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Orchestrator as CrewAI Orchestrator
    participant FinAgent as Financial Agent
    participant HRAgent as HR Agent
    participant Handoff as Handoff System
    participant Memory as Crew Memory
    participant Redis as Redis Cache
    participant DB as Supabase DB

    User->>Orchestrator: "Preciso de ajuda com RH"
    Orchestrator->>FinAgent: processRequest(request)
    FinAgent->>FinAgent: Analisar se é financeiro
    
    FinAgent->>Handoff: needsHandoff(request)
    Handoff->>Handoff: Determinar agente apropriado
    Handoff-->>FinAgent: HR Agent recomendado
    
    FinAgent->>Handoff: initiateHandoff(to: HRAgent)
    Handoff->>Memory: Preservar contexto atual
    Memory->>Redis: Salvar estado temporário
    Memory->>DB: Persistir contexto
    
    Handoff->>HRAgent: transferContext(context)
    HRAgent->>Memory: Recuperar contexto
    Memory->>Redis: Buscar estado
    Memory->>DB: Buscar histórico
    Memory-->>HRAgent: Contexto completo
    
    HRAgent->>HRAgent: Processar com contexto
    HRAgent-->>Orchestrator: HRResponse
    Orchestrator->>Handoff: updateHandoffStatus(completed)
    Handoff->>DB: Salvar histórico de handoff
    
    Orchestrator-->>User: Resposta do HR Agent
    
    Note over Handoff,DB: Contexto preservado para futuras referências
```

### Workflow 3: Sistema de Memória e Aprendizado

```mermaid
sequenceDiagram
    participant Agent as Financial Agent
    participant Memory as Crew Memory System
    participant Redis as Redis Cache
    participant DB as Supabase DB
    participant OpenAI as OpenAI API
    participant VectorDB as Vector Database

    Agent->>Memory: storeMemory(memoryData)
    Memory->>OpenAI: Gerar embedding do conteúdo
    OpenAI-->>Memory: Embedding vector
    Memory->>VectorDB: Indexar embedding
    
    Memory->>DB: Salvar memória com metadados
    DB-->>Memory: Confirmação + ID
    Memory->>Redis: Cache memória recente
    
    Note over Memory,VectorDB: Busca semântica para recuperação
    
    Agent->>Memory: retrieveRelevantMemories(query)
    Memory->>OpenAI: Gerar embedding da query
    OpenAI-->>Memory: Query embedding
    Memory->>VectorDB: Busca semântica
    VectorDB-->>Memory: Memórias similares
    
    Memory->>DB: Buscar metadados das memórias
    DB-->>Memory: Metadados + importância
    Memory->>Memory: Rankear por relevância
    Memory-->>Agent: Memórias relevantes
    
    Note over Memory,DB: Atualização de importância baseada no uso
    Agent->>Memory: updateMemoryImportance(memoryId, score)
    Memory->>DB: Atualizar importância
    Memory->>Redis: Invalidar cache se necessário
```

## Database Schema

### Novas Tabelas CrewAI

```sql
-- Tabela crews (Equipes de agentes por empresa)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}',
  llm_config JSONB NOT NULL DEFAULT '{}',
  memory_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crews_status CHECK (status IN ('active', 'paused', 'disabled', 'maintenance')),
  CONSTRAINT chk_crews_name_length CHECK (LENGTH(name) >= 3)
);

-- Tabela crew_agents (Agentes especializados)
CREATE TABLE crew_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  goal TEXT NOT NULL,
  backstory TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_agents_status CHECK (status IN ('active', 'inactive', 'maintenance')),
  CONSTRAINT chk_crew_agents_role CHECK (role IN ('orchestrator', 'financial', 'marketing', 'hr', 'support')),
  CONSTRAINT chk_crew_agents_goal_length CHECK (LENGTH(goal) >= 10)
);

-- Tabela crew_tasks (Tarefas dos agentes)
CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES crew_agents(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES crew_tasks(id),
  description TEXT NOT NULL,
  expected_output TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  execution_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}',
  cost_usd DECIMAL(10,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT chk_crew_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT chk_crew_tasks_execution_time CHECK (execution_time_ms >= 0),
  CONSTRAINT chk_crew_tasks_cost CHECK (cost_usd >= 0)
);

-- Tabela crew_memories (Memória CrewAI)
CREATE TABLE crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  content TEXT NOT NULL,
  summary TEXT,
  importance_score INTEGER NOT NULL DEFAULT 1,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_memories_type CHECK (memory_type IN ('fact', 'preference', 'context', 'learning', 'pattern')),
  CONSTRAINT chk_crew_memories_importance CHECK (importance_score >= 1 AND importance_score <= 10),
  CONSTRAINT chk_crew_memories_access_count CHECK (access_count >= 0)
);

-- Tabela crew_metrics (Métricas de performance)
CREATE TABLE crew_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES crew_agents(id) ON DELETE SET NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(15,6) NOT NULL,
  unit VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_crew_metrics_value CHECK (value >= 0)
);
```

### Índices para Performance

```sql
-- Índices para crews
CREATE INDEX idx_crews_company_id ON crews(company_id);
CREATE INDEX idx_crews_status ON crews(status);
CREATE INDEX idx_crews_created_at ON crews(created_at);

-- Índices para crew_agents
CREATE INDEX idx_crew_agents_crew_id ON crew_agents(crew_id);
CREATE INDEX idx_crew_agents_role ON crew_agents(role);
CREATE INDEX idx_crew_agents_status ON crew_agents(status);

-- Índices para crew_tasks
CREATE INDEX idx_crew_tasks_crew_id ON crew_tasks(crew_id);
CREATE INDEX idx_crew_tasks_agent_id ON crew_tasks(agent_id);
CREATE INDEX idx_crew_tasks_conversation_id ON crew_tasks(conversation_id);
CREATE INDEX idx_crew_tasks_status ON crew_tasks(status);
CREATE INDEX idx_crew_tasks_created_at ON crew_tasks(created_at);

-- Índices para crew_memories
CREATE INDEX idx_crew_memories_company_id ON crew_memories(company_id);
CREATE INDEX idx_crew_memories_user_id ON crew_memories(user_id);
CREATE INDEX idx_crew_memories_conversation_id ON crew_memories(conversation_id);
CREATE INDEX idx_crew_memories_type ON crew_memories(memory_type);
CREATE INDEX idx_crew_memories_importance ON crew_memories(importance_score);

-- Índices para crew_metrics
CREATE INDEX idx_crew_metrics_crew_id ON crew_metrics(crew_id);
CREATE INDEX idx_crew_metrics_agent_id ON crew_metrics(agent_id);
CREATE INDEX idx_crew_metrics_type ON crew_metrics(metric_type);
CREATE INDEX idx_crew_metrics_recorded_at ON crew_metrics(recorded_at);
```

### Tabelas Adaptadas

```sql
-- Adaptar conversations para CrewAI
ALTER TABLE conversations 
ADD COLUMN crew_id UUID REFERENCES crews(id),
ADD COLUMN current_agent_id UUID REFERENCES crew_agents(id),
ADD COLUMN handoff_history JSONB DEFAULT '[]',
ADD COLUMN crew_context JSONB DEFAULT '{}',
ADD COLUMN requires_human_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN human_approval_status VARCHAR(50) DEFAULT 'not_required';

-- Adaptar messages para CrewAI
ALTER TABLE messages 
ADD COLUMN crew_task_id UUID REFERENCES crew_tasks(id),
ADD COLUMN agent_response JSONB DEFAULT '{}',
ADD COLUMN token_usage JSONB DEFAULT '{}',
ADD COLUMN processing_time_ms INTEGER,
ADD COLUMN confidence_score DECIMAL(3,2),
ADD COLUMN crew_metadata JSONB DEFAULT '{}';

-- Constraints
ALTER TABLE conversations 
ADD CONSTRAINT chk_conversations_human_approval_status 
CHECK (human_approval_status IN ('not_required', 'pending', 'approved', 'rejected'));

ALTER TABLE messages 
ADD CONSTRAINT chk_messages_confidence_score 
CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas CrewAI
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para isolamento por empresa
CREATE POLICY "Companies can access their own crews" ON crews
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id'::text);

CREATE POLICY "Companies can access their own crew agents" ON crew_agents
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );

CREATE POLICY "Companies can access their own crew tasks" ON crew_tasks
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );

CREATE POLICY "Companies can access their own crew memories" ON crew_memories
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id'::text);

CREATE POLICY "Companies can access their own crew metrics" ON crew_metrics
  FOR ALL USING (
    crew_id IN (
      SELECT id FROM crews WHERE company_id = auth.jwt() ->> 'company_id'::text
    )
  );
```

## Source Tree

### Estrutura de Diretórios Proposta

```
falachefe-crewai/
├── src/
│   ├── lib/
│   │   ├── auth/                      # Sistema de Autenticação
│   │   │   ├── whatsapp-auth.ts       # Autenticação WhatsApp híbrida
│   │   │   ├── verification-code.ts   # Sistema de códigos de verificação
│   │   │   ├── session-manager.ts     # Gerenciamento de sessões WhatsApp
│   │   │   ├── rate-limiter.ts        # Rate limiting e proteção
│   │   │   ├── audit-logger.ts        # Logs de auditoria
│   │   │   └── types.ts               # Tipos de autenticação
│   │   ├── crewai/                    # Sistema CrewAI
│   │   │   ├── orchestrator.ts        # Orquestrador principal
│   │   │   ├── agents/                # Agentes especializados
│   │   │   │   ├── financial-agent.ts # Agente financeiro
│   │   │   │   ├── customer-agent.ts  # Agente de atendimento
│   │   │   │   └── handoff-agent.ts   # Agente de transferência
│   │   │   ├── memory/                # Sistema de memória
│   │   │   │   ├── crew-memory.ts     # Memória de crews
│   │   │   │   ├── context-manager.ts # Gerenciador de contexto
│   │   │   │   └── learning-system.ts # Sistema de aprendizado
│   │   │   ├── tasks/                 # Definições de tarefas
│   │   │   │   ├── task-factory.ts    # Factory de tarefas
│   │   │   │   └── task-templates.ts  # Templates de tarefas
│   │   │   └── tools/                 # Ferramentas dos agentes
│   │   │       ├── uaz-tools.ts       # Ferramentas UAZ
│   │   │       ├── database-tools.ts  # Ferramentas de banco
│   │   │       └── external-tools.ts  # Ferramentas externas
│   │   ├── database/                  # Camada de Dados
│   │   │   ├── schema.ts              # Schema principal
│   │   │   ├── migrations/            # Migrações do banco
│   │   │   │   ├── 0001_crews.sql     # Migração crews
│   │   │   │   ├── 0002_whatsapp_auth.sql # Migração auth WhatsApp
│   │   │   │   └── 0003_metrics.sql   # Migração métricas
│   │   │   └── queries/               # Queries organizadas
│   │   │       ├── crew-queries.ts    # Queries de crews
│   │   │       ├── whatsapp-queries.ts # Queries WhatsApp
│   │   │       ├── session-queries.ts  # Queries de sessão
│   │   │       └── metrics-queries.ts  # Queries de métricas
│   │   ├── api/                       # Integrações Externas
│   │   │   ├── uaz-client.ts          # Cliente UAZ API
│   │   │   ├── openai-client.ts       # Cliente OpenAI
│   │   │   ├── supabase-client.ts     # Cliente Supabase
│   │   │   └── redis-client.ts        # Cliente Redis
│   │   ├── config/                    # Configurações
│   │   │   ├── whatsapp-auth-config.ts # Config auth WhatsApp
│   │   │   ├── crewai-config.ts       # Config CrewAI
│   │   │   ├── database-config.ts     # Config banco de dados
│   │   │   └── environment.ts         # Variáveis de ambiente
│   │   ├── utils/                     # Utilitários
│   │   │   ├── validation.ts          # Validações
│   │   │   ├── encryption.ts          # Criptografia
│   │   │   ├── logging.ts             # Sistema de logs
│   │   │   └── error-handling.ts      # Tratamento de erros
│   │   └── types/                     # Definições de Tipos
│   │       ├── crewai.ts              # Tipos CrewAI
│   │       ├── whatsapp.ts            # Tipos WhatsApp
│   │       ├── database.ts            # Tipos banco de dados
│   │       └── api.ts                 # Tipos APIs externas
│   ├── app/                           # Next.js App Router
│   │   ├── api/                       # API Routes
│   │   │   ├── webhook/               # Webhooks
│   │   │   │   └── uaz/
│   │   │   │       └── route.ts       # Webhook UAZ
│   │   │   ├── auth/                  # Autenticação
│   │   │   │   └── whatsapp/
│   │   │   │       ├── verify/route.ts # Verificar código
│   │   │   │       └── resend/route.ts # Reenviar código
│   │   │   ├── crewai/                # CrewAI APIs
│   │   │   │   ├── process/route.ts   # Processar mensagem
│   │   │   │   ├── status/route.ts    # Status do sistema
│   │   │   │   └── metrics/route.ts   # Métricas
│   │   │   └── admin/                 # Admin APIs
│   │   │       ├── sessions/route.ts  # Gerenciar sessões
│   │   │       └── logs/route.ts      # Logs de auditoria
│   │   ├── (dashboard)/               # Dashboard (grupo de rotas)
│   │   │   └── dashboard/             # Painel administrativo
│   │   │       ├── page.tsx           # Dashboard principal
│   │   │       ├── whatsapp-auth/     # Configurações WhatsApp
│   │   │       │   └── page.tsx       # Config auth WhatsApp
│   │   │       ├── crewai/            # Configurações CrewAI
│   │   │       │   ├── page.tsx       # Config principal
│   │   │       │   ├── agents/page.tsx # Gerenciar agentes
│   │   │       │   └── memory/page.tsx # Configurar memória
│   │   │       ├── analytics/         # Analytics
│   │   │       │   ├── page.tsx       # Dashboard analytics
│   │   │       │   └── reports/page.tsx # Relatórios
│   │   │       └── settings/          # Configurações gerais
│   │   │           └── page.tsx       # Settings
│   │   ├── globals.css                # Estilos globais
│   │   ├── layout.tsx                 # Layout principal
│   │   └── page.tsx                   # Página inicial
│   └── components/                    # Componentes React
│       ├── ui/                        # Componentes base (shadcn/ui)
│       │   ├── button.tsx             # Botão
│       │   ├── input.tsx              # Input
│       │   ├── card.tsx               # Card
│       │   └── ...                    # Outros componentes UI
│       ├── chat/                      # Componentes de Chat
│       │   ├── whatsapp-verification.tsx # Verificação WhatsApp
│       │   ├── session-status.tsx     # Status da sessão
│       │   ├── message-bubble.tsx     # Bolha de mensagem
│       │   └── chat-interface.tsx     # Interface de chat
│       ├── admin/                     # Componentes Admin
│       │   ├── whatsapp-sessions.tsx  # Gerenciar sessões
│       │   ├── crewai-config.tsx      # Config CrewAI
│       │   ├── metrics-dashboard.tsx  # Dashboard métricas
│       │   └── audit-logs.tsx         # Logs de auditoria
│       ├── forms/                     # Formulários
│       │   ├── verification-form.tsx  # Form verificação
│       │   ├── agent-config-form.tsx  # Form config agente
│       │   └── company-settings-form.tsx # Form config empresa
│       └── layout/                    # Componentes de Layout
│           ├── header.tsx             # Cabeçalho
│           ├── sidebar.tsx            # Barra lateral
│           ├── footer.tsx             # Rodapé
│           └── navigation.tsx         # Navegação
├── public/                            # Arquivos estáticos
│   ├── icons/                         # Ícones
│   │   ├── whatsapp.svg               # Ícone WhatsApp
│   │   ├── crewai.svg                 # Ícone CrewAI
│   │   └── logo.svg                   # Logo Falachefe
│   └── images/                        # Imagens
│       ├── auth/                      # Imagens de auth
│       └── dashboard/                 # Imagens dashboard
├── scripts/                           # Scripts utilitários
│   ├── database/                      # Scripts de banco
│   │   ├── migrate.ts                 # Executar migrações
│   │   ├── seed.ts                    # Popular banco
│   │   └── backup.ts                  # Backup banco
│   ├── auth/                          # Scripts de auth
│   │   ├── generate-codes.ts          # Gerar códigos teste
│   │   └── cleanup-sessions.ts        # Limpar sessões
│   └── crewai/                        # Scripts CrewAI
│       ├── test-agents.ts             # Testar agentes
│       └── benchmark.ts               # Benchmark performance
├── tests/                             # Testes
│   ├── unit/                          # Testes unitários
│   │   ├── auth/                      # Testes autenticação
│   │   ├── crewai/                    # Testes CrewAI
│   │   └── utils/                     # Testes utilitários
│   ├── integration/                   # Testes integração
│   │   ├── api/                       # Testes APIs
│   │   ├── webhook/                   # Testes webhooks
│   │   └── database/                  # Testes banco
│   └── e2e/                           # Testes end-to-end
│       ├── whatsapp-auth.spec.ts      # Teste auth WhatsApp
│       └── crewai-flow.spec.ts        # Teste fluxo CrewAI
├── docs/                              # Documentação
│   ├── architecture.md                # Arquitetura (este arquivo)
│   ├── api/                           # Documentação APIs
│   │   ├── whatsapp-auth.md           # API auth WhatsApp
│   │   └── crewai.md                  # API CrewAI
│   ├── deployment/                    # Documentação deploy
│   │   ├── production.md              # Deploy produção
│   │   └── staging.md                 # Deploy staging
│   └── development/                   # Documentação desenvolvimento
│       ├── setup.md                   # Setup ambiente
│       └── contributing.md            # Guia contribuição
├── docker/                            # Docker
│   ├── Dockerfile                     # Dockerfile principal
│   ├── docker-compose.yml             # Compose desenvolvimento
│   ├── docker-compose.prod.yml        # Compose produção
│   └── nginx.conf                     # Configuração Nginx
├── .github/                           # GitHub Actions
│   └── workflows/                     # Workflows CI/CD
│       ├── ci.yml                     # Continuous Integration
│       ├── deploy-staging.yml         # Deploy staging
│       └── deploy-production.yml      # Deploy produção
├── package.json                       # Dependências Node.js
├── tsconfig.json                      # Configuração TypeScript
├── next.config.ts                     # Configuração Next.js
├── tailwind.config.js                 # Configuração Tailwind
├── drizzle.config.ts                  # Configuração Drizzle ORM
├── .env.example                       # Exemplo variáveis ambiente
├── .gitignore                         # Arquivos ignorados Git
└── README.md                          # Documentação principal
```

### Organização por Responsabilidades

#### 🔐 **Autenticação (`src/lib/auth/`)**
- **whatsapp-auth.ts**: Lógica principal de autenticação híbrida
- **verification-code.ts**: Sistema de códigos de verificação
- **session-manager.ts**: Gerenciamento de sessões e tokens
- **rate-limiter.ts**: Proteção contra spam e ataques
- **audit-logger.ts**: Logs de auditoria e compliance

#### 🤖 **CrewAI (`src/lib/crewai/`)**
- **orchestrator.ts**: Orquestrador principal do sistema
- **agents/**: Agentes especializados por domínio
- **memory/**: Sistema de memória e contexto
- **tasks/**: Definições e templates de tarefas
- **tools/**: Ferramentas disponíveis para agentes

#### 🗄️ **Dados (`src/lib/database/`)**
- **schema.ts**: Schema principal do banco
- **migrations/**: Migrações organizadas por versão
- **queries/**: Queries organizadas por domínio

#### 🔌 **Integrações (`src/lib/api/`)**
- **uaz-client.ts**: Cliente para UAZ API
- **openai-client.ts**: Cliente para OpenAI
- **supabase-client.ts**: Cliente para Supabase
- **redis-client.ts**: Cliente para Redis

#### ⚙️ **Configuração (`src/lib/config/`)**
- **whatsapp-auth-config.ts**: Configurações de autenticação
- **crewai-config.ts**: Configurações CrewAI
- **database-config.ts**: Configurações de banco
- **environment.ts**: Gerenciamento de variáveis

### Estrutura de APIs (`src/app/api/`)

```
api/
├── webhook/uaz/route.ts              # Webhook principal UAZ
├── auth/whatsapp/
│   ├── verify/route.ts               # POST: Verificar código
│   └── resend/route.ts               # POST: Reenviar código
├── crewai/
│   ├── process/route.ts              # POST: Processar mensagem
│   ├── status/route.ts               # GET: Status sistema
│   └── metrics/route.ts              # GET: Métricas
└── admin/
    ├── sessions/route.ts             # CRUD: Sessões WhatsApp
    └── logs/route.ts                 # GET: Logs auditoria
```

### Componentes de Interface (`src/components/`)

```
components/
├── ui/                               # Componentes base (shadcn/ui)
├── chat/                             # Interface de chat
├── admin/                            # Painel administrativo
├── forms/                            # Formulários
└── layout/                           # Layout e navegação
```

### Scripts de Automação (`scripts/`)

```
scripts/
├── database/                         # Scripts de banco de dados
├── auth/                             # Scripts de autenticação
└── crewai/                           # Scripts CrewAI
```

### Testes Organizados (`tests/`)

```
tests/
├── unit/                             # Testes unitários por domínio
├── integration/                      # Testes de integração
└── e2e/                              # Testes end-to-end
```

### Documentação Estruturada (`docs/`)

```
docs/
├── architecture.md                   # Este documento
├── api/                              # Documentação APIs
├── deployment/                       # Guias de deploy
└── development/                      # Guias desenvolvimento
```

### Benefícios desta Estrutura

✅ **Separação Clara**: Cada domínio tem sua pasta dedicada  
✅ **Escalabilidade**: Fácil adicionar novos agentes/ferramentas  
✅ **Manutenibilidade**: Código organizado por responsabilidade  
✅ **Testabilidade**: Estrutura clara para testes  
✅ **Documentação**: Docs organizadas por contexto  
✅ **Deploy**: Scripts e configs separados por ambiente  

**Esta estrutura reflete a arquitetura híbrida de autenticação WhatsApp e o sistema CrewAI integrado. Pronto para prosseguir para a próxima seção?**

## Deployment

### Estratégia de Deploy Multi-Ambiente

A estratégia de deploy foi projetada para suportar a arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, com foco em confiabilidade, escalabilidade e monitoramento.

#### Ambientes de Deploy

```mermaid
graph TD
    A[Developer] --> B[Local Development]
    B --> C[Feature Branch]
    C --> D[Staging Environment]
    D --> E[Production Environment]
    
    F[Hotfix Branch] --> E
    
    subgraph "Local Development"
        B1[Docker Compose]
        B2[Local Database]
        B3[Mock Services]
    end
    
    subgraph "Staging"
        D1[Vercel Preview]
        D2[Supabase Staging]
        D3[Redis Staging]
        D4[UAZ Sandbox]
    end
    
    subgraph "Production"
        E1[Vercel Production]
        E2[Supabase Production]
        E3[Redis Production]
        E4[UAZ Production]
        E5[Monitoring Stack]
    end
```

### 1. Configuração Docker

#### Dockerfile Otimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build CrewAI and WhatsApp Auth components
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/falachefe_dev
      - REDIS_URL=redis://redis:6379
      - UAZ_API_URL=https://sandbox.uazapi.com
      - UAZ_API_TOKEN=${UAZ_API_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=falachefe_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 2. Configuração Vercel

#### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/webhook/uaz",
      "dest": "/api/webhook/uaz",
      "methods": ["POST"]
    },
    {
      "src": "/api/auth/whatsapp/(.*)",
      "dest": "/api/auth/whatsapp/$1",
      "methods": ["GET", "POST"]
    },
    {
      "src": "/api/crewai/(.*)",
      "dest": "/api/crewai/$1",
      "methods": ["GET", "POST"]
    },
    {
      "src": "/api/admin/(.*)",
      "dest": "/api/admin/$1",
      "methods": ["GET", "POST", "PUT", "DELETE"]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/webhook/uaz/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/crewai/process/route.ts": {
      "maxDuration": 60
    }
  },
  "regions": ["iad1", "sfo1"],
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup-metrics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### Environment Variables por Ambiente

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.supabase.co:5432/postgres
REDIS_URL=rediss://prod-redis.redis.com:6380
UAZ_API_URL=https://api.uazapi.com
UAZ_API_TOKEN=prod_token_here
OPENAI_API_KEY=sk-prod_key_here
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
SENTRY_DSN=https://prod_sentry_dsn
VERCEL_URL=your-domain.vercel.app

# WhatsApp Auth Config
WHATSAPP_VERIFICATION_CODE_LENGTH=6
WHATSAPP_SESSION_EXPIRATION_HOURS=24
WHATSAPP_RATE_LIMIT_MESSAGES_PER_MINUTE=10
WHATSAPP_MAX_VERIFICATION_ATTEMPTS=3

# CrewAI Config
CREWAI_MAX_AGENTS_PER_CREW=5
CREWAI_TASK_TIMEOUT_SECONDS=30
CREWAI_MEMORY_RETENTION_DAYS=30
```

### 3. Configuração Supabase

#### Database Migrations

```sql
-- scripts/database/migrations/0001_initial_setup.sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar RLS
ALTER DATABASE postgres SET row_security = on;

-- Criar schema para WhatsApp Auth
CREATE SCHEMA IF NOT EXISTS whatsapp_auth;

-- Configurar políticas de segurança
ALTER SCHEMA whatsapp_auth OWNER TO postgres;
GRANT USAGE ON SCHEMA whatsapp_auth TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA whatsapp_auth TO authenticated;
```

```sql
-- scripts/database/migrations/0002_whatsapp_auth_tables.sql
-- Executar no ambiente de produção via Supabase CLI
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX idx_whatsapp_sessions_token ON whatsapp_sessions(session_token);
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number, company_id);
CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- RLS Policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON whatsapp_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON whatsapp_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON whatsapp_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

### 4. Configuração Redis Cloud

#### Redis Configuration

```typescript
// src/lib/config/redis-config.ts
export const RedisConfig = {
  development: {
    host: 'localhost',
    port: 6379,
    password: undefined,
    db: 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  staging: {
    host: process.env.REDIS_STAGING_HOST,
    port: parseInt(process.env.REDIS_STAGING_PORT || '6379'),
    password: process.env.REDIS_STAGING_PASSWORD,
    db: 0,
    tls: {},
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  production: {
    host: process.env.REDIS_PRODUCTION_HOST,
    port: parseInt(process.env.REDIS_PRODUCTION_PORT || '6379'),
    password: process.env.REDIS_PRODUCTION_PASSWORD,
    db: 0,
    tls: {},
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  }
};

export const getRedisConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return RedisConfig[env as keyof typeof RedisConfig];
};
```

### 5. CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Falachefe CrewAI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          REDIS_URL: ${{ secrets.TEST_REDIS_URL }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Database Migrations (Staging)
        run: |
          npx supabase db push --project-ref=${{ secrets.SUPABASE_STAGING_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run E2E Tests
        run: npm run test:e2e:staging
        env:
          VERCEL_URL: ${{ steps.deploy.outputs.url }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Database Migrations (Production)
        run: |
          npx supabase db push --project-ref=${{ secrets.SUPABASE_PRODUCTION_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run Health Checks
        run: npm run health-check:production
        env:
          VERCEL_URL: ${{ steps.deploy.outputs.url }}

      - name: Notify Deployment Success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 6. Scripts de Deploy

#### Deploy Script para Desenvolvimento

```bash
#!/bin/bash
# scripts/deploy/dev-deploy.sh

set -e

echo "🚀 Starting development deployment..."

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec app npm run db:migrate

# Seed development data
echo "🌱 Seeding development data..."
docker-compose exec app npm run db:seed

# Run health checks
echo "🏥 Running health checks..."
docker-compose exec app npm run health-check

echo "✅ Development deployment completed!"
echo "📱 App available at: http://localhost:3000"
echo "🗄️ Database available at: localhost:5432"
echo "📊 Redis available at: localhost:6379"
```

#### Deploy Script para Produção

```bash
#!/bin/bash
# scripts/deploy/prod-deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Backup current database
echo "💾 Creating database backup..."
npx supabase db dump --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF > backup-$(date +%Y%m%d-%H%M%S).sql

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel deploy --prod --token=$VERCEL_TOKEN

# Run database migrations
echo "🗄️ Running database migrations..."
npx supabase db push --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF

# Clear Redis cache
echo "🧹 Clearing Redis cache..."
redis-cli -u $REDIS_PRODUCTION_URL FLUSHDB

# Run health checks
echo "🏥 Running health checks..."
npm run health-check:production

# Notify deployment
echo "📢 Deployment completed successfully!"

# Cleanup old backups (keep last 7 days)
find . -name "backup-*.sql" -mtime +7 -delete

echo "✅ Production deployment completed!"
```

### 7. Monitoramento e Observabilidade

#### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    uaz: await checkUAZAPI(),
    openai: await checkOpenAI(),
    timestamp: new Date().toISOString()
  };

  const allHealthy = Object.values(checks).every(
    check => check === true || check.status === 'healthy'
  );

  return Response.json(checks, {
    status: allHealthy ? 200 : 503
  });
}

async function checkDatabase(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
```

#### Cron Jobs para Limpeza

```typescript
// src/app/api/cron/cleanup-sessions/route.ts
export async function GET() {
  try {
    // Limpar sessões expiradas
    const expiredSessions = await db
      .delete(whatsappSessions)
      .where(lt(whatsappSessions.expiresAt, new Date()));

    // Limpar logs antigos
    const oldLogs = await db
      .delete(whatsappAuthLogs)
      .where(lt(whatsappAuthLogs.createdAt, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
      ));

    return Response.json({
      status: 'success',
      expiredSessions: expiredSessions.rowCount,
      oldLogs: oldLogs.rowCount
    });
  } catch (error) {
    return Response.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
```

### 8. Configuração de Domínio e SSL

#### Nginx Configuration

```nginx
# docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;

    server {
        listen 80;
        server_name falachefe.com www.falachefe.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name falachefe.com www.falachefe.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API routes with rate limiting
        location /api/webhook/ {
            limit_req zone=webhook burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 9. Rollback Strategy

#### Rollback Script

```bash
#!/bin/bash
# scripts/deploy/rollback.sh

set -e

DEPLOYMENT_ID=$1

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ Please provide a deployment ID to rollback to"
    exit 1
fi

echo "🔄 Rolling back to deployment: $DEPLOYMENT_ID"

# Rollback Vercel deployment
vercel rollback $DEPLOYMENT_ID --token=$VERCEL_TOKEN

# Rollback database if needed
if [ "$ROLLBACK_DB" = "true" ]; then
    echo "🗄️ Rolling back database..."
    npx supabase db reset --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF
fi

# Clear caches
redis-cli -u $REDIS_PRODUCTION_URL FLUSHDB

# Run health checks
npm run health-check:production

echo "✅ Rollback completed successfully!"
```

### 10. Environment-Specific Configurations

#### Configuração por Ambiente

```typescript
// src/lib/config/environment.ts
export const EnvironmentConfig = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://postgres:password@localhost:5432/falachefe_dev',
    redisUrl: 'redis://localhost:6379',
    uazApiUrl: 'https://sandbox.uazapi.com',
    logLevel: 'debug',
    enableMetrics: false,
    enableAuditLogs: false,
  },
  staging: {
    apiBaseUrl: process.env.VERCEL_URL || 'https://staging.falachefe.com',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    uazApiUrl: 'https://sandbox.uazapi.com',
    logLevel: 'info',
    enableMetrics: true,
    enableAuditLogs: true,
  },
  production: {
    apiBaseUrl: 'https://falachefe.com',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    uazApiUrl: 'https://api.uazapi.com',
    logLevel: 'warn',
    enableMetrics: true,
    enableAuditLogs: true,
  }
};

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return EnvironmentConfig[env as keyof typeof EnvironmentConfig];
};
```

### Benefícios da Estratégia de Deploy

✅ **Multi-Ambiente**: Desenvolvimento, staging e produção isolados  
✅ **CI/CD Automatizado**: Deploy automático via GitHub Actions  
✅ **Rollback Rápido**: Estratégia de rollback em caso de problemas  
✅ **Monitoramento**: Health checks e métricas em tempo real  
✅ **Segurança**: SSL, rate limiting e headers de segurança  
✅ **Escalabilidade**: Configuração para crescimento automático  
✅ **Observabilidade**: Logs, métricas e alertas configurados  

**A estratégia de deploy está completa e pronta para implementação! Próxima seção?**

## Monitoring

### Estratégia de Observabilidade Completa

O sistema de monitoramento foi projetado para fornecer visibilidade completa sobre a arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, garantindo confiabilidade, performance e segurança.

#### Stack de Monitoramento

```mermaid
graph TD
    A[Application] --> B[Metrics Collection]
    A --> C[Logging]
    A --> D[Tracing]
    
    B --> E[Prometheus]
    C --> F[Loki]
    D --> G[Jaeger]
    
    E --> H[Grafana Dashboard]
    F --> H
    G --> H
    
    H --> I[Alerting]
    I --> J[Slack/Email]
    
    subgraph "WhatsApp Auth Metrics"
        K[Auth Attempts]
        L[Session Management]
        M[Rate Limiting]
    end
    
    subgraph "CrewAI Metrics"
        N[Agent Performance]
        O[Task Execution]
        P[Memory Usage]
    end
    
    subgraph "Infrastructure Metrics"
        Q[Database Performance]
        R[Redis Metrics]
        S[API Response Times]
    end
```

### 1. Métricas de Aplicação

#### Sistema de Métricas WhatsApp Auth

```typescript
// src/lib/monitoring/whatsapp-metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const WhatsAppAuthMetrics = {
  // Contadores
  authAttempts: new Counter({
    name: 'whatsapp_auth_attempts_total',
    help: 'Total number of WhatsApp authentication attempts',
    labelNames: ['phone_number', 'company_id', 'auth_method', 'status']
  }),

  verificationCodesSent: new Counter({
    name: 'whatsapp_verification_codes_sent_total',
    help: 'Total number of verification codes sent',
    labelNames: ['phone_number', 'company_id']
  }),

  sessionsCreated: new Counter({
    name: 'whatsapp_sessions_created_total',
    help: 'Total number of WhatsApp sessions created',
    labelNames: ['user_id', 'company_id']
  }),

  sessionsExpired: new Counter({
    name: 'whatsapp_sessions_expired_total',
    help: 'Total number of expired WhatsApp sessions',
    labelNames: ['user_id', 'company_id']
  }),

  rateLimitHits: new Counter({
    name: 'whatsapp_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['phone_number', 'limit_type']
  }),

  // Histogramas
  authResponseTime: new Histogram({
    name: 'whatsapp_auth_response_time_seconds',
    help: 'Response time for WhatsApp authentication',
    labelNames: ['auth_method', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  verificationCodeGenerationTime: new Histogram({
    name: 'whatsapp_verification_code_generation_time_seconds',
    help: 'Time to generate verification codes',
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  }),

  // Gauges
  activeSessions: new Gauge({
    name: 'whatsapp_active_sessions',
    help: 'Number of active WhatsApp sessions',
    labelNames: ['company_id']
  }),

  pendingVerifications: new Gauge({
    name: 'whatsapp_pending_verifications',
    help: 'Number of pending verifications',
    labelNames: ['company_id']
  })
};

// Registrar métricas
register.registerMetric(WhatsAppAuthMetrics.authAttempts);
register.registerMetric(WhatsAppAuthMetrics.verificationCodesSent);
register.registerMetric(WhatsAppAuthMetrics.sessionsCreated);
register.registerMetric(WhatsAppAuthMetrics.sessionsExpired);
register.registerMetric(WhatsAppAuthMetrics.rateLimitHits);
register.registerMetric(WhatsAppAuthMetrics.authResponseTime);
register.registerMetric(WhatsAppAuthMetrics.verificationCodeGenerationTime);
register.registerMetric(WhatsAppAuthMetrics.activeSessions);
register.registerMetric(WhatsAppAuthMetrics.pendingVerifications);
```

#### Sistema de Métricas CrewAI

```typescript
// src/lib/monitoring/crewai-metrics.ts
export const CrewAIMetrics = {
  // Contadores
  messagesProcessed: new Counter({
    name: 'crewai_messages_processed_total',
    help: 'Total number of messages processed by CrewAI',
    labelNames: ['crew_id', 'agent_id', 'company_id', 'status']
  }),

  tasksExecuted: new Counter({
    name: 'crewai_tasks_executed_total',
    help: 'Total number of tasks executed',
    labelNames: ['task_type', 'crew_id', 'status']
  }),

  handoffsPerformed: new Counter({
    name: 'crewai_handoffs_performed_total',
    help: 'Total number of agent handoffs',
    labelNames: ['from_agent', 'to_agent', 'crew_id']
  }),

  memoryOperations: new Counter({
    name: 'crewai_memory_operations_total',
    help: 'Total number of memory operations',
    labelNames: ['operation_type', 'crew_id']
  }),

  // Histogramas
  messageProcessingTime: new Histogram({
    name: 'crewai_message_processing_time_seconds',
    help: 'Time to process messages through CrewAI',
    labelNames: ['crew_id', 'agent_id'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60]
  }),

  taskExecutionTime: new Histogram({
    name: 'crewai_task_execution_time_seconds',
    help: 'Time to execute individual tasks',
    labelNames: ['task_type', 'agent_id'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  handoffTime: new Histogram({
    name: 'crewai_handoff_time_seconds',
    help: 'Time to perform agent handoffs',
    labelNames: ['from_agent', 'to_agent'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),

  // Gauges
  activeCrews: new Gauge({
    name: 'crewai_active_crews',
    help: 'Number of active crews',
    labelNames: ['company_id']
  }),

  activeAgents: new Gauge({
    name: 'crewai_active_agents',
    help: 'Number of active agents',
    labelNames: ['crew_id', 'agent_type']
  }),

  memoryUsage: new Gauge({
    name: 'crewai_memory_usage_bytes',
    help: 'Memory usage by crews',
    labelNames: ['crew_id', 'memory_type']
  }),

  queueDepth: new Gauge({
    name: 'crewai_queue_depth',
    help: 'Depth of message processing queue',
    labelNames: ['crew_id']
  })
};
```

### 2. Sistema de Logging Estruturado

#### Logger Centralizado

```typescript
// src/lib/monitoring/logger.ts
import winston from 'winston';
import { Request, Response } from 'express';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Logger específico para WhatsApp Auth
export const whatsappAuthLogger = logger.child({ 
  service: 'whatsapp-auth',
  version: process.env.npm_package_version 
});

// Logger específico para CrewAI
export const crewaiLogger = logger.child({ 
  service: 'crewai',
  version: process.env.npm_package_version 
});

// Logger para auditoria
export const auditLogger = logger.child({ 
  service: 'audit',
  version: process.env.npm_package_version 
});

// Middleware para logging de requests
export const requestLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      companyId: req.user?.companyId
    });
  });
  
  next();
};
```

#### Logs Estruturados para WhatsApp Auth

```typescript
// src/lib/auth/whatsapp-auth-logger.ts
export class WhatsAppAuthLogger {
  static logAuthenticationAttempt(
    phoneNumber: string,
    companyId: string,
    authMethod: string,
    success: boolean,
    metadata?: any
  ) {
    whatsappAuthLogger.info('Authentication attempt', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      companyId,
      authMethod,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Log de auditoria para compliance
    auditLogger.info('WhatsApp authentication attempt', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      companyId,
      authMethod,
      success,
      timestamp: new Date().toISOString(),
      compliance: true
    });
  }

  static logVerificationCodeSent(
    phoneNumber: string,
    companyId: string,
    codeLength: number
  ) {
    whatsappAuthLogger.info('Verification code sent', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      companyId,
      codeLength,
      timestamp: new Date().toISOString()
    });
  }

  static logSessionCreated(
    userId: string,
    companyId: string,
    sessionToken: string,
    expiresAt: Date
  ) {
    whatsappAuthLogger.info('Session created', {
      userId,
      companyId,
      sessionToken: this.maskToken(sessionToken),
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString()
    });
  }

  static logRateLimitHit(
    phoneNumber: string,
    limitType: string,
    attempts: number
  ) {
    whatsappAuthLogger.warn('Rate limit hit', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      limitType,
      attempts,
      timestamp: new Date().toISOString()
    });
  }

  private static maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }

  private static maskToken(token: string): string {
    return token.substring(0, 8) + '...' + token.substring(token.length - 4);
  }
}
```

#### Logs Estruturados para CrewAI

```typescript
// src/lib/monitoring/crewai-logger.ts
export class CrewAILogger {
  static logMessageProcessed(
    messageId: string,
    crewId: string,
    agentId: string,
    processingTime: number,
    status: 'success' | 'error' | 'timeout',
    metadata?: any
  ) {
    crewaiLogger.info('Message processed', {
      messageId,
      crewId,
      agentId,
      processingTime: `${processingTime}ms`,
      status,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  static logTaskExecuted(
    taskId: string,
    taskType: string,
    agentId: string,
    executionTime: number,
    result: any
  ) {
    crewaiLogger.info('Task executed', {
      taskId,
      taskType,
      agentId,
      executionTime: `${executionTime}ms`,
      result: this.sanitizeResult(result),
      timestamp: new Date().toISOString()
    });
  }

  static logHandoffPerformed(
    fromAgent: string,
    toAgent: string,
    crewId: string,
    handoffTime: number,
    context: any
  ) {
    crewaiLogger.info('Agent handoff performed', {
      fromAgent,
      toAgent,
      crewId,
      handoffTime: `${handoffTime}ms`,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString()
    });
  }

  static logMemoryOperation(
    operationType: 'read' | 'write' | 'update' | 'delete',
    crewId: string,
    memoryKey: string,
    success: boolean,
    metadata?: any
  ) {
    crewaiLogger.info('Memory operation', {
      operationType,
      crewId,
      memoryKey,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  private static sanitizeResult(result: any): any {
    // Remove dados sensíveis dos resultados
    if (typeof result === 'object' && result !== null) {
      const sanitized = { ...result };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.apiKey;
      return sanitized;
    }
    return result;
  }

  private static sanitizeContext(context: any): any {
    // Remove dados sensíveis do contexto
    if (typeof context === 'object' && context !== null) {
      const sanitized = { ...context };
      delete sanitized.userData?.password;
      delete sanitized.userData?.token;
      delete sanitized.apiKeys;
      return sanitized;
    }
    return context;
  }
}
```

### 3. Distributed Tracing

#### Configuração Jaeger

```typescript
// src/lib/monitoring/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'falachefe-crewai',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export const tracer = trace.getTracer('falachefe-crewai');

// Span helper para WhatsApp Auth
export const createWhatsAppAuthSpan = (operationName: string, attributes?: any) => {
  return tracer.startSpan(operationName, {
    attributes: {
      'service.name': 'whatsapp-auth',
      'operation.name': operationName,
      ...attributes
    }
  });
};

// Span helper para CrewAI
export const createCrewAISpan = (operationName: string, attributes?: any) => {
  return tracer.startSpan(operationName, {
    attributes: {
      'service.name': 'crewai',
      'operation.name': operationName,
      ...attributes
    }
  });
};

// Função para executar operação com span
export const withSpan = async <T>(
  spanName: string,
  operation: (span: any) => Promise<T>,
  attributes?: any
): Promise<T> => {
  const span = tracer.startSpan(spanName, { attributes });
  
  try {
    const result = await operation(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
};
```

#### Instrumentação WhatsApp Auth

```typescript
// src/lib/auth/whatsapp-auth-instrumented.ts
export class WhatsAppAuthServiceInstrumented {
  async authenticateUser(
    phoneNumber: string, 
    companyId: string,
    message?: string
  ): Promise<WhatsAppAuthResult> {
    
    return await withSpan(
      'whatsapp.auth.authenticate_user',
      async (span) => {
        span.setAttributes({
          'whatsapp.phone_number': phoneNumber,
          'whatsapp.company_id': companyId,
          'whatsapp.message_length': message?.length || 0
        });

        // Verificar sessão ativa
        const activeSessionSpan = tracer.startSpan('whatsapp.auth.check_active_session');
        const activeSession = await this.getActiveSession(phoneNumber, companyId);
        activeSessionSpan.setAttributes({
          'whatsapp.session_found': !!activeSession,
          'whatsapp.session_valid': !!(activeSession && !this.isSessionExpired(activeSession))
        });
        activeSessionSpan.end();

        if (activeSession && !this.isSessionExpired(activeSession)) {
          span.setAttributes({
            'whatsapp.auth_method': 'session_token',
            'whatsapp.auth_success': true
          });
          
          return {
            authenticated: true,
            user: activeSession.user,
            sessionToken: activeSession.token,
            authMethod: 'session_token'
          };
        }

        // Buscar usuário no banco
        const userLookupSpan = tracer.startSpan('whatsapp.auth.lookup_user');
        const user = await this.findUserByPhone(phoneNumber, companyId);
        userLookupSpan.setAttributes({
          'whatsapp.user_found': !!user,
          'whatsapp.user_id': user?.id || 'none'
        });
        userLookupSpan.end();

        // Resto da lógica...
        // ...
      },
      {
        'whatsapp.phone_number': phoneNumber,
        'whatsapp.company_id': companyId
      }
    );
  }
}
```

### 4. Dashboards Grafana

#### Dashboard WhatsApp Auth

```json
{
  "dashboard": {
    "title": "WhatsApp Authentication Dashboard",
    "panels": [
      {
        "title": "Authentication Attempts Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(whatsapp_auth_attempts_total[5m])",
            "legendFormat": "{{status}} - {{auth_method}}"
          }
        ]
      },
      {
        "title": "Active Sessions",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(whatsapp_active_sessions)",
            "legendFormat": "Active Sessions"
          }
        ]
      },
      {
        "title": "Authentication Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(whatsapp_auth_response_time_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(whatsapp_auth_response_time_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Rate Limit Hits",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(whatsapp_rate_limit_hits_total[5m])",
            "legendFormat": "{{limit_type}}"
          }
        ]
      },
      {
        "title": "Verification Codes Sent",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(whatsapp_verification_codes_sent_total[5m])",
            "legendFormat": "Codes Sent"
          }
        ]
      }
    ]
  }
}
```

#### Dashboard CrewAI

```json
{
  "dashboard": {
    "title": "CrewAI Performance Dashboard",
    "panels": [
      {
        "title": "Messages Processed Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(crewai_messages_processed_total[5m])",
            "legendFormat": "{{crew_id}} - {{agent_id}}"
          }
        ]
      },
      {
        "title": "Task Execution Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(crewai_task_execution_time_seconds_bucket[5m]))",
            "legendFormat": "{{task_type}} - 95th percentile"
          }
        ]
      },
      {
        "title": "Agent Handoffs",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(crewai_handoffs_performed_total[5m])",
            "legendFormat": "{{from_agent}} → {{to_agent}}"
          }
        ]
      },
      {
        "title": "Memory Operations",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(crewai_memory_operations_total[5m])",
            "legendFormat": "{{operation_type}}"
          }
        ]
      },
      {
        "title": "Queue Depth",
        "type": "graph",
        "targets": [
          {
            "expr": "crewai_queue_depth",
            "legendFormat": "{{crew_id}}"
          }
        ]
      }
    ]
  }
}
```

### 5. Sistema de Alertas

#### Configuração de Alertas

```yaml
# monitoring/alerts.yml
groups:
  - name: whatsapp-auth
    rules:
      - alert: WhatsAppAuthHighFailureRate
        expr: rate(whatsapp_auth_attempts_total{status="failed"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          service: whatsapp-auth
        annotations:
          summary: "High WhatsApp authentication failure rate"
          description: "WhatsApp authentication failure rate is {{ $value }} failures per second"

      - alert: WhatsAppAuthHighResponseTime
        expr: histogram_quantile(0.95, rate(whatsapp_auth_response_time_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
          service: whatsapp-auth
        annotations:
          summary: "High WhatsApp authentication response time"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: WhatsAppAuthRateLimitHits
        expr: rate(whatsapp_rate_limit_hits_total[5m]) > 10
        for: 1m
        labels:
          severity: critical
          service: whatsapp-auth
        annotations:
          summary: "High rate limit hits"
          description: "Rate limit hits per second: {{ $value }}"

  - name: crewai
    rules:
      - alert: CrewAIMessageProcessingErrors
        expr: rate(crewai_messages_processed_total{status="error"}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
          service: crewai
        annotations:
          summary: "High CrewAI message processing error rate"
          description: "Error rate is {{ $value }} errors per second"

      - alert: CrewAIHighProcessingTime
        expr: histogram_quantile(0.95, rate(crewai_message_processing_time_seconds_bucket[5m])) > 30
        for: 5m
        labels:
          severity: warning
          service: crewai
        annotations:
          summary: "High CrewAI message processing time"
          description: "95th percentile processing time is {{ $value }} seconds"

      - alert: CrewAIQueueBacklog
        expr: crewai_queue_depth > 100
        for: 5m
        labels:
          severity: critical
          service: crewai
        annotations:
          summary: "CrewAI queue backlog"
          description: "Queue depth is {{ $value }} messages"

  - name: infrastructure
    rules:
      - alert: DatabaseConnectionErrors
        expr: rate(database_connection_errors_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "Database connection errors"
          description: "Database connection error rate is {{ $value }} errors per second"

      - alert: RedisConnectionErrors
        expr: rate(redis_connection_errors_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
          service: redis
        annotations:
          summary: "Redis connection errors"
          description: "Redis connection error rate is {{ $value }} errors per second"
```

### 6. Health Checks Avançados

#### Health Check Completo

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    checks: {}
  };

  // Database Health Check
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    healthChecks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.database = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // Redis Health Check
  try {
    const redisStart = Date.now();
    await redis.ping();
    healthChecks.checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.redis = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // UAZ API Health Check
  try {
    const uazStart = Date.now();
    const response = await fetch(`${process.env.UAZ_API_URL}/health`, {
      timeout: 5000
    });
    healthChecks.checks.uaz = {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - uazStart,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.uaz = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // OpenAI API Health Check
  try {
    const openaiStart = Date.now();
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      timeout: 5000
    });
    healthChecks.checks.openai = {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - openaiStart,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.openai = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // WhatsApp Auth System Health
  try {
    const activeSessions = await db.query(
      'SELECT COUNT(*) as count FROM whatsapp_sessions WHERE expires_at > NOW()'
    );
    const pendingVerifications = await redis.keys('verify:*');
    
    healthChecks.checks.whatsappAuth = {
      status: 'healthy',
      activeSessions: parseInt(activeSessions.rows[0].count),
      pendingVerifications: pendingVerifications.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.whatsappAuth = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // CrewAI System Health
  try {
    const activeCrews = await db.query(
      'SELECT COUNT(*) as count FROM crews WHERE is_active = true'
    );
    const activeAgents = await db.query(
      'SELECT COUNT(*) as count FROM crew_agents WHERE is_active = true'
    );
    
    healthChecks.checks.crewai = {
      status: 'healthy',
      activeCrews: parseInt(activeCrews.rows[0].count),
      activeAgents: parseInt(activeAgents.rows[0].count),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    healthChecks.checks.crewai = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  const totalResponseTime = Date.now() - startTime;
  const allHealthy = Object.values(healthChecks.checks).every(
    check => check.status === 'healthy'
  );

  return Response.json({
    ...healthChecks,
    totalResponseTime,
    overallStatus: allHealthy ? 'healthy' : 'unhealthy'
  }, {
    status: allHealthy ? 200 : 503
  });
}
```

### 7. Métricas de Business Intelligence

#### Métricas de Negócio

```typescript
// src/lib/monitoring/business-metrics.ts
export const BusinessMetrics = {
  // Métricas de usuários
  dailyActiveUsers: new Gauge({
    name: 'business_daily_active_users',
    help: 'Number of daily active users',
    labelNames: ['company_id', 'channel']
  }),

  userRetention: new Gauge({
    name: 'business_user_retention_rate',
    help: 'User retention rate',
    labelNames: ['company_id', 'period']
  }),

  // Métricas de conversas
  conversationVolume: new Counter({
    name: 'business_conversation_volume_total',
    help: 'Total conversation volume',
    labelNames: ['company_id', 'channel']
  }),

  averageConversationLength: new Histogram({
    name: 'business_conversation_length_messages',
    help: 'Average conversation length in messages',
    labelNames: ['company_id', 'channel'],
    buckets: [1, 5, 10, 20, 50, 100]
  }),

  // Métricas de satisfação
  responseTime: new Histogram({
    name: 'business_response_time_seconds',
    help: 'Business response time',
    labelNames: ['company_id', 'agent_type'],
    buckets: [1, 5, 10, 30, 60, 120]
  }),

  // Métricas financeiras
  revenuePerUser: new Gauge({
    name: 'business_revenue_per_user',
    help: 'Revenue per user',
    labelNames: ['company_id', 'period']
  }),

  costPerConversation: new Gauge({
    name: 'business_cost_per_conversation',
    help: 'Cost per conversation',
    labelNames: ['company_id', 'channel']
  })
};

// Função para atualizar métricas de negócio
export const updateBusinessMetrics = async (companyId: string) => {
  try {
    // Atualizar usuários ativos diários
    const dailyUsers = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM conversations 
      WHERE company_id = $1 
      AND DATE(created_at) = CURRENT_DATE
    `, [companyId]);
    
    BusinessMetrics.dailyActiveUsers.set(
      { company_id: companyId, channel: 'whatsapp' },
      parseInt(dailyUsers.rows[0].count)
    );

    // Atualizar volume de conversas
    const conversationVolume = await db.query(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id = $1 
      AND DATE(created_at) = CURRENT_DATE
    `, [companyId]);
    
    BusinessMetrics.conversationVolume.inc(
      { company_id: companyId, channel: 'whatsapp' },
      parseInt(conversationVolume.rows[0].count)
    );

    // Atualizar tempo médio de resposta
    const avgResponseTime = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (response_at - sent_at))) as avg_time
      FROM messages 
      WHERE company_id = $1 
      AND response_at IS NOT NULL
      AND DATE(created_at) = CURRENT_DATE
    `, [companyId]);
    
    if (avgResponseTime.rows[0].avg_time) {
      BusinessMetrics.responseTime.observe(
        { company_id: companyId, agent_type: 'crewai' },
        parseFloat(avgResponseTime.rows[0].avg_time)
      );
    }

  } catch (error) {
    logger.error('Failed to update business metrics', { error, companyId });
  }
};
```

### 8. Integração com Sentry

#### Configuração Sentry

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  beforeSend(event) {
    // Filtrar dados sensíveis
    if (event.user) {
      delete event.user.phone_number;
      delete event.user.email;
    }
    
    // Adicionar contexto customizado
    event.tags = {
      ...event.tags,
      service: 'falachefe-crewai',
      version: process.env.npm_package_version
    };
    
    return event;
  },
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
    new Sentry.Integrations.Prisma({ client: undefined })
  ]
});

// Helper para capturar erros WhatsApp Auth
export const captureWhatsAppAuthError = (error: Error, context: any) => {
  Sentry.withScope((scope) => {
    scope.setTag('component', 'whatsapp-auth');
    scope.setContext('whatsapp-auth', {
      phoneNumber: context.phoneNumber ? 
        context.phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : undefined,
      companyId: context.companyId,
      authMethod: context.authMethod
    });
    Sentry.captureException(error);
  });
};

// Helper para capturar erros CrewAI
export const captureCrewAIError = (error: Error, context: any) => {
  Sentry.withScope((scope) => {
    scope.setTag('component', 'crewai');
    scope.setContext('crewai', {
      crewId: context.crewId,
      agentId: context.agentId,
      taskType: context.taskType,
      messageId: context.messageId
    });
    Sentry.captureException(error);
  });
};
```

### Benefícios do Sistema de Monitoramento

✅ **Observabilidade Completa**: Métricas, logs e traces integrados  
✅ **Alertas Proativos**: Detecção precoce de problemas  
✅ **Dashboards Visuais**: Visibilidade em tempo real  
✅ **Business Intelligence**: Métricas de negócio integradas  
✅ **Troubleshooting**: Rastreamento distribuído de requests  
✅ **Performance**: Monitoramento de latência e throughput  
✅ **Compliance**: Logs de auditoria estruturados  
✅ **Escalabilidade**: Métricas para planejamento de capacidade  

**O sistema de monitoramento está completo e pronto para implementação! Próxima seção?**

## Security

### Estratégia de Segurança Baseada em Better Auth + RBAC

A estratégia de segurança foi projetada para proteger a arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, utilizando Better Auth com controle de acesso baseado em roles (RBAC) e multi-tenancy rigoroso.

#### Hierarquia de Roles e Permissões

```mermaid
graph TD
    A[Superadmin] --> B[Admin]
    B --> C[User]
    
    A --> A1[Full System Access]
    A --> A2[User Management]
    A --> A3[System Configuration]
    A --> A4[WhatsApp Auth Management]
    A --> A5[CrewAI Management]
    A --> A6[Multi-tenant Access]
    
    B --> B1[Company Management]
    B --> B2[User Management]
    B --> B3[WhatsApp Auth Config]
    B --> B4[CrewAI Configuration]
    B --> B5[Analytics Access]
    
    C --> C1[Company Data Access]
    C --> C2[WhatsApp Interaction]
    C --> C3[Limited Analytics]
    
    subgraph "Better Auth RBAC"
        D[Role: superadmin]
        E[Role: admin]
        F[Role: user]
    end
    
    subgraph "Multi-tenancy"
        G[Company Isolation]
        H[Data Segregation]
        I[Resource Isolation]
    end
```

### 1. Configuração Better Auth com RBAC

#### Configuração Principal do Better Auth

```typescript
// src/lib/auth/config.ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { emailAndPassword } from "better-auth/plugins/email-and-password";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Para desenvolvimento
    minPasswordLength: 8,
    maxPasswordLength: 128,
    passwordHashing: {
      algorithm: "scrypt",
      keyLength: 64,
      saltLength: 32
    }
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }
  },

  plugins: [
    admin({
      // Configurações específicas do admin
      impersonationSessionDuration: 3600, // 1 hora
    }),
    
    organization({
      // Configurações de organização para multi-tenancy
      allowUserToCreateOrganization: false, // Apenas admins podem criar
      organizationLimit: {
        free: 1,
        pro: 5,
        enterprise: -1 // Ilimitado
      }
    })
  ],

  // Configurações de sessão
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // 1 dia
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutos
    }
  },

  // Configurações de segurança
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false,
      domain: process.env.NODE_ENV === 'production' ? '.falachefe.com' : 'localhost'
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedOrigins: [
      'http://localhost:3000',
      'https://falachefe.com',
      'https://*.falachefe.com'
    ]
  },

  // Configurações de rate limiting
  rateLimit: {
    window: 60, // 1 minuto
    max: 100, // 100 requests por minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Callbacks para controle de acesso
  callbacks: {
    async session({ session, user }) {
      // Adicionar informações de role e company ao session
      if (session?.user) {
        session.user.role = user.role;
        session.user.companyId = user.companyId;
        session.user.permissions = await getUserPermissions(user.id);
      }
      return session;
    },

    async jwt({ token, user, account }) {
      // Adicionar informações de role ao JWT
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    }
  }
});
```

#### Sistema de Roles e Permissões

```typescript
// src/lib/auth/rbac.ts
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin', 
  USER: 'user'
} as const;

export const PERMISSIONS = {
  // Superadmin permissions
  SYSTEM_MANAGEMENT: 'system:manage',
  USER_MANAGEMENT: 'user:manage',
  ORGANIZATION_MANAGEMENT: 'organization:manage',
  
  // Admin permissions
  COMPANY_MANAGEMENT: 'company:manage',
  COMPANY_USER_MANAGEMENT: 'company:user:manage',
  WHATSAPP_CONFIG: 'whatsapp:config',
  CREWAI_CONFIG: 'crewai:config',
  ANALYTICS_FULL: 'analytics:full',
  
  // User permissions
  WHATSAPP_INTERACT: 'whatsapp:interact',
  ANALYTICS_READ: 'analytics:read',
  PROFILE_MANAGE: 'profile:manage'
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: [
    PERMISSIONS.SYSTEM_MANAGEMENT,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.ORGANIZATION_MANAGEMENT,
    PERMISSIONS.COMPANY_MANAGEMENT,
    PERMISSIONS.COMPANY_USER_MANAGEMENT,
    PERMISSIONS.WHATSAPP_CONFIG,
    PERMISSIONS.CREWAI_CONFIG,
    PERMISSIONS.ANALYTICS_FULL,
    PERMISSIONS.WHATSAPP_INTERACT,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.PROFILE_MANAGE
  ],
  
  [ROLES.ADMIN]: [
    PERMISSIONS.COMPANY_MANAGEMENT,
    PERMISSIONS.COMPANY_USER_MANAGEMENT,
    PERMISSIONS.WHATSAPP_CONFIG,
    PERMISSIONS.CREWAI_CONFIG,
    PERMISSIONS.ANALYTICS_FULL,
    PERMISSIONS.WHATSAPP_INTERACT,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.PROFILE_MANAGE
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.WHATSAPP_INTERACT,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.PROFILE_MANAGE
  ]
} as const;

// Função para verificar permissões
export const hasPermission = (userRole: string, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission) || false;
};

// Função para verificar múltiplas permissões
export const hasAllPermissions = (userRole: string, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Função para verificar se é superadmin
export const isSuperadmin = (userRole: string): boolean => {
  return userRole === ROLES.SUPERADMIN;
};

// Função para verificar se é admin
export const isAdmin = (userRole: string): boolean => {
  return userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;
};
```

#### Middleware de Autenticação e Autorização

```typescript
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './config';
import { hasPermission, isSuperadmin, isAdmin } from './rbac';

export async function authenticateRequest(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    return session;
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 401 }
    );
  }
}

export async function authorizeRequest(
  request: NextRequest, 
  requiredPermission: string
) {
  const session = await authenticateRequest(request);
  
  if (session instanceof NextResponse) {
    return session; // Erro de autenticação
  }

  if (!hasPermission(session.user.role, requiredPermission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' }, 
      { status: 403 }
    );
  }

  return session;
}

export async function authorizeAdminRequest(request: NextRequest) {
  const session = await authenticateRequest(request);
  
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: 'Admin access required' }, 
      { status: 403 }
    );
  }

  return session;
}

export async function authorizeSuperadminRequest(request: NextRequest) {
  const session = await authenticateRequest(request);
  
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSuperadmin(session.user.role)) {
    return NextResponse.json(
      { error: 'Superadmin access required' }, 
      { status: 403 }
    );
  }

  return session;
}
```

### 2. Proteção Multi-Tenant

#### Middleware de Isolamento por Empresa

```typescript
// src/lib/auth/tenant-middleware.ts
export async function validateTenantAccess(
  request: NextRequest,
  companyId: string,
  session: any
): Promise<boolean> {
  // Superadmin tem acesso a todas as empresas
  if (isSuperadmin(session.user.role)) {
    return true;
  }

  // Admin tem acesso apenas à sua empresa
  if (isAdmin(session.user.role)) {
    return session.user.companyId === companyId;
  }

  // User tem acesso apenas à sua empresa
  return session.user.companyId === companyId;
}

export async function authorizeTenantRequest(
  request: NextRequest,
  companyId: string
) {
  const session = await authenticateRequest(request);
  
  if (session instanceof NextResponse) {
    return session;
  }

  const hasAccess = await validateTenantAccess(request, companyId, session);
  
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this company' }, 
      { status: 403 }
    );
  }

  return session;
}

// Helper para extrair companyId do request
export function extractCompanyId(request: NextRequest): string | null {
  // Tentar extrair do path
  const pathMatch = request.nextUrl.pathname.match(/\/company\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  // Tentar extrair do query params
  const queryCompanyId = request.nextUrl.searchParams.get('companyId');
  if (queryCompanyId) {
    return queryCompanyId;
  }

  // Tentar extrair do body (para POST/PUT)
  return null;
}
```

### 3. Proteção de APIs

#### Proteção de Endpoints WhatsApp Auth

```typescript
// src/app/api/auth/whatsapp/verify/route.ts
import { authorizeRequest } from '@/lib/auth/middleware';
import { PERMISSIONS } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  // Verificar se usuário tem permissão para interagir com WhatsApp
  const session = await authorizeRequest(request, PERMISSIONS.WHATSAPP_INTERACT);
  
  if (session instanceof NextResponse) {
    return session; // Erro de autorização
  }

  try {
    const { phoneNumber, companyId, code } = await request.json();

    // Validar acesso à empresa
    const tenantSession = await authorizeTenantRequest(request, companyId);
    if (tenantSession instanceof NextResponse) {
      return tenantSession;
    }

    // Verificar código
    const authResult = await whatsappAuth.verifyCode(phoneNumber, companyId, code);

    return Response.json({
      status: 'success',
      authenticated: true,
      sessionToken: authResult.sessionToken,
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        phoneNumber: authResult.user.phoneNumber
      }
    });

  } catch (error) {
    if (error instanceof WhatsAppAuthError) {
      return Response.json({ 
        error: error.message,
        code: error.code 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Proteção de Endpoints CrewAI

```typescript
// src/app/api/crewai/process/route.ts
import { authorizeRequest } from '@/lib/auth/middleware';
import { PERMISSIONS } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  // Verificar se usuário tem permissão para configurar CrewAI
  const session = await authorizeRequest(request, PERMISSIONS.CREWAI_CONFIG);
  
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { message, companyId, conversationId } = await request.json();

    // Validar acesso à empresa
    const tenantSession = await authorizeTenantRequest(request, companyId);
    if (tenantSession instanceof NextResponse) {
      return tenantSession;
    }

    // Processar mensagem com CrewAI
    const crewResponse = await crewOrchestrator.processMessage({
      message,
      userId: session.user.id,
      companyId,
      conversationId,
      authContext: {
        type: 'api',
        userId: session.user.id,
        role: session.user.role,
        permissions: session.user.permissions
      }
    });

    return Response.json(crewResponse);

  } catch (error) {
    logger.error('CrewAI processing error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Proteção de Endpoints Admin

```typescript
// src/app/api/admin/users/route.ts
import { authorizeAdminRequest } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  // Verificar se usuário é admin
  const session = await authorizeAdminRequest(request);
  
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validar acesso à empresa (se especificada)
    if (companyId) {
      const tenantSession = await authorizeTenantRequest(request, companyId);
      if (tenantSession instanceof NextResponse) {
        return tenantSession;
      }
    }

    // Buscar usuários
    const users = await getUsers({
      companyId: companyId || session.user.companyId,
      page,
      limit,
      role: session.user.role === 'superadmin' ? undefined : 'user' // Admin só vê users
    });

    return Response.json(users);

  } catch (error) {
    logger.error('Admin users fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Verificar se usuário é admin
  const session = await authorizeAdminRequest(request);
  
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { email, name, role, companyId } = await request.json();

    // Validar acesso à empresa
    const targetCompanyId = companyId || session.user.companyId;
    const tenantSession = await authorizeTenantRequest(request, targetCompanyId);
    if (tenantSession instanceof NextResponse) {
      return tenantSession;
    }

    // Validar role (admin não pode criar superadmin)
    if (role === 'superadmin' && session.user.role !== 'superadmin') {
      return Response.json(
        { error: 'Cannot create superadmin user' }, 
        { status: 403 }
      );
    }

    // Criar usuário
    const newUser = await createUser({
      email,
      name,
      role: role || 'user',
      companyId: targetCompanyId
    });

    return Response.json(newUser, { status: 201 });

  } catch (error) {
    logger.error('Admin user creation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. Proteção de Dados Sensíveis

#### Sanitização de Dados

```typescript
// src/lib/security/data-sanitization.ts
export class DataSanitizer {
  static sanitizeUser(user: any): any {
    const sanitized = { ...user };
    
    // Remover campos sensíveis
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.twoFactorSecret;
    delete sanitized.recoveryCodes;
    
    // Mascarar dados sensíveis
    if (sanitized.phoneNumber) {
      sanitized.phoneNumber = this.maskPhoneNumber(sanitized.phoneNumber);
    }
    
    if (sanitized.email && !this.isAdminEmail(sanitized.email)) {
      sanitized.email = this.maskEmail(sanitized.email);
    }
    
    return sanitized;
  }

  static sanitizeSession(session: any): any {
    const sanitized = { ...session };
    
    // Mascarar token de sessão
    if (sanitized.sessionToken) {
      sanitized.sessionToken = this.maskToken(sanitized.sessionToken);
    }
    
    return sanitized;
  }

  static sanitizeWhatsAppAuth(authData: any): any {
    const sanitized = { ...authData };
    
    // Mascarar número de telefone
    if (sanitized.phoneNumber) {
      sanitized.phoneNumber = this.maskPhoneNumber(sanitized.phoneNumber);
    }
    
    // Remover códigos de verificação
    delete sanitized.verificationCode;
    delete sanitized.verificationAttempts;
    
    return sanitized;
  }

  private static maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }

  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 2);
    return `${maskedLocal}@${domain}`;
  }

  private static maskToken(token: string): string {
    return token.substring(0, 8) + '...' + token.substring(token.length - 4);
  }

  private static isAdminEmail(email: string): boolean {
    const adminEmails = [
      'tiago@agenciavibecode.com',
      'fabricio@fabricioleonard.com'
    ];
    return adminEmails.includes(email);
  }
}
```

#### Validação de Input

```typescript
// src/lib/security/input-validation.ts
import { z } from 'zod';

export const ValidationSchemas = {
  // Validação de usuário
  createUser: z.object({
    email: z.string().email().max(255),
    name: z.string().min(2).max(100),
    role: z.enum(['user', 'admin', 'superadmin']),
    companyId: z.string().uuid()
  }),

  // Validação de WhatsApp Auth
  whatsappVerify: z.object({
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    companyId: z.string().uuid(),
    code: z.string().length(6).regex(/^\d+$/)
  }),

  // Validação de CrewAI
  crewaiProcess: z.object({
    message: z.string().min(1).max(10000),
    companyId: z.string().uuid(),
    conversationId: z.string().uuid().optional()
  }),

  // Validação de empresa
  createCompany: z.object({
    name: z.string().min(2).max(100),
    domain: z.string().domain().optional(),
    settings: z.record(z.any()).optional()
  })
};

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Invalid input data',
        error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      );
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 5. Proteção de Rate Limiting

#### Rate Limiting por Role e Endpoint

```typescript
// src/lib/security/rate-limiting.ts
import { Redis } from 'ioredis';
import { auth } from './auth/config';

const redis = new Redis(process.env.REDIS_URL!);

export const RateLimits = {
  // Por role
  [ROLES.SUPERADMIN]: {
    requests: 1000,
    window: 60 // 1 minuto
  },
  [ROLES.ADMIN]: {
    requests: 500,
    window: 60
  },
  [ROLES.USER]: {
    requests: 100,
    window: 60
  },
  
  // Por endpoint específico
  'whatsapp-verify': {
    requests: 3,
    window: 300 // 5 minutos
  },
  'crewai-process': {
    requests: 50,
    window: 60
  },
  'admin-users': {
    requests: 20,
    window: 60
  }
};

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  const ttl = await redis.ttl(key);
  const resetTime = Date.now() + (ttl * 1000);
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetTime
  };
}

export async function checkUserRateLimit(
  userId: string,
  endpoint: string,
  role: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const roleLimit = RateLimits[role as keyof typeof RateLimits];
  const endpointLimit = RateLimits[endpoint as keyof typeof RateLimits];
  
  // Usar o limite mais restritivo
  const limit = endpointLimit ? endpointLimit.requests : roleLimit.requests;
  const window = endpointLimit ? endpointLimit.window : roleLimit.window;
  
  const key = `rate_limit:${userId}:${endpoint}`;
  return await checkRateLimit(key, limit, window);
}
```

### 6. Auditoria e Compliance

#### Sistema de Auditoria

```typescript
// src/lib/security/audit.ts
export class AuditLogger {
  static async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details: any,
    ipAddress: string,
    userAgent: string
  ) {
    await db.insert('audit_logs').values({
      userId,
      action,
      resource,
      details: JSON.stringify(details),
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  }

  static async logAdminAction(
    adminId: string,
    targetUserId: string,
    action: string,
    details: any,
    ipAddress: string
  ) {
    await this.logUserAction(
      adminId,
      `admin:${action}`,
      `user:${targetUserId}`,
      details,
      ipAddress,
      'Admin Panel'
    );
  }

  static async logWhatsAppAuthAction(
    phoneNumber: string,
    action: string,
    success: boolean,
    ipAddress: string
  ) {
    await db.insert('whatsapp_auth_logs').values({
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      action,
      success,
      ipAddress,
      timestamp: new Date()
    });
  }

  private static maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }
}
```

### 7. Configuração de Segurança do Next.js

#### Middleware de Segurança

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function middleware(request: NextRequest) {
  // Headers de segurança
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Verificar autenticação para rotas protegidas
  const protectedPaths = ['/dashboard', '/admin', '/api/admin'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers
      });

      if (!session?.user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Adicionar informações do usuário aos headers
      response.headers.set('X-User-ID', session.user.id);
      response.headers.set('X-User-Role', session.user.role);
      response.headers.set('X-User-Company', session.user.companyId || '');

    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 8. Configuração de Usuários Específicos

#### Script de Inicialização de Usuários

```typescript
// scripts/auth/init-users.ts
import { auth } from '@/lib/auth/config';

export async function initializeUsers() {
  // Criar superadmin
  const superadmin = await auth.api.signUpEmail({
    body: {
      email: 'tiago@agenciavibecode.com',
      password: process.env.SUPERADMIN_PASSWORD!,
      name: 'Tiago Yokoyama'
    }
  });

  if (superadmin.user) {
    // Definir role como superadmin
    await db.update('user')
      .set({ role: 'superadmin' })
      .where(eq('user.id', superadmin.user.id));
    
    console.log('✅ Superadmin created:', superadmin.user.email);
  }

  // Criar admin
  const admin = await auth.api.signUpEmail({
    body: {
      email: 'fabricio@fabricioleonard.com',
      password: process.env.ADMIN_PASSWORD!,
      name: 'Fabricio Leonard'
    }
  });

  if (admin.user) {
    // Definir role como admin
    await db.update('user')
      .set({ role: 'admin' })
      .where(eq('user.id', admin.user.id));
    
    console.log('✅ Admin created:', admin.user.email);
  }

  console.log('🎉 Initial users created successfully!');
}
```

### Benefícios da Estratégia de Segurança

✅ **RBAC Completo**: Controle granular baseado em roles  
✅ **Multi-tenancy**: Isolamento rigoroso por empresa  
✅ **Better Auth**: Sistema de autenticação robusto e moderno  
✅ **Rate Limiting**: Proteção contra abuso por role  
✅ **Auditoria**: Logs completos para compliance  
✅ **Validação**: Sanitização e validação de dados  
✅ **Headers de Segurança**: Proteção contra ataques comuns  
✅ **Usuários Específicos**: Superadmin e admin configurados  

**A estratégia de segurança está completa e pronta para implementação! Próxima seção?**

## Performance

### Estratégia de Otimização e Escalabilidade

A estratégia de performance foi projetada para garantir alta disponibilidade, baixa latência e escalabilidade da arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, otimizando para cenários de alto volume e crescimento.

#### Arquitetura de Performance

```mermaid
graph TD
    A[Load Balancer] --> B[API Gateway]
    B --> C[Application Layer]
    C --> D[Cache Layer]
    C --> E[Database Layer]
    
    subgraph "Application Layer"
        F[WhatsApp Auth Service]
        G[CrewAI Orchestrator]
        H[Background Jobs]
    end
    
    subgraph "Cache Layer"
        I[Redis Cluster]
        J[CDN]
        K[Session Store]
    end
    
    subgraph "Database Layer"
        L[Primary DB]
        M[Read Replicas]
        N[Connection Pool]
    end
    
    subgraph "Monitoring"
        O[Performance Metrics]
        P[Auto-scaling]
        Q[Alerting]
    end
```

### 1. Otimizações de Banco de Dados

#### Estratégia de Indexação

```sql
-- Índices para WhatsApp Auth Performance
CREATE INDEX CONCURRENTLY idx_whatsapp_sessions_lookup 
ON whatsapp_sessions(phone_number, company_id, expires_at) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_whatsapp_sessions_cleanup 
ON whatsapp_sessions(expires_at, is_active) 
WHERE expires_at < NOW() + INTERVAL '1 day';

CREATE INDEX CONCURRENTLY idx_whatsapp_auth_logs_search 
ON whatsapp_auth_logs(phone_number, created_at, success);

-- Índices para CrewAI Performance
CREATE INDEX CONCURRENTLY idx_crews_company_active 
ON crews(company_id, is_active, created_at);

CREATE INDEX CONCURRENTLY idx_crew_agents_active 
ON crew_agents(crew_id, is_active, agent_type);

CREATE INDEX CONCURRENTLY idx_crew_tasks_status 
ON crew_tasks(status, created_at, priority);

CREATE INDEX CONCURRENTLY idx_crew_memories_access 
ON crew_memories(crew_id, memory_type, last_accessed_at);

-- Índices para Performance de Consultas
CREATE INDEX CONCURRENTLY idx_conversations_company_date 
ON conversations(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Índices Compostos para Multi-tenancy
CREATE INDEX CONCURRENTLY idx_users_company_role 
ON users(company_id, role, is_active);

CREATE INDEX CONCURRENTLY idx_companies_active_domain 
ON companies(is_active, domain) WHERE domain IS NOT NULL;
```

#### Configuração de Connection Pooling

```typescript
// src/lib/database/pool-config.ts
import { Pool } from 'pg';

export const createDatabasePool = () => {
  return new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    
    // Configurações de pool otimizadas
    max: 20, // Máximo de conexões
    min: 5,  // Mínimo de conexões
    idleTimeoutMillis: 30000, // 30 segundos
    connectionTimeoutMillis: 2000, // 2 segundos
    
    // Configurações de performance
    statement_timeout: 30000, // 30 segundos
    query_timeout: 25000, // 25 segundos
    application_name: 'falachefe-crewai',
    
    // Configurações de SSL
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
};

// Pool específico para operações de leitura
export const createReadOnlyPool = () => {
  return new Pool({
    host: process.env.READ_REPLICA_HOST || process.env.DATABASE_HOST,
    port: parseInt(process.env.READ_REPLICA_PORT || process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    
    // Pool menor para leitura
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    
    // Configurações específicas para leitura
    statement_timeout: 10000, // 10 segundos
    query_timeout: 8000, // 8 segundos
    application_name: 'falachefe-crewai-readonly'
  });
};
```

#### Otimização de Queries

```typescript
// src/lib/database/query-optimization.ts
export class QueryOptimizer {
  // Cache de queries preparadas
  private static preparedQueries = new Map<string, any>();

  static async executeOptimizedQuery<T>(
    query: string,
    params: any[],
    useCache: boolean = true
  ): Promise<T[]> {
    const cacheKey = `${query}:${JSON.stringify(params)}`;
    
    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const startTime = Date.now();
    
    try {
      // Usar prepared statement se disponível
      let preparedQuery = this.preparedQueries.get(query);
      if (!preparedQuery) {
        preparedQuery = await db.prepare(query);
        this.preparedQueries.set(query, preparedQuery);
      }

      const result = await preparedQuery.execute(params);
      
      // Cache do resultado por 5 minutos
      if (useCache) {
        await redis.setex(cacheKey, 300, JSON.stringify(result));
      }

      // Log de performance
      const executionTime = Date.now() - startTime;
      if (executionTime > 1000) { // Log queries lentas
        logger.warn('Slow query detected', {
          query: query.substring(0, 100),
          executionTime: `${executionTime}ms`,
          params: params.length
        });
      }

      return result;
    } catch (error) {
      logger.error('Query execution failed', { query, params, error });
      throw error;
    }
  }

  // Batch operations para inserções em massa
  static async batchInsert<T>(
    table: string,
    data: T[],
    batchSize: number = 1000
  ): Promise<void> {
    const batches = this.chunkArray(data, batchSize);
    
    for (const batch of batches) {
      await db.query(`
        INSERT INTO ${table} (${Object.keys(batch[0]).join(', ')})
        VALUES ${batch.map((_, i) => 
          `(${Object.keys(batch[0]).map((_, j) => `$${i * Object.keys(batch[0]).length + j + 1}`).join(', ')})`
        ).join(', ')}
      `, batch.flatMap(item => Object.values(item)));
    }
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### 2. Cache Strategy

#### Sistema de Cache Multi-Camada

```typescript
// src/lib/cache/cache-strategy.ts
export class CacheStrategy {
  // Cache L1: In-memory (Node.js)
  private static memoryCache = new Map<string, { value: any; expires: number }>();
  private static readonly MEMORY_CACHE_SIZE = 1000;
  private static readonly MEMORY_CACHE_TTL = 60000; // 1 minuto

  // Cache L2: Redis
  private static redis = new Redis(process.env.REDIS_URL!);

  static async get<T>(key: string): Promise<T | null> {
    // Tentar L1 primeiro
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expires > Date.now()) {
      return memoryEntry.value;
    }

    // Tentar L2 (Redis)
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        
        // Armazenar no L1 por 1 minuto
        this.setMemoryCache(key, parsed, this.MEMORY_CACHE_TTL);
        
        return parsed;
      }
    } catch (error) {
      logger.warn('Redis cache miss', { key, error });
    }

    return null;
  }

  static async set<T>(
    key: string, 
    value: T, 
    ttl: number = 3600, // 1 hora padrão
    options: { useMemory?: boolean; useRedis?: boolean } = {}
  ): Promise<void> {
    const { useMemory = true, useRedis = true } = options;

    // Armazenar no L1
    if (useMemory) {
      this.setMemoryCache(key, value, Math.min(ttl * 1000, this.MEMORY_CACHE_TTL));
    }

    // Armazenar no L2
    if (useRedis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        logger.warn('Redis cache set failed', { key, error });
      }
    }
  }

  private static setMemoryCache(key: string, value: any, ttl: number): void {
    // Implementar LRU se necessário
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  // Cache patterns específicos
  static async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    await this.set(`user_session:${userId}`, sessionData, 86400); // 24 horas
  }

  static async cacheWhatsAppAuth(phoneNumber: string, companyId: string, authData: any): Promise<void> {
    await this.set(`whatsapp_auth:${phoneNumber}:${companyId}`, authData, 300); // 5 minutos
  }

  static async cacheCrewAIResponse(crewId: string, messageHash: string, response: any): Promise<void> {
    await this.set(`crewai_response:${crewId}:${messageHash}`, response, 1800); // 30 minutos
  }

  static async cacheCompanyConfig(companyId: string, config: any): Promise<void> {
    await this.set(`company_config:${companyId}`, config, 3600); // 1 hora
  }
}
```

#### Cache Invalidation Strategy

```typescript
// src/lib/cache/cache-invalidation.ts
export class CacheInvalidation {
  private static redis = new Redis(process.env.REDIS_URL!);

  // Invalidação por padrões
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Cache invalidated', { pattern, keysCount: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error });
    }
  }

  // Invalidação específica por empresa
  static async invalidateCompanyCache(companyId: string): Promise<void> {
    await Promise.all([
      this.invalidatePattern(`company_config:${companyId}`),
      this.invalidatePattern(`crew:*:${companyId}`),
      this.invalidatePattern(`whatsapp_auth:*:${companyId}`),
      this.invalidatePattern(`user_session:*:${companyId}`)
    ]);
  }

  // Invalidação por usuário
  static async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`user_session:${userId}`);
    await this.invalidatePattern(`user_permissions:${userId}`);
  }

  // Invalidação por crew
  static async invalidateCrewCache(crewId: string): Promise<void> {
    await this.invalidatePattern(`crewai_response:${crewId}:*`);
    await this.invalidatePattern(`crew_memory:${crewId}:*`);
  }

  // Invalidação em cascata
  static async invalidateCascade(resourceType: string, resourceId: string): Promise<void> {
    switch (resourceType) {
      case 'company':
        await this.invalidateCompanyCache(resourceId);
        break;
      case 'user':
        await this.invalidateUserCache(resourceId);
        break;
      case 'crew':
        await this.invalidateCrewCache(resourceId);
        break;
      default:
        logger.warn('Unknown resource type for cache invalidation', { resourceType, resourceId });
    }
  }
}
```

### 3. Otimização de APIs

#### API Response Optimization

```typescript
// src/lib/performance/api-optimization.ts
export class APIOptimization {
  // Compressão de resposta
  static async compressResponse(data: any): Promise<Buffer> {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length < 1024) {
      return Buffer.from(jsonString);
    }

    return new Promise((resolve, reject) => {
      zlib.gzip(jsonString, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  // Paginação otimizada
  static async paginateQuery<T>(
    query: string,
    params: any[],
    page: number,
    limit: number,
    orderBy: string = 'created_at',
    orderDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    
    // Query otimizada com COUNT em paralelo
    const [data, countResult] = await Promise.all([
      db.query(`${query} ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, 
        [...params, limit, offset]),
      db.query(`SELECT COUNT(*) as total FROM (${query}) as count_query`, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Lazy loading para relacionamentos
  static async loadRelations<T>(
    entities: T[],
    relations: string[],
    loader: (ids: string[], relation: string) => Promise<any[]>
  ): Promise<T[]> {
    const enrichedEntities = await Promise.all(
      entities.map(async (entity) => {
        const enriched = { ...entity };
        
        for (const relation of relations) {
          if (entity[`${relation}_id`]) {
            const relatedData = await loader([entity[`${relation}_id`]], relation);
            enriched[relation] = relatedData[0];
          }
        }
        
        return enriched;
      })
    );

    return enrichedEntities;
  }

  // Response caching middleware
  static createCacheMiddleware(ttl: number = 300) {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const cacheKey = `api:${req.nextUrl.pathname}:${req.nextUrl.search}`;
      
      // Verificar cache
      const cached = await CacheStrategy.get(cacheKey);
      if (cached) {
        return new NextResponse(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-TTL': ttl.toString()
          }
        });
      }

      // Executar request
      const response = await next();
      
      // Cache da resposta se for sucesso
      if (response.status === 200) {
        const responseData = await response.json();
        await CacheStrategy.set(cacheKey, responseData, ttl);
        
        // Adicionar headers de cache
        response.headers.set('X-Cache', 'MISS');
        response.headers.set('X-Cache-TTL', ttl.toString());
      }

      return response;
    };
  }
}
```

#### Request Batching

```typescript
// src/lib/performance/request-batching.ts
export class RequestBatcher {
  private static batches = new Map<string, {
    requests: Array<{ resolve: Function; reject: Function; data: any }>;
    timer: NodeJS.Timeout;
  }>();

  static async batchRequest<T>(
    batchKey: string,
    data: any,
    batchProcessor: (batchData: any[]) => Promise<T[]>,
    batchSize: number = 10,
    batchTimeout: number = 50 // 50ms
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Verificar se já existe um batch ativo
      let batch = this.batches.get(batchKey);
      
      if (!batch) {
        batch = {
          requests: [],
          timer: setTimeout(async () => {
            await this.processBatch(batchKey, batchProcessor);
          }, batchTimeout)
        };
        this.batches.set(batchKey, batch);
      }

      // Adicionar request ao batch
      batch.requests.push({ resolve, reject, data });

      // Processar batch se atingir o tamanho máximo
      if (batch.requests.length >= batchSize) {
        clearTimeout(batch.timer);
        this.processBatch(batchKey, batchProcessor);
      }
    });
  }

  private static async processBatch<T>(
    batchKey: string,
    batchProcessor: (batchData: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    // Remover batch da lista
    this.batches.delete(batchKey);

    try {
      // Processar todos os requests em lote
      const batchData = batch.requests.map(req => req.data);
      const results = await batchProcessor(batchData);

      // Resolver todos os promises
      batch.requests.forEach((request, index) => {
        if (results[index]) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error('Batch processing failed'));
        }
      });
    } catch (error) {
      // Rejeitar todos os requests em caso de erro
      batch.requests.forEach(request => {
        request.reject(error);
      });
    }
  }

  // Batch específico para consultas de usuários
  static async batchUserLookup(userIds: string[]): Promise<any[]> {
    return this.batchRequest(
      'user_lookup',
      userIds,
      async (batchData: string[][]) => {
        const allUserIds = batchData.flat();
        return await db.query('SELECT * FROM users WHERE id = ANY($1)', [allUserIds]);
      }
    );
  }

  // Batch específico para consultas de empresas
  static async batchCompanyLookup(companyIds: string[]): Promise<any[]> {
    return this.batchRequest(
      'company_lookup',
      companyIds,
      async (batchData: string[][]) => {
        const allCompanyIds = batchData.flat();
        return await db.query('SELECT * FROM companies WHERE id = ANY($1)', [allCompanyIds]);
      }
    );
  }
}
```

### 4. Background Jobs e Queue System

#### Sistema de Queue Otimizado

```typescript
// src/lib/performance/queue-system.ts
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL!);

export class QueueSystem {
  // Queue para processamento WhatsApp
  static whatsappQueue = new Queue('whatsapp-processing', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  });

  // Queue para processamento CrewAI
  static crewaiQueue = new Queue('crewai-processing', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    }
  });

  // Queue para tarefas administrativas
  static adminQueue = new Queue('admin-tasks', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2
    }
  });

  // Adicionar job ao queue
  static async addWhatsAppJob(data: any, options?: any): Promise<void> {
    await this.whatsappQueue.add('process-message', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      ...options
    });
  }

  static async addCrewAIJob(data: any, options?: any): Promise<void> {
    await this.crewaiQueue.add('process-crew', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      ...options
    });
  }

  // Workers para processamento
  static createWorkers(): void {
    // Worker para WhatsApp
    new Worker('whatsapp-processing', async (job: Job) => {
      const { messageData } = job.data;
      
      try {
        await this.processWhatsAppMessage(messageData);
        logger.info('WhatsApp message processed', { jobId: job.id });
      } catch (error) {
        logger.error('WhatsApp processing failed', { jobId: job.id, error });
        throw error;
      }
    }, {
      connection: redis,
      concurrency: 5 // Processar até 5 jobs simultaneamente
    });

    // Worker para CrewAI
    new Worker('crewai-processing', async (job: Job) => {
      const { crewData } = job.data;
      
      try {
        await this.processCrewAITask(crewData);
        logger.info('CrewAI task processed', { jobId: job.id });
      } catch (error) {
        logger.error('CrewAI processing failed', { jobId: job.id, error });
        throw error;
      }
    }, {
      connection: redis,
      concurrency: 3 // Processar até 3 jobs simultaneamente
    });
  }

  private static async processWhatsAppMessage(data: any): Promise<void> {
    // Implementar processamento WhatsApp
    await whatsappAuth.processMessage(data);
  }

  private static async processCrewAITask(data: any): Promise<void> {
    // Implementar processamento CrewAI
    await crewOrchestrator.processTask(data);
  }
}
```

#### Background Job Optimization

```typescript
// src/lib/performance/background-jobs.ts
export class BackgroundJobOptimizer {
  // Job para limpeza de cache
  static async scheduleCacheCleanup(): Promise<void> {
    setInterval(async () => {
      try {
        await CacheInvalidation.invalidatePattern('temp:*');
        await CacheInvalidation.invalidatePattern('session:*');
        logger.info('Cache cleanup completed');
      } catch (error) {
        logger.error('Cache cleanup failed', { error });
      }
    }, 300000); // A cada 5 minutos
  }

  // Job para limpeza de sessões expiradas
  static async scheduleSessionCleanup(): Promise<void> {
    setInterval(async () => {
      try {
        const result = await db.query(`
          DELETE FROM whatsapp_sessions 
          WHERE expires_at < NOW() 
          AND last_used_at < NOW() - INTERVAL '7 days'
        `);
        
        logger.info('Session cleanup completed', { 
          deletedCount: result.rowCount 
        });
      } catch (error) {
        logger.error('Session cleanup failed', { error });
      }
    }, 3600000); // A cada hora
  }

  // Job para otimização de métricas
  static async scheduleMetricsAggregation(): Promise<void> {
    setInterval(async () => {
      try {
        await this.aggregateMetrics();
        logger.info('Metrics aggregation completed');
      } catch (error) {
        logger.error('Metrics aggregation failed', { error });
      }
    }, 300000); // A cada 5 minutos
  }

  private static async aggregateMetrics(): Promise<void> {
    // Agregar métricas de performance
    const metrics = await db.query(`
      SELECT 
        company_id,
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        DATE_TRUNC('hour', created_at) as hour
      FROM performance_metrics 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY company_id, hour
    `);

    // Armazenar métricas agregadas
    for (const metric of metrics.rows) {
      await CacheStrategy.set(
        `metrics:${metric.company_id}:${metric.hour}`,
        metric,
        86400 // 24 horas
      );
    }
  }

  // Job para backup de dados críticos
  static async scheduleDataBackup(): Promise<void> {
    setInterval(async () => {
      try {
        await this.backupCriticalData();
        logger.info('Data backup completed');
      } catch (error) {
        logger.error('Data backup failed', { error });
      }
    }, 86400000); // A cada 24 horas
  }

  private static async backupCriticalData(): Promise<void> {
    // Backup de configurações de empresas
    const companyConfigs = await db.query(`
      SELECT id, name, settings, created_at 
      FROM companies 
      WHERE is_active = true
    `);

    await CacheStrategy.set('backup:company_configs', companyConfigs.rows, 604800); // 7 dias

    // Backup de configurações CrewAI
    const crewConfigs = await db.query(`
      SELECT id, name, configuration, company_id 
      FROM crews 
      WHERE is_active = true
    `);

    await CacheStrategy.set('backup:crew_configs', crewConfigs.rows, 604800); // 7 dias
  }
}
```

### 5. CDN e Asset Optimization

#### CDN Configuration

```typescript
// src/lib/performance/cdn-config.ts
export class CDNOptimizer {
  private static cloudflare = new CloudflareAPI({
    apiToken: process.env.CLOUDFLARE_API_TOKEN!
  });

  // Configurar cache rules
  static async configureCacheRules(): Promise<void> {
    const cacheRules = [
      {
        url: 'api/whatsapp/*',
        ttl: 300, // 5 minutos
        browserTtl: 60 // 1 minuto no browser
      },
      {
        url: 'api/crewai/*',
        ttl: 600, // 10 minutos
        browserTtl: 120 // 2 minutos no browser
      },
      {
        url: 'api/admin/*',
        ttl: 0, // Sem cache
        browserTtl: 0
      },
      {
        url: 'static/*',
        ttl: 86400, // 24 horas
        browserTtl: 3600 // 1 hora no browser
      }
    ];

    for (const rule of cacheRules) {
      await this.cloudflare.pageRules.create({
        zone_id: process.env.CLOUDFLARE_ZONE_ID!,
        targets: [{ target: 'url', constraint: { operator: 'matches', value: rule.url } }],
        actions: [
          { id: 'cache_level', value: 'cache_everything' },
          { id: 'edge_cache_ttl', value: rule.ttl },
          { id: 'browser_cache_ttl', value: rule.browserTtl }
        ]
      });
    }
  }

  // Purge cache por padrão
  static async purgeCache(pattern: string): Promise<void> {
    try {
      await this.cloudflare.zones.purgeCache(process.env.CLOUDFLARE_ZONE_ID!, {
        files: [pattern]
      });
      logger.info('CDN cache purged', { pattern });
    } catch (error) {
      logger.error('CDN cache purge failed', { pattern, error });
    }
  }

  // Otimização de imagens
  static getOptimizedImageUrl(originalUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): string {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);

    return `${originalUrl}?${params.toString()}`;
  }
}
```

### 6. Database Performance Monitoring

#### Query Performance Monitoring

```typescript
// src/lib/performance/query-monitoring.ts
export class QueryMonitor {
  private static slowQueries = new Map<string, number>();
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 segundo

  static async monitorQuery<T>(
    query: string,
    params: any[],
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const queryHash = this.hashQuery(query, params);

    try {
      const result = await executor();
      const executionTime = Date.now() - startTime;

      // Log queries lentas
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        this.logSlowQuery(query, params, executionTime);
        this.slowQueries.set(queryHash, executionTime);
      }

      // Métricas de performance
      await this.recordQueryMetrics(queryHash, executionTime, true);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.recordQueryMetrics(queryHash, executionTime, false);
      throw error;
    }
  }

  private static hashQuery(query: string, params: any[]): string {
    // Normalizar query removendo valores específicos
    const normalizedQuery = query.replace(/\$\d+/g, '$?');
    return crypto.createHash('md5').update(normalizedQuery + params.length).digest('hex');
  }

  private static logSlowQuery(query: string, params: any[], executionTime: number): void {
    logger.warn('Slow query detected', {
      query: query.substring(0, 200),
      params: params.length,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString()
    });
  }

  private static async recordQueryMetrics(
    queryHash: string,
    executionTime: number,
    success: boolean
  ): Promise<void> {
    await db.query(`
      INSERT INTO query_performance_metrics (
        query_hash,
        execution_time,
        success,
        timestamp
      ) VALUES ($1, $2, $3, $4)
    `, [queryHash, executionTime, success, new Date()]);
  }

  // Relatório de performance
  static async getPerformanceReport(): Promise<any> {
    const report = await db.query(`
      SELECT 
        query_hash,
        COUNT(*) as total_queries,
        AVG(execution_time) as avg_execution_time,
        MAX(execution_time) as max_execution_time,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_queries,
        SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed_queries
      FROM query_performance_metrics 
      WHERE timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY query_hash
      ORDER BY avg_execution_time DESC
      LIMIT 10
    `);

    return report.rows;
  }
}
```

### 7. Auto-scaling e Load Balancing

#### Auto-scaling Configuration

```typescript
// src/lib/performance/auto-scaling.ts
export class AutoScaling {
  private static readonly SCALE_UP_THRESHOLD = 80; // 80% CPU
  private static readonly SCALE_DOWN_THRESHOLD = 20; // 20% CPU
  private static readonly MIN_INSTANCES = 2;
  private static readonly MAX_INSTANCES = 10;

  static async checkScalingNeeds(): Promise<void> {
    const metrics = await this.getSystemMetrics();
    
    if (metrics.cpuUsage > this.SCALE_UP_THRESHOLD) {
      await this.scaleUp();
    } else if (metrics.cpuUsage < this.SCALE_DOWN_THRESHOLD) {
      await this.scaleDown();
    }
  }

  private static async getSystemMetrics(): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    requestRate: number;
  }> {
    // Obter métricas do sistema
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const requestRate = await this.getRequestRate();

    return { cpuUsage, memoryUsage, requestRate };
  }

  private static async scaleUp(): Promise<void> {
    const currentInstances = await this.getCurrentInstanceCount();
    
    if (currentInstances < this.MAX_INSTANCES) {
      await this.deployNewInstance();
      logger.info('Scaling up', { newInstanceCount: currentInstances + 1 });
    }
  }

  private static async scaleDown(): Promise<void> {
    const currentInstances = await this.getCurrentInstanceCount();
    
    if (currentInstances > this.MIN_INSTANCES) {
      await this.removeInstance();
      logger.info('Scaling down', { newInstanceCount: currentInstances - 1 });
    }
  }

  private static async getCPUUsage(): Promise<number> {
    // Implementar obtenção de CPU usage
    return 0;
  }

  private static async getMemoryUsage(): Promise<number> {
    // Implementar obtenção de memory usage
    return 0;
  }

  private static async getRequestRate(): Promise<number> {
    // Implementar obtenção de request rate
    return 0;
  }

  private static async getCurrentInstanceCount(): Promise<number> {
    // Implementar obtenção de instance count
    return 0;
  }

  private static async deployNewInstance(): Promise<void> {
    // Implementar deploy de nova instância
  }

  private static async removeInstance(): Promise<void> {
    // Implementar remoção de instância
  }
}
```

### Benefícios da Estratégia de Performance

✅ **Database Optimization**: Índices otimizados e connection pooling  
✅ **Cache Strategy**: Multi-camada com invalidação inteligente  
✅ **API Optimization**: Compressão, paginação e batching  
✅ **Background Jobs**: Processamento assíncrono com queues  
✅ **CDN Integration**: Cache distribuído e otimização de assets  
✅ **Query Monitoring**: Detecção de queries lentas  
✅ **Auto-scaling**: Escalabilidade automática baseada em métricas  
✅ **Performance Metrics**: Monitoramento contínuo de performance  

**A estratégia de performance está completa e pronta para implementação! Próxima seção?**

## Testing Strategy

### Estratégia Abrangente de Testes

A estratégia de testes foi projetada para garantir qualidade, confiabilidade e robustez da arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, cobrindo todos os níveis e cenários críticos.

#### Pirâmide de Testes

```mermaid
graph TD
    A[E2E Tests] --> B[Integration Tests]
    B --> C[Unit Tests]
    
    subgraph "E2E Tests"
        D[WhatsApp Auth Flow]
        E[CrewAI Workflow]
        F[Multi-tenant Scenarios]
    end
    
    subgraph "Integration Tests"
        G[API Integration]
        H[Database Integration]
        I[External Services]
    end
    
    subgraph "Unit Tests"
        J[Auth Logic]
        K[CrewAI Components]
        L[Business Logic]
    end
    
    subgraph "Test Types"
        M[Functional Tests]
        N[Performance Tests]
        O[Security Tests]
        P[Load Tests]
    end
```

### 1. Testes Unitários

#### Configuração Jest para CrewAI

```typescript
// jest.config.crewai.js
module.exports = {
  displayName: 'CrewAI Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lib/crewai'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/lib/crewai/**/*.ts',
    '!src/lib/crewai/**/*.d.ts',
    '!src/lib/crewai/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.crewai.js']
};
```

#### Testes de Autenticação WhatsApp

```typescript
// src/lib/auth/__tests__/whatsapp-auth.test.ts
import { WhatsAppAuthService } from '../whatsapp-auth';
import { Redis } from 'ioredis';
import { db } from '../../database';

jest.mock('ioredis');
jest.mock('../../database');

describe('WhatsAppAuthService', () => {
  let authService: WhatsAppAuthService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    authService = new WhatsAppAuthService(mockRedis);
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid phone number', async () => {
      // Arrange
      const phoneNumber = '+5511999999999';
      const companyId = 'company-123';
      const mockUser = {
        id: 'user-123',
        phoneNumber,
        companyId,
        name: 'Test User'
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Act
      const result = await authService.authenticateUser(phoneNumber, companyId);

      // Assert
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.authMethod).toBe('phone_number');
    });

    it('should generate verification code for unknown user', async () => {
      // Arrange
      const phoneNumber = '+5511888888888';
      const companyId = 'company-123';

      db.query.mockResolvedValueOnce({ rows: [] });
      mockRedis.setex.mockResolvedValueOnce('OK');

      // Act
      const result = await authService.authenticateUser(phoneNumber, companyId);

      // Assert
      expect(result.authenticated).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.verificationCode).toHaveLength(6);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `verify:${phoneNumber}:${companyId}`,
        300,
        expect.any(String)
      );
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const phoneNumber = '+5511777777777';
      const companyId = 'company-123';

      mockRedis.get.mockResolvedValueOnce('5'); // Rate limit exceeded

      // Act & Assert
      await expect(
        authService.authenticateUser(phoneNumber, companyId)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('verifyCode', () => {
    it('should verify correct code', async () => {
      // Arrange
      const phoneNumber = '+5511666666666';
      const companyId = 'company-123';
      const code = '123456';

      mockRedis.get.mockResolvedValueOnce(code);

      // Act
      const result = await authService.verifyCode(phoneNumber, companyId, code);

      // Assert
      expect(result.verified).toBe(true);
      expect(result.sessionToken).toBeDefined();
    });

    it('should reject incorrect code', async () => {
      // Arrange
      const phoneNumber = '+5511555555555';
      const companyId = 'company-123';
      const code = '123456';

      mockRedis.get.mockResolvedValueOnce('654321'); // Different code

      // Act
      const result = await authService.verifyCode(phoneNumber, companyId, code);

      // Assert
      expect(result.verified).toBe(false);
    });
  });
});
```

#### Testes do Sistema CrewAI

```typescript
// src/lib/crewai/__tests__/crew-orchestrator.test.ts
import { CrewOrchestrator } from '../crew-orchestrator';
import { CrewAI } from 'crewai';
import { db } from '../../database';

jest.mock('crewai');
jest.mock('../../database');

describe('CrewOrchestrator', () => {
  let orchestrator: CrewOrchestrator;
  let mockCrewAI: jest.Mocked<CrewAI>;

  beforeEach(() => {
    mockCrewAI = new CrewAI() as jest.Mocked<CrewAI>;
    orchestrator = new CrewOrchestrator(mockCrewAI);
  });

  describe('processMessage', () => {
    it('should process message through crew', async () => {
      // Arrange
      const messageData = {
        message: 'Hello, I need help with my order',
        userId: 'user-123',
        companyId: 'company-123',
        conversationId: 'conv-123'
      };

      const mockCrew = {
        kickoff: jest.fn().mockResolvedValue({
          result: 'I can help you with your order',
          agent: 'customer_service'
        })
      };

      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 'crew-123', configuration: {} }] 
      });
      mockCrewAI.createCrew.mockReturnValue(mockCrew);

      // Act
      const result = await orchestrator.processMessage(messageData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.response).toBe('I can help you with your order');
      expect(result.agent).toBe('customer_service');
    });

    it('should handle crew creation failure', async () => {
      // Arrange
      const messageData = {
        message: 'Hello',
        userId: 'user-123',
        companyId: 'company-123'
      };

      db.query.mockRejectedValueOnce(new Error('Database error'));

      // Act & Assert
      await expect(orchestrator.processMessage(messageData))
        .rejects.toThrow('Database error');
    });

    it('should handle agent handoff', async () => {
      // Arrange
      const messageData = {
        message: 'I want to speak to a manager',
        userId: 'user-123',
        companyId: 'company-123'
      };

      const mockCrew = {
        kickoff: jest.fn().mockResolvedValue({
          result: 'Transferring you to a manager',
          agent: 'manager',
          handoff: true
        })
      };

      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 'crew-123', configuration: {} }] 
      });
      mockCrewAI.createCrew.mockReturnValue(mockCrew);

      // Act
      const result = await orchestrator.processMessage(messageData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.handoff).toBe(true);
      expect(result.agent).toBe('manager');
    });
  });
});
```

### 2. Testes de Integração

#### Configuração de Testes de Integração

```typescript
// jest.config.integration.js
module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  testTimeout: 30000,
  maxWorkers: 1 // Run integration tests sequentially
};
```

#### Testes de API Integration

```typescript
// tests/integration/api/whatsapp-auth.integration.test.ts
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/whatsapp/verify/route';
import { db } from '@/lib/database';
import { redis } from '@/lib/redis';

describe('/api/auth/whatsapp/verify', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM whatsapp_sessions WHERE phone_number LIKE \'+5511%\'');
    await redis.flushdb();
  });

  afterAll(async () => {
    await db.query('DELETE FROM whatsapp_sessions WHERE phone_number LIKE \'+5511%\'');
    await redis.flushdb();
  });

  it('should verify WhatsApp authentication', async () => {
    // Arrange
    const phoneNumber = '+5511999999999';
    const companyId = 'company-123';
    const code = '123456';

    // Store verification code
    await redis.setex(`verify:${phoneNumber}:${companyId}`, 300, code);

    const request = new NextRequest('http://localhost:3000/api/auth/whatsapp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        companyId,
        code
      })
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.authenticated).toBe(true);
    expect(data.sessionToken).toBeDefined();
  });

  it('should reject invalid verification code', async () => {
    // Arrange
    const phoneNumber = '+5511888888888';
    const companyId = 'company-123';
    const code = '123456';

    // Store different code
    await redis.setex(`verify:${phoneNumber}:${companyId}`, 300, '654321');

    const request = new NextRequest('http://localhost:3000/api/auth/whatsapp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        companyId,
        code
      })
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.authenticated).toBe(false);
  });
});
```

#### Testes de Database Integration

```typescript
// tests/integration/database/crewai.integration.test.ts
import { db } from '@/lib/database';
import { CrewService } from '@/lib/crewai/crew-service';

describe('CrewAI Database Integration', () => {
  let crewService: CrewService;

  beforeEach(() => {
    crewService = new CrewService(db);
  });

  it('should create and retrieve crew', async () => {
    // Arrange
    const crewData = {
      name: 'Test Crew',
      companyId: 'company-123',
      configuration: {
        agents: ['customer_service', 'sales'],
        tasks: ['handle_inquiry', 'process_order']
      }
    };

    // Act
    const createdCrew = await crewService.createCrew(crewData);
    const retrievedCrew = await crewService.getCrew(createdCrew.id);

    // Assert
    expect(createdCrew.name).toBe(crewData.name);
    expect(createdCrew.companyId).toBe(crewData.companyId);
    expect(retrievedCrew).toEqual(createdCrew);
  });

  it('should handle multi-tenant isolation', async () => {
    // Arrange
    const crew1 = {
      name: 'Crew 1',
      companyId: 'company-1',
      configuration: {}
    };

    const crew2 = {
      name: 'Crew 2',
      companyId: 'company-2',
      configuration: {}
    };

    // Act
    const createdCrew1 = await crewService.createCrew(crew1);
    const createdCrew2 = await crewService.createCrew(crew2);

    const company1Crews = await crewService.getCrewsByCompany('company-1');
    const company2Crews = await crewService.getCrewsByCompany('company-2');

    // Assert
    expect(company1Crews).toHaveLength(1);
    expect(company1Crews[0].id).toBe(createdCrew1.id);
    expect(company2Crews).toHaveLength(1);
    expect(company2Crews[0].id).toBe(createdCrew2.id);
  });
});
```

### 3. Testes End-to-End

#### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Testes E2E WhatsApp Auth Flow

```typescript
// tests/e2e/whatsapp-auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('WhatsApp Authentication Flow', () => {
  test('should complete WhatsApp authentication flow', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Enter phone number
    await page.fill('[data-testid="phone-input"]', '+5511999999999');
    await page.click('[data-testid="send-code-button"]');

    // Assert - Verification code form appears
    await expect(page.locator('[data-testid="verification-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-display"]')).toContainText('+5511999999999');

    // Act - Enter verification code
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="verify-button"]');

    // Assert - Success redirect
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle invalid verification code', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act
    await page.fill('[data-testid="phone-input"]', '+5511888888888');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '000000');
    await page.click('[data-testid="verify-button"]');

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid verification code');
  });

  test('should handle rate limiting', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Multiple rapid requests
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="phone-input"]', '+5511777777777');
      await page.click('[data-testid="send-code-button"]');
      await page.waitForTimeout(100);
    }

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Rate limit exceeded');
  });
});
```

#### Testes E2E CrewAI Workflow

```typescript
// tests/e2e/crewai-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CrewAI Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/whatsapp');
    await page.fill('[data-testid="phone-input"]', '+5511999999999');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="verify-button"]');
  });

  test('should process message through CrewAI', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Send message
    await page.fill('[data-testid="message-input"]', 'I need help with my order #12345');
    await page.click('[data-testid="send-button"]');

    // Assert - Message appears in chat
    await expect(page.locator('[data-testid="message-list"]')).toContainText('I need help with my order #12345');

    // Assert - AI response appears
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-indicator"]')).toContainText('Customer Service Agent');
  });

  test('should handle agent handoff', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Request manager
    await page.fill('[data-testid="message-input"]', 'I want to speak to a manager');
    await page.click('[data-testid="send-button"]');

    // Assert - Handoff occurs
    await expect(page.locator('[data-testid="agent-indicator"]')).toContainText('Manager');
    await expect(page.locator('[data-testid="handoff-notification"]')).toBeVisible();
  });

  test('should maintain conversation context', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Multi-turn conversation
    await page.fill('[data-testid="message-input"]', 'My order is delayed');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-response"]');

    await page.fill('[data-testid="message-input"]', 'What is the new delivery date?');
    await page.click('[data-testid="send-button"]');

    // Assert - Context maintained
    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText('order');
  });
});
```

### 4. Testes de Performance

#### Configuração K6

```javascript
// tests/performance/whatsapp-auth-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test WhatsApp auth endpoint
  const phoneNumber = `+5511${Math.floor(Math.random() * 100000000)}`;
  const companyId = 'company-123';

  let response = http.post('http://localhost:3000/api/auth/whatsapp/send-code', {
    phoneNumber,
    companyId
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

#### Testes de Load CrewAI

```javascript
// tests/performance/crewai-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

export default function () {
  // Test CrewAI processing endpoint
  const message = `Test message ${Math.random()}`;
  const userId = 'user-123';
  const companyId = 'company-123';

  let response = http.post('http://localhost:3000/api/crewai/process', {
    message,
    userId,
    companyId
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
    'has response': (r) => JSON.parse(r.body).response !== undefined,
  });

  sleep(2);
}
```

### 5. Testes de Segurança

#### Configuração OWASP ZAP

```yaml
# tests/security/zap-config.yml
api:
  key: "your-zap-api-key"
  baseurl: "http://localhost:3000"

scanner:
  spider:
    maxdepth: 5
    threads: 5
  
  active:
    threads: 5
    delay: 100
  
  passive:
    enabled: true

targets:
  - "http://localhost:3000/api/auth/whatsapp"
  - "http://localhost:3000/api/crewai/process"
  - "http://localhost:3000/api/admin"

reports:
  - format: "json"
    output: "security-report.json"
  - format: "html"
    output: "security-report.html"
```

#### Testes de Segurança Customizados

```typescript
// tests/security/security.test.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent SQL injection in WhatsApp auth', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Attempt SQL injection
    await page.fill('[data-testid="phone-input"]', "'; DROP TABLE users; --");
    await page.click('[data-testid="send-code-button"]');

    // Assert - Should handle gracefully
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should enforce rate limiting', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Rapid requests
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="phone-input"]', '+5511111111111');
      await page.click('[data-testid="send-code-button"]');
      await page.waitForTimeout(50);
    }

    // Assert
    await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Invalid phone numbers
    const invalidPhones = ['123', 'abc', '+999999999999999'];

    for (const phone of invalidPhones) {
      await page.fill('[data-testid="phone-input"]', phone);
      await page.click('[data-testid="send-code-button"]');
      
      // Assert
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid phone number');
    }
  });

  test('should enforce HTTPS in production', async ({ page, context }) => {
    // Arrange - Set production environment
    await context.addCookies([{
      name: 'NODE_ENV',
      value: 'production',
      domain: 'localhost',
      path: '/'
    }]);

    // Act
    await page.goto('http://localhost:3000/auth/whatsapp');

    // Assert - Should redirect to HTTPS
    expect(page.url()).toMatch(/^https:/);
  });
});
```

### 6. Testes de Acessibilidade

#### Configuração Axe

```typescript
// tests/accessibility/accessibility.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have accessibility violations on WhatsApp auth page', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act & Assert
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('+5511999999999');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Assert
    await expect(page.locator('[data-testid="verification-form"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Assert
    await expect(page.locator('[data-testid="phone-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="send-code-button"]')).toHaveAttribute('aria-label');
  });
});
```

### 7. CI/CD Pipeline de Testes

#### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: falachefe_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/falachefe_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: production
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run performance tests
        run: k6 run tests/performance/whatsapp-auth-load.js
      
      - name: Run CrewAI performance tests
        run: k6 run tests/performance/crewai-load.js
```

### 8. Scripts de Teste

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config jest.config.js",
    "test:crewai": "jest --config jest.config.crewai.js",
    "test:integration": "jest --config jest.config.integration.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:security": "zap-baseline.py -t http://localhost:3000",
    "test:accessibility": "playwright test tests/accessibility/",
    "test:performance": "k6 run tests/performance/",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### Benefícios da Estratégia de Testes

✅ **Cobertura Completa**: Unit, Integration, E2E e Performance  
✅ **Qualidade Garantida**: Testes automatizados em CI/CD  
✅ **Segurança**: Testes de segurança e vulnerabilidades  
✅ **Acessibilidade**: Conformidade com padrões de acessibilidade  
✅ **Performance**: Testes de carga e stress  
✅ **Multi-tenant**: Testes de isolamento por empresa  
✅ **WhatsApp Auth**: Cobertura completa do fluxo de autenticação  
✅ **CrewAI**: Testes de orquestração e handoff de agentes  

**A estratégia de testes está completa e pronta para implementação! Próxima seção?**

## Development Workflow

### Fluxo de Desenvolvimento Completo

O fluxo de desenvolvimento foi projetado para garantir produtividade, qualidade e colaboração eficiente na arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, seguindo as melhores práticas de DevOps e desenvolvimento ágil.

#### Fluxo de Desenvolvimento

```mermaid
graph TD
    A[Feature Request] --> B[Planning]
    B --> C[Development]
    C --> D[Testing]
    D --> E[Code Review]
    E --> F[Deployment]
    F --> G[Monitoring]
    
    subgraph "Development Environment"
        H[Local Setup]
        I[Feature Branch]
        J[Hot Reload]
        K[Debug Tools]
    end
    
    subgraph "Testing Pipeline"
        L[Unit Tests]
        M[Integration Tests]
        N[E2E Tests]
        O[Security Tests]
    end
    
    subgraph "Deployment Pipeline"
        P[Staging]
        Q[Production]
        R[Rollback]
        S[Health Checks]
    end
    
    subgraph "Monitoring & Feedback"
        T[Performance Metrics]
        U[Error Tracking]
        V[User Feedback]
        W[Analytics]
    end
```

### 1. Configuração do Ambiente de Desenvolvimento

#### Setup Inicial

```bash
# scripts/setup-dev.sh
#!/bin/bash

echo "🚀 Setting up Falachefe CrewAI Development Environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "📝 Please update .env.local with your configuration"
fi

# Setup database
echo "🗄️ Setting up database..."
pnpm run db:setup:dev

# Setup Redis
echo "🔴 Setting up Redis..."
pnpm run redis:setup:dev

# Run initial migrations
echo "🔄 Running database migrations..."
pnpm run db:migrate:dev

# Seed development data
echo "🌱 Seeding development data..."
pnpm run db:seed:dev

# Setup pre-commit hooks
echo "🪝 Setting up pre-commit hooks..."
pnpm run husky:install

echo "🎉 Development environment setup complete!"
echo "📖 Run 'pnpm run dev' to start the development server"
```

#### Configuração Docker para Desenvolvimento

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: falachefe-postgres-dev
    environment:
      POSTGRES_DB: falachefe_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/database/init-dev.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: falachefe-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: falachefe-jaeger-dev
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  prometheus:
    image: prom/prometheus:latest
    container_name: falachefe-prometheus-dev
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus-dev.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

volumes:
  postgres_dev_data:
  redis_dev_data:
```

#### Scripts de Desenvolvimento

```json
// package.json - Scripts de desenvolvimento
{
  "scripts": {
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:docker": "docker-compose -f docker-compose.dev.yml up -d && pnpm run dev",
    "dev:clean": "pnpm run db:clean:dev && pnpm run redis:clean:dev && pnpm run dev",
    
    "db:setup:dev": "pnpm run db:create:dev && pnpm run db:migrate:dev && pnpm run db:seed:dev",
    "db:create:dev": "createdb falachefe_dev || true",
    "db:migrate:dev": "drizzle-kit migrate",
    "db:seed:dev": "tsx scripts/database/seed-dev.ts",
    "db:clean:dev": "dropdb falachefe_dev && pnpm run db:create:dev",
    "db:reset:dev": "pnpm run db:clean:dev && pnpm run db:migrate:dev && pnpm run db:seed:dev",
    
    "redis:setup:dev": "redis-server --daemonize yes || true",
    "redis:clean:dev": "redis-cli flushdb",
    
    "test:dev": "jest --watch",
    "test:dev:crewai": "jest --config jest.config.crewai.js --watch",
    "test:dev:integration": "jest --config jest.config.integration.js --watch",
    
    "lint:dev": "eslint . --ext .ts,.tsx --fix",
    "typecheck:dev": "tsc --noEmit --incremental",
    "format:dev": "prettier --write .",
    
    "storybook:dev": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

### 2. Git Workflow e Branching Strategy

#### Git Flow Configuration

```bash
# .gitflow-config
[gitflow "branch"]
    master = main
    develop = develop
    feature = feature/
    release = release/
    hotfix = hotfix/
    support = support/
    versiontag = v

[gitflow "prefix"]
    feature = feature/
    release = release/
    hotfix = hotfix/
    support = support/
    versiontag = v
```

#### Branching Strategy

```mermaid
graph TD
    A[main] --> B[develop]
    B --> C[feature/whatsapp-auth]
    B --> D[feature/crewai-integration]
    B --> E[feature/admin-panel]
    B --> F[release/v1.0.0]
    A --> G[hotfix/critical-bug]
    
    C --> H[PR to develop]
    D --> I[PR to develop]
    E --> J[PR to develop]
    F --> K[PR to main]
    G --> L[PR to main]
    
    subgraph "Feature Development"
        M[Create Feature Branch]
        N[Develop Feature]
        O[Write Tests]
        P[Create PR]
        Q[Code Review]
        R[Merge to Develop]
    end
    
    subgraph "Release Process"
        S[Create Release Branch]
        T[Final Testing]
        U[Deploy to Staging]
        V[Deploy to Production]
        W[Tag Release]
    end
```

#### Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
echo "🔍 Running ESLint..."
pnpm run lint:dev

# Run type checking
echo "🔍 Running TypeScript check..."
pnpm run typecheck:dev

# Run formatting
echo "🎨 Running Prettier..."
pnpm run format:dev

# Run unit tests for changed files
echo "🧪 Running unit tests..."
pnpm run test:unit:changed

# Check for sensitive data
echo "🔒 Checking for sensitive data..."
pnpm run security:check

echo "✅ Pre-commit checks passed!"
```

### 3. Code Quality e Standards

#### ESLint Configuration

```javascript
// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ),
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React specific rules
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      
      // General rules
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      
      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],
      
      // CrewAI specific rules
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message: "Use absolute imports instead of relative imports",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
```

#### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "proseWrap": "preserve"
}
```

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/services/*": ["./src/services/*"],
      "@/agents/*": ["./src/agents/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", ".next", "dist", "build"]
}
```

### 4. Development Tools

#### VSCode Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/build": true,
    "**/coverage": true
  },
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true
  },
  "jest.jestCommandLine": "pnpm test",
  "jest.autoRun": {
    "watch": true,
    "onSave": "test-file"
  }
}
```

#### VSCode Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-azuretools.vscode-docker",
    "ms-vscode.vscode-github-pullrequest",
    "github.vscode-pull-request-github",
    "ms-vscode.vscode-jest",
    "firsttris.vscode-jest-runner",
    "ms-playwright.playwright",
    "ms-vscode.vscode-jest",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug CrewAI Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--config", "jest.config.crewai.js", "--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 5. CI/CD Pipeline

#### GitHub Actions - Development

```yaml
# .github/workflows/development.yml
name: Development Pipeline

on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint code
        run: pnpm run lint:dev
      
      - name: Type check
        run: pnpm run typecheck:dev
      
      - name: Format check
        run: pnpm run format:dev --check
      
      - name: Security audit
        run: pnpm audit --audit-level moderate

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: falachefe_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run database migrations
        run: pnpm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/falachefe_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: pnpm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [quality-checks, unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm run build
        env:
          NEXT_PUBLIC_APP_URL: https://dev.falachefe.com
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/
```

#### GitHub Actions - Staging

```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm run build
        env:
          NEXT_PUBLIC_APP_URL: https://staging.falachefe.com
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
      
      - name: Run E2E tests against staging
        run: pnpm run test:e2e:staging
        env:
          BASE_URL: https://staging.falachefe.com
      
      - name: Health check
        run: |
          curl -f https://staging.falachefe.com/api/health || exit 1
```

### 6. Monitoring de Desenvolvimento

#### Development Metrics

```typescript
// src/lib/monitoring/dev-metrics.ts
export class DevMetrics {
  private static metrics = {
    buildTime: 0,
    testTime: 0,
    deployTime: 0,
    errorCount: 0,
    warningCount: 0
  };

  static recordBuildTime(startTime: number) {
    this.metrics.buildTime = Date.now() - startTime;
    console.log(`🏗️ Build completed in ${this.metrics.buildTime}ms`);
  }

  static recordTestTime(startTime: number) {
    this.metrics.testTime = Date.now() - startTime;
    console.log(`🧪 Tests completed in ${this.metrics.testTime}ms`);
  }

  static recordDeployTime(startTime: number) {
    this.metrics.deployTime = Date.now() - startTime;
    console.log(`🚀 Deploy completed in ${this.metrics.deployTime}ms`);
  }

  static recordError(error: Error) {
    this.metrics.errorCount++;
    console.error(`❌ Error: ${error.message}`);
  }

  static recordWarning(warning: string) {
    this.metrics.warningCount++;
    console.warn(`⚠️ Warning: ${warning}`);
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    this.metrics = {
      buildTime: 0,
      testTime: 0,
      deployTime: 0,
      errorCount: 0,
      warningCount: 0
    };
  }
}
```

#### Development Dashboard

```typescript
// src/app/dev/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { DevMetrics } from '@/lib/monitoring/dev-metrics';

export default function DevDashboard() {
  const [metrics, setMetrics] = useState(DevMetrics.getMetrics());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(DevMetrics.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Development Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Build Time</h3>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.buildTime}ms
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Test Time</h3>
          <p className="text-2xl font-bold text-green-600">
            {metrics.testTime}ms
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Errors</h3>
          <p className="text-2xl font-bold text-red-600">
            {metrics.errorCount}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Warnings</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {metrics.warningCount}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 7. Documentação de Desenvolvimento

#### README de Desenvolvimento

```markdown
# Falachefe CrewAI - Guia de Desenvolvimento

## 🚀 Quick Start

```bash
# Clone o repositório
git clone https://github.com/your-org/falachefe-crewai.git
cd falachefe-crewai

# Instale dependências
pnpm install

# Configure ambiente
cp .env.example .env.local

# Inicie o ambiente de desenvolvimento
pnpm run dev:docker

# Acesse a aplicação
open http://localhost:3000
```

## 🏗️ Arquitetura

### Estrutura do Projeto
```
src/
├── app/                 # Next.js App Router
├── components/          # Componentes React
├── lib/                 # Utilitários e configurações
│   ├── auth/           # Autenticação WhatsApp
│   ├── crewai/         # Sistema CrewAI
│   ├── database/       # Configuração do banco
│   └── monitoring/     # Métricas e logs
├── agents/             # Agentes CrewAI
└── types/              # Definições TypeScript
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
pnpm test

# Testes unitários
pnpm test:unit

# Testes de integração
pnpm test:integration

# Testes E2E
pnpm test:e2e

# Testes com coverage
pnpm test:coverage
```

## 🔧 Desenvolvimento

### Comandos Úteis
```bash
# Desenvolvimento com hot reload
pnpm dev

# Desenvolvimento com debug
pnpm dev:debug

# Limpar e reiniciar
pnpm dev:clean

# Linting
pnpm lint:dev

# Type checking
pnpm typecheck:dev

# Formatação
pnpm format:dev
```

### Banco de Dados
```bash
# Setup inicial
pnpm run db:setup:dev

# Migrations
pnpm run db:migrate:dev

# Seed data
pnpm run db:seed:dev

# Reset completo
pnpm run db:reset:dev
```

## 📝 Convenções

### Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### Branches
- `feature/nome-da-feature` - Desenvolvimento de funcionalidade
- `hotfix/nome-do-fix` - Correção urgente
- `release/versao` - Preparação de release

## 🚀 Deploy

### Staging
```bash
# Deploy automático via GitHub Actions
git push origin main
```

### Produção
```bash
# Deploy via Vercel
vercel --prod
```

## 📊 Monitoramento

### Métricas de Desenvolvimento
- Acesse `/dev/dashboard` para ver métricas em tempo real
- Logs estruturados com Winston
- Métricas Prometheus para performance

### Debugging
- Use `pnpm dev:debug` para debugging com Node.js
- Configure breakpoints no VSCode
- Use React DevTools para componentes
```

### Benefícios do Fluxo de Desenvolvimento

✅ **Produtividade**: Setup automatizado e hot reload  
✅ **Qualidade**: Linting, type checking e testes automáticos  
✅ **Colaboração**: Git flow e code review padronizados  
✅ **CI/CD**: Pipeline automatizado com GitHub Actions  
✅ **Monitoramento**: Métricas de desenvolvimento em tempo real  
✅ **Debugging**: Ferramentas integradas para debugging  
✅ **Documentação**: Guias completos para desenvolvedores  
✅ **Padrões**: Convenções e standards estabelecidos  

**O fluxo de desenvolvimento está completo e pronto para implementação!**

## Resumo Final da Arquitetura

A **Falachefe CrewAI Architecture** está agora completamente documentada com:

- ✅ **Introduction** - Visão geral e contexto
- ✅ **High Level Architecture** - Arquitetura de alto nível
- ✅ **Tech Stack** - Stack tecnológico definitivo
- ✅ **Data Models** - Modelos de dados e relacionamentos
- ✅ **Components** - Componentes lógicos e interfaces
- ✅ **External APIs** - Integrações externas
- ✅ **Core Workflows** - Fluxos principais do sistema
- ✅ **Database Schema** - Schema completo do banco
- ✅ **Source Tree** - Estrutura de diretórios
- ✅ **Deployment** - Estratégia de deploy
- ✅ **Monitoring** - Observabilidade completa
- ✅ **Security** - Estratégia de segurança com Better Auth
- ✅ **Performance** - Otimizações e escalabilidade
- ✅ **Testing Strategy** - Estratégia de testes abrangente
- ✅ **Development Workflow** - Fluxo de desenvolvimento

**A arquitetura está completa e pronta para implementação!** 🎉

## WhatsApp Authentication Strategy

### Solução Híbrida Implementada

A solução híbrida combina múltiplas estratégias de autenticação para WhatsApp:

1. **Primeira Interação:** Código de verificação obrigatório
2. **Sessões Subsequentes:** Token de sessão com TTL
3. **Reautenticação:** A cada 24 horas ou a pedido
4. **Fallback:** Para sistema legado se autenticação falhar

### Componentes da Solução

#### 1. WhatsApp Authentication Service

```typescript
// src/lib/auth/whatsapp-auth.ts
export class WhatsAppAuthService {
  constructor(
    private redis: RedisClient,
    private db: DatabaseClient,
    private uazClient: UAZClient,
    private logger: Logger
  ) {}

  async authenticateUser(
    phoneNumber: string, 
    companyId: string,
    message?: string
  ): Promise<WhatsAppAuthResult> {
    
    // 1. Verificar se usuário já tem sessão ativa
    const activeSession = await this.getActiveSession(phoneNumber, companyId);
    if (activeSession && !this.isSessionExpired(activeSession)) {
      return {
        authenticated: true,
        user: activeSession.user,
        sessionToken: activeSession.token,
        authMethod: 'session_token'
      };
    }

    // 2. Buscar usuário no banco
    const user = await this.findUserByPhone(phoneNumber, companyId);
    
    if (!user) {
      // 3. Usuário não existe - iniciar processo de registro/verificação
      return await this.handleUnknownUser(phoneNumber, companyId);
    }

    // 4. Usuário existe - verificar se precisa reautenticação
    if (this.requiresReauthentication(user)) {
      return await this.initiateVerification(user, phoneNumber, companyId);
    }

    // 5. Gerar nova sessão
    const sessionToken = await this.createSession(user, companyId);
    
    return {
      authenticated: true,
      user,
      sessionToken,
      authMethod: 'existing_user'
    };
  }

  async verifyCode(
    phoneNumber: string, 
    companyId: string, 
    code: string
  ): Promise<WhatsAppAuthResult> {
    
    const verificationKey = `verify:${phoneNumber}:${companyId}`;
    const storedData = await this.redis.get(verificationKey);
    
    if (!storedData) {
      throw new WhatsAppAuthError('Código expirado ou inválido');
    }

    const { code: storedCode, attempts } = JSON.parse(storedData);
    
    if (attempts >= 3) {
      throw new WhatsAppAuthError('Muitas tentativas. Tente novamente em 15 minutos.');
    }

    if (storedCode !== code) {
      await this.redis.setex(verificationKey, 300, JSON.stringify({
        code: storedCode,
        attempts: attempts + 1
      }));
      throw new WhatsAppAuthError('Código incorreto');
    }

    // Código válido - buscar ou criar usuário
    let user = await this.findUserByPhone(phoneNumber, companyId);
    
    if (!user) {
      user = await this.createWhatsAppUser(phoneNumber, companyId);
    }

    // Criar sessão
    const sessionToken = await this.createSession(user, companyId);
    
    // Limpar dados de verificação
    await this.redis.del(verificationKey);
    
    return {
      authenticated: true,
      user,
      sessionToken,
      authMethod: 'verification_code'
    };
  }

  private async initiateVerification(
    user: User, 
    phoneNumber: string, 
    companyId: string
  ): Promise<WhatsAppAuthResult> {
    
    const code = this.generateVerificationCode();
    const verificationData = {
      code,
      attempts: 0,
      userId: user.id,
      timestamp: Date.now()
    };

    // Salvar código no Redis (TTL 5 minutos)
    await this.redis.setex(
      `verify:${phoneNumber}:${companyId}`, 
      300, 
      JSON.stringify(verificationData)
    );

    // Enviar código via WhatsApp
    await this.sendVerificationCode(phoneNumber, code);

    return {
      authenticated: false,
      requiresVerification: true,
      message: 'Código de verificação enviado'
    };
  }

  private async createSession(user: User, companyId: string): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await this.db.insert('whatsapp_sessions').values({
      userId: user.id,
      companyId,
      phoneNumber: user.phoneNumber,
      sessionToken,
      expiresAt
    });

    // Cache da sessão no Redis
    await this.redis.setex(
      `session:${sessionToken}`, 
      86400, 
      JSON.stringify({
        userId: user.id,
        companyId,
        phoneNumber: user.phoneNumber,
        expiresAt: expiresAt.toISOString()
      })
    );

    return sessionToken;
  }
}
```

#### 2. Webhook Handler com Autenticação

```typescript
// src/app/api/webhook/uaz/route.ts
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    const { from, message, company_id } = webhookData;

    // Validar webhook signature
    const signature = request.headers.get('x-uaz-signature');
    if (!await validateWebhookSignature(webhookData, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Rate limiting por telefone
    const rateLimitKey = `rate_limit:${from}`;
    const isRateLimited = await checkRateLimit(rateLimitKey, 10, 60); // 10 msg/min
    if (isRateLimited) {
      return Response.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Autenticar usuário WhatsApp
    const authResult = await whatsappAuth.authenticateUser(from, company_id, message);
    
    if (!authResult.authenticated) {
      if (authResult.requiresVerification) {
        return Response.json({ 
          status: 'verification_required',
          message: 'Código de verificação enviado para seu WhatsApp'
        });
      }
      
      return Response.json({ 
        status: 'authentication_failed',
        message: 'Não foi possível autenticar o usuário'
      });
    }

    // Processar mensagem com usuário autenticado
    const crewResponse = await crewOrchestrator.processMessage({
      message,
      userId: authResult.user.id,
      companyId: company_id,
      conversationId: await getOrCreateConversation(authResult.user.id, company_id),
      authContext: {
        type: 'whatsapp',
        phoneNumber: from,
        sessionToken: authResult.sessionToken,
        authMethod: authResult.authMethod
      }
    });

    // Enviar resposta via UAZ
    await uazClient.sendMessage({
      to: from,
      message: crewResponse.response,
      companyId: company_id
    });

    // Log da interação
    await logWhatsAppInteraction({
      phoneNumber: from,
      companyId: company_id,
      message,
      response: crewResponse.response,
      authMethod: authResult.authMethod,
      processingTime: crewResponse.processingTime
    });

    return Response.json({ 
      status: 'success',
      messageId: crewResponse.messageId 
    });

  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    
    // Enviar mensagem de erro para usuário se possível
    if (error instanceof WhatsAppAuthError && error.sendToUser) {
      await uazClient.sendMessage({
        to: webhookData.from,
        message: error.userMessage
      });
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 3. Endpoints de Autenticação WhatsApp

```typescript
// src/app/api/auth/whatsapp/verify/route.ts
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, companyId, code } = await request.json();

    // Validar entrada
    if (!phoneNumber || !companyId || !code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verificar código
    const authResult = await whatsappAuth.verifyCode(phoneNumber, companyId, code);

    return Response.json({
      status: 'success',
      authenticated: true,
      sessionToken: authResult.sessionToken,
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        phoneNumber: authResult.user.phoneNumber
      }
    });

  } catch (error) {
    if (error instanceof WhatsAppAuthError) {
      return Response.json({ 
        error: error.message,
        code: error.code 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/auth/whatsapp/resend/route.ts
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, companyId } = await request.json();

    // Verificar rate limit para reenvio
    const rateLimitKey = `resend:${phoneNumber}:${companyId}`;
    const canResend = await checkRateLimit(rateLimitKey, 3, 300); // 3 reenvios/5min
    
    if (!canResend) {
      return Response.json({ 
        error: 'Muitas tentativas de reenvio. Tente novamente em 5 minutos.' 
      }, { status: 429 });
    }

    await whatsappAuth.resendVerificationCode(phoneNumber, companyId);

    return Response.json({
      status: 'success',
      message: 'Código reenviado'
    });

  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 4. Database Schema para WhatsApp Auth

```sql
-- Adicionar campos para autenticação WhatsApp
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN whatsapp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN whatsapp_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN whatsapp_last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_attempts INTEGER DEFAULT 0,
ADD COLUMN last_verification_attempt TIMESTAMP WITH TIME ZONE;

-- Índice para busca por telefone + empresa
CREATE INDEX idx_users_phone_company ON users(phone_number, company_id) 
WHERE phone_number IS NOT NULL;

-- Tabela para sessões WhatsApp
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT chk_whatsapp_sessions_token_unique UNIQUE (session_token)
);

-- Índices para sessões
CREATE INDEX idx_whatsapp_sessions_token ON whatsapp_sessions(session_token);
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number, company_id);
CREATE INDEX idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- Tabela para logs de autenticação WhatsApp
CREATE TABLE whatsapp_auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  auth_method VARCHAR(50) NOT NULL, -- 'verification_code', 'session_token', 'new_user'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX idx_whatsapp_auth_logs_phone ON whatsapp_auth_logs(phone_number);
CREATE INDEX idx_whatsapp_auth_logs_company ON whatsapp_auth_logs(company_id);
CREATE INDEX idx_whatsapp_auth_logs_created ON whatsapp_auth_logs(created_at);

-- Trigger para limpeza automática de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_whatsapp_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_sessions 
  WHERE expires_at < NOW() OR (last_used_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- Job para limpeza (executar a cada hora)
-- SELECT cron.schedule('cleanup-whatsapp-sessions', '0 * * * *', 'SELECT cleanup_expired_whatsapp_sessions();');
```

#### 5. Fluxo de Autenticação Completo

```mermaid
sequenceDiagram
    participant User as Usuário WhatsApp
    participant UAZ as UAZ API
    participant Webhook as Webhook Handler
    participant Auth as WhatsApp Auth
    participant Redis as Redis Cache
    participant DB as Supabase DB
    participant Orchestrator as CrewAI Orchestrator

    User->>UAZ: Envia mensagem
    UAZ->>Webhook: POST /webhook (phone, message, company_id)
    
    Webhook->>Webhook: Validar signature + rate limit
    Webhook->>Auth: authenticateUser(phone, company_id)
    
    Auth->>Redis: Verificar sessão ativa
    alt Sessão ativa
        Redis-->>Auth: Sessão válida
        Auth-->>Webhook: authenticated (session_token)
    else Sem sessão ativa
        Auth->>DB: Buscar usuário por telefone + empresa
        alt Usuário existe
            DB-->>Auth: Usuário encontrado
            Auth->>Auth: Verificar se precisa reauth
            alt Precisa reauth
                Auth->>Redis: Gerar código verificação
                Auth->>UAZ: Enviar código
                UAZ->>User: "Código: 123456"
                Auth-->>Webhook: requiresVerification
            else Não precisa reauth
                Auth->>DB: Criar nova sessão
                Auth-->>Webhook: authenticated (existing_user)
            end
        else Usuário não existe
            Auth->>Redis: Gerar código verificação
            Auth->>UAZ: Enviar código
            UAZ->>User: "Código: 123456"
            Auth-->>Webhook: requiresVerification
        end
    end
    
    alt Usuário autenticado
        Webhook->>Orchestrator: processMessage(authContext)
        Orchestrator-->>Webhook: Response
        Webhook->>UAZ: Enviar resposta
        UAZ->>User: Resposta do agente
    else Verificação necessária
        Webhook-->>UAZ: Aguardando verificação
    end
```

### Segurança e Monitoramento

#### Rate Limiting e Proteção

```typescript
// src/lib/auth/rate-limiter.ts
export class WhatsAppRateLimiter {
  async checkRateLimit(
    key: string, 
    maxRequests: number, 
    windowSeconds: number
  ): Promise<boolean> {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    return current > maxRequests;
  }

  async checkVerificationRateLimit(phoneNumber: string): Promise<boolean> {
    return await this.checkRateLimit(`verify_limit:${phoneNumber}`, 3, 300); // 3 tentativas/5min
  }

  async checkMessageRateLimit(phoneNumber: string): Promise<boolean> {
    return await this.checkRateLimit(`msg_limit:${phoneNumber}`, 10, 60); // 10 msg/min
  }
}
```

#### Logging e Auditoria

```typescript
// src/lib/auth/audit-logger.ts
export class WhatsAppAuditLogger {
  async logAuthenticationAttempt(
    phoneNumber: string,
    companyId: string,
    authMethod: string,
    success: boolean,
    errorMessage?: string,
    metadata?: any
  ): Promise<void> {
    await this.db.insert('whatsapp_auth_logs').values({
      phoneNumber,
      companyId,
      authMethod,
      success,
      errorMessage,
      metadata: JSON.stringify(metadata),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      createdAt: new Date()
    });
  }
}
```

### Configurações e Environment

```typescript
// src/lib/config/whatsapp-auth-config.ts
export const WhatsAppAuthConfig = {
  verificationCode: {
    length: 6,
    expirationMinutes: 5,
    maxAttempts: 3,
    resendCooldownMinutes: 1
  },
  session: {
    expirationHours: 24,
    maxSessionsPerUser: 3,
    cleanupIntervalHours: 1
  },
  rateLimiting: {
    verificationAttempts: { max: 3, windowMinutes: 5 },
    messages: { max: 10, windowMinutes: 1 },
    resendCodes: { max: 3, windowMinutes: 5 }
  },
  security: {
    requireReauthAfterHours: 24,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15
  }
};
```

Esta implementação híbrida garante:

✅ **Segurança:** Múltiplas camadas de autenticação  
✅ **Usabilidade:** Experiência fluida para usuários recorrentes  
✅ **Auditoria:** Logs completos de todas as interações  
✅ **Escalabilidade:** Rate limiting e cache eficiente  
✅ **Confiabilidade:** Fallback para sistema legado  

**A solução está pronta para implementação! Precisa de algum ajuste específico?**
