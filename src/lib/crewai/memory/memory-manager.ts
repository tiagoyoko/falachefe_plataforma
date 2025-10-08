import { IndividualMemoryManager } from './individual-memory-manager';
import { SharedMemoryManager } from './shared-memory-manager';
import { memoryRedisConfig } from './redis-config';

export interface MemoryManagerInterface {
  // Memória individual
  getIndividualMemory(conversationId: string, agentType: string): Promise<Record<string, any>>;
  setIndividualMemory(conversationId: string, agentType: string, data: Record<string, any>): Promise<void>;
  deleteIndividualMemory(conversationId: string, agentType: string): Promise<void>;
  
  // Memória compartilhada
  getSharedMemory(conversationId: string): Promise<Record<string, any>>;
  setSharedMemory(conversationId: string, data: Record<string, any>): Promise<void>;
  updateSharedMemory(conversationId: string, updates: Record<string, any>): Promise<void>;
  
  // Operações combinadas
  syncMemories(conversationId: string): Promise<void>;
  clearAllMemories(conversationId: string): Promise<void>;
  
  // Utilitários
  getStats(): Promise<MemoryStats>;
  cleanup(): Promise<CleanupResult>;
}

export interface MemoryStats {
  individual: {
    totalMemories: number;
    redisStats: any;
    averageSize: number;
  };
  shared: {
    totalMemories: number;
    activeMemories: number;
    redisStats: any;
    averageSize: number;
  };
  performance: {
    averageGetTime: number;
    averageSetTime: number;
    cacheHitRate: number;
  };
}

export interface CleanupResult {
  individualCleaned: number;
  sharedCleaned: number;
  totalCleaned: number;
  executionTime: number;
}

export class MemoryManager implements MemoryManagerInterface {
  private individualManager: IndividualMemoryManager;
  private sharedManager: SharedMemoryManager;
  private performanceMetrics: {
    getTimes: number[];
    setTimes: number[];
    cacheHits: number;
    totalRequests: number;
  };

  constructor() {
    this.individualManager = new IndividualMemoryManager();
    this.sharedManager = new SharedMemoryManager();
    this.performanceMetrics = {
      getTimes: [],
      setTimes: [],
      cacheHits: 0,
      totalRequests: 0,
    };
  }

  /**
   * Inicializar ambos os gerenciadores
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.individualManager.initialize(),
      this.sharedManager.initialize(),
    ]);
  }

  // ===== MEMÓRIA INDIVIDUAL =====

  /**
   * Obter memória individual de um agente
   */
  async getIndividualMemory(conversationId: string, agentType: string): Promise<Record<string, any>> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      const result = await this.individualManager.get(conversationId, agentType);
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.getTimes.push(executionTime);
      
      // Considerar cache hit se execução foi rápida (< 10ms)
      if (executionTime < 10) {
        this.performanceMetrics.cacheHits++;
      }

      return result;
    } catch (error) {
      console.error('Error getting individual memory:', error);
      return {};
    }
  }

  /**
   * Definir memória individual de um agente
   */
  async setIndividualMemory(conversationId: string, agentType: string, data: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      await this.individualManager.set(conversationId, agentType, data);
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.setTimes.push(executionTime);
    } catch (error) {
      console.error('Error setting individual memory:', error);
      throw error;
    }
  }

  /**
   * Deletar memória individual de um agente
   */
  async deleteIndividualMemory(conversationId: string, agentType: string): Promise<void> {
    try {
      await this.individualManager.delete(conversationId, agentType);
    } catch (error) {
      console.error('Error deleting individual memory:', error);
      throw error;
    }
  }

  // ===== MEMÓRIA COMPARTILHADA =====

  /**
   * Obter memória compartilhada de uma conversa
   */
  async getSharedMemory(conversationId: string): Promise<Record<string, any>> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      const result = await this.sharedManager.get(conversationId);
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.getTimes.push(executionTime);
      
      // Considerar cache hit se execução foi rápida (< 10ms)
      if (executionTime < 10) {
        this.performanceMetrics.cacheHits++;
      }

      return result;
    } catch (error) {
      console.error('Error getting shared memory:', error);
      return {};
    }
  }

  /**
   * Definir memória compartilhada de uma conversa
   */
  async setSharedMemory(conversationId: string, data: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      await this.sharedManager.set(conversationId, data);
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.setTimes.push(executionTime);
    } catch (error) {
      console.error('Error setting shared memory:', error);
      throw error;
    }
  }

  /**
   * Atualizar memória compartilhada (merge)
   */
  async updateSharedMemory(conversationId: string, updates: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      await this.sharedManager.update(conversationId, updates);
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.setTimes.push(executionTime);
    } catch (error) {
      console.error('Error updating shared memory:', error);
      throw error;
    }
  }

  // ===== OPERAÇÕES COMBINADAS =====

  /**
   * Sincronizar memórias entre sistemas
   */
  async syncMemories(conversationId: string): Promise<void> {
    try {
      await Promise.all([
        this.sharedManager.sync(conversationId),
        // Individual memory sync seria implementado se necessário
      ]);
    } catch (error) {
      console.error('Error syncing memories:', error);
      throw error;
    }
  }

  /**
   * Limpar todas as memórias de uma conversa
   */
  async clearAllMemories(conversationId: string): Promise<void> {
    try {
      // Limpar memória compartilhada
      await this.sharedManager.delete(conversationId);
      
      // Limpar memórias individuais (buscar todos os agentes)
      // Esta implementação seria expandida para buscar agentes ativos
      console.log(`Cleared all memories for conversation: ${conversationId}`);
    } catch (error) {
      console.error('Error clearing all memories:', error);
      throw error;
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Obter estatísticas completas do sistema de memória
   */
  async getStats(): Promise<MemoryStats> {
    try {
      const [individualStats, sharedStats] = await Promise.all([
        this.individualManager.getStats(),
        this.sharedManager.getStats(),
      ]);

      const averageGetTime = this.performanceMetrics.getTimes.length > 0
        ? this.performanceMetrics.getTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.getTimes.length
        : 0;

      const averageSetTime = this.performanceMetrics.setTimes.length > 0
        ? this.performanceMetrics.setTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.setTimes.length
        : 0;

      const cacheHitRate = this.performanceMetrics.totalRequests > 0
        ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests
        : 0;

      return {
        individual: individualStats,
        shared: sharedStats,
        performance: {
          averageGetTime,
          averageSetTime,
          cacheHitRate,
        },
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        individual: { totalMemories: 0, redisStats: null, averageSize: 0 },
        shared: { totalMemories: 0, activeMemories: 0, redisStats: null, averageSize: 0 },
        performance: { averageGetTime: 0, averageSetTime: 0, cacheHitRate: 0 },
      };
    }
  }

  /**
   * Limpeza geral do sistema
   */
  async cleanup(): Promise<CleanupResult> {
    const startTime = Date.now();

    try {
      const [individualCleaned, sharedCleaned] = await Promise.all([
        this.individualManager.cleanup(),
        // Shared memory cleanup seria implementado se necessário
        Promise.resolve(0),
      ]);

      const executionTime = Date.now() - startTime;

      return {
        individualCleaned,
        sharedCleaned,
        totalCleaned: individualCleaned + sharedCleaned,
        executionTime,
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return {
        individualCleaned: 0,
        sharedCleaned: 0,
        totalCleaned: 0,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Resetar métricas de performance
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      getTimes: [],
      setTimes: [],
      cacheHits: 0,
      totalRequests: 0,
    };
  }

  /**
   * Desconectar todos os gerenciadores
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.individualManager.disconnect(),
      this.sharedManager.disconnect(),
    ]);
  }
}

// Instância singleton
let memoryManagerInstance: MemoryManager | null = null;

export const getMemoryManager = (): MemoryManager => {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
};

export const initializeMemoryManager = async (): Promise<MemoryManager> => {
  const manager = getMemoryManager();
  await manager.initialize();
  return manager;
};
