/**
 * Tipos de mensagem suportados pelo sistema
 */
export enum MessageContentType {
  // Apenas texto
  TEXT_ONLY = 'text_only',
  
  // Texto + mídia
  TEXT_WITH_IMAGE = 'text_with_image',
  TEXT_WITH_AUDIO = 'text_with_audio',
  TEXT_WITH_VIDEO = 'text_with_video',
  TEXT_WITH_DOCUMENT = 'text_with_document',
  
  // Apenas mídia
  IMAGE_ONLY = 'image_only',
  AUDIO_ONLY = 'audio_only',
  VIDEO_ONLY = 'video_only',
  DOCUMENT_ONLY = 'document_only',
  
  // Outros tipos
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
  POLL = 'poll',
  BUTTON_RESPONSE = 'button_response',
  LIST_RESPONSE = 'list_response',
  
  // Desconhecido
  UNKNOWN = 'unknown'
}

/**
 * Destinos possíveis para cada tipo de mensagem
 */
export enum MessageDestination {
  // CrewAI Agents
  CREWAI_TEXT = 'crewai_text',              // Marketing, Sales, Financial, HR, Support
  CREWAI_MEDIA = 'crewai_media',            // Análise de imagem/vídeo
  CREWAI_AUDIO = 'crewai_audio',            // Transcrição + análise
  CREWAI_DOCUMENT = 'crewai_document',      // Processamento de documentos
  
  // Processamento direto
  AUTO_REPLY = 'auto_reply',                // Resposta automática simples
  IGNORE = 'ignore',                        // Ignorar (stickers, reactions, etc)
  
  // Fallback
  QUEUE = 'queue',                          // Enfileirar para análise manual
}

/**
 * Resultado da classificação de mensagem
 */
export interface MessageClassification {
  contentType: MessageContentType;
  destination: MessageDestination;
  hasText: boolean;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
  textContent?: string;
  priority: 'high' | 'medium' | 'low';
  metadata: {
    messageType: string;
    mediaType?: string;
    hasCaption: boolean;
    estimatedProcessingTime: number; // em segundos
  };
}

