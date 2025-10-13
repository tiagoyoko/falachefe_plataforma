import { NextRequest, NextResponse } from 'next/server';
import { createRedisQueue } from '@/lib/queue/redis-queue';
import { UpstashRedisClient } from '@/lib/cache/upstash-redis-client';

// Redis client instance (singleton)
let redisClient: UpstashRedisClient | null = null;

/**
 * Inicializa Redis Client se não estiver inicializado
 */
async function initializeRedisClient(): Promise<UpstashRedisClient> {
  if (!redisClient) {
    redisClient = new UpstashRedisClient({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
    });
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Processa fila periodicamente (chamado por cron)
 * GET /api/cron/process-queue
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autorização (Vercel Cron ou chave secreta)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const redis = await initializeRedisClient();
    const queue = createRedisQueue(redis);

    const processed: Array<{ id: string; success: boolean; error?: string }> = [];
    const maxJobs = 10; // Processar até 10 jobs por execução
    let jobsProcessed = 0;

    console.log('🔄 Starting queue processing...');

    // Processar múltiplos jobs
    for (let i = 0; i < maxJobs; i++) {
      const result = await queue.processNext();

      if (!result.job) {
        // Fila vazia
        break;
      }

      jobsProcessed++;
      processed.push({
        id: result.job.id,
        success: result.success,
        error: result.error,
      });

      console.log(`✅ Processed job ${i + 1}/${maxJobs}:`, {
        jobId: result.job.id,
        success: result.success,
      });
    }

    const queueSize = await queue.getQueueSize();

    console.log(`🏁 Queue processing complete: ${jobsProcessed} jobs processed, ${queueSize} remaining`);

    return NextResponse.json({
      success: true,
      processed: jobsProcessed,
      remaining: queueSize,
      jobs: processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

