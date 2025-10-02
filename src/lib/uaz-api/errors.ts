// UAZ API Error Handling
export class UAZError extends Error {
  public readonly code?: number;
  public readonly details?: any;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code?: number,
    details?: any,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'UAZError';
    this.code = code;
    this.details = details;
    this.isRetryable = isRetryable;
  }

  static fromResponse(response: any): UAZError {
    const message = response.error || response.message || 'Unknown UAZ API error';
    const code = response.code || response.status;
    const details = response.details || response;
    
    // Determinar se o erro é recuperável
    const isRetryable = code >= 500 || code === 429 || code === 408;
    
    return new UAZError(message, code, details, isRetryable);
  }

  static fromNetworkError(error: any): UAZError {
    const message = error.message || 'Network error';
    const isRetryable = true; // Erros de rede são sempre recuperáveis
    
    return new UAZError(message, undefined, error, isRetryable);
  }

  static fromTimeout(): UAZError {
    return new UAZError('Request timeout', 408, undefined, true);
  }

  static fromRateLimit(): UAZError {
    return new UAZError('Rate limit exceeded', 429, undefined, true);
  }

  static fromUnauthorized(): UAZError {
    return new UAZError('Unauthorized - Invalid token', 401, undefined, false);
  }

  static fromForbidden(): UAZError {
    return new UAZError('Forbidden - Insufficient permissions', 403, undefined, false);
  }

  static fromNotFound(): UAZError {
    return new UAZError('Resource not found', 404, undefined, false);
  }

  static fromValidation(message: string): UAZError {
    return new UAZError(`Validation error: ${message}`, 400, undefined, false);
  }
}

export class UAZTimeoutError extends UAZError {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`, 408, undefined, true);
    this.name = 'UAZTimeoutError';
  }
}

export class UAZRateLimitError extends UAZError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, undefined, true);
    this.name = 'UAZRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class UAZWebhookError extends UAZError {
  constructor(message: string, details?: any) {
    super(`Webhook error: ${message}`, undefined, details, false);
    this.name = 'UAZWebhookError';
  }
}
