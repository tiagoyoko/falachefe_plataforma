# 📋 **Story 1.4: Agent Orchestrator/Supervisor**

## 🎯 **Story Statement**
Como **sistema**, quero **um orquestrador central que analise mensagens recebidas via webhook** para que **possa direcionar cada mensagem para o agente especializado correto** baseado no contexto da conversa e intenção do usuário.

## 📝 **Descrição Detalhada**

### **Contexto**
O Agent Orchestrator é o componente central do Agent Squad Framework que atua como um "supervisor inteligente". Ele recebe todas as mensagens do webhook UazAPI, analisa o contexto da conversa, classifica a intenção do usuário e direciona para o agente especializado mais adequado.

### **Objetivos**
- Implementar orquestrador central para roteamento de mensagens
- Analisar contexto da conversa para tomada de decisão
- Classificar intenções do usuário com alta precisão
- Gerenciar fluxo entre múltiplos agentes
- Manter estado da conversa e contexto compartilhado

## ✅ **Acceptance Criteria**

### **AC1: Recebimento e Análise de Mensagens**
- [ ] Receber mensagens do webhook UazAPI
- [ ] Extrair contexto da conversa (histórico, usuário, chat)
- [ ] Validar formato e conteúdo da mensagem
- [ ] Processar diferentes tipos de mídia (texto, imagem, áudio)
- [ ] Manter logs detalhados de todas as mensagens

### **AC2: Classificação de Intenções**
- [ ] Classificar intenção principal da mensagem
- [ ] Identificar domínio (financeiro, marketing, RH, etc.)
- [ ] Detectar urgência e prioridade
- [ ] Reconhecer comandos de sistema
- [ ] Precisão de classificação > 90%

### **AC3: Roteamento Inteligente**
- [ ] Direcionar para agente especializado correto
- [ ] Gerenciar handoff entre agentes
- [ ] Manter contexto durante transferências
- [ ] Implementar fallback para agente geral
- [ ] Suportar múltiplos agentes simultâneos

### **AC4: Gerenciamento de Estado**
- [ ] Manter estado da conversa ativa
- [ ] Gerenciar contexto compartilhado
- [ ] Implementar timeouts e limpeza
- [ ] Sincronizar com sistema de memória
- [ ] Garantir consistência de dados

## 📋 **Tasks / Subtasks**

### **Task 1: Implementar Core Orchestrator**
- [ ] Criar classe `AgentOrchestrator` principal
- [ ] Implementar interface de recebimento de mensagens
- [ ] Configurar sistema de logs e monitoramento
- [ ] Implementar tratamento de erros robusto
- [ ] Criar testes unitários básicos

### **Task 2: Sistema de Classificação de Intenções**
- [ ] Implementar `IntentClassifier` avançado
- [ ] Criar prompts especializados para classificação
- [ ] Implementar cache de classificações frequentes
- [ ] Adicionar validação de confiança
- [ ] Otimizar performance de classificação

### **Task 3: Sistema de Roteamento**
- [ ] Implementar `AgentRouter` inteligente
- [ ] Criar regras de roteamento por domínio
- [ ] Implementar sistema de prioridades
- [ ] Adicionar suporte a handoff entre agentes
- [ ] Implementar fallback e recovery

### **Task 4: Gerenciamento de Contexto**
- [ ] Implementar `ConversationContextManager`
- [ ] Integrar com sistema de memória individual
- [ ] Integrar com sistema de memória compartilhada
- [ ] Implementar limpeza automática de contexto
- [ ] Adicionar persistência de estado

### **Task 5: Integração com Webhook UazAPI**
- [ ] Modificar webhook existente para usar orchestrator
- [ ] Implementar validação de payload UazAPI
- [ ] Adicionar suporte a diferentes tipos de mensagem
- [ ] Implementar retry logic para falhas
- [ ] Adicionar métricas de performance

### **Task 6: Testes e Validação**
- [ ] Testes unitários para cada componente
- [ ] Testes de integração com agentes
- [ ] Testes de performance com carga
- [ ] Testes de falha e recovery
- [ ] Validação end-to-end

## 🔧 **Dev Notes**

### **Framework Agent Squad - Base Arquitetural**

Baseado no framework oficial da AWS Labs (awslabs/agent-squad), o Agent Orchestrator será implementado seguindo os padrões:

- **SupervisorAgent**: Classe base para orquestração
- **AgentSquad**: Gerenciamento de múltiplos agentes
- **MemorySystem**: Sistema de memória individual e compartilhada
- **StreamingService**: Comunicação em tempo real

### **Arquitetura do Agent Orchestrator**

```typescript
// src/agents/core/agent-orchestrator.ts
import { SupervisorAgent } from '@falachefe/agent-squad-core'
import { UazAPIMessage, UazAPIChat } from '@/lib/uaz-api/types'

export class FalachefeAgentOrchestrator extends SupervisorAgent {
  private intentClassifier: IntentClassifier
  private agentRouter: AgentRouter
  private contextManager: ConversationContextManager
  private memoryManager: MemoryManager
  private uazClient: UAZClient
  private logger: Logger

  constructor(config: OrchestratorConfig) {
    super(config.supervisor)
    this.intentClassifier = new IntentClassifier(config.classification)
    this.agentRouter = new AgentRouter(config.routing)
    this.contextManager = new ConversationContextManager(config.context)
    this.memoryManager = new MemoryManager(config.memory)
    this.uazClient = new UAZClient()
    this.logger = new Logger('FalachefeAgentOrchestrator')
  }

  async processMessage(
    message: UazAPIMessage,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    try {
      // 1. Validar e preparar mensagem
      const validatedMessage = await this.validateMessage(message)
      
      // 2. Carregar contexto da conversa
      const conversationContext = await this.contextManager.loadContext(
        context.conversationId
      )
      
      // 3. Classificar intenção
      const intent = await this.intentClassifier.classify(
        validatedMessage.text,
        conversationContext
      )
      
      // 4. Determinar agente alvo
      const targetAgent = await this.agentRouter.route(intent, conversationContext)
      
      // 5. Processar via agente especializado
      const agentResponse = await this.executeAgent(
        targetAgent,
        validatedMessage,
        conversationContext
      )
      
      // 6. Atualizar contexto
      await this.contextManager.updateContext(
        context.conversationId,
        {
          lastMessage: validatedMessage,
          lastIntent: intent,
          lastAgent: targetAgent.type,
          lastResponse: agentResponse
        }
      )
      
      // 7. Retornar resposta formatada
      return this.formatResponse(agentResponse, targetAgent)
      
    } catch (error) {
      this.logger.error('Erro no orchestrator:', error)
      return this.handleError(error, context)
    }
  }
}
```

### **Sistema de Classificação de Intenções**

```typescript
// src/agents/core/intent-classifier.ts
export class IntentClassifier {
  private llmClient: OpenAI
  private cache: Map<string, ClassificationResult>
  private prompts: ClassificationPrompts

  async classify(
    message: string,
    context: ConversationContext
  ): Promise<IntentClassification> {
    // 1. Verificar cache primeiro
    const cacheKey = this.generateCacheKey(message, context)
    const cached = this.cache.get(cacheKey)
    if (cached && this.isCacheValid(cached)) {
      return cached.result
    }

    // 2. Preparar contexto para classificação
    const classificationContext = this.prepareContext(message, context)
    
    // 3. Classificar usando LLM
    const result = await this.llmClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: this.buildClassificationPrompt(classificationContext)
      }],
      temperature: 0.1,
      max_tokens: 200
    })

    // 4. Processar resultado
    const classification = this.parseClassificationResult(result.choices[0].message.content)
    
    // 5. Validar confiança
    if (classification.confidence < 0.7) {
      classification.intent = 'general_query'
      classification.confidence = 0.5
    }

    // 6. Cache resultado
    this.cache.set(cacheKey, {
      result: classification,
      timestamp: Date.now()
    })

    return classification
  }

  private buildClassificationPrompt(context: ClassificationContext): string {
    return `
      Analise a seguinte mensagem e contexto para classificar a intenção:
      
      MENSAGEM: "${context.message}"
      
      CONTEXTO DA CONVERSA:
      - Última intenção: ${context.lastIntent || 'N/A'}
      - Último agente: ${context.lastAgent || 'N/A'}
      - Histórico recente: ${context.recentHistory || 'N/A'}
      - Tipo de usuário: ${context.userType || 'N/A'}
      
      CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES:
      
      FINANCEIRO:
      - add_expense: Adicionar despesa
      - add_revenue: Adicionar receita
      - cashflow_analysis: Análise de fluxo de caixa
      - budget_planning: Planejamento orçamentário
      - financial_query: Consulta financeira geral
      
      MARKETING/VENDAS:
      - lead_management: Gerenciar leads
      - campaign_analysis: Análise de campanhas
      - sales_report: Relatório de vendas
      - marketing_query: Consulta de marketing
      
      RH:
      - employee_management: Gerenciar funcionários
      - payroll: Folha de pagamento
      - hr_query: Consulta de RH
      
      SISTEMA:
      - agent_switch: Trocar de agente
      - help: Ajuda/suporte
      - settings: Configurações
      - general_query: Consulta geral
      
      Responda em formato JSON:
      {
        "intent": "intenção_classificada",
        "domain": "domínio_principal",
        "confidence": 0.0-1.0,
        "reasoning": "explicação_breve",
        "suggested_agent": "tipo_do_agente"
      }
    `
  }
}
```

### **Sistema de Roteamento**

```typescript
// src/agents/core/agent-router.ts
export class AgentRouter {
  private agents: Map<string, BaseAgent>
  private routingRules: RoutingRule[]
  private fallbackAgent: BaseAgent

  constructor(config: RouterConfig) {
    this.agents = new Map()
    this.routingRules = config.rules
    this.fallbackAgent = config.fallbackAgent
  }

  async route(
    intent: IntentClassification,
    context: ConversationContext
  ): Promise<AgentRoute> {
    // 1. Aplicar regras de roteamento
    for (const rule of this.routingRules) {
      if (this.matchesRule(intent, context, rule)) {
        const agent = this.agents.get(rule.agentType)
        if (agent && agent.isAvailable()) {
          return {
            agent,
            priority: rule.priority,
            reason: rule.reason,
            estimatedTime: rule.estimatedTime
          }
        }
      }
    }

    // 2. Roteamento baseado em domínio
    const domainAgent = this.getAgentByDomain(intent.domain)
    if (domainAgent && domainAgent.isAvailable()) {
      return {
        agent: domainAgent,
        priority: 'normal',
        reason: `Domain-based routing: ${intent.domain}`,
        estimatedTime: 2000
      }
    }

    // 3. Fallback para agente geral
    return {
      agent: this.fallbackAgent,
      priority: 'low',
      reason: 'Fallback to general agent',
      estimatedTime: 3000
    }
  }

  private matchesRule(
    intent: IntentClassification,
    context: ConversationContext,
    rule: RoutingRule
  ): boolean {
    // Verificar intenção
    if (rule.intents && !rule.intents.includes(intent.intent)) {
      return false
    }

    // Verificar domínio
    if (rule.domains && !rule.domains.includes(intent.domain)) {
      return false
    }

    // Verificar contexto
    if (rule.contextConditions) {
      for (const condition of rule.contextConditions) {
        if (!this.evaluateCondition(context, condition)) {
          return false
        }
      }
    }

    // Verificar confiança mínima
    if (rule.minConfidence && intent.confidence < rule.minConfidence) {
      return false
    }

    return true
  }
}
```

### **Gerenciamento de Contexto**

```typescript
// src/agents/core/conversation-context-manager.ts
export class ConversationContextManager {
  private memoryManager: MemoryManager
  private contextCache: Map<string, ConversationContext>
  private ttl: number

  async loadContext(conversationId: string): Promise<ConversationContext> {
    // 1. Verificar cache local
    const cached = this.contextCache.get(conversationId)
    if (cached && this.isContextValid(cached)) {
      return cached
    }

    // 2. Carregar do sistema de memória
    const sharedMemory = await this.memoryManager.getSharedMemory(conversationId)
    const individualMemories = await this.loadIndividualMemories(conversationId)

    // 3. Construir contexto
    const context: ConversationContext = {
      conversationId,
      lastMessage: sharedMemory.lastMessage,
      lastIntent: sharedMemory.lastIntent,
      lastAgent: sharedMemory.lastAgent,
      userProfile: sharedMemory.userProfile,
      conversationHistory: sharedMemory.conversationHistory || [],
      agentStates: individualMemories,
      createdAt: sharedMemory.createdAt,
      updatedAt: sharedMemory.updatedAt
    }

    // 4. Cache local
    this.contextCache.set(conversationId, context)

    return context
  }

  async updateContext(
    conversationId: string,
    updates: Partial<ConversationContext>
  ): Promise<void> {
    // 1. Atualizar contexto local
    const currentContext = this.contextCache.get(conversationId) || {}
    const updatedContext = { ...currentContext, ...updates, updatedAt: new Date() }
    this.contextCache.set(conversationId, updatedContext)

    // 2. Persistir no sistema de memória
    await this.memoryManager.setSharedMemory(conversationId, {
      lastMessage: updatedContext.lastMessage,
      lastIntent: updatedContext.lastIntent,
      lastAgent: updatedContext.lastAgent,
      userProfile: updatedContext.userProfile,
      conversationHistory: updatedContext.conversationHistory,
      updatedAt: updatedContext.updatedAt
    })

    // 3. Atualizar memórias individuais dos agentes
    for (const [agentType, state] of Object.entries(updatedContext.agentStates || {})) {
      await this.memoryManager.setIndividualMemory(
        conversationId,
        agentType,
        state
      )
    }
  }
}
```

### **Integração com Webhook UazAPI**

Baseado na documentação UazAPI OpenAPI, os tipos de mensagem são:

```typescript
// src/lib/uaz-api/types.ts
export interface UazAPIMessage {
  id: string
  text?: string
  content?: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  media?: {
    url: string
    mimeType: string
    filename?: string
  }
  timestamp: number
  sender: string
  chatId: string
}

export interface UazAPIChat {
  id: string
  name: string
  type: 'individual' | 'group'
  participants: string[]
  owner: string
}

export interface UazAPIWebhookPayload {
  message: UazAPIMessage
  chat: UazAPIChat
  owner: string
  event: 'message' | 'status' | 'typing'
}
```

```typescript
// src/app/api/webhook/uaz/route.ts (modificado)
import { FalachefeAgentOrchestrator } from '@/agents/core/agent-orchestrator'
import { UAZClient } from '@/lib/uaz-api/client'
import { UazAPIWebhookPayload } from '@/lib/uaz-api/types'

const orchestrator = new FalachefeAgentOrchestrator({
  classification: {
    model: 'gpt-4',
    temperature: 0.1,
    cacheEnabled: true,
    cacheTTL: 300 // 5 minutos
  },
  routing: {
    rules: [
      {
        intents: ['add_expense', 'add_revenue', 'cashflow_analysis'],
        domains: ['financial'],
        agentType: 'financial',
        priority: 'high',
        minConfidence: 0.8
      },
      {
        intents: ['lead_management', 'campaign_analysis'],
        domains: ['marketing'],
        agentType: 'marketing_sales',
        priority: 'high',
        minConfidence: 0.8
      }
    ],
    fallbackAgent: 'general'
  },
  context: {
    ttl: 3600, // 1 hora
    maxHistory: 50,
    autoCleanup: true
  }
})

export async function POST(request: Request) {
  try {
    const payload: UazAPIWebhookPayload = await request.json()

    // Validar webhook UazAPI
    if (!isValidUazWebhook(payload)) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const { message, chat, owner, event } = payload

    // Processar apenas eventos de mensagem
    if (event !== 'message') {
      return NextResponse.json({ success: true, event })
    }

    // Processar via Agent Orchestrator
    const orchestratorResponse = await orchestrator.processMessage(
      message,
      {
        conversationId: chat.id,
        userId: message.sender,
        chatInfo: chat,
        owner,
        platform: 'whatsapp',
        eventType: event
      }
    )

    // Enviar resposta via UazAPI se necessário
    if (orchestratorResponse.shouldSendToUaz && orchestratorResponse.response) {
      const uazClient = new UAZClient()
      await uazClient.sendMessage({
        chatId: chat.id,
        message: orchestratorResponse.response,
        messageType: 'text'
      })
    }

    return NextResponse.json({
      success: true,
      agent: orchestratorResponse.agentType,
      confidence: orchestratorResponse.confidence,
      processingTime: orchestratorResponse.processingTime
    })

  } catch (error) {
    console.error('Erro no webhook Agent Orchestrator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 🧪 **Testing**

### **Testes Unitários**
- [ ] Testar classificação de intenções
- [ ] Testar regras de roteamento
- [ ] Testar gerenciamento de contexto
- [ ] Testar tratamento de erros
- [ ] Testar cache e performance

### **Testes de Integração**
- [ ] Testar integração com webhook UazAPI
- [ ] Testar integração com agentes especializados
- [ ] Testar integração com sistema de memória
- [ ] Testar fluxo completo de processamento

### **Testes de Performance**
- [ ] Testar tempo de resposta < 2 segundos
- [ ] Testar processamento de múltiplas mensagens
- [ ] Testar uso de memória e CPU
- [ ] Testar escalabilidade

## 📊 **Definition of Done**

- [ ] Agent Orchestrator implementado e funcionando
- [ ] Sistema de classificação com precisão > 90%
- [ ] Roteamento inteligente para agentes especializados
- [ ] Gerenciamento de contexto robusto
- [ ] Integração completa com webhook UazAPI
- [ ] Testes unitários e de integração passando
- [ ] Performance dentro dos parâmetros especificados
- [ ] Documentação atualizada

## 📈 **Estimativas**

- **Story Points**: 21
- **Tempo Estimado**: 3-4 dias
- **Prioridade**: Crítica
- **Dependências**: Story 1.2 (Sistema de Memória)
- **Complexidade**: Muito Alta

## 👥 **Responsáveis**

- **Tech Lead**: Arquitetura e design
- **Backend Developer**: Implementação principal
- **AI Specialist**: Otimização de classificação
- **DevOps**: Configuração e monitoramento

## 🔗 **Dependências**

- **Entrada**: Story 1.2 concluída (Sistema de Memória)
- **Saída**: Orchestrator funcional
- **Bloqueadores**: 
  - Configuração OpenAI API
  - Instalação do Agent Squad Framework
  - Configuração UazAPI client

## 📦 **Dependências Técnicas**

### **Agent Squad Framework**
```json
{
  "@falachefe/agent-squad-core": "^1.0.0",
  "@falachefe/agent-squad-memory": "^1.0.0",
  "@falachefe/agent-squad-streaming": "^1.0.0"
}
```

### **UazAPI Integration**
```json
{
  "@falachefe/uaz-api-client": "^1.0.0",
  "@falachefe/uaz-api-types": "^1.0.0"
}
```

### **Core Dependencies**
```json
{
  "openai": "^4.0.0",
  "redis": "^4.0.0",
  "drizzle-orm": "^0.29.0",
  "postgresql": "^3.0.0"
}
```

---

**Status**: Ready for Development
**Criado em**: Janeiro 2025
**Última atualização**: Janeiro 2025
**Responsável**: Sarah (Product Owner)
**Desenvolvedor**: James (Full Stack Developer)
