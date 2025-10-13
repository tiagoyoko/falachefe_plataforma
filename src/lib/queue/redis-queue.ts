/**
 * Redis Queue para processamento assíncrono de mensagens
 * Usando Upstash Redis REST API
 */

import { UpstashRedisClient } from '@/lib/cache/upstash-redis-client';

export interface QueueMessagePayload {
  message: string;
  userId: string;
  phoneNumber: string;
  context: {
    conversationId: string;
    chatName?: string;
    senderName?: string;
    isGroup?: boolean;
    userName?: string;
    isNewUser?: boolean;
  };
}

export interface QueueJob {
  id: string;
  destination: string;
  payload: QueueMessagePayload;
  retries: number;
  maxRetries: number;
  createdAt: number;
  processAfter?: number;
}

export class RedisQueue {
  private redis: UpstashRedisClient;
  private queueName: string;

  constructor(redis: UpstashRedisClient, queueName: string = 'message_queue') {
    this.redis = redis;
    this.queueName = queueName;
  }

  /**
   * Adiciona mensagem à fila para processamento assíncrono
   */
  async enqueue(
    destination: string,
    payload: QueueMessagePayload,
    options?: {
      delay?: number; // delay em segundos
      retries?: number; // número de tentativas (padrão: 3)
    }
  ): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const now = Date.now();
      const processAfter = options?.delay ? now + (options.delay * 1000) : now;

      const job: QueueJob = {
        id: jobId,
        destination,
        payload,
        retries: 0,
        maxRetries: options?.retries ?? 3,
        createdAt: now,
        processAfter,
      };

      // Adicionar job à fila (lista Redis)
      await this.redis.lpush(this.queueName, JSON.stringify(job));

      console.log('✅ Job enqueued:', {
        jobId,
        destination,
        delay: options?.delay,
        processAfter: new Date(processAfter).toISOString(),
      });

      return {
        success: true,
        jobId,
      };
    } catch (error) {
      console.error('❌ Error enqueueing job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa próximo job da fila
   */
  async processNext(): Promise<{
    success: boolean;
    job?: QueueJob;
    error?: string;
  }> {
    try {
      // Pegar próximo job da fila (RPOP = pega do final)
      const jobData = await this.redis.rpop(this.queueName);

      if (!jobData) {
        return { success: true }; // Fila vazia
      }

      const job: QueueJob = JSON.parse(jobData);

      // Verificar se deve processar agora
      if (job.processAfter && Date.now() < job.processAfter) {
        // Recolocar na fila (início)
        await this.redis.rpush(this.queueName, jobData);
        return { success: true };
      }

      console.log('📋 Processing job:', {
        jobId: job.id,
        destination: job.destination,
        attempt: job.retries + 1,
        maxRetries: job.maxRetries,
      });

      // Processar job
      const result = await this.executeJob(job);

      if (!result.success && job.retries < job.maxRetries) {
        // Retry: incrementar contador e recolocar na fila
        job.retries++;
        job.processAfter = Date.now() + (Math.pow(2, job.retries) * 1000); // Exponential backoff
        await this.redis.lpush(this.queueName, JSON.stringify(job));
        
        console.log('🔄 Job requeued for retry:', {
          jobId: job.id,
          attempt: job.retries,
          nextAttempt: new Date(job.processAfter).toISOString(),
        });
      } else if (!result.success) {
        // Max retries atingido
        console.error('❌ Job failed after max retries:', {
          jobId: job.id,
          error: result.error,
        });
        
        // Mover para DLQ (Dead Letter Queue)
        await this.redis.lpush(`${this.queueName}:dlq`, JSON.stringify(job));
      }

      return {
        success: result.success,
        job,
        error: result.error,
      };
    } catch (error) {
      console.error('❌ Error processing job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Executa job (chama endpoint do worker)
   */
  private async executeJob(job: QueueJob): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(job.destination, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job.payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        throw new Error(`Worker returned ${response.status}: ${await response.text()}`);
      }

      console.log('✅ Job executed successfully:', {
        jobId: job.id,
        destination: job.destination,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Job execution failed:', {
        jobId: job.id,
        error,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtém tamanho da fila
   */
  async getQueueSize(): Promise<number> {
    try {
      return await this.redis.llen(this.queueName);
    } catch (error) {
      console.error('Error getting queue size:', error);
      return 0;
    }
  }

  /**
   * Limpa toda a fila (usar com cuidado!)
   */
  async clear(): Promise<void> {
    await this.redis.del(this.queueName);
    console.log('🗑️ Queue cleared');
  }
}

/**
 * Cria instância de RedisQueue com configuração do ambiente
 */
export function createRedisQueue(redis: UpstashRedisClient): RedisQueue {
  return new RedisQueue(redis, 'crewai_message_queue');
}

