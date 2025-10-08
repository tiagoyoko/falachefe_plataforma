import { RedisConfig } from '../../cache/redis-client';

export interface MemoryRedisConfig extends RedisConfig {
  keyPrefix: string;
  ttl: {
    individual: number;
    shared: number;
    cache: number;
  };
}

export const memoryRedisConfig: MemoryRedisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  timeout: 5000,
  retries: 3,
  keyPrefix: 'falachefe:agent:memory:',
  ttl: {
    individual: 86400, // 24 horas
    shared: 604800,    // 7 dias
    cache: 3600        // 1 hora
  }
};

export const getMemoryKey = (type: 'individual' | 'shared', conversationId: string, agentType?: string): string => {
  const baseKey = `${memoryRedisConfig.keyPrefix}${type}:${conversationId}`;
  return agentType ? `${baseKey}:${agentType}` : baseKey;
};

export const getMemoryPattern = (type: 'individual' | 'shared', conversationId?: string): string => {
  const basePattern = `${memoryRedisConfig.keyPrefix}${type}`;
  return conversationId ? `${basePattern}:${conversationId}*` : `${basePattern}:*`;
};
