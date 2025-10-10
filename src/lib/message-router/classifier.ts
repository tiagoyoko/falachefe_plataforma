import { UAZMessage } from '@/lib/uaz-api/types';
import { MessageContentType, MessageClassification, MessageDestination } from './types';

/**
 * Classifica uma mensagem UAZAPI e determina seu tipo e destino
 */
export class MessageClassifier {
  /**
   * Classifica mensagem baseada nos campos UAZAPI
   */
  static classify(message: UAZMessage): MessageClassification {
    const messageType = message.messageType || message.type || '';
    const mediaType = message.mediaType || '';
    const hasText = !!(message.text || message.content);
    
    // Extrair informações
    const contentType = this.determineContentType(messageType, mediaType, hasText);
    const destination = this.determineDestination(contentType);
    const priority = this.determinePriority(contentType, message);
    const estimatedTime = this.estimateProcessingTime(contentType);

    return {
      contentType,
      destination,
      hasText,
      hasMedia: this.hasMedia(messageType, mediaType),
      mediaType: mediaType || undefined,
      textContent: message.text || message.content || undefined,
      priority,
      metadata: {
        messageType,
        mediaType: mediaType || undefined,
        hasCaption: hasText && this.hasMedia(messageType, mediaType),
        estimatedProcessingTime: estimatedTime
      }
    };
  }

  /**
   * Determina o tipo de conteúdo da mensagem
   */
  private static determineContentType(
    messageType: string, 
    mediaType: string, 
    hasText: boolean
  ): MessageContentType {
    const msgType = messageType.toLowerCase();
    const media = mediaType.toLowerCase();

    // Tipos especiais
    if (msgType.includes('sticker')) return MessageContentType.STICKER;
    if (msgType.includes('location')) return MessageContentType.LOCATION;
    if (msgType.includes('contact') || msgType.includes('vcard')) return MessageContentType.CONTACT;
    if (msgType.includes('poll')) return MessageContentType.POLL;
    if (msgType.includes('button')) return MessageContentType.BUTTON_RESPONSE;
    if (msgType.includes('list')) return MessageContentType.LIST_RESPONSE;

    // Mensagens com mídia
    if (msgType.includes('image') || media.includes('image')) {
      return hasText ? MessageContentType.TEXT_WITH_IMAGE : MessageContentType.IMAGE_ONLY;
    }
    
    if (msgType.includes('audio') || media.includes('audio') || msgType.includes('ptt')) {
      return hasText ? MessageContentType.TEXT_WITH_AUDIO : MessageContentType.AUDIO_ONLY;
    }
    
    if (msgType.includes('video') || media.includes('video')) {
      return hasText ? MessageContentType.TEXT_WITH_VIDEO : MessageContentType.VIDEO_ONLY;
    }
    
    if (msgType.includes('document') || media.includes('document') || media.includes('application')) {
      return hasText ? MessageContentType.TEXT_WITH_DOCUMENT : MessageContentType.DOCUMENT_ONLY;
    }

    // Apenas texto
    if (hasText && !this.hasMedia(messageType, mediaType)) {
      return MessageContentType.TEXT_ONLY;
    }

    return MessageContentType.UNKNOWN;
  }

  /**
   * Determina o destino baseado no tipo de conteúdo
   */
  private static determineDestination(contentType: MessageContentType): MessageDestination {
    switch (contentType) {
      // Texto puro -> CrewAI para análise completa
      case MessageContentType.TEXT_ONLY:
        return MessageDestination.CREWAI_TEXT;

      // Texto + mídia -> CrewAI com análise de mídia
      case MessageContentType.TEXT_WITH_IMAGE:
      case MessageContentType.TEXT_WITH_VIDEO:
        return MessageDestination.CREWAI_MEDIA;

      case MessageContentType.TEXT_WITH_AUDIO:
        return MessageDestination.CREWAI_AUDIO;

      case MessageContentType.TEXT_WITH_DOCUMENT:
        return MessageDestination.CREWAI_DOCUMENT;

      // Apenas mídia -> Processamento especializado
      case MessageContentType.IMAGE_ONLY:
      case MessageContentType.VIDEO_ONLY:
        return MessageDestination.CREWAI_MEDIA;

      case MessageContentType.AUDIO_ONLY:
        return MessageDestination.CREWAI_AUDIO;

      case MessageContentType.DOCUMENT_ONLY:
        return MessageDestination.CREWAI_DOCUMENT;

      // Interações rápidas
      case MessageContentType.BUTTON_RESPONSE:
      case MessageContentType.LIST_RESPONSE:
        return MessageDestination.AUTO_REPLY;

      // Ignorar
      case MessageContentType.STICKER:
      case MessageContentType.LOCATION:
      case MessageContentType.CONTACT:
      case MessageContentType.POLL:
        return MessageDestination.IGNORE;

      // Desconhecido -> enfileirar para análise manual
      default:
        return MessageDestination.QUEUE;
    }
  }

  /**
   * Determina prioridade de processamento
   */
  private static determinePriority(
    contentType: MessageContentType, 
    message: UAZMessage
  ): 'high' | 'medium' | 'low' {
    // Alta prioridade: texto puro (resposta rápida esperada)
    if (contentType === MessageContentType.TEXT_ONLY) {
      return 'high';
    }

    // Média prioridade: texto + mídia
    if (contentType.startsWith('text_with_')) {
      return 'medium';
    }

    // Baixa prioridade: apenas mídia ou outros
    return 'low';
  }

  /**
   * Estima tempo de processamento em segundos
   */
  private static estimateProcessingTime(contentType: MessageContentType): number {
    switch (contentType) {
      case MessageContentType.TEXT_ONLY:
        return 30; // 30 segundos (resposta rápida)
      
      case MessageContentType.TEXT_WITH_IMAGE:
      case MessageContentType.IMAGE_ONLY:
        return 60; // 1 minuto (análise de imagem)
      
      case MessageContentType.TEXT_WITH_AUDIO:
      case MessageContentType.AUDIO_ONLY:
        return 120; // 2 minutos (transcrição + análise)
      
      case MessageContentType.TEXT_WITH_VIDEO:
      case MessageContentType.VIDEO_ONLY:
        return 180; // 3 minutos (processamento de vídeo)
      
      case MessageContentType.TEXT_WITH_DOCUMENT:
      case MessageContentType.DOCUMENT_ONLY:
        return 90; // 1.5 minutos (leitura de documento)
      
      case MessageContentType.BUTTON_RESPONSE:
      case MessageContentType.LIST_RESPONSE:
        return 5; // 5 segundos (resposta automática)
      
      default:
        return 30;
    }
  }

  /**
   * Verifica se mensagem tem mídia
   */
  private static hasMedia(messageType: string, mediaType: string): boolean {
    const msgType = messageType.toLowerCase();
    const media = mediaType.toLowerCase();
    
    const mediaKeywords = ['image', 'audio', 'video', 'document', 'sticker', 'ptt'];
    
    return mediaKeywords.some(keyword => 
      msgType.includes(keyword) || media.includes(keyword)
    );
  }

  /**
   * Extrai URL da mídia se disponível
   */
  static extractMediaUrl(message: UAZMessage): string | undefined {
    // UAZAPI pode ter diferentes campos para URL
    const content = message.content;
    
    try {
      // Se content é JSON, pode ter mediaUrl
      const parsed = JSON.parse(content);
      return parsed.mediaUrl || parsed.url || parsed.media || undefined;
    } catch {
      // Se não é JSON, pode ser a própria URL
      if (content && (content.startsWith('http://') || content.startsWith('https://'))) {
        return content;
      }
    }
    
    return undefined;
  }
}

