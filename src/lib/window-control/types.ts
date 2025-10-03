/**
 * Tipos para controle de janela de atendimento WhatsApp
 */

export interface WindowState {
  userId: string;
  windowStart: Date;
  windowEnd: Date;
  isActive: boolean;
  lastActivity: Date;
  messageCount: number;
}

export interface WindowConfig {
  windowDurationMs: number; // Duração da janela em milissegundos (padrão: 24h)
  maxInactiveTimeMs: number; // Tempo máximo de inatividade antes de fechar janela
  cleanupIntervalMs: number; // Intervalo para limpeza de janelas expiradas
}

export interface MessageValidationResult {
  isAllowed: boolean;
  reason?: string;
  windowState?: WindowState;
  requiresTemplate?: boolean;
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  approved: boolean;
  content: string;
}

export interface WindowControlOptions {
  autoRenewOnUserMessage?: boolean;
  autoCloseOnInactivity?: boolean;
  validateTemplates?: boolean;
  logActivity?: boolean;
}

export const DEFAULT_WINDOW_CONFIG: WindowConfig = {
  windowDurationMs: 24 * 60 * 60 * 1000, // 24 horas
  maxInactiveTimeMs: 30 * 60 * 1000, // 30 minutos de inatividade
  cleanupIntervalMs: 60 * 60 * 1000, // Limpeza a cada hora
};

export const DEFAULT_WINDOW_OPTIONS: WindowControlOptions = {
  autoRenewOnUserMessage: true,
  autoCloseOnInactivity: true,
  validateTemplates: true,
  logActivity: true,
};
