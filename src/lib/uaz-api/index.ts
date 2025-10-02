// UAZ API - Exports principais
export { UAZClient } from './client';
export { UAZError, UAZTimeoutError, UAZRateLimitError, UAZWebhookError } from './errors';
export { TemplateService } from './template-service';
export { CircuitBreaker, UAZCircuitBreaker } from './circuit-breaker';
export { RetryLogic, UAZRetryLogic } from './retry-logic';
export { RateLimiter, UAZRateLimiter } from './rate-limiter';

// Types
export type {
  UAZInstance,
  UAZWebhook,
  SendTextMessageRequest,
  SendMediaMessageRequest,
  MessageResponse,
  WebhookPayload,
  CreateTemplateRequest,
  TemplateResponse,
  UAZError as UAZErrorType,
  UAZConfig,
} from './types';

export type {
  Template,
  TemplateFilters,
  CreateTemplateInput,
  UpdateTemplateInput,
  ValidationResult,
} from './template-service';

export type {
  CircuitBreakerConfig,
  CircuitState,
  CircuitBreakerStats,
} from './circuit-breaker';

export type {
  RetryConfig,
  RetryStats,
} from './retry-logic';

export type {
  RateLimitConfig,
  RateLimitStats,
} from './rate-limiter';

// Validation
export {
  validateSendTextMessage,
  validateSendMediaMessage,
  validateCreateTemplate,
  validatePhoneNumber,
  validateMediaUrl,
  validateBase64,
} from './validation';

// Logger
export { UAZLogger, UAZLoggerSingleton } from '../logger/uaz-logger';
export type { LogLevelType, LogContext, LogEntry } from '../logger/uaz-logger';
