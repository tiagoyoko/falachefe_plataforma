import { UAZMessage, UAZChat } from '@/lib/uaz-api/types';
import { MessageClassifier } from './classifier';
import { MessageDestination, MessageClassification } from './types';

/**
 * Configuração de destino de processamento
 */
interface ProcessingDestination {
  endpoint: string;
  method: 'POST' | 'GET';
  timeout: number;
  retries: number;
  description: string;
}

/**
 * Router que direciona mensagens para diferentes processadores
 */
export class MessageRouter {
  private static destinations: Record<MessageDestination, ProcessingDestination> = {
    [MessageDestination.CREWAI_TEXT]: {
      endpoint: '/process',
      method: 'POST',
      timeout: 180000, // 3 minutos
      retries: 2,
      description: 'CrewAI - Análise de texto completa'
    },
    [MessageDestination.CREWAI_MEDIA]: {
      endpoint: '/process/media',
      method: 'POST',
      timeout: 300000, // 5 minutos
      retries: 1,
      description: 'CrewAI - Análise de mídia (imagem/vídeo)'
    },
    [MessageDestination.CREWAI_AUDIO]: {
      endpoint: '/process/audio',
      method: 'POST',
      timeout: 240000, // 4 minutos
      retries: 1,
      description: 'CrewAI - Transcrição e análise de áudio'
    },
    [MessageDestination.CREWAI_DOCUMENT]: {
      endpoint: '/process/document',
      method: 'POST',
      timeout: 180000, // 3 minutos
      retries: 1,
      description: 'CrewAI - Processamento de documentos'
    },
    [MessageDestination.AUTO_REPLY]: {
      endpoint: '/auto-reply',
      method: 'POST',
      timeout: 5000, // 5 segundos
      retries: 0,
      description: 'Resposta automática rápida'
    },
    [MessageDestination.IGNORE]: {
      endpoint: '/dev/null',
      method: 'POST',
      timeout: 0,
      retries: 0,
      description: 'Ignorar mensagem'
    },
    [MessageDestination.QUEUE]: {
      endpoint: '/queue/manual',
      method: 'POST',
      timeout: 10000,
      retries: 0,
      description: 'Enfileirar para revisão manual'
    }
  };

  /**
   * Roteia mensagem para o destino apropriado
   */
  static async route(
    message: UAZMessage, 
    _chat: UAZChat,
    _baseUrl: string
  ): Promise<{
    classification: MessageClassification;
    destination: ProcessingDestination;
    shouldProcess: boolean;
    reason?: string;
  }> {
    // Classificar mensagem
    const classification = MessageClassifier.classify(message);
    
    console.log('📊 Message Classification:', {
      contentType: classification.contentType,
      destination: classification.destination,
      hasText: classification.hasText,
      hasMedia: classification.hasMedia,
      priority: classification.priority,
      estimatedTime: `${classification.metadata.estimatedProcessingTime}s`
    });

    // Obter configuração de destino
    const destination = this.destinations[classification.destination];

    // Decidir se deve processar
    const shouldProcess = this.shouldProcessMessage(classification, message);

    return {
      classification,
      destination,
      shouldProcess,
      reason: shouldProcess ? undefined : this.getIgnoreReason(classification)
    };
  }

  /**
   * Determina se mensagem deve ser processada
   */
  private static shouldProcessMessage(
    classification: MessageClassification,
    message: UAZMessage
  ): boolean {
    // Ignorar mensagens próprias
    if (message.fromMe) {
      return false;
    }

    // Ignorar tipos específicos
    if (classification.destination === MessageDestination.IGNORE) {
      return false;
    }

    // Ignorar mensagens sem conteúdo
    if (!classification.hasText && !classification.hasMedia) {
      return false;
    }

    return true;
  }

  /**
   * Retorna razão para ignorar mensagem
   */
  private static getIgnoreReason(classification: MessageClassification): string {
    switch (classification.destination) {
      case MessageDestination.IGNORE:
        return `Tipo de mensagem ignorado: ${classification.contentType}`;
      default:
        return 'Sem conteúdo para processar';
    }
  }

  /**
   * Prepara payload para o endpoint de destino
   */
  static preparePayload(
    message: UAZMessage,
    chat: UAZChat,
    classification: MessageClassification,
    userId: string,
    conversationId: string
  ): Record<string, any> {
    const basePayload = {
      message: classification.textContent || message.text || message.content || '',
      userId,
      phoneNumber: this.extractPhoneNumber(message.sender),
      context: {
        source: 'whatsapp',  // Identificar origem WhatsApp
        conversationId,
        chatName: chat.name,
        senderName: message.senderName,
        isGroup: message.isGroup || false,
        messageType: classification.contentType,
        priority: classification.priority
      }
    };

    // Adicionar campos específicos por tipo
    switch (classification.destination) {
      case MessageDestination.CREWAI_MEDIA:
        return {
          ...basePayload,
          media: {
            type: classification.mediaType,
            url: MessageClassifier.extractMediaUrl(message),
            hasCaption: classification.metadata.hasCaption
          }
        };

      case MessageDestination.CREWAI_AUDIO:
        return {
          ...basePayload,
          audio: {
            url: MessageClassifier.extractMediaUrl(message),
            transcriptionRequired: true
          }
        };

      case MessageDestination.CREWAI_DOCUMENT:
        return {
          ...basePayload,
          document: {
            url: MessageClassifier.extractMediaUrl(message),
            extractText: true
          }
        };

      default:
        return basePayload;
    }
  }

  /**
   * Extrai número de telefone do sender (formato WhatsApp)
   */
  private static extractPhoneNumber(sender: string): string {
    // Formato: 5511999999999@s.whatsapp.net
    return sender.split('@')[0] || sender;
  }
}
