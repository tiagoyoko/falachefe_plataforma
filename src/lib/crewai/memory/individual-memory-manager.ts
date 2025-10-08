import { RedisClient } from '../../cache/redis-client';
import { memoryRedisConfig, getMemoryKey, getMemoryPattern } from './redis-config';
import { db } from '../../db';
import { agentMemories } from '../../memory-schema';
import { eq, and, desc } from 'drizzle-orm';

export interface IndividualMemoryData {
  conversationId: string;
  agentType: string;
  data: Record<string, any>;
  ttl?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class IndividualMemoryManager {
  private redis: RedisClient;
  private isInitialized: boolean = false;

  constructor() {
    this.redis = new RedisClient({
      url: memoryRedisConfig.url,
      token: memoryRedisConfig.token,
      timeout: memoryRedisConfig.timeout,
      retries: memoryRedisConfig.retries,
    });
  }

  /**
   * Inicializar conexão Redis
   */
  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.redis.connect();
      this.isInitialized = true;
    }
  }

  /**
   * Obter memória individual de um agente
   */
  async get(conversationId: string, agentType: string): Promise<Record<string, any>> {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      // 1. Tentar Redis primeiro
      const redisKey = getMemoryKey('individual', conversationId, agentType);
      const cached = await this.redis.get<Record<string, any>>(redisKey);
      
      if (cached) {
        await this.logOperation(conversationId, agentType, 'get', 'individual', true, Date.now() - startTime);
        return cached;
      }

      // 2. Fallback para PostgreSQL
      const result = await db.select()
        .from(agentMemories)
        .where(and(
          eq(agentMemories.conversationId, conversationId),
          eq(agentMemories.agentId, agentType) // Usando agentId como agentType temporariamente
        ))
        .orderBy(desc(agentMemories.updatedAt))
        .limit(1);

      if (result[0]) {
        const memoryData = result[0].content as Record<string, any>;
        
        // 3. Cache no Redis para próximas consultas
        await this.redis.set(
          redisKey,
          memoryData,
          { ttl: memoryRedisConfig.ttl.individual }
        );
        
        await this.logOperation(conversationId, agentType, 'get', 'individual', true, Date.now() - startTime);
        return memoryData;
      }

      await this.logOperation(conversationId, agentType, 'get', 'individual', true, Date.now() - startTime);
      return {};
    } catch (error) {
      console.error('Error getting individual memory:', error);
      await this.logOperation(conversationId, agentType, 'get', 'individual', false, Date.now() - startTime, (error as Error).message);
      return {};
    }
  }

  /**
   * Definir memória individual de um agente
   */
  async set(conversationId: string, agentType: string, data: Record<string, any>, ttl?: number): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();
    const memoryTtl = ttl || memoryRedisConfig.ttl.individual;

    try {
      const redisKey = getMemoryKey('individual', conversationId, agentType);

      // 1. Salvar no Redis
      await this.redis.set(
        redisKey,
        data,
        { ttl: memoryTtl }
      );

      // 2. Backup no PostgreSQL
      await db.insert(agentMemories)
        .values({
          agentId: agentType, // Usando agentId como agentType temporariamente
          conversationId,
          memoryType: 'context' as any, // Tipo padrão
          content: data,
          importance: '0.5',
          expiresAt: new Date(Date.now() + memoryTtl * 1000),
        })
        .onConflictDoUpdate({
          target: [agentMemories.agentId, agentMemories.conversationId],
          set: {
            content: data,
            importance: '0.5',
            expiresAt: new Date(Date.now() + memoryTtl * 1000),
            updatedAt: new Date(),
          }
        });

      await this.logOperation(conversationId, agentType, 'set', 'individual', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error setting individual memory:', error);
      await this.logOperation(conversationId, agentType, 'set', 'individual', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Deletar memória individual de um agente
   */
  async delete(conversationId: string, agentType: string): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      const redisKey = getMemoryKey('individual', conversationId, agentType);

      // 1. Deletar do Redis
      await this.redis.del(redisKey);

      // 2. Deletar do PostgreSQL
      await db.delete(agentMemories)
        .where(and(
          eq(agentMemories.conversationId, conversationId),
          eq(agentMemories.agentId, agentType)
        ));

      await this.logOperation(conversationId, agentType, 'delete', 'individual', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error deleting individual memory:', error);
      await this.logOperation(conversationId, agentType, 'delete', 'individual', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Buscar memórias por padrão
   */
  async search(conversationId: string, pattern: string): Promise<IndividualMemoryData[]> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      // Buscar no PostgreSQL por padrão no JSONB
      const results = await db.select()
        .from(agentMemories)
        .where(and(
          eq(agentMemories.conversationId, conversationId),
          // Busca por padrão no conteúdo JSONB
        ));

      const memories: IndividualMemoryData[] = results.map(result => ({
        conversationId: result.conversationId || '',
        agentType: result.agentId,
        data: result.content as Record<string, any>,
        ttl: result.expiresAt ? Math.floor((result.expiresAt.getTime() - Date.now()) / 1000) : undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }));

      await this.logOperation(conversationId, 'search', 'search', 'individual', true, Date.now() - startTime);
      return memories;
    } catch (error) {
      console.error('Error searching individual memory:', error);
      await this.logOperation(conversationId, 'search', 'search', 'individual', false, Date.now() - startTime, (error as Error).message);
      return [];
    }
  }

  /**
   * Limpar memórias expiradas
   */
  async cleanup(): Promise<number> {
    await this.initialize();
    
    const startTime = Date.now();
    let cleanedCount = 0;

    try {
      // Limpar do PostgreSQL
      const expiredMemories = await db.select()
        .from(agentMemories)
        .where(eq(agentMemories.expiresAt, new Date()));

      for (const memory of expiredMemories) {
        const redisKey = getMemoryKey('individual', memory.conversationId || '', memory.agentId);
        await this.redis.del(redisKey);
        
        await db.delete(agentMemories)
          .where(eq(agentMemories.id, memory.id));
        
        cleanedCount++;
      }

      // Limpar padrões Redis expirados
      const pattern = getMemoryPattern('individual');
      const keys = await (this.redis as any).redis.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // Chave sem TTL, deletar
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      await this.logOperation('cleanup', 'system', 'cleanup', 'individual', true, Date.now() - startTime);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up individual memory:', error);
      await this.logOperation('cleanup', 'system', 'cleanup', 'individual', false, Date.now() - startTime, (error as Error).message);
      return cleanedCount;
    }
  }

  /**
   * Obter estatísticas da memória individual
   */
  async getStats(): Promise<{
    totalMemories: number;
    redisStats: any;
    averageSize: number;
  }> {
    await this.initialize();

    try {
      const redisStats = await this.redis.getStats();
      
      const memories = await db.select()
        .from(agentMemories);

      const totalSize = memories.reduce((acc, memory) => {
        return acc + JSON.stringify(memory.content).length;
      }, 0);

      return {
        totalMemories: memories.length,
        redisStats,
        averageSize: memories.length > 0 ? totalSize / memories.length : 0,
      };
    } catch (error) {
      console.error('Error getting individual memory stats:', error);
      return {
        totalMemories: 0,
        redisStats: null,
        averageSize: 0,
      };
    }
  }

  /**
   * Log de operações
   */
  private async logOperation(
    conversationId: string,
    agentType: string,
    operation: string,
    memoryType: string,
    success: boolean,
    executionTime: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Log simples para debug
      console.log(`Memory ${operation}:`, {
        conversationId,
        agentType,
        memoryType,
        success,
        executionTime: `${executionTime}ms`,
        error: errorMessage
      });
    } catch (error) {
      // Ignorar erros de log
    }
  }

  /**
   * Desconectar Redis
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.redis.disconnect();
      this.isInitialized = false;
    }
  }
}
