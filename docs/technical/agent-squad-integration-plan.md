# 🚀 **Plano de Integração Agent Squad - Projeto Falachefe**

## 📋 **Índice**
1. [Visão Geral da Integração](#visão-geral-da-integração)
2. [Análise da Arquitetura Atual](#análise-da-arquitetura-atual)
3. [Arquitetura Proposta](#arquitetura-proposta)
4. [Plano de Implementação Passo a Passo](#plano-de-implementação-passo-a-passo)
5. [Estrutura de Código](#estrutura-de-código)
6. [Configurações e Deploy](#configurações-e-deploy)
7. [Monitoramento e Métricas](#monitoramento-e-métricas)
8. [Cronograma e Marcos](#cronograma-e-marcos)
9. [Riscos e Mitigações](#riscos-e-mitigações)
10. [Próximos Passos](#próximos-passos)

---

## 🎯 **Visão Geral da Integração**

### **Objetivo**
Integrar o framework Agent Squad ao projeto Falachefe existente, criando um sistema de agentes de IA especializados que processam mensagens do WhatsApp via UazAPI, mantendo a arquitetura atual Next.js + Supabase + Better Auth.

### **Benefícios Esperados**
- **Automação Inteligente**: Agentes especializados para diferentes domínios
- **Memória Persistente**: Contexto mantido entre conversas
- **Escalabilidade**: Processamento assíncrono e distribuído
- **Integração Nativa**: Aproveitamento da infraestrutura existente
- **Monitoramento**: Dashboards e métricas em tempo real

### **Princípios da Integração**
1. **Não Quebrar o Existente**: Manter funcionalidades atuais
2. **Incrementar Progressivamente**: Implementação por fases
3. **Aproveitar Infraestrutura**: Usar Supabase, Redis, e UazAPI existentes
4. **Manter Performance**: Resposta < 3 segundos
5. **Facilitar Manutenção**: Código limpo e documentado

---

## 🏗️ **Análise da Arquitetura Atual**

### **Stack Tecnológica Existente**
```yaml
Frontend:
  - Next.js 15.4.6 (App Router)
  - React 19.1.0
  - TypeScript 5
  - Tailwind CSS 4
  - Shadcn/ui
  - Zustand (state management)

Backend:
  - Next.js API Routes
  - Better Auth (autenticação)
  - Drizzle ORM
  - PostgreSQL (via Supabase)
  - Redis (cache/sessões)

Integrações:
  - UazAPI (WhatsApp)
  - OpenAI (AI SDK)
  - Resend (email)
  - Stripe (pagamentos)
```

### **Estrutura de Diretórios Atual**
```
src/
├── app/
│   ├── api/
│   │   └── webhook/uaz/route.ts  # Webhook UazAPI
│   ├── (auth)/                   # Páginas de autenticação
│   ├── (dashboard)/              # Dashboard principal
│   └── admin/                    # Painel administrativo
├── components/
│   ├── ui/                       # Componentes Shadcn
│   └── forms/                    # Formulários
├── lib/
│   ├── auth.ts                   # Configuração Better Auth
│   ├── db.ts                     # Conexão Drizzle
│   ├── uaz-api/                  # Cliente UazAPI
│   └── cache/                    # Redis client
└── services/
    └── message-service.ts        # Processamento de mensagens
```

### **Pontos de Integração Identificados**
1. **Webhook UazAPI** (`/api/webhook/uaz/route.ts`)
2. **MessageService** (`/services/message-service.ts`)
3. **Sistema de Cache** (Redis existente)
4. **Banco de Dados** (PostgreSQL via Supabase)
5. **Sistema de Autenticação** (Better Auth)

---

## 🏛️ **Arquitetura Proposta**

### **Diagrama de Arquitetura Integrada**
```
┌─────────────────────────────────────────────────────────────┐
│                    FALACHEFE + AGENT SQUAD                 │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp → UazAPI → Webhook → Orchestrator → Agent Squad │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              NEXT.JS APPLICATION                       │ │
│  │  • Webhook Handler (UazAPI)                           │ │
│  │  • Agent Orchestrator                                 │ │
│  │  • Memory Management                                   │ │
│  │  • Dashboard & Admin Panel                            │ │
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
│  │  • Supabase PostgreSQL (Conversations, Users, Context) │ │
│  │  • Redis (Session Cache, Queue, Memory)                │ │
│  │  • File System (Logs, Temp Files)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes da Integração**

#### **1. Agent Orchestrator**
- **Localização**: `src/lib/agents/orchestrator.ts`
- **Responsabilidade**: Roteamento inteligente de mensagens
- **Integração**: Chama Agent Squad via API interna

#### **2. Agent Squad Service**
- **Localização**: `src/lib/agents/agent-squad-service.ts`
- **Responsabilidade**: Interface com framework Agent Squad
- **Tecnologia**: Python + FastAPI (container separado)

#### **3. Memory System**
- **Localização**: `src/lib/agents/memory/`
- **Responsabilidade**: Gestão de memória individual e compartilhada
- **Storage**: Redis + PostgreSQL

#### **4. Webhook Integration**
- **Localização**: `src/app/api/webhook/uaz/route.ts` (modificado)
- **Responsabilidade**: Processar mensagens via Agent Squad
- **Fluxo**: UazAPI → Webhook → Orchestrator → Agent Squad

---

## 🛠️ **Plano de Implementação Passo a Passo**

### **Fase 1: Preparação e Infraestrutura (Semana 1)**

#### **Passo 1.1: Configurar Ambiente de Desenvolvimento**
```bash
# 1. Instalar dependências Python
pip install agent-squad==0.8.1
pip install fastapi uvicorn openai redis asyncpg

# 2. Configurar Docker para Agent Squad
mkdir -p src/agent-squad
cd src/agent-squad
# Criar Dockerfile e requirements.txt
```

#### **Passo 1.2: Criar Estrutura de Diretórios**
```bash
src/
├── agents/
│   ├── orchestrator.ts           # Orchestrator principal
│   ├── agent-squad-service.ts    # Interface com Agent Squad
│   ├── memory/                   # Sistema de memória
│   │   ├── individual.ts
│   │   ├── shared.ts
│   │   └── index.ts
│   └── types.ts                  # Tipos TypeScript
├── agent-squad/                  # Serviço Python
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── agents/
│       ├── financial.py
│       ├── cashflow.py
│       ├── marketing.py
│       └── hr.py
└── app/api/
    └── agents/                   # APIs dos agentes
        ├── route.ts
        └── memory/route.ts
```

#### **Passo 1.3: Configurar Banco de Dados**
```sql
-- Tabelas para Agent Squad
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    conversation_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    memory_type TEXT NOT NULL, -- 'individual' | 'shared'
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    confidence FLOAT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Fase 2: Implementação Core (Semanas 2-3)**

#### **Passo 2.1: Criar Agent Squad Service (Python)**
```python
# src/agent-squad/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import json
from typing import Dict, Any
from agents.orchestrator import AgentOrchestrator
from memory.memory_manager import MemoryManager

app = FastAPI(title="Falachefe Agent Squad")

# Inicializar componentes
orchestrator = AgentOrchestrator()
memory_manager = MemoryManager()

class MessageRequest(BaseModel):
    message: str
    conversation_id: str
    user_id: str
    context: Dict[str, Any] = {}

class MessageResponse(BaseModel):
    response: str
    agent_type: str
    confidence: float
    processing_time_ms: int

@app.post("/process-message", response_model=MessageResponse)
async def process_message(request: MessageRequest):
    """Processa mensagem via Agent Squad"""
    try:
        start_time = time.time()
        
        # Obter contexto da memória
        context = await memory_manager.get_context(
            request.conversation_id, 
            request.user_id
        )
        
        # Processar via orchestrator
        result = await orchestrator.process_message(
            request.message,
            context
        )
        
        # Salvar na memória
        await memory_manager.save_interaction(
            request.conversation_id,
            request.user_id,
            request.message,
            result.response,
            result.agent_type,
            result.confidence
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return MessageResponse(
            response=result.response,
            agent_type=result.agent_type,
            confidence=result.confidence,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-squad"}
```

#### **Passo 2.2: Implementar Orchestrator TypeScript**
```typescript
// src/lib/agents/orchestrator.ts
import { AgentSquadService } from './agent-squad-service';
import { MemoryManager } from './memory';
import { UAZMessage, UAZChat } from '@/lib/uaz-api/types';

export interface AgentContext {
  conversationId: string;
  userId: string;
  userMessage: string;
  chatInfo: UAZChat;
  previousContext?: Record<string, any>;
}

export interface AgentResponse {
  response: string;
  agentType: string;
  confidence: number;
  processingTimeMs: number;
  shouldSendToUaz: boolean;
}

export class FalachefeOrchestrator {
  private agentSquadService: AgentSquadService;
  private memoryManager: MemoryManager;

  constructor() {
    this.agentSquadService = new AgentSquadService();
    this.memoryManager = new MemoryManager();
  }

  async processMessage(
    message: UAZMessage, 
    chat: UAZChat, 
    owner: string
  ): Promise<AgentResponse> {
    try {
      // Extrair contexto da mensagem
      const context: AgentContext = {
        conversationId: chat.id,
        userId: message.sender,
        userMessage: message.text || message.content || '',
        chatInfo: chat,
        previousContext: await this.memoryManager.getContext(chat.id, message.sender)
      };

      // Verificar se deve processar (não processar mensagens próprias)
      if (message.fromMe) {
        return {
          response: '',
          agentType: 'system',
          confidence: 1.0,
          processingTimeMs: 0,
          shouldSendToUaz: false
        };
      }

      // Processar via Agent Squad
      const result = await this.agentSquadService.processMessage(context);

      // Salvar interação na memória
      await this.memoryManager.saveInteraction(
        context.conversationId,
        context.userId,
        context.userMessage,
        result.response,
        result.agentType,
        result.confidence
      );

      return {
        ...result,
        shouldSendToUaz: true
      };

    } catch (error) {
      console.error('Erro no orchestrator:', error);
      
      // Resposta de fallback
      return {
        response: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
        agentType: 'system',
        confidence: 0.0,
        processingTimeMs: 0,
        shouldSendToUaz: true
      };
    }
  }
}
```

#### **Passo 2.3: Implementar Agent Squad Service**
```typescript
// src/lib/agents/agent-squad-service.ts
import { AgentContext, AgentResponse } from './orchestrator';

export class AgentSquadService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AGENT_SQUAD_URL || 'http://localhost:8001';
    this.apiKey = process.env.AGENT_SQUAD_API_KEY || '';
  }

  async processMessage(context: AgentContext): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          message: context.userMessage,
          conversation_id: context.conversationId,
          user_id: context.userId,
          context: context.previousContext || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Agent Squad API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        response: result.response,
        agentType: result.agent_type,
        confidence: result.confidence,
        processingTimeMs: result.processing_time_ms
      };

    } catch (error) {
      console.error('Erro ao chamar Agent Squad:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
```

#### **Passo 2.4: Implementar Sistema de Memória**
```typescript
// src/lib/agents/memory/index.ts
import { db } from '@/lib/db';
import { agentConversations, agentMemory, agentInteractions } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export class MemoryManager {
  async getContext(conversationId: string, userId: string): Promise<Record<string, any>> {
    try {
      // Buscar contexto da conversa
      const conversation = await db
        .select()
        .from(agentConversations)
        .where(
          and(
            eq(agentConversations.conversationId, conversationId),
            eq(agentConversations.userId, userId)
          )
        )
        .limit(1);

      if (conversation.length === 0) {
        return {};
      }

      return conversation[0].context || {};

    } catch (error) {
      console.error('Erro ao buscar contexto:', error);
      return {};
    }
  }

  async saveInteraction(
    conversationId: string,
    userId: string,
    userMessage: string,
    agentResponse: string,
    agentType: string,
    confidence: number
  ): Promise<void> {
    try {
      // Salvar interação
      await db.insert(agentInteractions).values({
        conversationId,
        agentType,
        userMessage,
        agentResponse,
        confidence,
        processingTimeMs: 0 // Será preenchido pelo Agent Squad
      });

      // Atualizar contexto da conversa
      await db
        .update(agentConversations)
        .set({
          context: {
            lastAgent: agentType,
            lastMessage: userMessage,
            lastResponse: agentResponse,
            confidence: confidence,
            updatedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(
          and(
            eq(agentConversations.conversationId, conversationId),
            eq(agentConversations.userId, userId)
          )
        );

    } catch (error) {
      console.error('Erro ao salvar interação:', error);
    }
  }

  async getConversationHistory(
    conversationId: string, 
    limit: number = 10
  ): Promise<any[]> {
    try {
      const history = await db
        .select()
        .from(agentInteractions)
        .where(eq(agentInteractions.conversationId, conversationId))
        .orderBy(desc(agentInteractions.createdAt))
        .limit(limit);

      return history.reverse(); // Mais antigo primeiro

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }
}
```

### **Fase 3: Integração com Webhook (Semana 4)**

#### **Passo 3.1: Modificar Webhook UazAPI**
```typescript
// src/app/api/webhook/uaz/route.ts (modificado)
import { FalachefeOrchestrator } from '@/lib/agents/orchestrator';
import { UAZClient } from '@/lib/uaz-api/client';

// ... código existente ...

// Adicionar após a linha 240 (TODO: Implementar roteamento para orchestrator)
const orchestrator = new FalachefeOrchestrator();
const uazClient = new UAZClient({
  baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
  apiKey: process.env.UAZ_API_KEY || '',
  apiSecret: process.env.UAZ_API_SECRET || '',
  webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
  timeout: 30000,
});

// Substituir o TODO por:
try {
  // Processar mensagem via Agent Squad
  const agentResponse = await orchestrator.processMessage(message, chat, owner);
  
  if (agentResponse.shouldSendToUaz && agentResponse.response) {
    // Enviar resposta via UazAPI
    await uazClient.sendMessage({
      chatId: chat.id,
      message: agentResponse.response,
      messageType: 'text'
    });
    
    console.log('Resposta enviada via Agent Squad:', {
      agentType: agentResponse.agentType,
      confidence: agentResponse.confidence,
      processingTime: agentResponse.processingTimeMs
    });
  }
} catch (error) {
  console.error('Erro no Agent Squad:', error);
  // Continuar sem falhar o webhook
}
```

#### **Passo 3.2: Criar APIs para Dashboard**
```typescript
// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FalachefeOrchestrator } from '@/lib/agents/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const orchestrator = new FalachefeOrchestrator();
    
    // Buscar estatísticas dos agentes
    const stats = await orchestrator.getAgentStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId } = await request.json();
    
    const orchestrator = new FalachefeOrchestrator();
    const response = await orchestrator.processMessage({
      message,
      conversationId,
      userId,
      chatInfo: {} as any,
      userMessage: message
    });
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
```

### **Fase 4: Dashboard e Monitoramento (Semana 5)**

#### **Passo 4.1: Criar Dashboard de Agentes**
```typescript
// src/app/(dashboard)/agents/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentStats {
  totalInteractions: number;
  averageConfidence: number;
  averageResponseTime: number;
  agentBreakdown: {
    [agentType: string]: {
      count: number;
      avgConfidence: number;
      avgResponseTime: number;
    };
  };
}

export default function AgentsPage() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agentes de IA</h1>
        <Button onClick={fetchAgentStats}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Interações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalInteractions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confiança Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageConfidence ? 
                `${(stats.averageConfidence * 100).toFixed(1)}%` : 
                '0%'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageResponseTime ? 
                `${stats.averageResponseTime}ms` : 
                '0ms'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.agentBreakdown && Object.entries(stats.agentBreakdown).map(([agentType, data]) => (
              <div key={agentType} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold capitalize">
                    {agentType.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {data.count} interações
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Badge variant="secondary">
                    {(data.avgConfidence * 100).toFixed(1)}% confiança
                  </Badge>
                  <Badge variant="outline">
                    {data.avgResponseTime}ms
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Fase 5: Deploy e Produção (Semana 6)**

#### **Passo 5.1: Configurar Docker Compose**
```yaml
# docker-compose.yml (adicionar ao existente)
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
      - LOG_LEVEL=INFO
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

#### **Passo 5.2: Configurar Variáveis de Ambiente**
```bash
# .env.local (adicionar)
AGENT_SQUAD_URL=http://localhost:8001
AGENT_SQUAD_API_KEY=your-agent-squad-api-key
AGENT_SQUAD_ENABLED=true
```

#### **Passo 5.3: Scripts de Deploy**
```bash
#!/bin/bash
# scripts/deploy-agent-squad.sh

echo "🚀 Deploying Agent Squad integration..."

# 1. Build Agent Squad container
echo "🔨 Building Agent Squad container..."
docker build -t falachefe-agent-squad ./src/agent-squad

# 2. Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

# 3. Start services
echo "🚀 Starting services..."
docker-compose up -d agent-squad

# 4. Wait for health check
echo "🏥 Waiting for health check..."
sleep 30
curl -f http://localhost:8001/health || {
    echo "❌ Agent Squad health check failed"
    exit 1
}

echo "✅ Agent Squad deployed successfully!"
```

---

## 📁 **Estrutura de Código**

### **Arquivos a Criar/Modificar**

#### **Novos Arquivos**
```
src/
├── agents/
│   ├── orchestrator.ts
│   ├── agent-squad-service.ts
│   ├── memory/
│   │   ├── index.ts
│   │   ├── individual.ts
│   │   └── shared.ts
│   └── types.ts
├── agent-squad/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── agents/
│       ├── __init__.py
│       ├── financial.py
│       ├── cashflow.py
│       ├── marketing.py
│       └── hr.py
├── app/api/agents/
│   ├── route.ts
│   └── memory/route.ts
├── app/(dashboard)/agents/
│   └── page.tsx
└── lib/schema.ts (modificar)
```

#### **Arquivos a Modificar**
```
src/
├── app/api/webhook/uaz/route.ts (modificar)
├── lib/schema.ts (adicionar tabelas)
├── package.json (adicionar scripts)
└── docker-compose.yml (adicionar serviço)
```

---

## ⚙️ **Configurações e Deploy**

### **Configuração de Desenvolvimento**
```bash
# 1. Instalar dependências Python
cd src/agent-squad
pip install -r requirements.txt

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Iniciar serviços
docker-compose up -d postgres redis
npm run dev
python src/agent-squad/main.py
```

### **Configuração de Produção**
```bash
# 1. Build e deploy
./scripts/deploy-agent-squad.sh

# 2. Verificar saúde
curl http://localhost:8001/health

# 3. Monitorar logs
docker-compose logs -f agent-squad
```

### **Configuração do Vercel**
```json
// vercel.json (adicionar)
{
  "functions": {
    "src/agent-squad/main.py": {
      "runtime": "python3.9"
    }
  },
  "env": {
    "AGENT_SQUAD_URL": "https://your-vercel-app.vercel.app/api/agent-squad"
  }
}
```

---

## 📊 **Monitoramento e Métricas**

### **Métricas Implementadas**
- **Performance**: Tempo de resposta, throughput
- **Qualidade**: Confiança, precisão de classificação
- **Uso**: Interações por agente, usuário
- **Sistema**: CPU, memória, erros

### **Dashboards**
- **Dashboard Principal**: Visão geral dos agentes
- **Dashboard por Agente**: Performance individual
- **Dashboard de Conversas**: Histórico e contexto
- **Dashboard de Sistema**: Saúde e performance

### **Alertas**
- **Tempo de Resposta**: > 5 segundos
- **Confiança Baixa**: < 70%
- **Erros**: > 5% das requisições
- **Sistema**: CPU > 80%, Memória > 90%

---

## 📅 **Cronograma e Marcos**

### **Semana 1: Preparação**
- [ ] Configurar ambiente de desenvolvimento
- [ ] Criar estrutura de diretórios
- [ ] Configurar banco de dados
- [ ] Implementar Agent Squad Service básico

### **Semana 2: Core Implementation**
- [ ] Implementar Orchestrator
- [ ] Implementar sistema de memória
- [ ] Criar agentes especializados
- [ ] Testes unitários

### **Semana 3: Integração**
- [ ] Integrar com webhook UazAPI
- [ ] Implementar APIs de dashboard
- [ ] Testes de integração
- [ ] Documentação

### **Semana 4: Dashboard**
- [ ] Criar dashboard de agentes
- [ ] Implementar monitoramento
- [ ] Configurar alertas
- [ ] Testes de usuário

### **Semana 5: Deploy**
- [ ] Configurar Docker Compose
- [ ] Deploy em staging
- [ ] Testes de produção
- [ ] Deploy em produção

### **Semana 6: Otimização**
- [ ] Monitoramento ativo
- [ ] Otimizações de performance
- [ ] Ajustes baseados em feedback
- [ ] Documentação final

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
1. **Aprovar plano de integração**
2. **Configurar ambiente de desenvolvimento**
3. **Criar estrutura de diretórios**
4. **Implementar Agent Squad Service básico**

### **Curto Prazo (2-4 semanas)**
1. **Implementar Orchestrator completo**
2. **Integrar com webhook UazAPI**
3. **Criar dashboard básico**
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

### **Comunicação**
- **Daily Standups**: Progresso e bloqueios
- **Weekly Reviews**: Marcos e ajustes
- **Slack Channel**: #agent-squad-integration
- **GitHub Issues**: Tracking de tarefas

---

**🎉 Este plano fornece uma rota clara e detalhada para integrar o Agent Squad ao projeto Falachefe, mantendo a arquitetura existente e adicionando capacidades avançadas de IA de forma incremental e segura.**

*Última atualização: Janeiro 2025*
