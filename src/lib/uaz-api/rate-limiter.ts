import { UAZError } from './errors';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number; // Limite de rajada
  windowSize: number; // Tamanho da janela em ms
}

export interface RateLimitStats {
  requests: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: number[] = []; // Timestamps das requisições
  private burstRequests: number[] = []; // Timestamps das requisições de rajada

  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      requestsPerMinute: config.requestsPerMinute || 60,
      requestsPerHour: config.requestsPerHour || 1000,
      burstLimit: config.burstLimit || 10,
      windowSize: config.windowSize || 60000, // 1 minuto
    };
  }

  /**
   * Verificar se pode fazer requisição
   */
  async checkLimit(): Promise<RateLimitStats> {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;

    // Limpar requisições antigas
    this.cleanOldRequests(now, windowStart);

    // Verificar limite de rajada
    if (this.burstRequests.length >= this.config.burstLimit) {
      const oldestBurst = this.burstRequests[0];
      const retryAfter = Math.ceil((oldestBurst + this.config.windowSize - now) / 1000);
      
      throw new UAZError(
        'Burst rate limit exceeded',
        429,
        { retryAfter },
        true
      );
    }

    // Verificar limite por minuto
    if (this.requests.length >= this.config.requestsPerMinute) {
      const oldestRequest = this.requests[0];
      const retryAfter = Math.ceil((oldestRequest + this.config.windowSize - now) / 1000);
      
      throw new UAZError(
        'Rate limit exceeded',
        429,
        { retryAfter },
        true
      );
    }

    // Verificar limite por hora (aproximado)
    const hourStart = now - 3600000; // 1 hora
    const hourRequests = this.requests.filter(timestamp => timestamp > hourStart);
    
    if (hourRequests.length >= this.config.requestsPerHour) {
      const oldestHourRequest = hourRequests[0];
      const retryAfter = Math.ceil((oldestHourRequest + 3600000 - now) / 1000);
      
      throw new UAZError(
        'Hourly rate limit exceeded',
        429,
        { retryAfter },
        true
      );
    }

    // Registrar requisição
    this.requests.push(now);
    this.burstRequests.push(now);

    return {
      requests: this.requests.length,
      remaining: this.config.requestsPerMinute - this.requests.length,
      resetTime: now + this.config.windowSize,
    };
  }

  /**
   * Aguardar até poder fazer requisição
   */
  async waitForLimit(): Promise<RateLimitStats> {
    while (true) {
      try {
        return await this.checkLimit();
      } catch (error) {
        if (error instanceof UAZError && error.code === 429) {
          const retryAfter = error.details?.retryAfter || 1;
          await this.sleep(retryAfter * 1000);
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Executar função com rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.checkLimit();
    return fn();
  }

  /**
   * Executar função com rate limiting e retry automático
   */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      if (error instanceof UAZError && error.code === 429) {
        const retryAfter = error.details?.retryAfter || 1;
        await this.sleep(retryAfter * 1000);
        return this.executeWithRetry(fn);
      }
      throw error;
    }
  }

  /**
   * Limpar requisições antigas
   */
  private cleanOldRequests(now: number, windowStart: number): void {
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    this.burstRequests = this.burstRequests.filter(timestamp => timestamp > windowStart);
  }

  /**
   * Aguardar por um tempo
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas atuais
   */
  getStats(): {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstRequests: number;
    remainingPerMinute: number;
    remainingPerHour: number;
    nextReset: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;
    const hourStart = now - 3600000;

    const minuteRequests = this.requests.filter(timestamp => timestamp > windowStart);
    const hourRequests = this.requests.filter(timestamp => timestamp > hourStart);

    return {
      requestsPerMinute: minuteRequests.length,
      requestsPerHour: hourRequests.length,
      burstRequests: this.burstRequests.length,
      remainingPerMinute: Math.max(0, this.config.requestsPerMinute - minuteRequests.length),
      remainingPerHour: Math.max(0, this.config.requestsPerHour - hourRequests.length),
      nextReset: now + this.config.windowSize,
    };
  }

  /**
   * Resetar contadores
   */
  reset(): void {
    this.requests = [];
    this.burstRequests = [];
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter configuração atual
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}

/**
 * Rate limiter singleton para UAZ API
 */
class UAZRateLimiter {
  private static instance: RateLimiter;

  static getInstance(): RateLimiter {
    if (!UAZRateLimiter.instance) {
      UAZRateLimiter.instance = new RateLimiter({
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        burstLimit: 10,
        windowSize: 60000,
      });
    }
    return UAZRateLimiter.instance;
  }
}

export { UAZRateLimiter };
