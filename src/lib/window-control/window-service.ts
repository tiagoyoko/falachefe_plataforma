/**
 * Serviço de controle de janela de atendimento WhatsApp
 * Gerencia janelas de 24h conforme políticas do WhatsApp
 */

import { RedisClient } from '../cache/redis-client';
import { 
  WindowState, 
  WindowConfig, 
  MessageValidationResult, 
  TemplateInfo,
  WindowControlOptions,
  DEFAULT_WINDOW_CONFIG,
  DEFAULT_WINDOW_OPTIONS
} from './types';

export class WindowControlService {
  private redis: RedisClient;
  private config: WindowConfig;
  private options: WindowControlOptions;
  private cleanupInterval?: NodeJS.Timeout;
  private approvedTemplates: Map<string, TemplateInfo> = new Map();

  constructor(
    redis: RedisClient,
    config: Partial<WindowConfig> = {},
    options: Partial<WindowControlOptions> = {}
  ) {
    this.redis = redis;
    this.config = { ...DEFAULT_WINDOW_CONFIG, ...config };
    this.options = { ...DEFAULT_WINDOW_OPTIONS, ...options };
    
    this.initializeApprovedTemplates();
    this.startCleanupInterval();
  }

  /**
   * Inicializa templates aprovados para uso fora da janela
   */
  private initializeApprovedTemplates(): void {
    // Templates básicos aprovados pelo WhatsApp
    const basicTemplates: TemplateInfo[] = [
      {
        id: 'welcome',
        name: 'Boas-vindas',
        category: 'utility',
        approved: true,
        content: 'Olá! Como posso ajudá-lo hoje?'
      },
      {
        id: 'confirmation',
        name: 'Confirmação',
        category: 'utility',
        approved: true,
        content: 'Recebemos sua mensagem. Em breve retornaremos.'
      },
      {
        id: 'out_of_hours',
        name: 'Fora do horário',
        category: 'utility',
        approved: true,
        content: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
      }
    ];

    basicTemplates.forEach(template => {
      this.approvedTemplates.set(template.id, template);
    });
  }

  /**
   * Inicia janela de atendimento para um usuário
   */
  async startWindow(userId: string): Promise<WindowState> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.config.windowDurationMs);
    
    const windowState: WindowState = {
      userId,
      windowStart: now,
      windowEnd,
      isActive: true,
      lastActivity: now,
      messageCount: 0
    };

    const key = this.getWindowKey(userId);
    await this.redis.set(key, windowState, { 
      ttl: Math.ceil(this.config.windowDurationMs / 1000) // TTL em segundos
    });

    if (this.options.logActivity) {
      console.log(`🪟 Window started for user ${userId}`, {
        windowStart: windowState.windowStart,
        windowEnd: windowState.windowEnd,
        duration: this.config.windowDurationMs
      });
    }

    return windowState;
  }

  /**
   * Renova janela de atendimento (quando usuário responde)
   */
  async renewWindow(userId: string): Promise<WindowState | undefined> {
    const existingWindow = await this.getWindowState(userId);
    
    if (!existingWindow) {
      // Se não existe janela, criar uma nova
      return await this.startWindow(userId);
    }

    if (!existingWindow.isActive) {
      // Se janela está inativa, reativar
      return await this.startWindow(userId);
    }

    // Renovar janela existente
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.config.windowDurationMs);
    
    const renewedWindow: WindowState = {
      ...existingWindow,
      windowEnd,
      lastActivity: now,
      messageCount: existingWindow.messageCount + 1
    };

    const key = this.getWindowKey(userId);
    await this.redis.set(key, renewedWindow, { 
      ttl: Math.ceil(this.config.windowDurationMs / 1000)
    });

    if (this.options.logActivity) {
      console.log(`🔄 Window renewed for user ${userId}`, {
        messageCount: renewedWindow.messageCount,
        newWindowEnd: renewedWindow.windowEnd
      });
    }

    return renewedWindow;
  }

  /**
   * Fecha janela de atendimento
   */
  async closeWindow(userId: string): Promise<void> {
    const key = this.getWindowKey(userId);
    await this.redis.del(key);

    if (this.options.logActivity) {
      console.log(`❌ Window closed for user ${userId}`);
    }
  }

  /**
   * Obtém estado atual da janela
   */
  async getWindowState(userId: string): Promise<WindowState | undefined> {
    const key = this.getWindowKey(userId);
    const windowState = await this.redis.get<WindowState>(key);
    
    if (!windowState) {
      return undefined;
    }

    // Verificar se janela ainda está ativa
    const now = new Date();
    if (windowState.windowEnd < now) {
      // Janela expirou, marcar como inativa
      windowState.isActive = false;
      await this.redis.del(key);
      return undefined;
    }

    return windowState;
  }

  /**
   * Verifica se usuário está dentro da janela de atendimento
   */
  async isWindowActive(userId: string): Promise<boolean> {
    const windowState = await this.getWindowState(userId);
    return windowState?.isActive || false;
  }

  /**
   * Valida se mensagem é permitida baseada no estado da janela
   */
  async validateMessage(
    userId: string, 
    messageType: 'text' | 'template' | 'media' | 'interactive',
    templateId?: string
  ): Promise<MessageValidationResult> {
    const windowState = await this.getWindowState(userId);
    
    // Se janela está ativa, permitir qualquer tipo de mensagem
    if (windowState?.isActive) {
      return {
        isAllowed: true,
        windowState,
        requiresTemplate: false
      };
    }

    // Se janela não está ativa, só permitir templates aprovados
    if (messageType === 'template' && templateId) {
      const template = this.approvedTemplates.get(templateId);
      if (template?.approved) {
        return {
          isAllowed: true,
          windowState: undefined,
          requiresTemplate: true
        };
      }
    }

    return {
      isAllowed: false,
      reason: 'Window is not active and message is not an approved template',
      windowState: undefined,
      requiresTemplate: true
    };
  }

  /**
   * Processa mensagem do usuário (renova janela se necessário)
   */
  async processUserMessage(userId: string): Promise<WindowState | undefined> {
    if (!this.options.autoRenewOnUserMessage) {
      return await this.getWindowState(userId);
    }

    return await this.renewWindow(userId);
  }

  /**
   * Processa mensagem do sistema (valida se pode enviar)
   */
  async processSystemMessage(
    userId: string,
    messageType: 'text' | 'template' | 'media' | 'interactive',
    templateId?: string
  ): Promise<MessageValidationResult> {
    return await this.validateMessage(userId, messageType, templateId);
  }

  /**
   * Obtém templates aprovados
   */
  getApprovedTemplates(): TemplateInfo[] {
    return Array.from(this.approvedTemplates.values());
  }

  /**
   * Adiciona template aprovado
   */
  addApprovedTemplate(template: TemplateInfo): void {
    this.approvedTemplates.set(template.id, template);
  }

  /**
   * Remove template aprovado
   */
  removeApprovedTemplate(templateId: string): boolean {
    return this.approvedTemplates.delete(templateId);
  }

  /**
   * Obtém estatísticas das janelas
   */
  async getWindowStats(): Promise<{
    activeWindows: number;
    totalWindows: number;
    averageWindowDuration: number;
  }> {
    // Implementação básica - em produção, usar scan do Redis
    return {
      activeWindows: 0,
      totalWindows: 0,
      averageWindowDuration: 0
    };
  }

  /**
   * Limpa janelas expiradas
   */
  async cleanupExpiredWindows(): Promise<number> {
    // Implementação básica - em produção, usar scan do Redis
    // Por enquanto, o TTL do Redis cuida da limpeza automática
    return 0;
  }

  /**
   * Inicia intervalo de limpeza
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpiredWindows();
        if (cleaned > 0 && this.options.logActivity) {
          console.log(`🧹 Cleaned up ${cleaned} expired windows`);
        }
      } catch (error) {
        console.error('Error during window cleanup:', error);
      }
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Para o serviço e limpa recursos
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Gera chave Redis para janela do usuário
   */
  private getWindowKey(userId: string): string {
    return `window:${userId}`;
  }
}
