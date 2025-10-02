import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { UAZConfig, UAZInstance, UAZWebhook, SendTextMessageRequest, SendMediaMessageRequest, MessageResponse, WebhookPayload, CreateTemplateRequest, TemplateResponse, UAZError } from './types';
import { UAZError as UAZErrorClass, UAZTimeoutError, UAZRateLimitError } from './errors';
import { validateSendTextMessage, validateSendMediaMessage, validateCreateTemplate, validatePhoneNumber, validateMediaUrl, validateBase64 } from './validation';

export class UAZClient {
  private httpClient: AxiosInstance;
  private config: UAZConfig;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(config: UAZConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
    this.maxRetries = this.config.retries || 3;

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Falachefe-UAZ-Client/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para adicionar token
    this.httpClient.interceptors.request.use(
      (config) => {
        // Adiciona token baseado no endpoint
        if (config.url?.includes('/admin/') || config.url?.includes('/instance/')) {
          config.headers['admintoken'] = this.config.apiSecret;
        } else {
          config.headers['token'] = this.config.apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para tratamento de erros
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Se não é um erro de retry, processa normalmente
        if (!this.shouldRetry(error, originalRequest)) {
          return Promise.reject(this.handleError(error));
        }

        // Implementa retry com backoff exponencial
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s...
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.httpClient(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRetry(error: any, originalRequest: any): boolean {
    // Não retry se já tentou o máximo
    if (this.retryCount >= this.maxRetries) return false;
    
    // Não retry se já tentou este request
    if (originalRequest._retry) return false;
    
    // Marca como tentado
    originalRequest._retry = true;
    
    // Retry em erros de rede, timeout, rate limit
    return (
      !error.response || // Erro de rede
      error.code === 'ECONNABORTED' || // Timeout
      error.response.status === 429 || // Rate limit
      error.response.status >= 500 // Erro do servidor
    );
  }

  private handleError(error: any): UAZErrorClass {
    if (error.code === 'ECONNABORTED') {
      return new UAZTimeoutError(this.config.timeout || 30000);
    }

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return UAZErrorClass.fromUnauthorized();
        case 403:
          return UAZErrorClass.fromForbidden();
        case 404:
          return UAZErrorClass.fromNotFound();
        case 429:
          const retryAfter = error.response.headers['retry-after'];
          return new UAZRateLimitError(parseInt(retryAfter));
        case 408:
          return UAZErrorClass.fromTimeout();
        default:
          return UAZErrorClass.fromResponse(data);
      }
    }

    return UAZErrorClass.fromNetworkError(error);
  }

  // Métodos principais da API

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(request: SendTextMessageRequest): Promise<MessageResponse> {
    try {
      // Validação
      const validatedData = validateSendTextMessage(request);
      
      if (!validatePhoneNumber(validatedData.number)) {
        throw UAZErrorClass.fromValidation('Número de telefone inválido');
      }

      const response = await this.httpClient.post('/send/text', validatedData);
      return response.data;
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw this.handleError(error);
    }
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   */
  async sendMediaMessage(request: SendMediaMessageRequest): Promise<MessageResponse> {
    try {
      // Validação
      const validatedData = validateSendMediaMessage(request);
      
      if (!validatePhoneNumber(validatedData.number)) {
        throw UAZErrorClass.fromValidation('Número de telefone inválido');
      }

      // Validação de mídia
      if (validatedData.media.startsWith('http')) {
        if (!validateMediaUrl(validatedData.media)) {
          throw UAZErrorClass.fromValidation('URL de mídia inválida');
        }
      } else {
        if (!validateBase64(validatedData.media)) {
          throw UAZErrorClass.fromValidation('Dados de mídia em base64 inválidos');
        }
      }

      const response = await this.httpClient.post('/send/media', validatedData);
      return response.data;
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw this.handleError(error);
    }
  }

  /**
   * Criar template de mensagem
   */
  async createTemplate(request: CreateTemplateRequest): Promise<TemplateResponse> {
    try {
      // Validação
      const validatedData = validateCreateTemplate(request);

      const response = await this.httpClient.post('/template/create', validatedData);
      return response.data;
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw this.handleError(error);
    }
  }

  /**
   * Obter status da instância
   */
  async getInstanceStatus(): Promise<UAZInstance> {
    try {
      const response = await this.httpClient.get('/instance/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Configurar webhook
   */
  async configureWebhook(webhookConfig: {
    url: string;
    events: string[];
    excludeMessages?: string[];
    addUrlEvents?: boolean;
    addUrlTypesMessages?: boolean;
  }): Promise<UAZWebhook> {
    try {
      const response = await this.httpClient.post('/webhook', webhookConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obter webhooks configurados
   */
  async getWebhooks(): Promise<UAZWebhook[]> {
    try {
      const response = await this.httpClient.get('/webhook');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validar assinatura do webhook
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Webhook secret não configurado - validação de assinatura desabilitada');
      return true; // Em desenvolvimento, aceita sem validação
    }

    try {
      // Implementação básica de validação HMAC
      // Em produção, usar crypto.createHmac('sha256', this.config.webhookSecret)
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  /**
   * Processar payload do webhook
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Validação básica do payload
      if (!payload.event || !payload.instance || !payload.data) {
        throw UAZErrorClass.fromValidation('Payload do webhook inválido');
      }

      // Aqui seria implementada a lógica de processamento
      // Por enquanto, apenas log
      console.log('Webhook recebido:', {
        event: payload.event,
        instance: payload.instance,
        data: payload.data,
      });

      // TODO: Implementar roteamento para orchestrator
      // TODO: Implementar processamento de diferentes tipos de evento
      
    } catch (error) {
      if (error instanceof UAZErrorClass) throw error;
      throw this.handleError(error);
    }
  }

  /**
   * Gerar assinatura do webhook
   */
  generateWebhookSignature(payload: string): string {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret não configurado');
    }

    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Obter configuração do webhook
   */
  async getWebhookConfig(): Promise<UAZWebhook> {
    try {
      const response = await this.httpClient.get('/webhook');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Configurar webhook
   */
  async setWebhookConfig(webhook: UAZWebhook): Promise<UAZWebhook> {
    try {
      const response = await this.httpClient.post('/webhook', webhook);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset do contador de retry
   */
  private resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Obter configuração atual
   */
  getConfig(): UAZConfig {
    return { ...this.config };
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<UAZConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Atualiza timeout se fornecido
    if (newConfig.timeout) {
      this.httpClient.defaults.timeout = newConfig.timeout;
    }
  }
}
