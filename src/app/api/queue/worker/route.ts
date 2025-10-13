import { NextResponse } from 'next/server';
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
 * Processa um job da fila
 * POST /api/queue/worker
 */
export async function POST() {
  try {
    // Obter Redis Queue
    const redis = await initializeRedisClient();
    const queue = createRedisQueue(redis);

    // Processar próximo job
    const result = await queue.processNext();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result.job ? {
        id: result.job.id,
        destination: result.job.destination,
        retries: result.job.retries,
      } : null,
      message: result.job ? 'Job processed' : 'Queue empty',
    });
  } catch (error) {
    console.error('Worker error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Status da fila
 * GET /api/queue/worker
 */
export async function GET() {
  try {
    const redis = await initializeRedisClient();
    const queue = createRedisQueue(redis);

    const queueSize = await queue.getQueueSize();

    return NextResponse.json({
      status: 'ok',
      service: 'Redis Queue Worker',
      queueSize,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Worker status error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

