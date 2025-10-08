# Sistema de Memória do Agente Secretário Falachefe

## Visão Geral

O Sistema de Memória do Falachefe é uma solução robusta e escalável que permite ao agente secretário manter contexto de conversação, aprender com interações e personalizar respostas baseadas no histórico do usuário.

## Arquitetura

### Componentes Principais

1. **MemoryManager** - Gerenciamento central de memórias
2. **ConversationContextManager** - Contexto de conversação
3. **UserProfileManager** - Perfil e preferências do usuário
4. **LearningSystem** - Sistema de aprendizado contínuo
5. **FalachefeMemorySystem** - Orquestrador principal

### Categorias de Memória

```typescript
enum MemoryCategory {
  CONVERSATION = 'conversation',      // Contexto de conversa
  USER_PROFILE = 'user_profile',      // Dados pessoais
  BUSINESS_CONTEXT = 'business',      // Contexto empresarial
  FINANCIAL_DATA = 'financial',       // Dados financeiros
  LEARNING = 'learning',              // Conhecimento aprendido
  PREFERENCES = 'preferences',        // Preferências do usuário
  GOALS = 'goals',                    // Objetivos e metas
  INSIGHTS = 'insights'               // Insights gerados
}
```

## Estrutura do Banco de Dados

### Tabelas Principais

#### agent_memories
```sql
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  conversation_id VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  memory_key VARCHAR(255) NOT NULL,
  memory_value JSONB NOT NULL,
  importance_score REAL DEFAULT 0.5,
  ttl_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

#### conversation_contexts
```sql
CREATE TABLE conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  context_data JSONB NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_memory_profiles
```sql
CREATE TABLE user_memory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) UNIQUE NOT NULL,
  profile_data JSONB NOT NULL,
  preferences JSONB DEFAULT '{}',
  business_context JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### memory_embeddings
```sql
CREATE TABLE memory_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES agent_memories(id) ON DELETE CASCADE,
  embedding TEXT NOT NULL,
  content_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Uso do Sistema

### Inicialização

```typescript
import { falachefeMemorySystem } from '@/agents/memory/memory-system'

// O sistema é inicializado automaticamente como singleton
```

### Processamento de Mensagens

```typescript
const response = await falachefeMemorySystem.processMessageWithMemory(
  userId,
  conversationId,
  message,
  'user'
)

// Response contém:
// - personalizedPrompt: Prompt personalizado com contexto
// - context: Contexto de memória recuperado
// - shouldStore: Se deve armazenar a interação
// - storeData: Dados para armazenar
```

### Armazenamento de Memórias

```typescript
import { memoryManager } from '@/agents/memory/memory-manager'
import { MemoryCategory } from '@/agents/memory/types'

const memory = {
  userId: 'user123',
  conversationId: 'conv456',
  category: MemoryCategory.USER_PROFILE,
  key: 'preferences',
  value: { language: 'pt-BR', theme: 'dark' },
  importance: 0.8
}

await memoryManager.store(memory)
```

### Recuperação de Memórias

```typescript
const memories = await memoryManager.retrieve({
  userId: 'user123',
  category: MemoryCategory.USER_PROFILE,
  limit: 10
})
```

## Integração com o Agente

### Modificação do Agente Secretário

O agente foi modificado para integrar com o sistema de memória:

```typescript
// src/agents/falachefe-secretary-agent.ts
async processMessage(message: string, userId?: string, conversationId?: string) {
  let systemPrompt = this.agentProfile
  
  if (userId && conversationId) {
    const memoryResponse = await falachefeMemorySystem.processMessageWithMemory(
      userId, 
      conversationId, 
      message, 
      'user'
    )
    systemPrompt = memoryResponse.personalizedPrompt
    
    if (memoryResponse.shouldStore && memoryResponse.storeData) {
      await falachefeMemorySystem['memoryManager'].store(memoryResponse.storeData)
    }
  }
  
  // Continuar com processamento normal...
}
```

### Modificação da API

A API foi atualizada para passar `userId` e `conversationId`:

```typescript
// src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { message, userId, conversationId } = await request.json()
  
  const response = await processMessage(message, userId, conversationId)
  
  return NextResponse.json(response)
}
```

### Modificação do Hook React

O hook `useAgentChat` foi atualizado para gerar `conversationId` automaticamente:

```typescript
// src/hooks/use-agent-chat.ts
export function useAgentChat(userId?: string) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  React.useEffect(() => {
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [conversationId])
  
  // Enviar userId e conversationId para a API...
}
```

## Funcionalidades Avançadas

### Sistema de Aprendizado

O sistema aprende com cada interação:

- **Análise de Padrões**: Identifica padrões de comunicação
- **Geração de Insights**: Cria insights baseados no histórico
- **Recomendações**: Sugere ações baseadas no contexto
- **Personalização**: Adapta respostas ao perfil do usuário

### Contexto de Conversação

- **Histórico de Mensagens**: Mantém últimas 50 mensagens
- **Tópicos Atuais**: Rastreia tópicos da conversa
- **Intenções**: Identifica intenções do usuário
- **Variáveis de Contexto**: Armazena dados temporários

### Perfil do Usuário

- **Informações Pessoais**: Nome, email, localização
- **Preferências**: Idioma, tema, notificações
- **Contexto Empresarial**: Tipo de negócio, objetivos
- **Histórico de Interações**: Padrões de uso

## Testes

### Script de Teste

Execute o script de teste para validar o sistema:

```bash
cd /Users/tiagoyokoyama/Falachefe
DATABASE_URL="sua_database_url" npx tsx scripts/test-memory-system.ts
```

### Testes Incluídos

1. ✅ Armazenamento de memórias
2. ✅ Recuperação de memórias
3. ✅ Contexto de conversação
4. ✅ Perfil do usuário
5. ✅ Processamento com memória
6. ✅ Sistema de aprendizado
7. ✅ Limpeza de memórias

## Configuração

### Variáveis de Ambiente

```env
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Dependências

```json
{
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "drizzle-zod": "^0.5.0",
    "postgres": "^3.4.0",
    "uuid": "^9.0.0"
  }
}
```

## Monitoramento e Manutenção

### Limpeza Automática

O sistema inclui limpeza automática de memórias expiradas:

```typescript
await memoryManager.cleanupExpiredMemories()
```

### Estatísticas

```typescript
const stats = await falachefeMemorySystem.getMemoryStats(userId)
```

### Logs

O sistema gera logs detalhados para monitoramento:

```
🧠 Processando mensagem com memória - User: user123, Conversation: conv456
✅ Contexto de memória processado - Memórias: 10, Insights: 7
```

## Próximos Passos

1. **Implementar Cache Redis** para melhor performance
2. **Adicionar Embeddings** para busca semântica
3. **Implementar Análise de Sentimento** para personalização
4. **Adicionar Métricas** de uso e performance
5. **Implementar Backup** automático de memórias

## Conclusão

O Sistema de Memória do Falachefe está totalmente implementado e funcional, proporcionando:

- **Contexto Persistente**: Mantém conversas e preferências
- **Aprendizado Contínuo**: Melhora com cada interação
- **Personalização Avançada**: Adapta respostas ao usuário
- **Escalabilidade**: Suporta múltiplos usuários e conversas
- **Robustez**: Sistema de fallback e tratamento de erros

O agente secretário agora pode oferecer uma experiência verdadeiramente personalizada e inteligente! 🚀


