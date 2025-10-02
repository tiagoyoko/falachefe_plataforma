import { UAZError } from './errors';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Delay base em ms
  maxDelay: number; // Delay máximo em ms
  backoffMultiplier: number; // Multiplicador para backoff exponencial
  jitter: boolean; // Adicionar aleatoriedade ao delay
}

export interface RetryStats {
  attempts: number;
  totalDelay: number;
  lastError?: Error;
  success: boolean;
}

export class RetryLogic {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 segundo
      maxDelay: 30000, // 30 segundos
      backoffMultiplier: 2,
      jitter: true,
      ...config,
    };
  }

  /**
   * Executar função com retry
   */
  async execute<T>(
    fn: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    const stats: RetryStats = {
      attempts: 0,
      totalDelay: 0,
      success: false,
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      stats.attempts = attempt + 1;

      try {
        const result = await fn();
        stats.success = true;
        return result;
      } catch (error) {
        lastError = error as Error;
        stats.lastError = lastError;

        // Se não é o último attempt, calcular delay e aguardar
        if (attempt < config.maxRetries) {
          const shouldRetry = this.shouldRetry(error as Error);
          
          if (!shouldRetry) {
            throw error;
          }

          const delay = this.calculateDelay(attempt, config);
          stats.totalDelay += delay;

          console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, {
            error: lastError.message,
            delay,
          });

          await this.sleep(delay);
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError!;
  }

  /**
   * Verificar se deve tentar novamente
   */
  private shouldRetry(error: Error): boolean {
    // Se é UAZError, verificar se é recuperável
    if (error instanceof UAZError) {
      return error.isRetryable;
    }

    // Verificar por tipo de erro
    if (error.name === 'UAZTimeoutError') return true;
    if (error.name === 'UAZRateLimitError') return true;
    if (error.message.includes('timeout')) return true;
    if (error.message.includes('ECONNRESET')) return true;
    if (error.message.includes('ENOTFOUND')) return true;
    if (error.message.includes('ECONNREFUSED')) return true;

    // Verificar por código de status HTTP
    const statusMatch = error.message.match(/status (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return status >= 500 || status === 429 || status === 408;
    }

    return false;
  }

  /**
   * Calcular delay para próxima tentativa
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Backoff exponencial
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

    // Limitar ao máximo
    delay = Math.min(delay, config.maxDelay);

    // Adicionar jitter se habilitado
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% de jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Aguardar por um tempo
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executar com retry e callback de progresso
   */
  async executeWithProgress<T>(
    fn: () => Promise<T>,
    onProgress?: (stats: RetryStats) => void,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    const stats: RetryStats = {
      attempts: 0,
      totalDelay: 0,
      success: false,
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      stats.attempts = attempt + 1;

      try {
        const result = await fn();
        stats.success = true;
        onProgress?.(stats);
        return result;
      } catch (error) {
        lastError = error as Error;
        stats.lastError = lastError;

        if (attempt < config.maxRetries) {
          const shouldRetry = this.shouldRetry(error as Error);
          
          if (!shouldRetry) {
            onProgress?.(stats);
            throw error;
          }

          const delay = this.calculateDelay(attempt, config);
          stats.totalDelay += delay;

          onProgress?.(stats);
          await this.sleep(delay);
        }
      }
    }

    onProgress?.(stats);
    throw lastError!;
  }

  /**
   * Executar múltiplas funções em paralelo com retry
   */
  async executeParallel<T>(
    functions: Array<() => Promise<T>>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T[]> {
    const promises = functions.map(fn => this.execute(fn, customConfig));
    return Promise.all(promises);
  }

  /**
   * Executar com timeout
   */
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new UAZError('Operation timeout', 408, undefined, true));
      }, timeoutMs);
    });

    const operationPromise = this.execute(fn, customConfig);

    return Promise.race([operationPromise, timeoutPromise]);
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter configuração atual
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Retry logic singleton para UAZ API
 */
class UAZRetryLogic {
  private static instance: RetryLogic;

  static getInstance(): RetryLogic {
    if (!UAZRetryLogic.instance) {
      UAZRetryLogic.instance = new RetryLogic({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      });
    }
    return UAZRetryLogic.instance;
  }
}

export { UAZRetryLogic };
