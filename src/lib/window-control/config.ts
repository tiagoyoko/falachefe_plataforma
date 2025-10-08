/**
 * Configuração do Window Control Service
 */

import { UpstashRedisClient as RedisClient } from '../cache/upstash-redis-client';
import { WindowControlService } from './window-service';
import { WindowConfig, WindowControlOptions } from './types';

// Configuração do Redis para janelas (Upstash REST API)
export const windowRedisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
};

// Configuração das janelas
export const windowConfig: WindowConfig = {
  windowDurationMs: 24 * 60 * 60 * 1000, // 24 horas
  maxInactiveTimeMs: 30 * 60 * 1000, // 30 minutos de inatividade
  cleanupIntervalMs: 60 * 60 * 1000, // Limpeza a cada hora
};

// Opções do Window Control
export const windowOptions: WindowControlOptions = {
  autoRenewOnUserMessage: true,
  autoCloseOnInactivity: true,
  validateTemplates: true,
  logActivity: process.env.NODE_ENV === 'development',
};

// Instâncias singleton
let redisClient: RedisClient | null = null;
let windowControlService: WindowControlService | null = null;

/**
 * Obter cliente Redis para janelas
 */
export function getWindowRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient(windowRedisConfig);
  }
  return redisClient;
}

/**
 * Obter serviço de controle de janela
 */
export function getWindowControlService(): WindowControlService {
  if (!windowControlService) {
    const redis = getWindowRedisClient();
    windowControlService = new WindowControlService(redis, windowConfig, windowOptions);
  }
  return windowControlService;
}

/**
 * Inicializar todos os serviços de janela
 */
export async function initializeWindowServices(): Promise<{
  redis: RedisClient;
  windowControl: WindowControlService;
}> {
  const redis = getWindowRedisClient();
  await redis.connect();
  
  const windowControl = getWindowControlService();
  
  return { redis, windowControl };
}

/**
 * Destruir todos os serviços de janela
 */
export async function destroyWindowServices(): Promise<void> {
  if (windowControlService) {
    await windowControlService.destroy();
    windowControlService = null;
  }
  
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}
