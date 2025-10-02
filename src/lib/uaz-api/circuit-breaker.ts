import { UAZError } from './errors';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Número de falhas para abrir o circuito
  recoveryTimeout: number; // Tempo em ms para tentar recuperar
  monitoringPeriod: number; // Período em ms para monitorar falhas
  successThreshold: number; // Número de sucessos para fechar o circuito
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private config: CircuitBreakerConfig;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      ...config,
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000, // 1 minuto
      monitoringPeriod: config.monitoringPeriod || 300000, // 5 minutos
      successThreshold: config.successThreshold || 3,
    };

    this.startMonitoring();
  }

  /**
   * Executar função com circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Verificar se o circuito está aberto
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new UAZError('Circuit breaker is open', 503, undefined, false);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Verificar se deve tentar resetar o circuito
   */
  private shouldAttemptReset(): boolean {
    const now = Date.now();
    return now - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Processar sucesso
   */
  private onSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'half-open') {
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        console.log('Circuit breaker closed - service recovered');
      }
    } else if (this.state === 'closed') {
      // Reset contador de falhas em sucessos consecutivos
      if (this.failures > 0) {
        this.failures = Math.max(0, this.failures - 1);
      }
    }
  }

  /**
   * Processar falha
   */
  private onFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Se falhar no estado half-open, volta para open
      this.state = 'open';
      this.successes = 0;
      console.log('Circuit breaker opened - service still failing');
    } else if (this.state === 'closed') {
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        console.log('Circuit breaker opened - too many failures');
      }
    }
  }

  /**
   * Iniciar monitoramento periódico
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.resetCounters();
    }, this.config.monitoringPeriod);
  }

  /**
   * Resetar contadores periodicamente
   */
  private resetCounters(): void {
    if (this.state === 'closed') {
      this.failures = 0;
      this.successes = 0;
    }
  }

  /**
   * Obter estatísticas do circuit breaker
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Obter estado atual
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Verificar se está aberto
   */
  isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Verificar se está fechado
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Verificar se está half-open
   */
  isHalfOpen(): boolean {
    return this.state === 'half-open';
  }

  /**
   * Forçar abertura do circuito
   */
  open(): void {
    this.state = 'open';
    this.failures = this.config.failureThreshold;
    this.lastFailureTime = Date.now();
    console.log('Circuit breaker manually opened');
  }

  /**
   * Forçar fechamento do circuito
   */
  close(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    console.log('Circuit breaker manually closed');
  }

  /**
   * Resetar estatísticas
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    console.log('Circuit breaker reset');
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter configuração atual
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Obter taxa de sucesso
   */
  getSuccessRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.totalSuccesses / this.totalRequests;
  }

  /**
   * Obter taxa de falha
   */
  getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.totalFailures / this.totalRequests;
  }

  /**
   * Destruir circuit breaker
   */
  destroy(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }
}

/**
 * Circuit breaker singleton para UAZ API
 */
class UAZCircuitBreaker {
  private static instance: CircuitBreaker;

  static getInstance(): CircuitBreaker {
    if (!UAZCircuitBreaker.instance) {
      UAZCircuitBreaker.instance = new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minuto
        monitoringPeriod: 300000, // 5 minutos
        successThreshold: 3,
      });
    }
    return UAZCircuitBreaker.instance;
  }

  static destroy(): void {
    if (UAZCircuitBreaker.instance) {
      UAZCircuitBreaker.instance.destroy();
      UAZCircuitBreaker.instance = undefined as any;
    }
  }
}

export { UAZCircuitBreaker };
