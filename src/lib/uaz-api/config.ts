import { UAZClient } from './client';
import { TemplateService } from './template-service';
import { RedisClient } from '../cache/redis-client';
import { UAZCircuitBreaker } from './circuit-breaker';
import { UAZRetryLogic } from './retry-logic';
import { UAZRateLimiter } from './rate-limiter';
import { UAZLoggerSingleton } from '../logger/uaz-logger';

// Configuração da UAZ API
export const uazConfig = {
  baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
  apiKey: process.env.UAZ_API_KEY || '',
  apiSecret: process.env.UAZ_API_SECRET || '',
  webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
  timeout: 30000,
  retries: 3,
};

// Configuração do Redis
export const redisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  timeout: 5000,
  retries: 3,
};

// Instâncias singleton
let uazClient: UAZClient | null = null;
let templateService: TemplateService | null = null;
let redisClient: RedisClient | null = null;

/**
 * Obter cliente UAZ
 */
export function getUAZClient(): UAZClient {
  if (!uazClient) {
    uazClient = new UAZClient(uazConfig);
  }
  return uazClient;
}

/**
 * Obter serviço de templates
 */
export function getTemplateService(): TemplateService {
  if (!templateService) {
    const client = getUAZClient();
    templateService = new TemplateService(client);
  }
  return templateService;
}

/**
 * Obter cliente Redis
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient(redisConfig);
  }
  return redisClient;
}

/**
 * Obter circuit breaker
 */
export function getCircuitBreaker() {
  return UAZCircuitBreaker.getInstance();
}

/**
 * Obter retry logic
 */
export function getRetryLogic() {
  return UAZRetryLogic.getInstance();
}

/**
 * Obter rate limiter
 */
export function getRateLimiter() {
  return UAZRateLimiter.getInstance();
}

/**
 * Obter logger
 */
export function getLogger() {
  return UAZLoggerSingleton.getInstance();
}

/**
 * Inicializar todos os serviços
 */
export async function initializeServices(): Promise<void> {
  try {
    // Conectar Redis
    const redis = getRedisClient();
    await redis.connect();
    console.log('Redis connected');

    // Testar UAZ API
    const uaz = getUAZClient();
    await uaz.getInstanceStatus();
    console.log('UAZ API connected');

    // Inicializar logger
    const logger = getLogger();
    logger.log('info', 'All services initialized successfully');

  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Desconectar todos os serviços
 */
export async function disconnectServices(): Promise<void> {
  try {
    // Desconectar Redis
    if (redisClient) {
      await redisClient.disconnect();
      redisClient = null;
    }

    // Destruir circuit breaker
    UAZCircuitBreaker.destroy();

    console.log('All services disconnected');
  } catch (error) {
    console.error('Error disconnecting services:', error);
  }
}

/**
 * Verificar saúde dos serviços
 */
export async function healthCheck(): Promise<{
  uaz: boolean;
  redis: boolean;
  overall: boolean;
}> {
  const health = {
    uaz: false,
    redis: false,
    overall: false,
  };

  try {
    // Verificar UAZ API
    const uaz = getUAZClient();
    await uaz.getInstanceStatus();
    health.uaz = true;
  } catch (error) {
    console.error('UAZ API health check failed:', error);
  }

  try {
    // Verificar Redis
    const redis = getRedisClient();
    health.redis = redis.isReady();
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  health.overall = health.uaz && health.redis;

  return health;
}
