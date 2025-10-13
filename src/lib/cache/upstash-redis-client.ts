import { Redis } from '@upstash/redis';

export interface UpstashRedisConfig {
  url: string;
  token: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

/**
 * Cliente Redis para Upstash (compatível com serverless)
 * 
 * Usa REST API oficial do Upstash (@upstash/redis)
 * Funciona perfeitamente em ambientes serverless como Vercel
 * 
 * Documentação: https://github.com/upstash/redis-js
 */
export class UpstashRedisClient {
  private redis: Redis | null = null;
  private config: UpstashRedisConfig;
  private configured: boolean = false;
  
  // Propriedade de compatibilidade com RedisClient antigo
  public isConnected: boolean = false;

  constructor(config: UpstashRedisConfig) {
    this.config = config;
    
    // Suportar múltiplos nomes de variáveis de ambiente
    const url = config.url || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
    const token = config.token || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
    
    // Verificar se configurações estão presentes
    if (!url || !token || url === '' || token === '') {
      console.warn('⚠️ Upstash Redis not configured. Cache will be disabled.');
      console.warn('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
      console.warn('   Or KV_REST_API_URL and KV_REST_API_TOKEN');
      this.configured = false;
      return;
    }

    try {
      // Usar configuração oficial do Upstash
      this.redis = new Redis({
        url: url,
        token: token,
      });
      this.configured = true;
      this.isConnected = true; // Upstash está sempre "conectado" (HTTP)
      console.log('✅ Upstash Redis client initialized (REST API)');
    } catch (error) {
      console.error('❌ Failed to initialize Upstash Redis:', error);
      this.configured = false;
      this.isConnected = false;
    }
    
    // Chamar setupEventHandlers para compatibilidade
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers (compatibilidade com RedisClient antigo)
   * Upstash REST API não tem eventos, mas mantemos para compatibilidade
   */
  private setupEventHandlers(): void {
    // Upstash REST API não tem eventos de conexão
    // Este método existe apenas para compatibilidade de tipo
  }

  /**
   * Verificar se Redis está configurado
   */
  isConfigured(): boolean {
    return this.configured && this.redis !== null;
  }

  /**
   * Conectar ao Redis (compatibilidade, Upstash não precisa)
   */
  async connect(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Redis not configured, skipping connection');
      this.isConnected = false;
      return;
    }
    // Upstash usa REST API, não precisa de conexão explícita
    this.isConnected = true;
    console.log('✅ Upstash Redis ready (REST API)');
  }

  /**
   * Desconectar do Redis (compatibilidade)
   */
  async disconnect(): Promise<void> {
    // Upstash usa REST API, não precisa de desconexão
    this.isConnected = false;
    console.log('✅ Upstash Redis client closed');
  }

  /**
   * Verificar se está pronto (compatibilidade)
   */
  isReady(): boolean {
    return this.isConfigured();
  }

  /**
   * Obter valor do cache
   * Upstash automaticamente deserializa JSON
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return null;
      }

      // Upstash já faz parse automático de JSON
      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Definir valor no cache
   * Upstash automaticamente serializa objetos em JSON
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        console.warn('Redis not configured, skipping SET');
        return;
      }

      const ttl = options?.ttl || 3600; // Default 1 hour

      // Upstash aceita objetos diretamente (auto-serialização)
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }

      // Adicionar tags se fornecidas
      if (options?.tags && options.tags.length > 0) {
        await this.addTags(key, options.tags);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      // Não lançar erro, apenas logar (cache não deve quebrar app)
    }
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return;
      }

      await this.redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis || keys.length === 0) {
        return;
      }

      await this.redis.del(...keys);
    } catch (error) {
      console.error('Redis DEL MULTIPLE error:', error);
    }
  }

  /**
   * Verificar se chave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Definir TTL para chave
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return;
      }

      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  }

  /**
   * Obter TTL de uma chave
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  /**
   * Incrementar contador
   */
  async incr(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return 0;
      }

      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  /**
   * Decrementar contador
   */
  async decr(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return 0;
      }

      return await this.redis.decrby(key, by);
    } catch (error) {
      console.error('Redis DECR error:', error);
      return 0;
    }
  }

  /**
   * Invalidar cache por padrão (usando SCAN para evitar KEYS em produção)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return;
      }

      // Upstash suporta keys() diretamente (otimizado internamente)
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis INVALIDATE PATTERN error:', error);
    }
  }

  /**
   * Invalidar cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return;
      }

      for (const tag of tags) {
        const pattern = `tag:${tag}:*`;
        await this.invalidatePattern(pattern);
      }
    } catch (error) {
      console.error('Redis INVALIDATE BY TAGS error:', error);
    }
  }

  /**
   * Adicionar tags a uma chave
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    try {
      if (!this.redis) return;

      for (const tag of tags) {
        const tagKey = `tag:${tag}:${key}`;
        await this.redis.set(tagKey, '1');
      }
    } catch (error) {
      console.error('Redis ADD TAGS error:', error);
    }
  }

  /**
   * Obter estatísticas do Redis
   */
  async getStats(): Promise<{
    connected: boolean;
    configured: boolean;
  }> {
    return {
      connected: this.isReady(),
      configured: this.isConfigured(),
    };
  }

  /**
   * Limpar todo o cache (usar com cuidado!)
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.isConfigured() || !this.redis) {
        console.warn('Redis not configured, skipping flush');
        return;
      }

      await this.redis.flushall();
      console.log('⚠️ Redis cache flushed');
    } catch (error) {
      console.error('Redis FLUSH ALL error:', error);
    }
  }

  /**
   * Lista: Adicionar elemento no início (esquerda)
   */
  async lpush(key: string, value: string): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return 0;
      }
      return await this.redis.lpush(key, value);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  /**
   * Lista: Adicionar elemento no final (direita)
   */
  async rpush(key: string, value: string): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return 0;
      }
      return await this.redis.rpush(key, value);
    } catch (error) {
      console.error('Redis RPUSH error:', error);
      return 0;
    }
  }

  /**
   * Lista: Remover e retornar elemento do final (direita)
   */
  async rpop(key: string): Promise<string | null> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return null;
      }
      const value = await this.redis.rpop<string>(key);
      return value || null;
    } catch (error) {
      console.error('Redis RPOP error:', error);
      return null;
    }
  }

  /**
   * Lista: Obter tamanho da lista
   */
  async llen(key: string): Promise<number> {
    try {
      if (!this.isConfigured() || !this.redis) {
        return 0;
      }
      return await this.redis.llen(key);
    } catch (error) {
      console.error('Redis LLEN error:', error);
      return 0;
    }
  }

  /**
   * Publicar mensagem em canal (compatibilidade)
   * Nota: Upstash Redis não suporta pub/sub via REST API
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async publish(_channel: string, _message: any): Promise<void> {
    console.warn('⚠️ Pub/Sub not supported in Upstash REST API (HTTP)');
    console.warn('   Use Upstash Redis with TCP connection for pub/sub');
    // Não fazer nada, apenas logar warning
  }

  /**
   * Subscrever a canal (compatibilidade)
   * Nota: Upstash Redis não suporta pub/sub via REST API
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async subscribe(_channel: string, _callback: (message: any) => void): Promise<void> {
    console.warn('⚠️ Pub/Sub not supported in Upstash REST API (HTTP)');
    console.warn('   Use Upstash Redis with TCP connection for pub/sub');
    // Não fazer nada, apenas logar warning
  }
}

// Compatibilidade com código existente
export { UpstashRedisClient as RedisClient };
export type { UpstashRedisConfig as RedisConfig };

