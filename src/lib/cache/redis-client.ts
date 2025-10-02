import { createClient, RedisClientType } from 'redis';
import { UAZError } from '../uaz-api/errors';

export interface RedisConfig {
  url: string;
  token: string;
  timeout?: number;
  retries?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

export class RedisClient {
  private redis: RedisClientType;
  private config: RedisConfig;
  private isConnected: boolean = false;

  constructor(config: RedisConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      ...config,
    };

    this.redis = createClient({
      url: config.url,
      password: config.token,
      socket: {
        connectTimeout: this.config.timeout,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('error', (error: Error) => {
      console.error('Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('end', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });
  }

  /**
   * Conectar ao Redis
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Desconectar do Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Verificar se está conectado
   */
  isReady(): boolean {
    return this.isConnected && this.redis.isReady;
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      const value = await this.redis.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Definir valor no cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      const serializedValue = JSON.stringify(value);
      const ttl = options?.ttl || 3600; // Default 1 hour

      await this.redis.setEx(key, ttl, serializedValue);

      // Adicionar tags se fornecidas
      if (options?.tags && options.tags.length > 0) {
        await this.addTags(key, options.tags);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      await this.redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      if (keys.length === 0) return;

      await this.redis.del(keys);
    } catch (error) {
      console.error('Redis DEL MULTIPLE error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Invalidar cache por padrão
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error('Redis INVALIDATE PATTERN error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Invalidar cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      for (const tag of tags) {
        const pattern = `tag:${tag}:*`;
        await this.invalidatePattern(pattern);
      }
    } catch (error) {
      console.error('Redis INVALIDATE BY TAGS error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Verificar se chave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) {
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
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Obter TTL de uma chave
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isReady()) {
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
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      return await this.redis.incrBy(key, by);
    } catch (error) {
      console.error('Redis INCR error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Decrementar contador
   */
  async decr(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      return await this.redis.decrBy(key, by);
    } catch (error) {
      console.error('Redis DECR error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Publicar mensagem em canal
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      const serializedMessage = JSON.stringify(message);
      await this.redis.publish(channel, serializedMessage);
    } catch (error) {
      console.error('Redis PUBLISH error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Subscrever a canal
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      const subscriber = this.redis.duplicate();
      await subscriber.connect();

      await subscriber.subscribe(channel, (message: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing subscribed message:', error);
        }
      });
    } catch (error) {
      console.error('Redis SUBSCRIBE error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }

  /**
   * Adicionar tags a uma chave
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    try {
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
    memory: any;
    keys: number;
    uptime: number;
  }> {
    try {
      if (!this.isReady()) {
        return {
          connected: false,
          memory: null,
          keys: 0,
          uptime: 0,
        };
      }

      const info = await this.redis.info();
      const keys = await this.redis.dbSize();

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);

      return {
        connected: true,
        memory: memoryMatch ? memoryMatch[1] : null,
        keys,
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0,
      };
    } catch (error) {
      console.error('Redis STATS error:', error);
      return {
        connected: false,
        memory: null,
        keys: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Limpar todo o cache
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      await this.redis.flushAll();
    } catch (error) {
      console.error('Redis FLUSH ALL error:', error);
      throw UAZError.fromNetworkError(error);
    }
  }
}
