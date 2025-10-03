# 🚀 **PLANO DE IMPLEMENTAÇÃO AGENT SQUAD FRAMEWORK - FALACHEFE**

## 📋 **Índice**
1. [Resumo Executivo](#resumo-executivo)
2. [Premissas e Requisitos](#premissas-e-requisitos)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Workflows dos Agentes](#workflows-dos-agentes)
5. [Implementação Técnica](#implementação-técnica)
6. [Cronograma de Implementação](#cronograma-de-implementação)
7. [Estrutura de Código](#estrutura-de-código)
8. [Configuração e Deploy](#configuração-e-deploy)
9. [Monitoramento e Métricas](#monitoramento-e-métricas)
10. [Riscos e Mitigações](#riscos-e-mitigações)

---

## 🎯 **Resumo Executivo**

### **Objetivo**
Implementar o **Agent Squad Framework** completo no projeto Falachefe, criando um sistema de agentes de IA especializados que processam mensagens do WhatsApp via UazAPI, com foco principal no **Agente Financeiro de Fluxo de Caixa**.

### **Premissas Fundamentais**
- ✅ **100% Agent Squad Framework** + customizações quando necessário
- ✅ **Sem infraestrutura AWS** - implementação self-hosted
- ✅ **Memória individual e compartilhada** para cada agente
- ✅ **Personalização de agentes** via painel admin existente
- ✅ **Integração com UazAPI** para WhatsApp como canal único
- ✅ **Streaming em tempo real** para comunicação
- ✅ **Flexibilidade com LLM GPT** para processamento de linguagem natural

### **Benefícios Esperados**
- **Automação Inteligente**: Agentes especializados para diferentes domínios
- **Memória Persistente**: Contexto mantido entre conversas
- **Personalização Total**: Admin pode configurar tom, nome, linguagem
- **Escalabilidade**: Processamento assíncrono e distribuído
- **Integração Nativa**: Aproveitamento da infraestrutura existente

---

## 🏗️ **Arquitetura do Sistema**

### **Diagrama de Arquitetura Completa**
```
┌─────────────────────────────────────────────────────────────┐
│                FALACHEFE + AGENT SQUAD FRAMEWORK            │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp User  →  UazAPI  →  Webhook  →  Agent Orchestrator │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              NEXT.JS APPLICATION                       │ │
│  │  • Webhook Handler (UazAPI)                           │ │
│  │  • Agent Squad Integration Layer                      │ │
│  │  • Memory Management (Individual + Shared)            │ │
│  │  • Admin Panel (Agent Customization)                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              AGENT SQUAD FRAMEWORK                     │ │
│  │  • Agent Manager                                       │ │
│  │  • Agent Orchestrator                                  │ │
│  │  • Memory System (Individual + Shared)                │ │
│  │  • Streaming Service                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   AGENTE    │ │   AGENTE    │ │   AGENTE    │ │ AGENTE  │ │
│  │ FINANCEIRO  │ │ FLUXO CAIXA │ │MARKETING/   │ │   RH    │ │
│  │             │ │             │ │   VENDAS    │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              STORAGE LAYER                             │ │
│  │  • PostgreSQL (Conversations, Users, Context)          │ │
│  │  • Redis (Session Cache, Queue, Memory)                │ │
│  │  • File System (Logs, Agent Configs)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes Principais**

#### **1. Agent Squad Framework Core**
- **Localização**: `src/agents/core/`
- **Responsabilidade**: Framework base do Agent Squad
- **Tecnologia**: TypeScript + Python (FastAPI)

#### **2. Memory System**
- **Individual Memory**: Contexto específico por agente
- **Shared Memory**: Contexto compartilhado entre agentes
- **Storage**: Redis + PostgreSQL

#### **3. Agent Customization System**
- **Localização**: `src/app/admin/agents/`
- **Responsabilidade**: Personalização de agentes via admin
- **Features**: Tom de voz, nome, linguagem, personalidade

#### **4. Streaming Integration**
- **Localização**: `src/lib/streaming/`
- **Responsabilidade**: Comunicação em tempo real
- **Tecnologia**: Server-Sent Events + WebSocket

---

## 🤖 **Workflows dos Agentes**

### **Workflow 0: Onboarding**
```
Usuário assina → Registro no BD → Trigger → Agente Onboarding
    ↓
Boas-vindas + Captura de dados:
• Nome da empresa
• Categorias de despesas
• Categorias de receita
• Periodicidade de relatórios
• Saldo inicial
• Configurações de alertas
```

### **Workflow 1: Gestão de Fluxo de Caixa**
```
Usuário solicita via WhatsApp:
• "Adicionar despesa de R$ 500 para marketing"
• "Criar nova categoria 'equipamentos'"
• "Excluir categoria 'viagens'"
• "Como está meu fluxo hoje?"

Agente processa:
• Valida dados via LLM
• Consulta banco via Drizzle
• Atualiza categorias/transações
• Gera resposta personalizada
• Envia via UazAPI
```

### **Workflow 2: Análise e Relatórios**
```
Usuário solicita: "Como está meu fluxo de caixa hoje?"

Agente executa:
• Consulta dados via Drizzle ORM
• Processa informações bancárias
• Gera análise em tempo real
• Envia relatório via WhatsApp
• Atualiza memória compartilhada
```

### **Workflow 3: Alertas Inteligentes**
```
Sistema monitora 24/7:
• Saldos baixos
• Padrões anômalos
• Vencimentos próximos
• Metas não atingidas

Agente envia:
• Alertas proativos via WhatsApp
• Sugestões de ações corretivas
• Relatórios de tendências
```

---

## 🛠️ **Implementação Técnica**

### **Fase 1: Setup do Agent Squad Framework (Semana 1)**

#### **Passo 1.1: Instalação do Framework**
```bash
# Instalar Agent Squad Framework
npm install @falachefe/agent-squad-core
npm install @falachefe/agent-squad-memory
npm install @falachefe/agent-squad-streaming

# Dependências Python (FastAPI)
pip install agent-squad==0.8.1
pip install fastapi uvicorn openai redis asyncpg
pip install pydantic sqlalchemy alembic
```

#### **Passo 1.2: Estrutura de Diretórios**
```
src/
├── agents/
│   ├── core/                    # Agent Squad Framework
│   │   ├── agent-manager.ts
│   │   ├── agent-orchestrator.ts
│   │   ├── memory-system.ts
│   │   └── streaming-service.ts
│   ├── financial/               # Agente Financeiro
│   │   ├── financial-agent.ts
│   │   ├── cashflow-agent.ts
│   │   └── workflows/
│   ├── memory/                  # Sistema de Memória
│   │   ├── individual-memory.ts
│   │   ├── shared-memory.ts
│   │   └── memory-manager.ts
│   └── streaming/               # Streaming Service
│       ├── sse-handler.ts
│       ├── websocket-handler.ts
│       └── real-time-processor.ts
├── app/
│   ├── admin/
│   │   └── agents/              # Painel de Customização
│   │       ├── page.tsx
│   │       ├── customization-form.tsx
│   │       └── agent-settings.tsx
│   └── api/
│       └── agents/              # APIs dos Agentes
│           ├── route.ts
│           ├── memory/route.ts
│           └── streaming/route.ts
└── lib/
    ├── agent-squad/             # Integração Agent Squad
    │   ├── client.ts
    │   ├── types.ts
    │   └── config.ts
    └── streaming/               # Streaming Utils
        ├── sse-server.ts
        └── real-time-utils.ts
```

### **Fase 2: Implementação Core (Semanas 2-3)**

#### **Passo 2.1: Agent Squad Core Implementation**
```typescript
// src/agents/core/agent-squad-setup.ts
import { 
  AgentSquad, 
  AgentManager, 
  AgentOrchestrator,
  MemorySystem,
  StreamingService
} from '@falachefe/agent-squad-core'

export class FalachefeAgentSquad extends AgentSquad {
  private agentManager: AgentManager
  private orchestrator: AgentOrchestrator
  private memorySystem: MemorySystem
  private streamingService: StreamingService

  constructor() {
    super({
      // Configuração base do Agent Squad
      name: 'FalachefeAgentSquad',
      version: '1.0.0',
      memoryConfig: {
        individual: true,
        shared: true,
        storage: 'redis+postgresql'
      },
      streamingConfig: {
        enabled: true,
        type: 'sse+websocket',
        realTime: true
      }
    })

    this.initializeComponents()
  }

  private initializeComponents() {
    // Inicializar Agent Manager
    this.agentManager = new AgentManager({
      agents: [
        'financial',
        'cashflow', 
        'marketing_sales',
        'hr'
      ],
      customizations: {
        enabled: true,
        adminPanel: true
      }
    })

    // Inicializar Memory System
    this.memorySystem = new MemorySystem({
      individual: {
        enabled: true,
        storage: 'redis',
        ttl: 86400 // 24 horas
      },
      shared: {
        enabled: true,
        storage: 'postgresql',
        sync: true
      }
    })

    // Inicializar Streaming Service
    this.streamingService = new StreamingService({
      type: 'sse+websocket',
      realTime: true,
      fallback: 'polling'
    })

    // Inicializar Orchestrator
    this.orchestrator = new AgentOrchestrator({
      agentManager: this.agentManager,
      memorySystem: this.memorySystem,
      streamingService: this.streamingService
    })
  }

  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Processar via Agent Squad Framework
    return await this.orchestrator.process(message, context)
  }
}
```

#### **Passo 2.2: Financial Agent Implementation**
```typescript
// src/agents/financial/financial-agent.ts
import { BaseAgent } from '@falachefe/agent-squad-core'
import { DrizzleClient } from '@/lib/db'
import { UAZClient } from '@/lib/uaz-api/client'

export class FinancialAgent extends BaseAgent {
  private db: DrizzleClient
  private uazClient: UAZClient

  constructor(config: AgentConfig) {
    super({
      name: 'FinancialAgent',
      type: 'financial',
      capabilities: [
        'cashflow_analysis',
        'expense_tracking',
        'revenue_monitoring',
        'budget_planning'
      ],
      memory: {
        individual: true,
        shared: true
      },
      streaming: true
    })

    this.db = new DrizzleClient()
    this.uazClient = new UAZClient()
  }

  async process(
    message: string, 
    context: AgentContext
  ): Promise<AgentResponse> {
    // Classificar intenção usando LLM
    const intent = await this.classifyIntent(message)
    
    // Processar baseado na intenção
    switch (intent) {
      case 'add_expense':
        return await this.addExpense(message, context)
      case 'add_revenue':
        return await this.addRevenue(message, context)
      case 'create_category':
        return await this.createCategory(message, context)
      case 'delete_category':
        return await this.deleteCategory(message, context)
      case 'cashflow_analysis':
        return await this.analyzeCashFlow(message, context)
      default:
        return await this.generalFinancialQuery(message, context)
    }
  }

  private async classifyIntent(message: string): Promise<string> {
    // Usar LLM para classificar intenção
    const prompt = `
    Classifique a intenção da seguinte mensagem financeira:
    "${message}"
    
    Opções: add_expense, add_revenue, create_category, delete_category, 
    cashflow_analysis, budget_planning, general_query
    
    Responda apenas com a intenção classificada.
    `

    const response = await this.callLLM(prompt)
    return response.trim().toLowerCase()
  }

  private async addExpense(
    message: string, 
    context: AgentContext
  ): Promise<AgentResponse> {
    // Extrair dados da mensagem usando LLM
    const extractedData = await this.extractExpenseData(message)
    
    // Validar dados
    if (!extractedData.amount || !extractedData.category) {
      return {
        response: 'Desculpe, não consegui identificar o valor e categoria da despesa. Tente novamente.',
        confidence: 0.3,
        shouldStream: false
      }
    }

    // Salvar no banco via Drizzle
    const expense = await this.db.insert(expenses).values({
      amount: extractedData.amount,
      category: extractedData.category,
      description: extractedData.description,
      userId: context.userId,
      createdAt: new Date()
    })

    // Atualizar memória individual
    await this.updateIndividualMemory(context.conversationId, {
      lastExpense: expense,
      totalExpenses: await this.getTotalExpenses(context.userId)
    })

    // Resposta personalizada
    const response = await this.generatePersonalizedResponse(
      'expense_added',
      { expense, user: context.user }
    )

    return {
      response,
      confidence: 0.9,
      shouldStream: true,
      data: expense
    }
  }

  private async analyzeCashFlow(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Buscar dados do banco
    const cashFlowData = await this.getCashFlowData(context.userId)
    
    // Gerar análise usando LLM
    const analysis = await this.generateCashFlowAnalysis(cashFlowData)
    
    // Atualizar memória compartilhada
    await this.updateSharedMemory(context.conversationId, {
      lastAnalysis: analysis,
      analysisDate: new Date()
    })

    return {
      response: analysis,
      confidence: 0.95,
      shouldStream: true,
      data: cashFlowData
    }
  }
}
```

#### **Passo 2.3: Memory System Implementation**
```typescript
// src/agents/memory/memory-manager.ts
import { MemorySystem } from '@falachefe/agent-squad-core'
import { RedisClient } from '@/lib/cache/redis-client'
import { db } from '@/lib/db'

export class FalachefeMemoryManager extends MemorySystem {
  private redis: RedisClient
  private db: typeof db

  constructor() {
    super({
      individual: {
        enabled: true,
        storage: 'redis',
        ttl: 86400
      },
      shared: {
        enabled: true,
        storage: 'postgresql',
        sync: true
      }
    })

    this.redis = new RedisClient()
    this.db = db
  }

  async getIndividualMemory(
    conversationId: string,
    agentType: string
  ): Promise<Record<string, any>> {
    const key = `memory:individual:${conversationId}:${agentType}`
    const memory = await this.redis.get(key)
    return memory ? JSON.parse(memory) : {}
  }

  async setIndividualMemory(
    conversationId: string,
    agentType: string,
    data: Record<string, any>
  ): Promise<void> {
    const key = `memory:individual:${conversationId}:${agentType}`
    await this.redis.setex(key, 86400, JSON.stringify(data))
  }

  async getSharedMemory(
    conversationId: string
  ): Promise<Record<string, any>> {
    const result = await this.db
      .select()
      .from(agentSharedMemory)
      .where(eq(agentSharedMemory.conversationId, conversationId))
      .limit(1)

    return result[0]?.data || {}
  }

  async setSharedMemory(
    conversationId: string,
    data: Record<string, any>
  ): Promise<void> {
    await this.db
      .insert(agentSharedMemory)
      .values({
        conversationId,
        data,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: agentSharedMemory.conversationId,
        set: {
          data,
          updatedAt: new Date()
        }
      })
  }
}
```

### **Fase 3: Integração com UazAPI (Semana 4)**

#### **Passo 3.1: Webhook Integration**
```typescript
// src/app/api/webhook/uaz/route.ts (modificado)
import { FalachefeAgentSquad } from '@/lib/agents/core/agent-squad-setup'
import { UAZClient } from '@/lib/uaz-api/client'

const agentSquad = new FalachefeAgentSquad()

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    // Validar webhook UazAPI
    if (!isValidUazWebhook(payload)) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const { message, chat, owner } = payload

    // Processar via Agent Squad
    const agentResponse = await agentSquad.processMessage(
      message.text || message.content || '',
      {
        conversationId: chat.id,
        userId: message.sender,
        userMessage: message.text || message.content || '',
        chatInfo: chat,
        owner
      }
    )

    // Enviar resposta via UazAPI se necessário
    if (agentResponse.shouldSendToUaz && agentResponse.response) {
      const uazClient = new UAZClient()
      await uazClient.sendMessage({
        chatId: chat.id,
        message: agentResponse.response,
        messageType: 'text'
      })
    }

    return NextResponse.json({ 
      success: true, 
      agent: agentResponse.agentType,
      confidence: agentResponse.confidence
    })

  } catch (error) {
    console.error('Erro no webhook Agent Squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

### **Fase 4: Admin Panel para Customização (Semana 5)**

#### **Passo 4.1: Agent Customization Interface**
```typescript
// src/app/admin/agents/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AgentConfig {
  id: string
  name: string
  type: string
  personality: string
  language: string
  tone: string
  customPrompts: string[]
  isActive: boolean
}

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents')
      const data = await response.json()
      setAgents(data.agents)
    } catch (error) {
      console.error('Erro ao buscar agentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAgent = async (agentId: string, updates: Partial<AgentConfig>) => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchAgents()
        // Aplicar mudanças em tempo real
        await applyAgentChanges(agentId, updates)
      }
    } catch (error) {
      console.error('Erro ao atualizar agente:', error)
    }
  }

  const applyAgentChanges = async (agentId: string, updates: Partial<AgentConfig>) => {
    // Aplicar mudanças no Agent Squad em tempo real
    await fetch('/api/agents/reload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, updates })
    })
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuração de Agentes</h1>
        <Button onClick={fetchAgents}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className={`cursor-pointer transition-colors ${
              selectedAgent?.id === agent.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedAgent(agent)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {agent.name}
                <span className={`px-2 py-1 rounded text-xs ${
                  agent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {agent.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 capitalize">
                {agent.type.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {agent.language} • {agent.tone}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração: {selectedAgent.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="agent-name">Nome do Agente</Label>
                <Input
                  id="agent-name"
                  value={selectedAgent.name}
                  onChange={(e) => setSelectedAgent({
                    ...selectedAgent,
                    name: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="agent-language">Idioma</Label>
                <Select
                  value={selectedAgent.language}
                  onValueChange={(value) => setSelectedAgent({
                    ...selectedAgent,
                    language: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent-tone">Tom de Voz</Label>
                <Select
                  value={selectedAgent.tone}
                  onValueChange={(value) => setSelectedAgent({
                    ...selectedAgent,
                    tone: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent-status">Status</Label>
                <Select
                  value={selectedAgent.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setSelectedAgent({
                    ...selectedAgent,
                    isActive: value === 'active'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="agent-personality">Personalidade</Label>
              <Textarea
                id="agent-personality"
                value={selectedAgent.personality}
                onChange={(e) => setSelectedAgent({
                  ...selectedAgent,
                  personality: e.target.value
                })}
                placeholder="Descreva a personalidade do agente..."
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={() => updateAgent(selectedAgent.id, selectedAgent)}
                className="flex-1"
              >
                Salvar Configurações
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedAgent(null)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## 📅 **Cronograma de Implementação**

### **Semana 1: Setup e Infraestrutura**
- [ ] Instalar Agent Squad Framework
- [ ] Configurar estrutura de diretórios
- [ ] Setup do sistema de memória (Redis + PostgreSQL)
- [ ] Configurar streaming service

### **Semana 2: Core Implementation**
- [ ] Implementar Agent Manager
- [ ] Implementar Agent Orchestrator
- [ ] Criar Financial Agent base
- [ ] Implementar sistema de memória individual e compartilhada

### **Semana 3: Agentes Especializados**
- [ ] Implementar CashFlow Agent
- [ ] Implementar Marketing/Sales Agent
- [ ] Implementar HR Agent
- [ ] Configurar personalização de agentes

### **Semana 4: Integração UazAPI**
- [ ] Modificar webhook UazAPI
- [ ] Implementar streaming em tempo real
- [ ] Testes de integração
- [ ] Configurar fallbacks

### **Semana 5: Admin Panel**
- [ ] Criar interface de customização
- [ ] Implementar APIs de configuração
- [ ] Testes de personalização
- [ ] Documentação

### **Semana 6: Deploy e Produção**
- [ ] Configurar Docker Compose
- [ ] Deploy em staging
- [ ] Testes de produção
- [ ] Monitoramento e alertas

---

## 📁 **Estrutura de Código Detalhada**

### **Arquivos a Criar**
```
src/
├── agents/
│   ├── core/
│   │   ├── agent-squad-setup.ts
│   │   ├── agent-manager.ts
│   │   ├── agent-orchestrator.ts
│   │   ├── memory-system.ts
│   │   └── streaming-service.ts
│   ├── financial/
│   │   ├── financial-agent.ts
│   │   ├── cashflow-agent.ts
│   │   └── workflows/
│   │       ├── onboarding-workflow.ts
│   │       ├── expense-workflow.ts
│   │       └── analysis-workflow.ts
│   ├── memory/
│   │   ├── individual-memory.ts
│   │   ├── shared-memory.ts
│   │   └── memory-manager.ts
│   └── streaming/
│       ├── sse-handler.ts
│       ├── websocket-handler.ts
│       └── real-time-processor.ts
├── app/
│   ├── admin/
│   │   └── agents/
│   │       ├── page.tsx
│   │       ├── customization-form.tsx
│   │       └── agent-settings.tsx
│   └── api/
│       └── agents/
│           ├── route.ts
│           ├── memory/route.ts
│           ├── streaming/route.ts
│           └── reload/route.ts
└── lib/
    ├── agent-squad/
    │   ├── client.ts
    │   ├── types.ts
    │   └── config.ts
    └── streaming/
        ├── sse-server.ts
        └── real-time-utils.ts
```

### **Arquivos a Modificar**
```
src/
├── app/api/webhook/uaz/route.ts (modificar)
├── lib/schema.ts (adicionar tabelas)
├── package.json (adicionar dependências)
└── docker-compose.yml (adicionar serviços)
```

---

## ⚙️ **Configuração e Deploy**

### **Variáveis de Ambiente**
```bash
# .env.local (adicionar)
AGENT_SQUAD_ENABLED=true
AGENT_SQUAD_URL=http://localhost:8001
AGENT_SQUAD_API_KEY=your-agent-squad-api-key

# Redis para memória
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# PostgreSQL para memória compartilhada
DATABASE_URL=postgresql://user:password@localhost:5432/falachefe

# UazAPI
UAZ_API_KEY=your-uaz-api-key
UAZ_API_SECRET=your-uaz-api-secret
UAZ_BASE_URL=https://falachefe.uazapi.com

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### **Docker Compose**
```yaml
# docker-compose.yml (adicionar)
version: '3.8'

services:
  # ... serviços existentes ...

  agent-squad:
    build:
      context: ./src/agent-squad
      dockerfile: Dockerfile
    container_name: falachefe_agent_squad
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - UAZ_API_KEY=${UAZ_API_KEY}
      - UAZ_API_SECRET=${UAZ_API_SECRET}
      - UAZ_BASE_URL=${UAZ_BASE_URL}
    ports:
      - "8001:8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📊 **Monitoramento e Métricas**

### **Métricas Implementadas**
- **Performance**: Tempo de resposta, throughput
- **Qualidade**: Confiança, precisão de classificação
- **Uso**: Interações por agente, usuário
- **Sistema**: CPU, memória, erros
- **Memória**: Uso de memória individual e compartilhada

### **Dashboards**
- **Dashboard Principal**: Visão geral dos agentes
- **Dashboard por Agente**: Performance individual
- **Dashboard de Conversas**: Histórico e contexto
- **Dashboard de Sistema**: Saúde e performance
- **Dashboard de Customização**: Configurações ativas

---

## ⚠️ **Riscos e Mitigações**

### **Riscos Técnicos**
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance degradada | Média | Alto | Cache Redis, otimização de queries |
| Falha do Agent Squad | Alta | Alto | Fallback para resposta padrão |
| Problemas de memória | Baixa | Médio | Limpeza automática, monitoramento |
| Integração UazAPI | Média | Alto | Circuit breaker, retry logic |

### **Riscos de Negócio**
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Resposta inadequada | Média | Alto | Treinamento contínuo, feedback loop |
| Escalabilidade | Baixa | Alto | Arquitetura distribuída |
| Custos OpenAI | Alta | Médio | Limites de rate, otimização de prompts |
| Complexidade | Alta | Médio | Documentação, treinamento da equipe |

---

## 🎯 **Próximos Passos**

### **Imediatos (Esta Semana)**
1. **Aprovar plano de implementação**
2. **Configurar ambiente de desenvolvimento**
3. **Instalar Agent Squad Framework**
4. **Criar estrutura de diretórios**

### **Curto Prazo (2-4 semanas)**
1. **Implementar Agent Squad completo**
2. **Integrar com webhook UazAPI**
3. **Criar painel de customização**
4. **Testes com usuários beta**

### **Médio Prazo (1-3 meses)**
1. **Otimizações de performance**
2. **Novos agentes especializados**
3. **Analytics avançado**
4. **Integrações adicionais**

---

## 📞 **Suporte e Recursos**

### **Documentação**
- **Agent Squad Docs**: [GitHub](https://github.com/awslabs/agent-squad)
- **UazAPI Docs**: [Documentação](https://uazapi.com/docs)
- **Next.js Docs**: [Documentação](https://nextjs.org/docs)

### **Equipe**
- **Tech Lead**: Responsável pela arquitetura
- **Backend Developer**: Implementação dos agentes
- **Frontend Developer**: Dashboard e UI
- **DevOps**: Deploy e monitoramento

---

**🎉 Este plano fornece uma rota completa e detalhada para implementar o Agent Squad Framework no projeto Falachefe, mantendo todas as premissas específicas e criando um sistema robusto e escalável de agentes de IA especializados.**

*Última atualização: Janeiro 2025*
