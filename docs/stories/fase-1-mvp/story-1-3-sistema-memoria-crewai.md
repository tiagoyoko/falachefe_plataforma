# 🧠 Story 1.3: Sistema de Memória CrewAI

## 📋 **Informações da Story**

**ID**: STORY-1.3  
**Épico**: CrewAI Fundação - Infraestrutura Base  
**Sprint**: 1.2 - Banco de Dados e Memória  
**Prioridade**: Crítica  
**Complexidade**: Alta  
**Estimativa**: 8 story points  
**Desenvolvedor**: [A definir]  
**QA**: [A definir]  

---

## 🎯 **Objetivo**

Como agente, quero ter um sistema de memória persistente para lembrar de interações anteriores e contexto, permitindo conversas mais inteligentes e personalizadas.

---

## 📝 **Descrição Detalhada**

Esta story implementa o sistema de memória CrewAI que permite aos agentes armazenar, recuperar e gerenciar informações contextuais de forma persistente. O sistema suporta diferentes tipos de memória, busca semântica e isolamento por tenant.

### **Contexto de Negócio**
- Agentes precisam lembrar de preferências do usuário
- Contexto de conversas anteriores deve ser preservado
- Fatos importantes devem ser armazenados permanentemente
- Sistema de aprendizado contínuo baseado em interações
- Isolamento completo entre diferentes empresas/usuários

### **Escopo Técnico**
- Implementação do CrewMemorySystem
- Sistema de classificação e indexação de memórias
- Busca semântica e recuperação contextual
- Gerenciamento de ciclo de vida das memórias
- Integração com banco de dados e Redis

---

## ✅ **Critérios de Aceitação**

### **CA1: CrewMemorySystem Implementado**
- [ ] CrewMemorySystem implementado com interface completa
- [ ] Suporte a múltiplos tipos de memória
- [ ] Armazenamento persistente no banco de dados
- [ ] Cache em Redis para performance
- [ ] Sistema de busca e recuperação

### **CA2: Tipos de Memória Suportados**
- [ ] Memória de fatos (facts) - informações objetivas
- [ ] Memória de preferências (preferences) - gostos do usuário
- [ ] Memória de contexto (context) - situação atual
- [ ] Memória de aprendizado (learning) - padrões identificados

### **CA3: Sistema de Busca e Recuperação**
- [ ] Busca por similaridade semântica
- [ ] Busca por tipo de memória
- [ ] Busca por importância e relevância
- [ ] Filtros por data e expiração
- [ ] Ranking por relevância contextual

### **CA4: Isolamento por Tenant**
- [ ] Memórias isoladas por empresa/usuário
- [ ] Zero vazamento de dados entre tenants
- [ ] Controle de acesso baseado em permissões
- [ ] Validação de ownership de memórias

---

## 🔧 **Tarefas Técnicas**

### **T1.3.1: Implementação do CrewMemorySystem**

#### **Interface Principal**
```typescript
// src/lib/crewai/memory/CrewMemorySystem.ts
export interface CrewMemorySystem {
  // Armazenamento
  storeMemory(memory: CrewMemory): Promise<string>;
  storeMemories(memories: CrewMemory[]): Promise<string[]>;
  
  // Recuperação
  retrieveMemory(id: string): Promise<CrewMemory | null>;
  searchMemories(query: MemorySearchQuery): Promise<CrewMemory[]>;
  getMemoriesByType(type: MemoryType, limit?: number): Promise<CrewMemory[]>;
  
  // Gerenciamento
  updateMemory(id: string, updates: Partial<CrewMemory>): Promise<void>;
  deleteMemory(id: string): Promise<void>;
  expireMemories(): Promise<number>;
  
  // Métricas
  getMemoryStats(): Promise<MemoryStats>;
}

export interface CrewMemory {
  id: string;
  crewId: string;
  memoryType: MemoryType;
  content: string;
  metadata?: Record<string, any>;
  importanceScore: number;
  accessCount: number;
  lastAccessed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum MemoryType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  CONTEXT = 'context',
  LEARNING = 'learning'
}
```

#### **Implementação Principal**
```typescript
// src/lib/crewai/memory/CrewMemorySystemImpl.ts
export class CrewMemorySystemImpl implements CrewMemorySystem {
  constructor(
    private db: Database,
    private redis: Redis,
    private embeddingService: EmbeddingService
  ) {}

  async storeMemory(memory: CrewMemory): Promise<string> {
    // 1. Validar dados de entrada
    this.validateMemory(memory);
    
    // 2. Gerar embedding para busca semântica
    const embedding = await this.embeddingService.generateEmbedding(memory.content);
    
    // 3. Armazenar no banco de dados
    const result = await this.db.crew_memories.create({
      data: {
        ...memory,
        embedding: embedding,
        importance_score: memory.importanceScore,
        expires_at: memory.expiresAt
      }
    });
    
    // 4. Cache no Redis
    await this.cacheMemory(result);
    
    return result.id;
  }

  async searchMemories(query: MemorySearchQuery): Promise<CrewMemory[]> {
    // 1. Buscar no cache primeiro
    const cached = await this.getCachedSearchResults(query);
    if (cached) return cached;
    
    // 2. Busca semântica no banco
    const results = await this.performSemanticSearch(query);
    
    // 3. Cache resultados
    await this.cacheSearchResults(query, results);
    
    return results;
  }

  private async performSemanticSearch(query: MemorySearchQuery): Promise<CrewMemory[]> {
    // Implementar busca por similaridade usando embeddings
    const queryEmbedding = await this.embeddingService.generateEmbedding(query.text);
    
    return await this.db.query(`
      SELECT cm.*, 
             (cm.embedding <=> $1) as similarity
      FROM crew_memories cm
      WHERE cm.crew_id = $2
        AND ($3::text[] IS NULL OR cm.memory_type = ANY($3::text[]))
        AND cm.expires_at > NOW()
      ORDER BY similarity ASC, cm.importance_score DESC
      LIMIT $4
    `, [queryEmbedding, query.crewId, query.types, query.limit || 10]);
  }
}
```

### **T1.3.2: MemoryManager para Operações Complexas**

```typescript
// src/lib/crewai/memory/MemoryManager.ts
export class MemoryManager {
  constructor(private memorySystem: CrewMemorySystem) {}

  async storeUserPreference(
    crewId: string, 
    userId: string, 
    preference: string, 
    context?: string
  ): Promise<string> {
    const memory: CrewMemory = {
      id: generateId(),
      crewId,
      memoryType: MemoryType.PREFERENCE,
      content: preference,
      metadata: {
        userId,
        context,
        source: 'user_interaction'
      },
      importanceScore: 0.8,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.memorySystem.storeMemory(memory);
  }

  async storeFact(
    crewId: string,
    fact: string,
    source: string,
    importance: number = 0.6
  ): Promise<string> {
    const memory: CrewMemory = {
      id: generateId(),
      crewId,
      memoryType: MemoryType.FACT,
      content: fact,
      metadata: {
        source,
        verified: false,
        confidence: 0.7
      },
      importanceScore: importance,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.memorySystem.storeMemory(memory);
  }

  async getContextualMemories(
    crewId: string,
    currentContext: string,
    limit: number = 5
  ): Promise<CrewMemory[]> {
    const query: MemorySearchQuery = {
      crewId,
      text: currentContext,
      types: [MemoryType.CONTEXT, MemoryType.PREFERENCE],
      limit,
      minImportance: 0.5
    };

    return await this.memorySystem.searchMemories(query);
  }
}
```

### **T1.3.3: Sistema de Embeddings e Busca Semântica**

```typescript
// src/lib/crewai/memory/EmbeddingService.ts
export class EmbeddingService {
  constructor(private openai: OpenAI) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });

    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float"
    });

    return response.data.map(item => item.embedding);
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    // Implementar cálculo de similaridade coseno
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }
}
```

### **T1.3.4: Cache e Performance**

```typescript
// src/lib/crewai/memory/MemoryCache.ts
export class MemoryCache {
  constructor(private redis: Redis) {}

  async cacheMemory(memory: CrewMemory): Promise<void> {
    const key = `memory:${memory.crewId}:${memory.id}`;
    await this.redis.setex(key, 3600, JSON.stringify(memory));
  }

  async getCachedMemory(crewId: string, memoryId: string): Promise<CrewMemory | null> {
    const key = `memory:${crewId}:${memoryId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheSearchResults(query: MemorySearchQuery, results: CrewMemory[]): Promise<void> {
    const key = this.generateSearchCacheKey(query);
    await this.redis.setex(key, 1800, JSON.stringify(results));
  }

  async getCachedSearchResults(query: MemorySearchQuery): Promise<CrewMemory[] | null> {
    const key = this.generateSearchCacheKey(query);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  private generateSearchCacheKey(query: MemorySearchQuery): string {
    const hash = crypto.createHash('md5')
      .update(JSON.stringify(query))
      .digest('hex');
    return `search:${query.crewId}:${hash}`;
  }
}
```

### **T1.3.5: Sistema de Limpeza e Manutenção**

```typescript
// src/lib/crewai/memory/MemoryMaintenance.ts
export class MemoryMaintenance {
  constructor(
    private memorySystem: CrewMemorySystem,
    private db: Database
  ) {}

  async cleanupExpiredMemories(): Promise<number> {
    const result = await this.db.crew_memories.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }

  async updateMemoryImportance(memoryId: string, accessCount: number): Promise<void> {
    // Atualizar score de importância baseado no uso
    const importanceScore = Math.min(1.0, 0.3 + (accessCount * 0.1));
    
    await this.memorySystem.updateMemory(memoryId, {
      importanceScore,
      accessCount,
      lastAccessed: new Date()
    });
  }

  async archiveOldMemories(crewId: string, olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.db.crew_memories.updateMany({
      where: {
        crewId,
        createdAt: {
          lt: cutoffDate
        },
        memoryType: MemoryType.CONTEXT
      },
      data: {
        importanceScore: 0.1 // Reduzir importância de memórias antigas
      }
    });

    return result.count;
  }
}
```

---

## 🧪 **Critérios de Teste**

### **Testes Unitários**
- [ ] Teste de armazenamento de memórias
- [ ] Teste de busca semântica
- [ ] Teste de tipos de memória
- [ ] Teste de cache e performance
- [ ] Teste de isolamento por tenant

### **Testes de Integração**
- [ ] Teste de integração com banco de dados
- [ ] Teste de integração com Redis
- [ ] Teste de integração com OpenAI embeddings
- [ ] Teste de fluxo completo de memória

### **Testes de Performance**
- [ ] Teste de busca com grande volume de memórias
- [ ] Teste de cache hit/miss rates
- [ ] Teste de tempo de resposta de embeddings
- [ ] Teste de concorrência

### **Testes de Segurança**
- [ ] Teste de isolamento entre tenants
- [ ] Teste de validação de entrada
- [ ] Teste de controle de acesso
- [ ] Teste de sanitização de dados

---

## 📊 **Métricas de Sucesso**

### **Métricas Técnicas**
- ✅ Tempo de armazenamento de memória < 200ms
- ✅ Tempo de busca semântica < 300ms
- ✅ Taxa de cache hit > 80%
- ✅ Precisão de busca semântica > 85%

### **Métricas de Negócio**
- ✅ Zero vazamento de dados entre tenants
- ✅ Sistema suporta 10.000+ memórias por crew
- ✅ Busca contextual relevante em 90% dos casos
- ✅ Retenção de memórias importantes > 95%

---

## 🚨 **Riscos e Mitigações**

### **Risco 1: Performance de Embeddings**
- **Probabilidade**: Média
- **Impacto**: Alto
- **Mitigação**: Cache agressivo e processamento assíncrono

### **Risco 2: Custo de OpenAI API**
- **Probabilidade**: Alta
- **Impacto**: Médio
- **Mitigação**: Rate limiting e otimização de calls

### **Risco 3: Qualidade da Busca Semântica**
- **Probabilidade**: Média
- **Impacto**: Alto
- **Mitigação**: Fine-tuning de embeddings e validação contínua

### **Risco 4: Isolamento de Dados**
- **Probabilidade**: Baixa
- **Impacto**: Crítico
- **Mitigação**: Validações rigorosas e testes de isolamento

---

## 🔗 **Dependências**

### **Dependências Externas**
- OpenAI API para embeddings
- Redis para cache
- Banco de dados com suporte a vetores

### **Dependências Internas**
- Story 1.1 (Dependências CrewAI) concluída
- Story 1.2 (Banco de Dados CrewAI) concluída
- Sistema de autenticação funcionando

---

## 📅 **Cronograma**

**Duração Estimada**: 4 dias  
**Esforço**: 32 horas  

### **Plano de Execução**
- **Dia 1 (8h)**: CrewMemorySystem e interfaces
- **Dia 2 (8h)**: Sistema de embeddings e busca semântica
- **Dia 3 (8h)**: Cache, performance e MemoryManager
- **Dia 4 (8h)**: Manutenção, testes e otimização

---

## 🎯 **Entregáveis**

### **Código**
- [ ] CrewMemorySystem implementado
- [ ] MemoryManager com operações complexas
- [ ] EmbeddingService para busca semântica
- [ ] Sistema de cache e performance
- [ ] Manutenção e limpeza automática

### **Documentação**
- [ ] Documentação da API de memória
- [ ] Guia de uso dos tipos de memória
- [ ] Documentação de performance
- [ ] Guia de troubleshooting

### **Testes**
- [ ] Suite de testes unitários
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Testes de segurança

---

## ✅ **Definition of Done**

- [ ] CrewMemorySystem implementado e funcionando
- [ ] Todos os tipos de memória suportados
- [ ] Busca semântica funcionando com precisão > 85%
- [ ] Cache implementado com taxa de hit > 80%
- [ ] Isolamento por tenant garantido
- [ ] Testes passando com cobertura > 85%
- [ ] Performance otimizada
- [ ] Documentação completa
- [ ] Code review aprovado
- [ ] Deploy em ambiente de desenvolvimento

---

## 🔄 **Próximos Passos**

Após conclusão desta story:
1. **Story 1.4**: Orquestrador Básico CrewAI
2. **Story 1.5**: Integração Redis para Coordenação

---

**Esta story estabelece o sistema de memória inteligente para agentes CrewAI!** 🧠
