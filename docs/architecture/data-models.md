# Data Models

## Crew
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

## CrewAgent
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

## CrewTask
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

## CrewMemory
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

## CrewMetrics
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
