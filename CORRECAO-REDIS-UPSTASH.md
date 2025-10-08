# 🔧 Correção: Redis/Upstash - Timeout no Webhook

## 🚨 Problema Identificado

```
Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379
FUNCTION_INVOCATION_TIMEOUT (504)
```

### Causa Raiz

O código está usando o pacote `redis` (TCP/local) em vez do `@upstash/redis` (REST API para serverless).

**Fluxo Atual (QUEBRADO na Vercel):**
```
Webhook → RedisClient (redis package) → Tentativa TCP localhost:6379 → ECONNREFUSED → Timeout
```

**Arquitetura Atual:**
```typescript
// ❌ PROBLEMA: src/lib/cache/redis-client.ts
import { createClient, RedisClientType } from 'redis';

this.redis = createClient({
  url: config.url,      // Tenta conectar via TCP
  password: config.token,
  socket: {
    connectTimeout: this.config.timeout,
  },
});
```

## ✅ Solução

### Opção 1: Usar @upstash/redis (RECOMENDADO) ⭐

**Vantagens:**
- ✅ Funciona em serverless (REST API)
- ✅ Sem configuração de socket
- ✅ Latência consistente (~50-100ms)
- ✅ Totalmente compatível com Vercel

**Implementação:**

```bash
# Instalar pacote correto
npm install @upstash/redis
npm uninstall redis
```

```typescript
// src/lib/cache/upstash-redis-client.ts
import { Redis } from '@upstash/redis';

export interface UpstashRedisConfig {
  url: string;
  token: string;
}

export class UpstashRedisClient {
  private redis: Redis;
  private config: UpstashRedisConfig;

  constructor(config: UpstashRedisConfig) {
    this.config = config;
    
    // Verificar se configurações estão vazias
    if (!config.url || !config.token) {
      console.warn('⚠️ Upstash Redis not configured, using no-op client');
      this.redis = null as any; // Cliente dummy
    } else {
      this.redis = new Redis({
        url: config.url,
        token: config.token,
      });
    }
  }

  /**
   * Verificar se está configurado
   */
  isConfigured(): boolean {
    return this.redis !== null;
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConfigured()) {
        console.warn('Redis not configured, skipping get');
        return null;
      }

      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Definir valor no cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isConfigured()) {
        console.warn('Redis not configured, skipping set');
        return;
      }

      if (ttl) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        await this.redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      // Não lançar erro, apenas logar
    }
  }

  /**
   * Deletar chave
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isConfigured()) return;
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  /**
   * Incrementar contador
   */
  async incr(key: string): Promise<number> {
    try {
      if (!this.isConfigured()) return 0;
      return await this.redis.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  /**
   * Definir TTL
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isConfigured()) return;
      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  }

  /**
   * Obter TTL
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConfigured()) return -1;
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  // Método dummy para compatibilidade
  async connect(): Promise<void> {
    // Upstash não precisa de conexão explícita
    console.log('✅ Upstash Redis client ready (REST API)');
  }

  async disconnect(): Promise<void> {
    // Upstash não precisa de desconexão
    console.log('✅ Upstash Redis client closed');
  }

  isReady(): boolean {
    return this.isConfigured();
  }
}
```

### Opção 2: Tornar Redis Opcional (SOLUÇÃO RÁPIDA) ⚡

Se não quiser trocar o pacote agora, torne o Redis opcional:

```typescript
// src/app/api/webhook/uaz/route.ts

async function initializeRedisClient(): Promise<RedisClient | null> {
  // Verificar se Upstash está configurado
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis not configured, skipping initialization');
    return null;
  }

  if (!redisClient) {
    try {
      console.log('🗄️ Initializing Redis Client...');
      redisClient = new RedisClient({
        url: redisUrl,
        token: redisToken,
      });
      
      // Timeout de 5 segundos para conexão
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      
      console.log('✅ Redis Client initialized');
    } catch (error) {
      console.error('⚠️ Redis connection failed, continuing without cache:', error);
      redisClient = null;
    }
  }
  
  return redisClient;
}

async function initializeWindowControlService(): Promise<WindowControlService | null> {
  if (!windowControlService) {
    console.log('🪟 Initializing Window Control Service...');
    
    const redis = await initializeRedisClient();
    
    if (!redis) {
      console.warn('⚠️ Window Control Service disabled (no Redis)');
      return null;
    }
    
    windowControlService = new WindowControlService(redis);
    console.log('✅ Window Control Service initialized');
  }
  return windowControlService;
}

async function initializeUAZClient(): Promise<UAZClient> {
  if (!uazClient) {
    console.log('🔌 Initializing UAZ Client...');
    
    const windowService = await initializeWindowControlService();
    
    uazClient = new UAZClient({
      baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
      apiKey: process.env.UAZ_API_KEY || '',
      apiSecret: process.env.UAZ_API_SECRET || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
      timeout: 30000,
    }, windowService || undefined); // Passar undefined se windowService for null
    
    console.log('✅ UAZ Client initialized');
  }
  return uazClient;
}
```

---

## 🚀 Implementação Recomendada (Opção 1)

### Passo 1: Instalar Upstash Redis

```bash
cd /Users/tiagoyokoyama/Falachefe
npm install @upstash/redis
npm uninstall redis
```

### Passo 2: Criar Conta Upstash (se não tiver)

1. Acesse: https://console.upstash.com/
2. Criar conta gratuita
3. Criar database Redis
4. Copiar:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Passo 3: Configurar na Vercel

```bash
# Via CLI
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Ou via Dashboard:
# https://vercel.com/[seu-usuario]/falachefe/settings/environment-variables
```

### Passo 4: Atualizar Código

Criar arquivo `src/lib/cache/upstash-redis-client.ts` (código acima).

### Passo 5: Atualizar Imports

```typescript
// Substituir em todos os arquivos:
// De:
import { RedisClient } from '@/lib/cache/redis-client';

// Para:
import { UpstashRedisClient as RedisClient } from '@/lib/cache/upstash-redis-client';
```

### Passo 6: Testar

```bash
npm run build
npm run dev

# Testar webhook
./scripts/testing/test-webhook-production.sh
```

---

## 📊 Comparação de Soluções

| Aspecto | Opção 1 (@upstash/redis) | Opção 2 (Redis opcional) |
|---------|--------------------------|--------------------------|
| **Tempo** | 30 min | 5 min |
| **Complexidade** | Média | Baixa |
| **Funcionalidade** | Redis funciona | Redis desabilitado |
| **Produção** | Pronto para escalar | Temporário |
| **Cache** | ✅ Funcional | ❌ Desabilitado |
| **Window Control** | ✅ Funcional | ❌ Desabilitado |

---

## 🎯 Recomendação

### Para Testar AGORA (5 minutos):
- **Implementar Opção 2** (tornar Redis opcional)
- Permite testar webhook sem Redis
- Webhook vai funcionar, mas sem cache

### Para Produção (30 minutos):
- **Implementar Opção 1** (@upstash/redis)
- Redis funcionando corretamente
- Cache e Window Control ativos
- Solução definitiva

---

## 📝 Checklist de Implementação

### Solução Rápida (Opção 2):
- [ ] Atualizar `initializeRedisClient()` para retornar null se não configurado
- [ ] Atualizar `initializeWindowControlService()` para aceitar null
- [ ] Atualizar `initializeUAZClient()` para funcionar sem windowService
- [ ] Testar webhook localmente
- [ ] Deploy na Vercel
- [ ] Testar em produção

### Solução Definitiva (Opção 1):
- [ ] Criar conta Upstash (se não tiver)
- [ ] Obter credenciais (URL + Token)
- [ ] Instalar `@upstash/redis`
- [ ] Criar `upstash-redis-client.ts`
- [ ] Atualizar imports
- [ ] Configurar env vars na Vercel
- [ ] Testar localmente
- [ ] Deploy
- [ ] Verificar logs

---

**Status**: 🚨 Bloqueador para webhook funcionar  
**Prioridade**: 🔴 Crítica  
**Tempo Estimado**: 5 min (rápida) ou 30 min (definitiva)

