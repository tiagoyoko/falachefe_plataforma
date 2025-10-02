export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export type LogLevelType = LogLevel[keyof LogLevel];

export interface LogContext {
  requestId?: string;
  userId?: string;
  companyId?: string;
  agentId?: string;
  conversationId?: string;
  messageId?: string;
  endpoint?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevelType;
  message: string;
  context: LogContext;
  service: string;
  version: string;
}

export class UAZLogger {
  private service: string;
  private version: string;
  private isDevelopment: boolean;

  constructor(service: string = 'uaz-api', version: string = '1.0.0') {
    this.service = service;
    this.version = version;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log de requisição
   */
  logRequest(endpoint: string, data: any, duration: number, context: LogContext = {}): void {
    this.log('info', `Request to ${endpoint}`, {
      ...context,
      endpoint,
      duration,
      requestData: this.sanitizeData(data),
    });
  }

  /**
   * Log de resposta
   */
  logResponse(endpoint: string, status: number, data: any, context: LogContext = {}): void {
    const level = status >= 400 ? 'warn' : 'info';
    this.log(level, `Response from ${endpoint}`, {
      ...context,
      endpoint,
      statusCode: status,
      responseData: this.sanitizeData(data),
    });
  }

  /**
   * Log de erro
   */
  logError(endpoint: string, error: Error, context: LogContext = {}): void {
    this.log('error', `Error in ${endpoint}`, {
      ...context,
      endpoint,
      error: {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      },
    });
  }

  /**
   * Log de webhook
   */
  logWebhook(payload: any, processed: boolean, context: LogContext = {}): void {
    this.log('info', `Webhook ${processed ? 'processed' : 'failed'}`, {
      ...context,
      webhookData: this.sanitizeData(payload),
      processed,
    });
  }

  /**
   * Log de template
   */
  logTemplate(action: string, templateId: string, context: LogContext = {}): void {
    this.log('info', `Template ${action}`, {
      ...context,
      templateId,
      action,
    });
  }

  /**
   * Log de mensagem
   */
  logMessage(action: string, messageId: string, context: LogContext = {}): void {
    this.log('info', `Message ${action}`, {
      ...context,
      messageId,
      action,
    });
  }

  /**
   * Log de circuit breaker
   */
  logCircuitBreaker(state: string, context: LogContext = {}): void {
    this.log('warn', `Circuit breaker ${state}`, {
      ...context,
      circuitState: state,
    });
  }

  /**
   * Log de rate limit
   */
  logRateLimit(limit: string, context: LogContext = {}): void {
    this.log('warn', `Rate limit ${limit}`, {
      ...context,
      rateLimit: limit,
    });
  }

  /**
   * Log de retry
   */
  logRetry(attempt: number, maxAttempts: number, context: LogContext = {}): void {
    this.log('info', `Retry attempt ${attempt}/${maxAttempts}`, {
      ...context,
      attempt,
      maxAttempts,
    });
  }

  /**
   * Log de cache
   */
  logCache(action: string, key: string, hit: boolean, context: LogContext = {}): void {
    this.log('debug', `Cache ${action}`, {
      ...context,
      cacheKey: key,
      cacheHit: hit,
      action,
    });
  }

  /**
   * Log de performance
   */
  logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    this.log('info', `Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      performance: true,
    });
  }

  /**
   * Log de segurança
   */
  logSecurity(event: string, context: LogContext = {}): void {
    this.log('warn', `Security: ${event}`, {
      ...context,
      security: true,
      event,
    });
  }

  /**
   * Log de auditoria
   */
  logAudit(action: string, resource: string, context: LogContext = {}): void {
    this.log('info', `Audit: ${action}`, {
      ...context,
      audit: true,
      action,
      resource,
    });
  }

  /**
   * Log genérico
   */
  log(level: LogLevelType, message: string, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      service: this.service,
      version: this.version,
    };

    // Em desenvolvimento, usar console colorido
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    } else {
      // Em produção, usar JSON estruturado
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log para console com cores
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;
    
    const colors = {
      error: '\x1b[31m', // Vermelho
      warn: '\x1b[33m',  // Amarelo
      info: '\x1b[36m',  // Ciano
      debug: '\x1b[90m', // Cinza
    };

    const reset = '\x1b[0m';
    const color = colors[level] || reset;

    console.log(
      `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`,
      context
    );
  }

  /**
   * Sanitizar dados sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'apiKey',
      'apiSecret',
      'webhookSecret',
      'jwt',
      'session',
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sanitizar contexto
   */
  private sanitizeContext(context: LogContext): LogContext {
    return this.sanitizeData(context);
  }

  /**
   * Obter logger para serviço específico
   */
  forService(service: string): UAZLogger {
    return new UAZLogger(service, this.version);
  }

  /**
   * Obter logger com contexto padrão
   */
  withContext(defaultContext: LogContext): UAZLogger {
    const logger = new UAZLogger(this.service, this.version);
    
    // Override do método log para incluir contexto padrão
    const originalLog = logger.log.bind(logger);
    logger.log = (level: LogLevelType, message: string, context: LogContext = {}) => {
      originalLog(level, message, { ...defaultContext, ...context });
    };

    return logger;
  }
}

/**
 * Logger singleton para UAZ API
 */
class UAZLoggerSingleton {
  private static instance: UAZLogger;

  static getInstance(): UAZLogger {
    if (!UAZLoggerSingleton.instance) {
      UAZLoggerSingleton.instance = new UAZLogger('uaz-api', '1.0.0');
    }
    return UAZLoggerSingleton.instance;
  }
}

export { UAZLoggerSingleton };
