# 🔗 Integração Webhook → CrewAI

## 🚨 Problema Identificado

O webhook **NÃO está entregando mensagens para o CrewAI** devido a um erro crítico na implementação:

### Situação Atual

```typescript
// src/app/api/webhook/uaz/route.ts - Linha 78-84

async function initializeAgentOrchestrator(): Promise<AgentOrchestrator> {
  if (!agentOrchestrator) {
    console.log('🎯 Initializing Agent Orchestrator...');
    
    // ❌ PROBLEMA: Sempre lança erro
    throw new Error('AgentOrchestrator initialization needs to be updated after removing Agent Squad framework');
  }
  return agentOrchestrator;
}
```

### Fluxo Atual (QUEBRADO)

```
WhatsApp (UazAPI)
    ↓
Webhook POST /api/webhook/uaz
    ↓
✅ Valida payload
    ↓
✅ Salva mensagem no banco
    ↓
❌ Tenta inicializar AgentOrchestrator
    ↓
❌ ERRO: "AgentOrchestrator initialization needs to be updated"
    ↓
❌ CrewAI NUNCA É CHAMADO
```

---

## ✅ Solução: Bridge Webhook → CrewAI

### Arquitetura Proposta

```
┌──────────────────────────────────────────────────────────┐
│  WhatsApp (UazAPI)                                       │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Webhook: /api/webhook/uaz (Next.js)                     │
│  ✅ Valida payload                                       │
│  ✅ Salva no banco                                       │
│  ✅ Envia para fila (Celery/Redis) ou HTTP              │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  CrewAI Bridge: /api/crewai/process (Next.js)           │
│  └─ Chama script Python via child_process ou HTTP       │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  CrewAI Python Worker                                    │
│  ✅ Processa mensagem                                    │
│  ✅ Orquestra agentes                                    │
│  ✅ Retorna resposta                                     │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Resposta → UazAPI → WhatsApp                            │
└──────────────────────────────────────────────────────────┘
```

### Opções de Implementação

#### Opção 1: HTTP Bridge (Simples e Rápido) ⭐ RECOMENDADO

**Vantagens:**
- ✅ Implementação rápida
- ✅ Não requer infraestrutura adicional
- ✅ Fácil de debugar
- ✅ Funciona localmente

**Desvantagens:**
- ⚠️ Síncrono (pode ser lento para mensagens complexas)
- ⚠️ Sem retry automático

**Implementação:**

1. **Criar endpoint CrewAI em Next.js** (`/api/crewai/process`)
2. **Endpoint chama script Python** via `child_process.spawn()`
3. **Webhook chama endpoint** em vez de AgentOrchestrator

#### Opção 2: Fila de Mensagens (Produção)

**Vantagens:**
- ✅ Assíncrono e escalável
- ✅ Retry automático
- ✅ Múltiplos workers
- ✅ Ideal para produção

**Desvantagens:**
- ⚠️ Requer Redis/RabbitMQ
- ⚠️ Mais complexo de configurar
- ⚠️ Overhead de infraestrutura

**Implementação:**

1. **Webhook → Fila** (Redis/Celery)
2. **Worker Python processa fila**
3. **Worker chama CrewAI**
4. **Resultado → Callback/Webhook**

#### Opção 3: Servidor CrewAI Standalone (Microserviço)

**Vantagens:**
- ✅ Totalmente desacoplado
- ✅ Escalável independentemente
- ✅ API REST padrão

**Desvantagens:**
- ⚠️ Requer servidor adicional
- ⚠️ Mais complexo de gerenciar
- ⚠️ Latência de rede

**Implementação:**

1. **Servidor FastAPI/Flask** com CrewAI
2. **Webhook chama API CrewAI** via HTTP
3. **CrewAI retorna resposta**

---

## 🚀 Implementação Rápida (Opção 1)

Vou implementar a **Opção 1** por ser a mais rápida e funcional.

### Passo 1: Criar Endpoint Bridge

```typescript
// /src/app/api/crewai/process/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, phoneNumber, context } = await request.json();

    // Validações
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'message and userId are required' },
        { status: 400 }
      );
    }

    console.log('🤖 Processing message with CrewAI:', {
      message: message.substring(0, 50) + '...',
      userId,
      phoneNumber
    });

    // Chamar script Python
    const result = await executeCrewAI({
      user_message: message,
      user_id: userId,
      phone_number: phoneNumber || '',
      context: context || {}
    });

    return NextResponse.json({
      success: true,
      response: result.response,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Error processing with CrewAI:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Função para executar CrewAI Python
async function executeCrewAI(inputs: {
  user_message: string;
  user_id: string;
  phone_number: string;
  context?: any;
}): Promise<{ response: string; metadata: any }> {
  
  return new Promise((resolve, reject) => {
    const crewPath = path.join(process.cwd(), 'crewai-projects', 'falachefe_crew');
    const scriptPath = path.join(crewPath, 'webhook_processor.py');
    
    // Executar Python
    const python = spawn('python', [scriptPath], {
      cwd: crewPath,
      env: {
        ...process.env,
        PYTHONPATH: crewPath
      }
    });

    let stdout = '';
    let stderr = '';

    // Enviar inputs via stdin
    python.stdin.write(JSON.stringify(inputs));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('CrewAI Python Error:', stderr);
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse CrewAI response: ${stdout}`));
        }
      }
    });

    // Timeout de 60 segundos
    setTimeout(() => {
      python.kill();
      reject(new Error('CrewAI execution timeout'));
    }, 60000);
  });
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'crewai-bridge',
    timestamp: new Date().toISOString()
  });
}
```

### Passo 2: Criar Script Python Processor

```python
#!/usr/bin/env python3
"""
Webhook Processor para CrewAI
Recebe JSON via stdin, processa com CrewAI, retorna JSON via stdout
"""

import sys
import json
import os
from datetime import datetime

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from falachefe_crew.crew import FalachefeCrew

def process_webhook_message(inputs: dict) -> dict:
    """
    Processa mensagem do webhook com CrewAI
    
    Args:
        inputs: {
            "user_message": str,
            "user_id": str,
            "phone_number": str,
            "context": dict (opcional)
        }
    
    Returns:
        {
            "response": str,
            "metadata": dict
        }
    """
    try:
        # Criar crew orquestrada
        crew = FalachefeCrew()
        orchestrated = crew.orchestrated_crew()
        
        # Executar crew com inputs
        crew_inputs = {
            "user_message": inputs.get("user_message", ""),
            "user_id": inputs.get("user_id", ""),
            "phone_number": inputs.get("phone_number", ""),
            **inputs.get("context", {})
        }
        
        # Executar
        result = orchestrated.kickoff(inputs=crew_inputs)
        
        # Formatar resposta
        return {
            "success": True,
            "response": str(result),
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "crew_type": "hierarchical",
                "agents_used": ["orchestrator", "specialists"]
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": f"Desculpe, houve um erro ao processar sua mensagem: {str(e)}",
            "metadata": {
                "error": str(e),
                "processed_at": datetime.now().isoformat()
            }
        }

def main():
    """Main function - lê stdin, processa, escreve stdout"""
    try:
        # Ler inputs do stdin
        input_data = sys.stdin.read()
        inputs = json.loads(input_data)
        
        # Processar com CrewAI
        result = process_webhook_message(inputs)
        
        # Escrever resultado no stdout
        print(json.stringify(result))
        
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            "success": False,
            "response": "Erro interno ao processar mensagem",
            "metadata": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Passo 3: Atualizar Webhook

```typescript
// src/app/api/webhook/uaz/route.ts

// SUBSTITUIR função initializeAgentOrchestrator() por:

async function processMessageWithCrewAI(
  message: string,
  userId: string,
  phoneNumber: string,
  context?: any
): Promise<string> {
  
  try {
    console.log('🤖 Calling CrewAI bridge...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crewai/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        phoneNumber,
        context
      })
    });
    
    if (!response.ok) {
      throw new Error(`CrewAI bridge error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'CrewAI processing failed');
    }
    
    console.log('✅ CrewAI response received:', {
      responseLength: data.response.length,
      metadata: data.metadata
    });
    
    return data.response;
    
  } catch (error) {
    console.error('❌ Error calling CrewAI:', error);
    throw error;
  }
}

// SUBSTITUIR no handleMessageEvent (linha 321-402):

// Process message through CrewAI
try {
  const response = await processMessageWithCrewAI(
    orchestratorMessage.text,
    message.sender,
    message.sender, // phone number
    {
      chatName: chat.name,
      senderName: message.senderName,
      isGroup: message.isGroup
    }
  );
  
  console.log('✅ CrewAI processed message successfully');
  
  // Send response back to user via UAZ API if available
  if (response && !message.fromMe) {
    await sendResponseToUserWithWindowValidation(
      chat, 
      response, 
      owner, 
      token, 
      message.sender
    );
  }
  
} catch (error) {
  console.error('❌ Error processing message through CrewAI:', error);
  // Continue with normal message processing even if CrewAI fails
}
```

---

## 🧪 Scripts de Teste

### Teste 1: Endpoint Bridge

```bash
# Testar endpoint bridge
curl -X POST http://localhost:3000/api/crewai/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é o meu saldo?",
    "userId": "test_user",
    "phoneNumber": "+5511999999999"
  }'
```

### Teste 2: Webhook Completo

```bash
# Simular webhook do WhatsApp
curl -X POST http://localhost:3000/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "messages",
    "message": {
      "id": "test-123",
      "text": "Oi, quanto tenho de saldo?",
      "sender": "+5511999999999",
      "chatid": "5511999999999@c.us",
      "type": "text",
      "fromMe": false,
      "messageTimestamp": 1699999999
    },
    "chat": {
      "id": "5511999999999@c.us",
      "name": "Teste Usuario"
    },
    "owner": "test-owner",
    "token": "test-token"
  }'
```

### Teste 3: Script Python Direto

```bash
cd crewai-projects/falachefe_crew

# Testar script diretamente
echo '{"user_message":"Qual meu saldo?","user_id":"test","phone_number":"+5511999999999"}' | \
  python webhook_processor.py
```

---

## 📊 Verificação do Fluxo

### Checklist de Validação

- [ ] **Webhook recebe mensagem**
  - Logs: `UAZ Webhook received`
  
- [ ] **Mensagem salva no banco**
  - Logs: `Message saved successfully`
  
- [ ] **Bridge CrewAI chamado**
  - Logs: `🤖 Calling CrewAI bridge...`
  
- [ ] **Python executado**
  - Logs do Python no console
  
- [ ] **Resposta do CrewAI recebida**
  - Logs: `✅ CrewAI response received`
  
- [ ] **Resposta enviada ao usuário**
  - Logs: `Response sent successfully`

### Logs a Observar

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Logs filtrados
tail -f .next/server.log | grep -E "🤖|CrewAI|Webhook"

# Terminal 3: Enviar mensagem de teste
curl -X POST http://localhost:3000/api/webhook/uaz ...
```

---

## 🐛 Troubleshooting

### Problema: "AgentOrchestrator initialization needs to be updated"

**Solução:** Implementar as mudanças acima (substituir por `processMessageWithCrewAI`)

### Problema: "Python script not found"

**Solução:**
```bash
# Verificar se script existe
ls -la crewai-projects/falachefe_crew/webhook_processor.py

# Criar se não existir
# (código fornecido acima)
```

### Problema: "Module not found"

**Solução:**
```bash
cd crewai-projects/falachefe_crew
source .venv/bin/activate
pip install -r requirements.txt
```

### Problema: "Timeout"

**Solução:** Aumentar timeout no bridge:
```typescript
setTimeout(() => {
  python.kill();
  reject(new Error('CrewAI execution timeout'));
}, 120000); // 2 minutos
```

---

## 📈 Próximos Passos

1. **Implementar solução acima** ⏱️ ~30 minutos
2. **Testar fluxo completo** ⏱️ ~15 minutos
3. **Ajustar e otimizar** ⏱️ ~15 minutos
4. **Documentar resultados**

## 🎯 Evolução Futura

### Curto Prazo
- [ ] Adicionar cache de respostas
- [ ] Implementar retry automático
- [ ] Adicionar métricas (tempo de resposta, taxa de sucesso)

### Médio Prazo
- [ ] Migrar para fila (Celery/Redis)
- [ ] Adicionar workers múltiplos
- [ ] Implementar fallback strategies

### Longo Prazo
- [ ] Microserviço CrewAI standalone
- [ ] Kubernetes deployment
- [ ] Auto-scaling baseado em carga

---

**Status**: 🚨 Implementação Pendente  
**Prioridade**: 🔴 Alta  
**Tempo Estimado**: 1 hora  
**Impacto**: 🎯 Crítico (bloqueia integração WhatsApp → CrewAI)

