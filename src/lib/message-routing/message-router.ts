/**
 * Message Router
 * Analisa tipo de mensagem e roteia para o processador correto
 */

import { UAZMessage, UAZChat } from '@/lib/uaz-api/types';
import { MessageDestination } from '@/lib/message-router/types';

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
  destination: MessageDestination;  // ✅ Agora usa enum correto!
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
    let destination: MessageDestination = MessageDestination.CREWAI_TEXT; // Destino padrão
    let processingPriority: 'high' | 'normal' | 'low' = 'normal';
    let requiresSpecialHandling = false;

    // Detectar tipo de conteúdo baseado no messageType
    switch (messageType.toLowerCase()) {
      // Apenas texto
      case 'conversation':
      case 'text':
      case 'extendedtextmessage':
        contentType = 'text_only';
        destination = MessageDestination.CREWAI_TEXT;
        processingPriority = 'high';
        break;

      // Imagem
      case 'imagemessage':
      case 'image':
        contentType = hasText ? 'text_with_image' : 'image_only';
        destination = MessageDestination.CREWAI_MEDIA;
        requiresSpecialHandling = true;
        break;

      // Áudio
      case 'audiomessage':
      case 'audio':
      case 'ptt': // Push to Talk (áudio de voz)
        contentType = hasText ? 'text_with_audio' : 'audio_only';
        destination = MessageDestination.CREWAI_AUDIO;
        requiresSpecialHandling = true;
        processingPriority = 'high';
        break;

      // Documento
      case 'documentmessage':
      case 'document':
        contentType = hasText ? 'text_with_document' : 'document_only';
        destination = MessageDestination.CREWAI_DOCUMENT;
        requiresSpecialHandling = true;
        break;

      // Vídeo
      case 'videomessage':
      case 'video':
        contentType = hasText ? 'text_with_video' : 'video_only';
        destination = MessageDestination.CREWAI_MEDIA;
        requiresSpecialHandling = true;
        processingPriority = 'low';
        break;

      // Sticker
      case 'stickermessage':
      case 'sticker':
        contentType = 'sticker';
        destination = MessageDestination.IGNORE;
        processingPriority = 'low';
        break;

      // Localização
      case 'locationmessage':
      case 'location':
        contentType = 'location';
        destination = MessageDestination.IGNORE;
        break;

      // Contato
      case 'contactmessage':
      case 'contact':
      case 'contactsmessage':
        contentType = 'contact';
        destination = MessageDestination.IGNORE;
        break;

      // Padrão
      default:
        // Se tem texto, processar como texto
        if (hasText) {
          contentType = 'text_only';
          destination = MessageDestination.CREWAI_TEXT;
          processingPriority = 'normal';
        } else {
          contentType = 'unknown';
          destination = MessageDestination.IGNORE;
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
    config: Record<string, unknown>;
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

  /**
   * Roteia mensagem para o processador correto
   * 
   * @param message - Mensagem UAZAPI
   * @param chat - Chat UAZAPI
   * @param baseUrl - URL base do servidor CrewAI
   * @returns Configuração de roteamento
   */
  static async route(
    message: UAZMessage,
    chat: UAZChat,
    baseUrl: string
  ): Promise<{
    shouldProcess: boolean;
    reason?: string;
    classification: MessageAnalysis;
    destination: {
      endpoint: string;
      timeout: number;
    };
  }> {
    // 1. Validar se deve processar
    const validationResult = this.shouldProcess(message);
    
    if (!validationResult.shouldProcess) {
      const classification = this.analyzeMessage(message);
      return {
        shouldProcess: false,
        reason: validationResult.reason,
        classification,
        destination: { endpoint: '', timeout: 0 }
      };
    }
    
    // 2. Classificar mensagem
    const classification = this.analyzeMessage(message);
    
    // 3. Obter endpoint de processamento
    const processingConfig = this.getProcessingEndpoint(classification);
    
    // 4. Construir endpoint completo
    const fullEndpoint = processingConfig.endpoint === 'local' 
      ? 'local'
      : `${baseUrl.trim()}${processingConfig.endpoint}`;
    
    // 5. Retornar configuração de roteamento
    return {
      shouldProcess: true,
      classification,
      destination: {
        endpoint: fullEndpoint,
        timeout: (processingConfig.config.timeout as number) || 120000
      }
    };
  }

  /**
   * Prepara payload para enviar ao CrewAI
   */
  static preparePayload(
    message: UAZMessage,
    chat: UAZChat,
    classification: MessageAnalysis,
    userId: string,
    conversationId: string
  ): Record<string, unknown> {
    // Extrair phoneNumber limpo
    const phoneNumber = chat.phone?.replace(/[^0-9]/g, '') || chat.wa_chatid?.split('@')[0] || '';
    
    return {
      userId,
      userName: chat.name || chat.wa_contactName || 'Usuário',
      phoneNumber,  // ✅ Agora no nível raiz como CrewAI espera
      message: message.text || message.content || '',
      conversationId,
      context: {
        source: 'whatsapp',
        messageType: classification.contentType || message.messageType,
        chatName: chat.name || chat.wa_contactName,
        timestamp: new Date().toISOString()
      }
    };
  }
}

