# 💻 **Exemplos de Código - Integração Agent Squad**

## 🚀 **Estrutura de Implementação**

### **1. Agent Squad Service (Python)**
```python
# src/agent-squad/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import time
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

### **2. Orchestrator TypeScript**
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

      // Verificar se deve processar
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

### **3. Sistema de Memória**
```typescript
// src/lib/agents/memory/index.ts
import { db } from '@/lib/db';
import { agentConversations, agentMemory, agentInteractions } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export class MemoryManager {
  async getContext(conversationId: string, userId: string): Promise<Record<string, any>> {
    try {
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
        processingTimeMs: 0
      });

      // Atualizar contexto
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
}
```

### **4. Integração com Webhook**
```typescript
// src/app/api/webhook/uaz/route.ts (modificado)
import { FalachefeOrchestrator } from '@/lib/agents/orchestrator';
import { UAZClient } from '@/lib/uaz-api/client';

// ... código existente ...

// Adicionar após processar mensagem
const orchestrator = new FalachefeOrchestrator();
const uazClient = new UAZClient({
  baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
  apiKey: process.env.UAZ_API_KEY || '',
  apiSecret: process.env.UAZ_API_SECRET || '',
  webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
  timeout: 30000,
});

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
}
```

### **5. Dashboard de Agentes**
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
    </div>
  );
}
```

### **6. Docker Compose**
```yaml
# docker-compose.yml (adicionar)
version: '3.8'

services:
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

### **7. Scripts de Deploy**
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

## 🎯 **Próximos Passos**

1. **Configurar ambiente de desenvolvimento**
2. **Implementar Agent Squad Service**
3. **Integrar com webhook UazAPI**
4. **Criar dashboard de monitoramento**
5. **Deploy em produção**

---

**💻 Código pronto para implementação!**
