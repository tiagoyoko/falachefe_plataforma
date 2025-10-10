/**
 * Message Router
 * Analisa tipo de mensagem e roteia para o processador correto
 */

import { UAZMessage } from '@/lib/uaz-api/types';

export type MessageContentType = 
  | 'text_only'           // Apenas texto
  | 'text_with_image'     // Texto + imagem
  | 'text_with_audio'     // Texto + áudio
  | 'text_with_document'  // Texto + arquivo
  | 'text_with_video'     // Texto + vídeo
  | 'image_only'          // Apenas imagem
  | 'audio_only'          // Apenas áudio
  | 'document_only'       // Apenas arquivo
  | 'video_only'          // Apenas vídeo
  | 'sticker'             // Sticker
  | 'location'            // Localização
  | 'contact'             // Contato
  | 'unknown';            // Tipo desconhecido

export interface MessageAnalysis {
  contentType: MessageContentType;
  hasText: boolean;
  hasMedia: boolean;
  mediaType: string | null;
  messageType: string;
  destination: string;
  processingPriority: 'high' | 'normal' | 'low';
  requiresSpecialHandling: boolean;
}

export class MessageRouter {
  
  /**
   * Analisa o tipo de conteúdo da mensagem
   */
  static analyzeMessage(message: UAZMessage): MessageAnalysis {
    const hasText = !!(message.text || message.content);
    const mediaType = message.mediaType || null;
    const messageType = message.messageType || message.type || '';
    
    let contentType: MessageContentType = 'unknown';
    let destination = 'crewai'; // Destino padrão
    let processingPriority: 'high' | 'normal' | 'low' = 'normal';
    let requiresSpecialHandling = false;

    // Detectar tipo de conteúdo baseado no messageType
    switch (messageType.toLowerCase()) {
      // Apenas texto
      case 'conversation':
      case 'text':
      case 'extendedtextmessage':
        contentType = 'text_only';
        destination = 'crewai';
        processingPriority = 'high';
        break;

      // Imagem
      case 'imagemessage':
      case 'image':
        contentType = hasText ? 'text_with_image' : 'image_only';
        destination = hasText ? 'crewai-vision' : 'image-analyzer';
        requiresSpecialHandling = true;
        break;

      // Áudio
      case 'audiomessage':
      case 'audio':
      case 'ptt': // Push to Talk (áudio de voz)
        contentType = hasText ? 'text_with_audio' : 'audio_only';
        destination = hasText ? 'crewai-audio' : 'audio-transcriber';
        requiresSpecialHandling = true;
        processingPriority = 'high';
        break;

      // Documento
      case 'documentmessage':
      case 'document':
        contentType = hasText ? 'text_with_document' : 'document_only';
        destination = hasText ? 'crewai-document' : 'document-analyzer';
        requiresSpecialHandling = true;
        break;

      // Vídeo
      case 'videomessage':
      case 'video':
        contentType = hasText ? 'text_with_video' : 'video_only';
        destination = hasText ? 'crewai-video' : 'video-analyzer';
        requiresSpecialHandling = true;
        processingPriority = 'low';
        break;

      // Sticker
      case 'stickermessage':
      case 'sticker':
        contentType = 'sticker';
        destination = 'auto-reply'; // Resposta automática simples
        processingPriority = 'low';
        break;

      // Localização
      case 'locationmessage':
      case 'location':
        contentType = 'location';
        destination = 'location-handler';
        break;

      // Contato
      case 'contactmessage':
      case 'contact':
      case 'contactsmessage':
        contentType = 'contact';
        destination = 'contact-handler';
        break;

      // Padrão
      default:
        // Se tem texto, processar como texto
        if (hasText) {
          contentType = 'text_only';
          destination = 'crewai';
          processingPriority = 'normal';
        } else {
          contentType = 'unknown';
          destination = 'fallback';
          requiresSpecialHandling = true;
        }
    }

    const hasMedia = !!(mediaType || ['image', 'audio', 'video', 'document'].some(
      type => messageType.toLowerCase().includes(type)
    ));

    return {
      contentType,
      hasText,
      hasMedia,
      mediaType,
      messageType,
      destination,
      processingPriority,
      requiresSpecialHandling
    };
  }

  /**
   * Decide qual endpoint/serviço processar a mensagem
   */
  static getProcessingEndpoint(analysis: MessageAnalysis): {
    endpoint: string;
    method: 'crewai' | 'transcription' | 'vision' | 'document' | 'simple' | 'fallback';
    config: Record<string, any>;
  } {
    const baseUrl = process.env.CREWAI_API_URL || 'https://api.falachefe.app.br';

    switch (analysis.contentType) {
      // Texto puro → CrewAI normal
      case 'text_only':
        return {
          endpoint: `${baseUrl}/process`,
          method: 'crewai',
          config: {
            timeout: 300000, // 5 minutos
            retries: 2
          }
        };

      // Áudio → Transcrever + CrewAI
      case 'audio_only':
      case 'text_with_audio':
        return {
          endpoint: `${baseUrl}/process-audio`,
          method: 'transcription',
          config: {
            transcribe: true,
            language: 'pt-BR',
            timeout: 180000 // 3 minutos
          }
        };

      // Imagem → Vision + CrewAI
      case 'image_only':
      case 'text_with_image':
        return {
          endpoint: `${baseUrl}/process-image`,
          method: 'vision',
          config: {
            analyze: true,
            extractText: true,
            timeout: 180000 // 3 minutos
          }
        };

      // Documento → Extrair texto + CrewAI
      case 'document_only':
      case 'text_with_document':
        return {
          endpoint: `${baseUrl}/process-document`,
          method: 'document',
          config: {
            extractText: true,
            analyze: true,
            timeout: 300000 // 5 minutos
          }
        };

      // Vídeo → Resposta simples (muito pesado)
      case 'video_only':
      case 'text_with_video':
        return {
          endpoint: `${baseUrl}/process-video`,
          method: 'simple',
          config: {
            autoReply: 'Recebi seu vídeo! Vou analisar e respondo em breve.',
            timeout: 60000
          }
        };

      // Sticker → Resposta divertida
      case 'sticker':
        return {
          endpoint: 'local',
          method: 'simple',
          config: {
            autoReply: '😄 Legal! Como posso ajudar?'
          }
        };

      // Localização → Agradecimento
      case 'location':
        return {
          endpoint: 'local',
          method: 'simple',
          config: {
            autoReply: '📍 Localização recebida! Obrigado!'
          }
        };

      // Contato → Salvar
      case 'contact':
        return {
          endpoint: 'local',
          method: 'simple',
          config: {
            autoReply: '👤 Contato recebido! Vou adicionar aos registros.'
          }
        };

      // Fallback → CrewAI com timeout curto
      default:
        return {
          endpoint: `${baseUrl}/process`,
          method: 'fallback',
          config: {
            timeout: 30000,
            retries: 1,
            autoReply: 'Recebi sua mensagem! Vou processar e respondo em breve.'
          }
        };
    }
  }

  /**
   * Valida se a mensagem deve ser processada
   */
  static shouldProcess(message: UAZMessage): {
    shouldProcess: boolean;
    reason: string;
  } {
    // Não processar mensagens próprias
    if (message.fromMe) {
      return {
        shouldProcess: false,
        reason: 'Message sent by bot'
      };
    }

    // Não processar mensagens de sistema
    if (message.messageType === 'protocol' || message.messageType === 'system') {
      return {
        shouldProcess: false,
        reason: 'System message'
      };
    }

    // Não processar reações
    if (message.reaction) {
      return {
        shouldProcess: false,
        reason: 'Reaction message'
      };
    }

    return {
      shouldProcess: true,
      reason: 'Valid user message'
    };
  }

  /**
   * Extrai informações de mídia da mensagem
   */
  static extractMediaInfo(message: UAZMessage): {
    hasMedia: boolean;
    mediaUrl?: string;
    mediaType?: string;
    mediaCaption?: string;
    mediaMimetype?: string;
  } {
    const content = message.content;
    
    // Se content é um objeto/JSON string
    try {
      const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
      
      return {
        hasMedia: !!(contentObj.url || contentObj.mediaUrl),
        mediaUrl: contentObj.url || contentObj.mediaUrl,
        mediaType: contentObj.mediaType || message.mediaType,
        mediaCaption: contentObj.caption || contentObj.text,
        mediaMimetype: contentObj.mimetype || contentObj.mimeType
      };
    } catch {
      // Se não for JSON, não tem mídia estruturada
      return {
        hasMedia: false
      };
    }
  }
}

