# 🌐 Integração do Chat Web com CrewAI

## 📋 Visão Geral

Este documento descreve a integração completa entre a interface web de chat e os agentes CrewAI no projeto Falachefe.

## 🏗️ Arquitetura

```mermaid
graph TB
    A[Interface Web /chat] -->|1. POST| B[/api/chat]
    B -->|2. POST| C[/api/crewai/process]
    C -->|3. spawn| D[webhook_processor.py]
    D -->|4. kickoff| E[FalachefeCrew]
    E -->|5. processa| F[Agentes CrewAI]
    F -->|6. retorna| E
    E -->|7. resposta| D
    D -->|8. JSON| C
    C -->|9. JSON| B
    B -->|10. JSON| A
    
    style A fill:#e1f5ff
    style B fill:#b3e5fc
    style C fill:#81d4fa
    style D fill:#4fc3f7
    style E fill:#29b6f6
    style F fill:#039be5
```

## 📁 Componentes

### 1. Interface Web (`/src/app/chat/page.tsx`)

**Localização**: `/chat`

**Características**:
- Interface moderna com suporte a Markdown
- Renderização de código, tabelas, listas
- Indicadores de carregamento
- Tratamento de erros
- Histórico de conversação
- Cópia de mensagens

**Hook**: `useAgentChat` (`/src/hooks/use-agent-chat.ts`)

```typescript
const { 
  messages,        // Histórico de mensagens
  isLoading,       // Estado de processamento
  error,           // Mensagem de erro
  conversationId,  // ID da conversa
  sendMessage,     // Enviar mensagem
  clearChat,       // Limpar histórico
  retryLastMessage // Tentar novamente
} = useAgentChat(session?.user?.id);
```

### 2. Endpoint Web Chat (`/src/app/api/chat/route.ts`)

**Método**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "Olá! Qual é o meu saldo?",
  "userId": "user-123",
  "conversationId": "conv-456",
  "includeUserProfile": true,
  "forceToolUse": true
}
```

**Response**:
```json
{
  "success": true,
  "content": "Seu saldo atual é R$ 1.234,56...",
  "metadata": {
    "processing_time_ms": 2500,
    "conversationId": "conv-456",
    "source": "web-chat",
    "timestamp": "2025-10-11T..."
  }
}
```

**Validações**:
- ✅ Mensagem não vazia
- ✅ UserId presente
- ✅ Formato JSON válido

### 3. Endpoint CrewAI (`/src/app/api/crewai/process/route.ts`)

**Método**: `POST /api/crewai/process`

**Request Body**:
```json
{
  "message": "Qual é o meu saldo?",
  "userId": "user-123",
  "phoneNumber": "",
  "context": {
    "source": "web-chat",
    "conversationId": "conv-456",
    "includeUserProfile": true
  }
}
```

**Processo**:
1. Valida entrada
2. Spawns processo Python
3. Executa `webhook_processor.py`
4. Aguarda resposta (timeout 60s)
5. Retorna JSON estruturado

### 4. Processador CrewAI (`webhook_processor.py`)

**Localização**: `/crewai-projects/falachefe_crew/webhook_processor.py`

**Fluxo**:
```python
def process_webhook_message(inputs):
    # 1. Valida inputs
    validate_inputs(inputs)
    
    # 2. Inicializa FalachefeCrew
    crew = FalachefeCrew()
    
    # 3. Executa agentes
    result = crew.kickoff(inputs={
        'user_message': inputs['user_message'],
        'user_id': inputs['user_id'],
        'context': inputs.get('context', {})
    })
    
    # 4. Retorna resposta
    return {
        'success': True,
        'response': result.output,
        'metadata': {...}
    }
```

## 🔄 Fluxo Completo

### Cenário: Usuário pergunta sobre saldo

1. **Usuário** digita na interface web:
   ```
   "Qual é o meu saldo atual?"
   ```

2. **Interface Web** (`ChatPage`) chama hook:
   ```typescript
   sendMessage("Qual é o meu saldo atual?")
   ```

3. **Hook** (`useAgentChat`) faz requisição:
   ```typescript
   fetch('/api/chat', {
     method: 'POST',
     body: JSON.stringify({
       message: "Qual é o meu saldo atual?",
       userId: "user-123",
       conversationId: "conv-456"
     })
   })
   ```

4. **Endpoint `/api/chat`** valida e encaminha:
   ```typescript
   fetch('/api/crewai/process', {
     method: 'POST',
     body: JSON.stringify({
       message: "Qual é o meu saldo atual?",
       userId: "user-123",
       context: { source: 'web-chat', ... }
     })
   })
   ```

5. **Endpoint `/api/crewai/process`** executa Python:
   ```typescript
   spawn('python3', ['webhook_processor.py'], {
     stdin: JSON.stringify(inputs)
   })
   ```

6. **Python** inicializa e executa crew:
   ```python
   crew = FalachefeCrew()
   result = crew.kickoff(inputs={...})
   ```

7. **FalachefeCrew** orquestra agentes:
   - FinancialAgent analisa pergunta
   - Consulta ferramenta de saldo
   - Formata resposta

8. **Resposta** retorna pela stack:
   ```
   Python → /api/crewai/process → /api/chat → Hook → Interface
   ```

9. **Usuário** vê resposta formatada:
   ```markdown
   ## Seu Saldo Atual
   
   💰 **Saldo disponível**: R$ 1.234,56
   
   - Entradas: R$ 5.000,00
   - Saídas: R$ 3.765,44
   ```

## 🧪 Como Testar

### Teste 1: Localmente

```bash
# Terminal 1: Inicie o servidor
npm run dev

# Terminal 2: Execute o teste
./scripts/testing/test-web-chat.sh local
```

### Teste 2: Via Interface Web

1. Abra: `http://localhost:3000/chat`
2. Faça login
3. Digite uma mensagem
4. Aguarde resposta (~10-30s)

### Teste 3: Via cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é o meu saldo?",
    "userId": "test-user",
    "conversationId": "test-conv",
    "includeUserProfile": true
  }'
```

## 🚀 Deploy

### ⚠️ Limitações na Vercel

A Vercel **NÃO suporta Python** por padrão no runtime serverless. Portanto:

❌ **Não funciona em produção na Vercel**:
- `/api/crewai/process` falha ao tentar executar Python
- `spawn('python3')` retorna erro

✅ **Funciona localmente**:
- Ambiente de desenvolvimento tem Python instalado
- Tudo funciona perfeitamente em `npm run dev`

### Soluções para Produção

#### Opção A: Deploy CrewAI Separadamente (Recomendado)

**Serviços Recomendados**:
- Railway.app (mais fácil para Python)
- Render.com (suporte nativo a Python)
- Google Cloud Run (containerizado)
- Heroku (plataforma madura)

**Arquitetura**:
```
Interface Web (Vercel)
    ↓
/api/chat (Vercel)
    ↓
CrewAI Service (Railway)
    ↓
FalachefeCrew (Python)
```

**Mudança Necessária**:
```typescript
// src/app/api/chat/route.ts
const crewAIUrl = process.env.CREWAI_SERVICE_URL || 
                  'https://falachefe-crewai.railway.app/process';
```

#### Opção B: Vercel Python Runtime

Converter para Vercel Functions (Beta):

```python
# api-python/chat.py
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Processar com CrewAI
        ...
```

```json
// vercel.json
{
  "functions": {
    "api-python/chat.py": {
      "runtime": "python3.9"
    }
  }
}
```

#### Opção C: Fila Assíncrona (Upstash QStash)

Arquitetura desacoplada:
```
/api/chat → Upstash QStash → Worker Python → Callback
```

## 📊 Performance

### Métricas Esperadas

| Métrica | Local | Produção (Railway) |
|---------|-------|-------------------|
| Latência total | 10-30s | 15-40s |
| /api/chat | <100ms | <200ms |
| /api/crewai/process | 10-30s | 15-40s |
| Python spawn | <500ms | <1s |
| CrewAI processing | 10-25s | 15-35s |

### Otimizações

1. **Cache de Respostas**:
   ```typescript
   // Implementar cache Redis para perguntas comuns
   const cached = await redis.get(`chat:${messageHash}`);
   if (cached) return cached;
   ```

2. **Streaming de Resposta**:
   ```typescript
   // Implementar Server-Sent Events (SSE)
   // para streaming da resposta do agente
   ```

3. **Timeout Configurável**:
   ```typescript
   const CREWAI_TIMEOUT = parseInt(
     process.env.CREWAI_TIMEOUT_MS || '60000'
   );
   ```

## 🔍 Debugging

### Logs Importantes

**Interface Web** (Console do navegador):
```
🤖 Agent Message: {...}
📨 API Response: {...}
```

**Endpoint /api/chat** (Vercel Logs):
```
🌐 Web chat message received: {...}
🤖 Calling CrewAI endpoint: {...}
✅ CrewAI response received: {...}
```

**Endpoint /api/crewai/process** (Vercel Logs):
```
🤖 Processing message with CrewAI: {...}
🐍 Executing Python script: {...}
[Python] 📥 Processing message: ...
[Python] 🚀 Initializing FalachefeCrew...
[Python] ✅ Crew executed successfully
✅ CrewAI processing completed: {...}
```

### Problemas Comuns

#### 1. "Erro ao processar mensagem"

**Causa**: Endpoint CrewAI não está respondendo

**Solução**:
```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/crewai/process

# Verificar logs
tail -f ~/.npm/_logs/*.log
```

#### 2. "Python não disponível"

**Causa**: Tentando executar em produção (Vercel)

**Solução**: Deploy CrewAI separadamente (ver Opção A acima)

#### 3. Timeout após 60s

**Causa**: CrewAI demorou muito para processar

**Solução**:
```typescript
// Aumentar timeout
const timeout = setTimeout(() => {
  python.kill('SIGTERM');
}, 120000); // 2 minutos
```

## 📚 Referências

- [CrewAI Documentation](https://docs.crewai.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Railway Python Deploy](https://docs.railway.app/guides/python)

## 🎯 Checklist de Implementação

- [x] Criar endpoint `/api/chat`
- [x] Implementar hook `useAgentChat`
- [x] Criar interface web de chat
- [x] Integrar com `/api/crewai/process`
- [x] Adicionar validações
- [x] Implementar tratamento de erros
- [x] Criar testes automatizados
- [x] Documentar fluxo completo
- [ ] Deploy CrewAI em ambiente separado
- [ ] Implementar cache de respostas
- [ ] Adicionar streaming de resposta (SSE)
- [ ] Implementar analytics/métricas
- [ ] Adicionar rate limiting
- [ ] Implementar histórico persistente

## 📝 Notas de Desenvolvimento

**Data de Criação**: 11/10/2025  
**Última Atualização**: 11/10/2025  
**Status**: ✅ Implementado (funciona localmente)  
**Produção**: ⚠️ Requer deploy Python separado

