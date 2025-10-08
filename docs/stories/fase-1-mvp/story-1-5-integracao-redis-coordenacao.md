# 🔴 Story 1.5: Integração Redis para Coordenação

## 📋 **Informações da Story**

**ID**: STORY-1.5  
**Épico**: CrewAI Fundação - Infraestrutura Base  
**Sprint**: 1.2 - Banco de Dados e Memória  
**Prioridade**: Crítica  
**Complexidade**: Média  
**Estimativa**: 5 story points  
**Desenvolvedor**: [A definir]  
**QA**: [A definir]  

---

## 🎯 **Objetivo**

Como sistema, quero usar Redis para coordenação para gerenciar sessões, cache de dados e implementar locks distribuídos de forma eficiente e confiável.

---

## 📝 **Descrição Detalhada**

Esta story implementa a integração Redis para coordenação distribuída do sistema CrewAI. Inclui gerenciamento de sessões, cache de dados, locks distribuídos, rate limiting e coordenação entre múltiplas instâncias do sistema.

### **Contexto de Negócio**
- Sistema precisa coordenar múltiplas instâncias simultaneamente
- Sessões de usuário devem ser mantidas consistentes
- Cache é essencial para performance
- Locks distribuídos previnem condições de corrida
- Rate limiting protege contra abuso

### **Escopo Técnico**
- Implementação do RedisCoordinator
- Sistema de gerenciamento de sessões
- Cache distribuído para dados frequentes
- Locks distribuídos para operações críticas
- Rate limiting e controle de acesso

---

## ✅ **Critérios de Aceitação**

### **CA1: RedisCoordinator Implementado**
- [ ] RedisCoordinator implementado com interface completa
- [ ] Conexão e reconexão automática
- [ ] Pool de conexões configurado
- [ ] Tratamento de erros e fallback
- [ ] Monitoramento de saúde da conexão

### **CA2: Sistema de Sessões**
- [ ] Armazenamento de dados de sessão
- [ ] Gerenciamento de TTL de sessões
- [ ] Invalidação automática de sessões expiradas
- [ ] Sincronização entre instâncias
- [ ] Backup e recuperação de sessões

### **CA3: Cache Distribuído**
- [ ] Cache de configurações de crews
- [ ] Cache de dados de usuários
- [ ] Cache de resultados de queries
- [ ] Invalidação inteligente de cache
- [ ] Compressão de dados grandes

### **CA4: Locks Distribuídos**
- [ ] Sistema de locks distribuídos
- [ ] Timeout automático de locks
- [ ] Detecção de deadlocks
- [ ] Priorização de locks
- [ ] Logs de operações de lock

### **CA5: Rate Limiting**
- [ ] Rate limiting por usuário
- [ ] Rate limiting por empresa
- [ ] Rate limiting por endpoint
- [ ] Sliding window implementation
- [ ] Alertas para violações

---

## 🔧 **Tarefas Técnicas**

### **T1.5.1: Implementação do RedisCoordinator**

#### **Interface Principal**
```typescript
// src/lib/crewai/coordination/RedisCoordinator.ts
export interface RedisCoordinator {
  // Conexão e Saúde
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealthStatus(): Promise<HealthStatus>;
  
  // Sessões
  setSessionData(sessionId: string, data: SessionData, ttl?: number): Promise<void>;
  getSessionData(sessionId: string): Promise<SessionData | null>;
  deleteSessionData(sessionId: string): Promise<void>;
  extendSessionTTL(sessionId: string, ttl: number): Promise<void>;
  
  // Cache
  setCache(key: string, value: any, ttl?: number): Promise<void>;
  getCache(key: string): Promise<any>;
  deleteCache(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  
  // Locks Distribuídos
  acquireLock(lockKey: string, ttl: number): Promise<boolean>;
  releaseLock(lockKey: string): Promise<void>;
  extendLock(lockKey: string, ttl: number): Promise<boolean>;
  
  // Rate Limiting
  checkRateLimit(key: string, limit: number, window: number): Promise<RateLimitResult>;
  incrementRateLimit(key: string, window: number): Promise<number>;
  
  // Pub/Sub
  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, callback: (message: any) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}

export interface SessionData {
  userId: string;
  companyId: string;
  crewId?: string;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}
```

#### **Implementação Principal**
```typescript
// src/lib/crewai/coordination/RedisCoordinatorImpl.ts
export class RedisCoordinatorImpl implements RedisCoordinator {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isHealthy: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(
    private config: RedisConfig,
    private logger: Logger
  ) {
    this.initializeClients();
  }

  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);
      
      this.isHealthy = true;
      this.reconnectAttempts = 0;
      
      this.setupEventHandlers();
      this.logger.info('Redis connections established');
      
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('Failed to connect to Redis:', error);
      throw new RedisConnectionError('Failed to establish Redis connections');
    }
  }

  private setupEventHandlers(): void {
    // Handler para reconexão automática
    this.client.on('error', (error) => {
      this.logger.error('Redis client error:', error);
      this.isHealthy = false;
      this.handleReconnection();
    });

    this.client.on('connect', () => {
      this.logger.info('Redis client reconnected');
      this.isHealthy = true;
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    
    this.logger.info(`Attempting Redis reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection failed:', error);
      }
    }, delay);
  }
}
```

### **T1.5.2: Sistema de Gerenciamento de Sessões**

```typescript
// src/lib/crewai/coordination/SessionManager.ts
export class SessionManager {
  constructor(
    private redis: RedisCoordinator,
    private config: SessionConfig
  ) {}

  async createSession(userId: string, companyId: string, crewId?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionData: SessionData = {
      userId,
      companyId,
      crewId,
      lastActivity: new Date(),
      metadata: {
        createdAt: new Date(),
        userAgent: 'crewai-system',
        ipAddress: 'system'
      }
    };

    await this.redis.setSessionData(
      sessionId, 
      sessionData, 
      this.config.defaultTTL
    );

    // Publicar evento de criação de sessão
    await this.redis.publish('session:created', {
      sessionId,
      userId,
      companyId,
      crewId
    });

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await this.redis.getSessionData(sessionId);
    
    if (sessionData) {
      // Atualizar última atividade
      sessionData.lastActivity = new Date();
      await this.redis.setSessionData(
        sessionId, 
        sessionData, 
        this.config.defaultTTL
      );
    }

    return sessionData;
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const currentSession = await this.getSession(sessionId);
    if (!currentSession) {
      throw new SessionNotFoundError(`Session ${sessionId} not found`);
    }

    const updatedSession = {
      ...currentSession,
      ...updates,
      lastActivity: new Date()
    };

    await this.redis.setSessionData(
      sessionId,
      updatedSession,
      this.config.defaultTTL
    );
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.deleteSessionData(sessionId);
    
    // Publicar evento de invalidação
    await this.redis.publish('session:invalidated', { sessionId });
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Redis TTL cuida automaticamente da expiração
    // Este método pode ser usado para limpeza adicional se necessário
    return 0;
  }

  private generateSessionId(): string {
    return `session:${crypto.randomUUID()}`;
  }
}
```

### **T1.5.3: Sistema de Cache Distribuído**

```typescript
// src/lib/crewai/coordination/CacheManager.ts
export class CacheManager {
  constructor(
    private redis: RedisCoordinator,
    private config: CacheConfig
  ) {}

  async cacheCrewConfig(crewId: string, config: CrewConfig): Promise<void> {
    const key = `crew:config:${crewId}`;
    const serializedConfig = JSON.stringify(config);
    
    await this.redis.setCache(key, serializedConfig, this.config.crewConfigTTL);
  }

  async getCrewConfig(crewId: string): Promise<CrewConfig | null> {
    const key = `crew:config:${crewId}`;
    const cached = await this.redis.getCache(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  async cacheUserData(userId: string, userData: UserData): Promise<void> {
    const key = `user:${userId}`;
    const serializedData = JSON.stringify(userData);
    
    await this.redis.setCache(key, serializedData, this.config.userDataTTL);
  }

  async getUserData(userId: string): Promise<UserData | null> {
    const key = `user:${userId}`;
    const cached = await this.redis.getCache(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  async cacheQueryResult(queryHash: string, result: any, ttl?: number): Promise<void> {
    const key = `query:${queryHash}`;
    const serializedResult = JSON.stringify(result);
    
    await this.redis.setCache(key, serializedResult, ttl || this.config.queryResultTTL);
  }

  async getQueryResult(queryHash: string): Promise<any | null> {
    const key = `query:${queryHash}`;
    return await this.redis.getCache(key);
  }

  async invalidateCrewCache(crewId: string): Promise<void> {
    const patterns = [
      `crew:config:${crewId}`,
      `crew:metrics:${crewId}:*`,
      `crew:memories:${crewId}:*`,
      `crew:tasks:${crewId}:*`
    ];

    for (const pattern of patterns) {
      await this.redis.invalidatePattern(pattern);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.redis.deleteCache(key);
  }
}
```

### **T1.5.4: Sistema de Locks Distribuídos**

```typescript
// src/lib/crewai/coordination/DistributedLockManager.ts
export class DistributedLockManager {
  constructor(
    private redis: RedisCoordinator,
    private config: LockConfig
  ) {}

  async acquireCrewLock(crewId: string, operation: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:crew:${crewId}:${operation}`;
    const lockValue = this.generateLockValue();
    
    const acquired = await this.redis.acquireLock(lockKey, ttl);
    
    if (acquired) {
      this.logger.info(`Crew lock acquired: ${lockKey}`, { crewId, operation });
    }
    
    return acquired;
  }

  async releaseCrewLock(crewId: string, operation: string): Promise<void> {
    const lockKey = `lock:crew:${crewId}:${operation}`;
    await this.redis.releaseLock(lockKey);
    this.logger.info(`Crew lock released: ${lockKey}`, { crewId, operation });
  }

  async acquireTaskLock(taskId: string, ttl: number = 60000): Promise<boolean> {
    const lockKey = `lock:task:${taskId}`;
    const acquired = await this.redis.acquireLock(lockKey, ttl);
    
    if (acquired) {
      this.logger.info(`Task lock acquired: ${lockKey}`, { taskId });
    }
    
    return acquired;
  }

  async releaseTaskLock(taskId: string): Promise<void> {
    const lockKey = `lock:task:${taskId}`;
    await this.redis.releaseLock(lockKey);
    this.logger.info(`Task lock released: ${lockKey}`, { taskId });
  }

  async acquireResourceLock(resourceId: string, operation: string, ttl: number = 15000): Promise<boolean> {
    const lockKey = `lock:resource:${resourceId}:${operation}`;
    return await this.redis.acquireLock(lockKey, ttl);
  }

  async releaseResourceLock(resourceId: string, operation: string): Promise<void> {
    const lockKey = `lock:resource:${resourceId}:${operation}`;
    await this.redis.releaseLock(lockKey);
  }

  async withCrewLock<T>(
    crewId: string, 
    operation: string, 
    callback: () => Promise<T>,
    ttl: number = 30000
  ): Promise<T> {
    const acquired = await this.acquireCrewLock(crewId, operation, ttl);
    
    if (!acquired) {
      throw new LockAcquisitionError(`Failed to acquire lock for crew ${crewId}, operation ${operation}`);
    }

    try {
      return await callback();
    } finally {
      await this.releaseCrewLock(crewId, operation);
    }
  }

  async withTaskLock<T>(
    taskId: string,
    callback: () => Promise<T>,
    ttl: number = 60000
  ): Promise<T> {
    const acquired = await this.acquireTaskLock(taskId, ttl);
    
    if (!acquired) {
      throw new LockAcquisitionError(`Failed to acquire lock for task ${taskId}`);
    }

    try {
      return await callback();
    } finally {
      await this.releaseTaskLock(taskId);
    }
  }

  private generateLockValue(): string {
    return `${process.pid}:${Date.now()}:${crypto.randomUUID()}`;
  }
}
```

### **T1.5.5: Sistema de Rate Limiting**

```typescript
// src/lib/crewai/coordination/RateLimitManager.ts
export class RateLimitManager {
  constructor(
    private redis: RedisCoordinator,
    private config: RateLimitConfig
  ) {}

  async checkUserRateLimit(userId: string, operation: string): Promise<RateLimitResult> {
    const key = `rate:user:${userId}:${operation}`;
    const limit = this.config.userLimits[operation] || this.config.defaultUserLimit;
    
    return await this.redis.checkRateLimit(key, limit, this.config.windowSize);
  }

  async checkCompanyRateLimit(companyId: string, operation: string): Promise<RateLimitResult> {
    const key = `rate:company:${companyId}:${operation}`;
    const limit = this.config.companyLimits[operation] || this.config.defaultCompanyLimit;
    
    return await this.redis.checkRateLimit(key, limit, this.config.windowSize);
  }

  async checkEndpointRateLimit(endpoint: string, clientId: string): Promise<RateLimitResult> {
    const key = `rate:endpoint:${endpoint}:${clientId}`;
    const limit = this.config.endpointLimits[endpoint] || this.config.defaultEndpointLimit;
    
    return await this.redis.checkRateLimit(key, limit, this.config.windowSize);
  }

  async incrementRateLimit(key: string): Promise<number> {
    return await this.redis.incrementRateLimit(key, this.config.windowSize);
  }

  async getRateLimitStatus(userId: string, operation: string): Promise<RateLimitStatus> {
    const key = `rate:user:${userId}:${operation}`;
    const limit = this.config.userLimits[operation] || this.config.defaultUserLimit;
    
    const result = await this.redis.checkRateLimit(key, limit, this.config.windowSize);
    
    return {
      userId,
      operation,
      limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      allowed: result.allowed
    };
  }

  async resetRateLimit(userId: string, operation: string): Promise<void> {
    const key = `rate:user:${userId}:${operation}`;
    await this.redis.deleteCache(key);
  }

  async getRateLimitViolations(timeWindow: number = 3600000): Promise<RateLimitViolation[]> {
    // Implementar busca por violações de rate limit
    // Este método pode ser usado para monitoramento e alertas
    return [];
  }
}
```

### **T1.5.6: Sistema de Pub/Sub para Coordenação**

```typescript
// src/lib/crewai/coordination/EventCoordinator.ts
export class EventCoordinator {
  private subscriptions: Map<string, (data: any) => void> = new Map();

  constructor(private redis: RedisCoordinator) {}

  async publishCrewEvent(crewId: string, eventType: string, data: any): Promise<void> {
    const channel = `crew:${crewId}:${eventType}`;
    await this.redis.publish(channel, {
      crewId,
      eventType,
      data,
      timestamp: new Date(),
      source: 'orchestrator'
    });
  }

  async subscribeToCrewEvents(crewId: string, callback: (event: CrewEvent) => void): Promise<void> {
    const channel = `crew:${crewId}:*`;
    
    await this.redis.subscribe(channel, (message) => {
      const event: CrewEvent = JSON.parse(message);
      callback(event);
    });
  }

  async publishSystemEvent(eventType: string, data: any): Promise<void> {
    const channel = `system:${eventType}`;
    await this.redis.publish(channel, {
      eventType,
      data,
      timestamp: new Date(),
      source: 'system'
    });
  }

  async subscribeToSystemEvents(eventType: string, callback: (event: SystemEvent) => void): Promise<void> {
    const channel = `system:${eventType}`;
    
    await this.redis.subscribe(channel, (message) => {
      const event: SystemEvent = JSON.parse(message);
      callback(event);
    });
  }

  async publishMetricsEvent(metrics: OrchestratorMetrics): Promise<void> {
    await this.redis.publish('metrics:orchestrator', {
      metrics,
      timestamp: new Date(),
      source: 'metrics-collector'
    });
  }

  async subscribeToMetricsEvents(callback: (metrics: OrchestratorMetrics) => void): Promise<void> {
    await this.redis.subscribe('metrics:orchestrator', (message) => {
      const data = JSON.parse(message);
      callback(data.metrics);
    });
  }
}
```

---

## 🧪 **Critérios de Teste**

### **Testes Unitários**
- [ ] Teste de conexão e reconexão Redis
- [ ] Teste de gerenciamento de sessões
- [ ] Teste de cache distribuído
- [ ] Teste de locks distribuídos
- [ ] Teste de rate limiting

### **Testes de Integração**
- [ ] Teste de coordenação entre instâncias
- [ ] Teste de sincronização de dados
- [ ] Teste de pub/sub entre componentes
- [ ] Teste de fallback em caso de falha

### **Testes de Performance**
- [ ] Teste de latência de operações Redis
- [ ] Teste de throughput de cache
- [ ] Teste de concorrência de locks
- [ ] Teste de escalabilidade horizontal

### **Testes de Resilência**
- [ ] Teste de falha de Redis
- [ ] Teste de reconexão automática
- [ ] Teste de degradação graceful
- [ ] Teste de recuperação de dados

---

## 📊 **Métricas de Sucesso**

### **Métricas Técnicas**
- ✅ Latência de operações Redis < 10ms
- ✅ Taxa de sucesso de conexão > 99.9%
- ✅ Taxa de cache hit > 85%
- ✅ Tempo de aquisição de lock < 5ms

### **Métricas de Negócio**
- ✅ Sistema suporta 100+ instâncias simultâneas
- ✅ Zero perda de sessões em condições normais
- ✅ Rate limiting efetivo contra abuso
- ✅ Coordenação perfeita entre componentes

---

## 🚨 **Riscos e Mitigações**

### **Risco 1: Falha de Redis**
- **Probabilidade**: Baixa
- **Impacto**: Alto
- **Mitigação**: Clustering Redis e fallback para banco

### **Risco 2: Latência de Rede**
- **Probabilidade**: Média
- **Impacto**: Médio
- **Mitigação**: Otimização de queries e cache local

### **Risco 3: Deadlocks em Locks**
- **Probabilidade**: Baixa
- **Impacto**: Médio
- **Mitigação**: Timeouts e detecção automática

### **Risco 4: Memory Leak no Redis**
- **Probabilidade**: Baixa
- **Impacto**: Alto
- **Mitigação**: TTLs apropriados e monitoramento

---

## 🔗 **Dependências**

### **Dependências Externas**
- Redis server configurado
- Clustering Redis (opcional)
- Rede estável entre instâncias

### **Dependências Internas**
- Story 1.1 (Dependências CrewAI) concluída
- Story 1.2 (Banco de Dados CrewAI) concluída
- Story 1.3 (Sistema de Memória CrewAI) concluída
- Story 1.4 (Orquestrador Básico CrewAI) concluída

---

## 📅 **Cronograma**

**Duração Estimada**: 3 dias  
**Esforço**: 24 horas  

### **Plano de Execução**
- **Dia 1 (8h)**: RedisCoordinator e conexões
- **Dia 2 (8h)**: SessionManager, CacheManager e locks
- **Dia 3 (8h)**: Rate limiting, pub/sub e testes

---

## 🎯 **Entregáveis**

### **Código**
- [ ] RedisCoordinator implementado
- [ ] SessionManager para gerenciamento de sessões
- [ ] CacheManager para cache distribuído
- [ ] DistributedLockManager para locks
- [ ] RateLimitManager para controle de acesso
- [ ] EventCoordinator para pub/sub

### **Documentação**
- [ ] Documentação da API de coordenação
- [ ] Guia de configuração Redis
- [ ] Documentação de locks e sessões
- [ ] Guia de troubleshooting

### **Testes**
- [ ] Suite de testes unitários
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Testes de resilência

---

## ✅ **Definition of Done**

- [ ] RedisCoordinator implementado e funcionando
- [ ] Sistema de sessões funcionando
- [ ] Cache distribuído implementado
- [ ] Locks distribuídos funcionando
- [ ] Rate limiting implementado
- [ ] Pub/sub para coordenação funcionando
- [ ] Testes passando com cobertura > 85%
- [ ] Performance otimizada
- [ ] Documentação completa
- [ ] Code review aprovado
- [ ] Deploy em ambiente de desenvolvimento

---

## 🔄 **Próximos Passos**

Após conclusão desta story, o épico CrewAI Fundação estará completo:
1. **Épico 2**: Agente Financeiro CrewAI
2. **Épico 3**: Sistema de Handoff
3. **Épico 4**: Integração Completa

---

**Esta story completa a fundação CrewAI com coordenação distribuída robusta!** 🔴
