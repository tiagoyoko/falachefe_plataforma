# 📋 Documento de Implementação: Chat-Demo-App
## Sistema de Chat Multi-Agente com Agent Squad Framework

---

## 🎯 **Visão Geral**

Este documento detalha a implementação de um sistema de chat multi-agente baseado no exemplo `chat-demo-app` do Agent Squad Framework, adaptado para nossa arquitetura atual (Next.js + API Routes) com WebSocket para streaming e Docker para containerização.

### 📚 **Referências do Exemplo Original**

- **Repositório Agent Squad**: [https://github.com/awslabs/agent-squad](https://github.com/awslabs/agent-squad)
- **Exemplo Chat Demo App**: [https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app](https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app)
- **README do Exemplo**: [https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md](https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md)

---

## 🏗️ **Arquitetura do Sistema**

### **Componentes Principais**

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[Chat Interface] --> B[WebSocket Client]
        B --> C[Message Handler]
        C --> D[Agent Selector]
    end
    
    subgraph "Backend (Next.js API)"
        E[WebSocket Server] --> F[Multi-Agent Handler]
        F --> G[Intent Classifier]
        G --> H[Agent Router]
        H --> I[Agent Manager]
    end
    
    subgraph "Agents"
        I --> J[Financial Agent]
        I --> K[Find My Name Agent]
        I --> L[Auth Agent]
        I --> M[Sync Agent]
    end
    
    subgraph "Data Layer"
        N[Memory System] --> O[Redis Cache]
        N --> P[PostgreSQL DB]
    end
    
    subgraph "Infrastructure"
        Q[Docker Containers] --> R[Next.js App]
        Q --> S[Redis Container]
        Q --> T[PostgreSQL Container]
    end
    
    A --> E
    F --> N
    I --> N
```

---

## 🚀 **Plano de Implementação**

### **Fase 1: Infraestrutura Base (Semana 1)**

#### **1.1 Configuração do Docker**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/agent_chat
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=agent_chat
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### **1.2 Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### **1.3 Configuração do WebSocket**
```typescript
// src/lib/websocket-server.ts
import { WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'

export class WebSocketManager {
  private wss: WebSocketServer
  private connections: Map<string, WebSocket> = new Map()

  constructor(server: any) {
    this.wss = new WebSocketServer({ server })
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const userId = this.extractUserId(req)
      this.connections.set(userId, ws)
      
      ws.on('message', (data) => {
        this.handleMessage(userId, data)
      })
      
      ws.on('close', () => {
        this.connections.delete(userId)
      })
    })
  }

  private extractUserId(req: IncomingMessage): string {
    // Implementar extração do userId do token JWT
    return 'anonymous'
  }

  private async handleMessage(userId: string, data: Buffer) {
    try {
      const message = JSON.parse(data.toString())
      const response = await this.processMessage(userId, message)
      this.sendToUser(userId, response)
    } catch (error) {
      this.sendError(userId, error)
    }
  }

  private async processMessage(userId: string, message: any) {
    // Implementar processamento da mensagem
    return { type: 'response', content: 'Message processed' }
  }

  private sendToUser(userId: string, data: any) {
    const ws = this.connections.get(userId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  private sendError(userId: string, error: any) {
    this.sendToUser(userId, { type: 'error', content: error.message })
  }
}
```

### **Fase 2: Sistema de Agentes (Semana 2)**

#### **2.1 Agent Squad Framework Integration**
```typescript
// src/agents/core/agent-squad-framework.ts
export interface AgentSquadConfig {
  agents: AgentConfig[]
  routing: RoutingConfig
  streaming: StreamingConfig
  memory: MemoryConfig
}

export class AgentSquadFramework {
  private agents: Map<string, BaseAgent> = new Map()
  private router: AgentRouter
  private memory: MemorySystem
  private streaming: StreamingService

  constructor(config: AgentSquadConfig) {
    this.initializeAgents(config.agents)
    this.router = new AgentRouter(config.routing)
    this.memory = new MemorySystem(config.memory)
    this.streaming = new StreamingService(config.streaming)
  }

  async processMessage(message: string, context: ConversationContext): Promise<AgentResponse> {
    // 1. Classificar intenção
    const intent = await this.classifyIntent(message)
    
    // 2. Selecionar agente
    const agent = this.router.selectAgent(intent, context)
    
    // 3. Processar mensagem
    const response = await agent.process(message, context)
    
    // 4. Atualizar contexto
    await this.memory.updateContext(context.conversationId, response)
    
    // 5. Enviar streaming
    await this.streaming.sendResponse(context.userId, response)
    
    return response
  }

  private async classifyIntent(message: string): Promise<Intent> {
    // Implementar classificação de intenção usando NLP
    const keywords = {
      financial: ['expense', 'revenue', 'budget', 'money', 'finance'],
      name: ['name', 'find', 'search', 'lookup'],
      auth: ['login', 'logout', 'register', 'password'],
      sync: ['sync', 'update', 'refresh', 'synchronize']
    }

    for (const [domain, words] of Object.entries(keywords)) {
      if (words.some(word => message.toLowerCase().includes(word))) {
        return { domain, confidence: 0.8 }
      }
    }

    return { domain: 'general', confidence: 0.5 }
  }
}
```

#### **2.2 Multi-Agent Handler**
```typescript
// src/agents/core/multi-agent-handler.ts
export class MultiAgentHandler {
  private framework: AgentSquadFramework
  private websocket: WebSocketManager

  constructor(framework: AgentSquadFramework, websocket: WebSocketManager) {
    this.framework = framework
    this.websocket = websocket
  }

  async handleMessage(userId: string, message: ChatMessage): Promise<void> {
    try {
      // 1. Carregar contexto da conversa
      const context = await this.loadConversationContext(message.conversationId, userId)
      
      // 2. Processar mensagem
      const response = await this.framework.processMessage(message.content, context)
      
      // 3. Enviar resposta via WebSocket
      await this.websocket.sendToUser(userId, {
        type: 'agent_response',
        data: {
          id: response.id,
          content: response.content,
          agentType: response.agentType,
          confidence: response.confidence,
          processingTime: response.processingTime,
          metadata: response.metadata
        }
      })
      
    } catch (error) {
      await this.websocket.sendToUser(userId, {
        type: 'error',
        data: { message: error.message }
      })
    }
  }

  private async loadConversationContext(conversationId: string, userId: string): Promise<ConversationContext> {
    // Implementar carregamento do contexto
    return {
      conversationId,
      userId,
      agentId: '',
      currentIntent: null,
      conversationHistory: [],
      userPreferences: {},
      sessionData: {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
    }
  }
}
```

### **Fase 3: Implementação dos Agentes (Semana 3)**

#### **3.1 Financial Agent (Expandido)**
```typescript
// src/agents/financial/financial-agent.ts
export class FinancialAgent extends BaseAgent {
  constructor(config: AgentConfig, memory: MemorySystem) {
    super(config, memory)
    this.capabilities = [
      'add_expense',
      'add_revenue', 
      'cashflow_analysis',
      'budget_planning',
      'financial_reporting',
      'expense_categorization'
    ]
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    const intent = await this.classifyFinancialIntent(message)
    
    switch (intent.action) {
      case 'add_expense':
        return await this.addExpense(message, context)
      case 'add_revenue':
        return await this.addRevenue(message, context)
      case 'cashflow_analysis':
        return await this.analyzeCashflow(message, context)
      case 'budget_planning':
        return await this.planBudget(message, context)
      default:
        return await this.generalFinancialResponse(message, context)
    }
  }

  private async addExpense(message: string, context: ConversationContext): Promise<AgentResponse> {
    // Implementar lógica de adição de despesa
    const expense = this.extractExpenseData(message)
    await this.memory.store('expenses', expense)
    
    return {
      id: uuidv4(),
      content: `Despesa de R$ ${expense.amount} adicionada com sucesso!`,
      agentType: 'financial',
      confidence: 0.9,
      processingTime: Date.now() - context.metadata.lastUpdated.getTime(),
      metadata: { action: 'add_expense', expense }
    }
  }

  private extractExpenseData(message: string): ExpenseData {
    // Implementar extração de dados da despesa usando NLP
    const amount = this.extractAmount(message)
    const category = this.extractCategory(message)
    const description = this.extractDescription(message)
    
    return { amount, category, description, date: new Date() }
  }
}
```

#### **3.2 Find My Name Agent**
```typescript
// src/agents/name/find-name-agent.ts
export class FindNameAgent extends BaseAgent {
  constructor(config: AgentConfig, memory: MemorySystem) {
    super(config, memory)
    this.capabilities = [
      'name_search',
      'name_validation',
      'name_suggestions',
      'contact_lookup'
    ]
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    const intent = await this.classifyNameIntent(message)
    
    switch (intent.action) {
      case 'name_search':
        return await this.searchName(message, context)
      case 'name_validation':
        return await this.validateName(message, context)
      case 'name_suggestions':
        return await this.suggestNames(message, context)
      default:
        return await this.generalNameResponse(message, context)
    }
  }

  private async searchName(message: string, context: ConversationContext): Promise<AgentResponse> {
    const searchTerm = this.extractSearchTerm(message)
    const results = await this.performNameSearch(searchTerm)
    
    return {
      id: uuidv4(),
      content: `Encontrei ${results.length} resultados para "${searchTerm}":\n${results.map(r => `- ${r.name} (${r.type})`).join('\n')}`,
      agentType: 'name',
      confidence: 0.8,
      processingTime: Date.now() - context.metadata.lastUpdated.getTime(),
      metadata: { action: 'name_search', results }
    }
  }
}
```

#### **3.3 Auth Agent**
```typescript
// src/agents/auth/auth-agent.ts
export class AuthAgent extends BaseAgent {
  constructor(config: AgentConfig, memory: MemorySystem) {
    super(config, memory)
    this.capabilities = [
      'user_authentication',
      'session_management',
      'password_reset',
      'account_verification',
      'permission_check'
    ]
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    const intent = await this.classifyAuthIntent(message)
    
    switch (intent.action) {
      case 'login':
        return await this.handleLogin(message, context)
      case 'logout':
        return await this.handleLogout(message, context)
      case 'password_reset':
        return await this.handlePasswordReset(message, context)
      default:
        return await this.generalAuthResponse(message, context)
    }
  }

  private async handleLogin(message: string, context: ConversationContext): Promise<AgentResponse> {
    const credentials = this.extractCredentials(message)
    const result = await this.authenticateUser(credentials)
    
    if (result.success) {
      return {
        id: uuidv4(),
        content: `Login realizado com sucesso! Bem-vindo, ${result.user.name}`,
        agentType: 'auth',
        confidence: 0.9,
        processingTime: Date.now() - context.metadata.lastUpdated.getTime(),
        metadata: { action: 'login', user: result.user }
      }
    } else {
      return {
        id: uuidv4(),
        content: `Falha no login: ${result.error}`,
        agentType: 'auth',
        confidence: 0.9,
        processingTime: Date.now() - context.metadata.lastUpdated.getTime(),
        metadata: { action: 'login', error: result.error }
      }
    }
  }
}
```

#### **3.4 Sync Agent**
```typescript
// src/agents/sync/sync-agent.ts
export class SyncAgent extends BaseAgent {
  constructor(config: AgentConfig, memory: MemorySystem) {
    super(config, memory)
    this.capabilities = [
      'data_synchronization',
      'external_api_sync',
      'backup_management',
      'conflict_resolution',
      'sync_status_check'
    ]
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    const intent = await this.classifySyncIntent(message)
    
    switch (intent.action) {
      case 'sync_data':
        return await this.syncData(message, context)
      case 'backup_data':
        return await this.backupData(message, context)
      case 'check_sync_status':
        return await this.checkSyncStatus(message, context)
      default:
        return await this.generalSyncResponse(message, context)
    }
  }

  private async syncData(message: string, context: ConversationContext): Promise<AgentResponse> {
    const syncTarget = this.extractSyncTarget(message)
    const result = await this.performSync(syncTarget)
    
    return {
      id: uuidv4(),
      content: `Sincronização com ${syncTarget} concluída! ${result.syncedItems} itens sincronizados.`,
      agentType: 'sync',
      confidence: 0.8,
      processingTime: Date.now() - context.metadata.lastUpdated.getTime(),
      metadata: { action: 'sync_data', result }
    }
  }
}
```

### **Fase 4: Frontend WebSocket Integration (Semana 4)**

#### **4.1 WebSocket Client Hook**
```typescript
// src/hooks/use-websocket-chat.ts
export function useWebSocketChat(userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (!userId) return

    const websocket = new WebSocket(`ws://localhost:3000/api/chat/ws?userId=${userId}`)
    
    websocket.onopen = () => {
      setIsConnected(true)
      setError(null)
    }
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleIncomingMessage(data)
    }
    
    websocket.onclose = () => {
      setIsConnected(false)
    }
    
    websocket.onerror = (error) => {
      setError('Erro na conexão WebSocket')
    }
    
    setWs(websocket)
    
    return () => {
      websocket.close()
    }
  }, [userId])

  const sendMessage = useCallback(async (content: string) => {
    if (!ws || !isConnected) return

    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      conversationId: getCurrentConversationId(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
    setIsLoading(true)

    try {
      ws.send(JSON.stringify(message))
    } catch (error) {
      setError('Erro ao enviar mensagem')
      setIsLoading(false)
    }
  }, [ws, isConnected])

  const handleIncomingMessage = (data: any) => {
    if (data.type === 'agent_response') {
      setMessages(prev => [...prev, {
        id: data.data.id,
        role: 'assistant',
        content: data.data.content,
        agentType: data.data.agentType,
        confidence: data.data.confidence,
        processingTime: data.data.processingTime,
        metadata: data.data.metadata,
        timestamp: new Date()
      }])
      setIsLoading(false)
    } else if (data.type === 'error') {
      setError(data.data.message)
      setIsLoading(false)
    }
  }

  return {
    messages,
    isConnected,
    isLoading,
    error,
    sendMessage,
    clearChat: () => setMessages([])
  }
}
```

#### **4.2 Chat Interface Atualizada**
```typescript
// src/app/chat/page.tsx
'use client'

import { useWebSocketChat } from '@/hooks/use-websocket-chat'
import { useSession } from 'next-auth/react'
import { Send, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'

export default function ChatPage() {
  const { data: session } = useSession()
  const { 
    messages, 
    isConnected, 
    isLoading, 
    error, 
    sendMessage, 
    clearChat 
  } = useWebSocketChat(session?.user?.id)

  const [inputMessage, setInputMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    await sendMessage(inputMessage)
    setInputMessage('')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Chat Multi-Agente
          </h1>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Actions */}
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Nova conversa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Agent Metadata */}
              {message.role === 'assistant' && message.agentType && (
                <div className="mt-2 text-xs opacity-75">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {message.agentType}
                    </span>
                    {message.confidence && (
                      <span className="text-xs">
                        ({Math.round(message.confidence * 100)}%)
                      </span>
                    )}
                    {message.processingTime && (
                      <span className="text-xs">
                        {message.processingTime}ms
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">Processando...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected || isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  )
}
```

### **Fase 5: API Routes WebSocket (Semana 5)**

#### **5.1 WebSocket API Route**
```typescript
// src/pages/api/chat/ws.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { WebSocketManager } from '@/lib/websocket-server'
import { AgentSquadFramework } from '@/agents/core/agent-squad-framework'
import { MultiAgentHandler } from '@/agents/core/multi-agent-handler'

let websocketManager: WebSocketManager | null = null

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!websocketManager) {
    // Initialize WebSocket Manager
    websocketManager = new WebSocketManager(req.socket.server)
    
    // Initialize Agent Squad Framework
    const framework = new AgentSquadFramework({
      agents: [
        // Financial Agent config
        // Find Name Agent config
        // Auth Agent config
        // Sync Agent config
      ],
      routing: {
        rules: [
          {
            intents: ['add_expense', 'add_revenue', 'cashflow_analysis'],
            domains: ['financial'],
            agentType: 'financial',
            priority: 'high',
            minConfidence: 0.7
          },
          {
            intents: ['name_search', 'name_validation'],
            domains: ['name'],
            agentType: 'name',
            priority: 'high',
            minConfidence: 0.7
          },
          {
            intents: ['login', 'logout', 'password_reset'],
            domains: ['auth'],
            agentType: 'auth',
            priority: 'high',
            minConfidence: 0.7
          },
          {
            intents: ['sync_data', 'backup_data'],
            domains: ['sync'],
            agentType: 'sync',
            priority: 'medium',
            minConfidence: 0.6
          }
        ],
        fallbackAgent: 'financial'
      },
      streaming: {
        enabled: true,
        type: 'websocket',
        heartbeatInterval: 30000
      },
      memory: {
        redis: {
          connectionString: process.env.REDIS_URL || 'redis://localhost:6379'
        },
        postgres: {
          connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/agent_chat'
        },
        defaultTTL: 3600000,
        maxMemorySize: 100 * 1024 * 1024
      }
    })
    
    // Initialize Multi-Agent Handler
    const multiAgentHandler = new MultiAgentHandler(framework, websocketManager)
    
    // Setup message handling
    websocketManager.onMessage = (userId: string, message: any) => {
      multiAgentHandler.handleMessage(userId, message)
    }
  }

  // WebSocket upgrade is handled by the WebSocketManager
  res.status(200).json({ message: 'WebSocket connection established' })
}
```

### **Fase 6: Testes e Validação (Semana 6)**

#### **6.1 Testes Unitários**
```typescript
// src/__tests__/agents/financial-agent.test.ts
import { FinancialAgent } from '@/agents/financial/financial-agent'
import { MemorySystem } from '@/agents/core/memory-system'

describe('FinancialAgent', () => {
  let agent: FinancialAgent
  let memory: MemorySystem

  beforeEach(() => {
    memory = new MemorySystem({
      redis: { connectionString: 'redis://localhost:6379' },
      postgres: { connectionString: 'postgresql://postgres:password@localhost:5432/agent_chat' },
      defaultTTL: 3600000,
      maxMemorySize: 100 * 1024 * 1024
    })
    
    agent = new FinancialAgent({
      id: 'financial-agent-1',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      retryAttempts: 3,
      escalationThreshold: 0.8,
      memoryRetentionDays: 30,
      learningEnabled: true
    }, memory)
  })

  test('should add expense correctly', async () => {
    const message = 'Adicionar despesa de R$ 100 para alimentação'
    const context = createMockContext()
    
    const response = await agent.process(message, context)
    
    expect(response.agentType).toBe('financial')
    expect(response.confidence).toBeGreaterThan(0.8)
    expect(response.metadata.action).toBe('add_expense')
  })

  test('should analyze cashflow correctly', async () => {
    const message = 'Analisar fluxo de caixa do mês'
    const context = createMockContext()
    
    const response = await agent.process(message, context)
    
    expect(response.agentType).toBe('financial')
    expect(response.metadata.action).toBe('cashflow_analysis')
  })
})
```

#### **6.2 Testes de Integração**
```typescript
// src/__tests__/integration/websocket-chat.test.ts
import { createWebSocketClient } from '@/lib/websocket-client'

describe('WebSocket Chat Integration', () => {
  test('should send and receive messages via WebSocket', async () => {
    const client = createWebSocketClient('test-user')
    
    await client.connect()
    
    const message = 'Adicionar despesa de R$ 50'
    const response = await client.sendMessage(message)
    
    expect(response.agentType).toBe('financial')
    expect(response.content).toContain('despesa')
    
    await client.disconnect()
  })
})
```

### **Fase 7: Deploy e Monitoramento (Semana 7)**

#### **7.1 Docker Compose para Produção**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/agent_chat
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=agent_chat
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### **7.2 Scripts de Deploy**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy do Chat Multi-Agente..."

# Build da aplicação
echo "📦 Fazendo build da aplicação..."
npm run build

# Build das imagens Docker
echo "🐳 Fazendo build das imagens Docker..."
docker-compose -f docker-compose.prod.yml build

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down

# Iniciar novos containers
echo "▶️ Iniciando novos containers..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
echo "✅ Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deploy concluído com sucesso!"
```

---

## 📊 **Métricas e Monitoramento**

### **Métricas de Performance**
- **Tempo de Resposta**: Tempo médio de processamento por agente
- **Throughput**: Mensagens processadas por minuto
- **Taxa de Erro**: Percentual de mensagens com erro
- **Uso de Memória**: Consumo de memória por agente
- **Conexões WebSocket**: Número de conexões ativas

### **Métricas de Negócio**
- **Agentes Mais Usados**: Ranking de utilização dos agentes
- **Intenções Mais Comuns**: Classificação das intenções dos usuários
- **Satisfação do Usuário**: Feedback sobre respostas dos agentes
- **Tempo de Resolução**: Tempo para resolver problemas dos usuários

---

## 🔧 **Configuração e Manutenção**

### **Variáveis de Ambiente**
```bash
# .env.production
NODE_ENV=production
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_chat
JWT_SECRET=your-jwt-secret
AGENT_SQUAD_API_KEY=your-api-key
```

### **Comandos Úteis**
```bash
# Desenvolvimento
npm run dev
npm run test
npm run lint

# Produção
npm run build
npm start

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Backup
npm run backup:db
npm run backup:redis
```

---

## 🎯 **Conclusão**

Este documento apresenta uma implementação completa do sistema de chat multi-agente baseado no exemplo `chat-demo-app` do Agent Squad Framework, adaptado para nossa arquitetura atual com Next.js, WebSocket para streaming e Docker para containerização.

A implementação é modular, escalável e mantém compatibilidade com nossa arquitetura existente, permitindo evolução gradual e adição de novos agentes conforme necessário.

---

**📅 Cronograma Total: 7 semanas**
**👥 Equipe Recomendada: 2-3 desenvolvedores**
**💰 Investimento Estimado: Médio**
**🎯 ROI Esperado: Alto (melhoria significativa na experiência do usuário)**

---

## 📚 **Referências e Recursos Adicionais**

### **Exemplo Original**
- **Repositório Principal**: [https://github.com/awslabs/agent-squad](https://github.com/awslabs/agent-squad)
- **Chat Demo App**: [https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app](https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app)
- **README do Exemplo**: [https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md](https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md)

### **Arquivos de Referência Analisados**
- `bin/chat-demo-app.ts` - Aplicação principal
- `lib/chat-demo-app-stack.ts` - Stack CDK
- `lambda/multi-agent/index.ts` - Handler multi-agente
- `ui/src/components/ChatWindow.tsx` - Interface de chat
- `ui/src/utils/ApiClient.ts` - Cliente da API
- `ui/src/pages/index.astro` - Página principal

### **Documentação Técnica**
- **Agent Squad Framework**: [Documentação oficial](https://github.com/awslabs/agent-squad)
- **Next.js WebSocket**: [Documentação Next.js](https://nextjs.org/docs)
- **Docker Compose**: [Documentação Docker](https://docs.docker.com/compose/)
- **PostgreSQL**: [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- **Redis**: [Documentação Redis](https://redis.io/docs/)

### **Tecnologias Utilizadas**
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket, Agent Squad Framework
- **Database**: PostgreSQL 15, Redis 7
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Monitoring**: Prometheus, Grafana
