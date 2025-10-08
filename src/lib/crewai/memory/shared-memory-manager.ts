import { RedisClient } from '../../cache/redis-client';
import { memoryRedisConfig, getMemoryKey, getMemoryPattern } from './redis-config';
import { db } from '../../db';
import { sharedMemories } from '../../memory-schema';
import { eq, and, desc } from 'drizzle-orm';

export interface SharedMemoryData {
  conversationId: string;
  data: Record<string, any>;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SharedMemoryManager {
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
   * Obter memória compartilhada de uma conversa
   */
  async get(conversationId: string): Promise<Record<string, any>> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      // 1. Tentar Redis primeiro
      const redisKey = getMemoryKey('shared', conversationId);
      const cached = await this.redis.get<Record<string, any>>(redisKey);
      
      if (cached) {
        await this.logOperation(conversationId, 'get', 'shared', true, Date.now() - startTime);
        return cached;
      }

      // 2. Fallback para PostgreSQL
      const result = await db.select()
        .from(sharedMemories)
        .where(eq(sharedMemories.companyId, conversationId)) // Usando companyId como conversationId temporariamente
        .orderBy(desc(sharedMemories.updatedAt))
        .limit(1);

      if (result[0]) {
        const memoryData = result[0].content as Record<string, any>;
        
        // 3. Cache no Redis para próximas consultas
        await this.redis.set(
          redisKey,
          memoryData,
          { ttl: memoryRedisConfig.ttl.shared }
        );
        
        await this.logOperation(conversationId, 'get', 'shared', true, Date.now() - startTime);
        return memoryData;
      }

      await this.logOperation(conversationId, 'get', 'shared', true, Date.now() - startTime);
      return {};
    } catch (error) {
      console.error('Error getting shared memory:', error);
      await this.logOperation(conversationId, 'get', 'shared', false, Date.now() - startTime, (error as Error).message);
      return {};
    }
  }

  /**
   * Definir memória compartilhada de uma conversa
   */
  async set(conversationId: string, data: Record<string, any>): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      const redisKey = getMemoryKey('shared', conversationId);

      // 1. Salvar no Redis
      await this.redis.set(
        redisKey,
        data,
        { ttl: memoryRedisConfig.ttl.shared }
      );

      // 2. Backup no PostgreSQL com versionamento
      const existing = await db.select()
        .from(sharedMemories)
        .where(eq(sharedMemories.companyId, conversationId))
        .limit(1);

      const version = existing[0] ? (existing[0] as any).version + 1 : 1;

      await db.insert(sharedMemories)
        .values({
          companyId: conversationId, // Usando companyId como conversationId temporariamente
          memoryType: 'common_knowledge' as any, // Tipo padrão
          content: data,
          accessLevel: 'public' as any,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [sharedMemories.companyId],
          set: {
            content: data,
            isActive: true,
            updatedAt: new Date(),
          }
        });

      await this.logOperation(conversationId, 'set', 'shared', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error setting shared memory:', error);
      await this.logOperation(conversationId, 'set', 'shared', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Atualizar memória compartilhada (merge)
   */
  async update(conversationId: string, updates: Record<string, any>): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      // 1. Obter dados atuais
      const currentData = await this.get(conversationId);
      
      // 2. Fazer merge dos dados
      const mergedData = {
        ...currentData,
        ...updates,
        _lastUpdated: new Date().toISOString(),
      };

      // 3. Salvar dados atualizados
      await this.set(conversationId, mergedData);

      await this.logOperation(conversationId, 'update', 'shared', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error updating shared memory:', error);
      await this.logOperation(conversationId, 'update', 'shared', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Deletar memória compartilhada de uma conversa
   */
  async delete(conversationId: string): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      const redisKey = getMemoryKey('shared', conversationId);

      // 1. Deletar do Redis
      await this.redis.del(redisKey);

      // 2. Marcar como inativo no PostgreSQL (soft delete)
      await db.update(sharedMemories)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(sharedMemories.companyId, conversationId));

      await this.logOperation(conversationId, 'delete', 'shared', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error deleting shared memory:', error);
      await this.logOperation(conversationId, 'delete', 'shared', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Obter versão da memória compartilhada
   */
  async getVersion(conversationId: string): Promise<number> {
    await this.initialize();

    try {
      const result = await db.select()
        .from(sharedMemories)
        .where(eq(sharedMemories.companyId, conversationId))
        .limit(1);

      return (result[0] as any)?.version || 0;
    } catch (error) {
      console.error('Error getting shared memory version:', error);
      return 0;
    }
  }

  /**
   * Sincronizar memória compartilhada entre agentes
   */
  async sync(conversationId: string): Promise<void> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      // Forçar atualização do cache Redis com dados do PostgreSQL
      const result = await db.select()
        .from(sharedMemories)
        .where(and(
          eq(sharedMemories.companyId, conversationId),
          eq(sharedMemories.isActive, true)
        ))
        .orderBy(desc(sharedMemories.updatedAt))
        .limit(1);

      if (result[0]) {
        const redisKey = getMemoryKey('shared', conversationId);
        await this.redis.set(
          redisKey,
          result[0].content as Record<string, any>,
          { ttl: memoryRedisConfig.ttl.shared }
        );
      }

      await this.logOperation(conversationId, 'sync', 'shared', true, Date.now() - startTime);
    } catch (error) {
      console.error('Error syncing shared memory:', error);
      await this.logOperation(conversationId, 'sync', 'shared', false, Date.now() - startTime, (error as Error).message);
      throw error;
    }
  }

  /**
   * Buscar memórias compartilhadas por padrão
   */
  async search(pattern: string): Promise<SharedMemoryData[]> {
    await this.initialize();
    
    const startTime = Date.now();

    try {
      // Buscar no PostgreSQL por padrão no JSONB
      const results = await db.select()
        .from(sharedMemories)
        .where(eq(sharedMemories.isActive, true));

      const memories: SharedMemoryData[] = results.map(result => ({
        conversationId: result.companyId,
        data: result.content as Record<string, any>,
        version: (result as any).version || 1,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }));

      await this.logOperation('search', 'search', 'shared', true, Date.now() - startTime);
      return memories;
    } catch (error) {
      console.error('Error searching shared memory:', error);
      await this.logOperation('search', 'search', 'shared', false, Date.now() - startTime, (error as Error).message);
      return [];
    }
  }

  /**
   * Obter estatísticas da memória compartilhada
   */
  async getStats(): Promise<{
    totalMemories: number;
    redisStats: any;
    averageSize: number;
    activeMemories: number;
  }> {
    await this.initialize();

    try {
      const redisStats = await this.redis.getStats();
      
      const allMemories = await db.select()
        .from(sharedMemories);

      const activeMemories = allMemories.filter(m => m.isActive);
      
      const totalSize = activeMemories.reduce((acc, memory) => {
        return acc + JSON.stringify(memory.content).length;
      }, 0);

      return {
        totalMemories: allMemories.length,
        activeMemories: activeMemories.length,
        redisStats,
        averageSize: activeMemories.length > 0 ? totalSize / activeMemories.length : 0,
      };
    } catch (error) {
      console.error('Error getting shared memory stats:', error);
      return {
        totalMemories: 0,
        activeMemories: 0,
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
    operation: string,
    memoryType: string,
    success: boolean,
    executionTime: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Log simples para debug
      console.log(`Shared Memory ${operation}:`, {
        conversationId,
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
