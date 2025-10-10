/**
 * Configuração de rotas por tipo de mensagem
 */

export interface RouteConfig {
  endpoint: string;
  method: string;
  timeout: number;
  retries: number;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
}

export const MESSAGE_ROUTES: Record<string, RouteConfig> = {
  // Texto puro → CrewAI principal
  text_only: {
    endpoint: '/process',
    method: 'POST',
    timeout: 300000, // 5min
    retries: 2
  },

  // Áudio → Transcrição + CrewAI
  audio_only: {
    endpoint: '/process-audio',
    method: 'POST',
    timeout: 180000, // 3min
    retries: 1
  },

  text_with_audio: {
    endpoint: '/process-audio',
    method: 'POST',
    timeout: 180000,
    retries: 1
  },

  // Imagem → Vision + CrewAI
  image_only: {
    endpoint: '/process-image',
    method: 'POST',
    timeout: 180000,
    retries: 1
  },

  text_with_image: {
    endpoint: '/process-image',
    method: 'POST',
    timeout: 180000,
    retries: 1
  },

  // Documento → Extração + CrewAI
  document_only: {
    endpoint: '/process-document',
    method: 'POST',
    timeout: 300000,
    retries: 1
  },

  text_with_document: {
    endpoint: '/process-document',
    method: 'POST',
    timeout: 300000,
    retries: 1
  },

  // Vídeo → Resposta simples (muito pesado)
  video_only: {
    endpoint: '/auto-reply',
    method: 'POST',
    timeout: 10000,
    retries: 0
  },

  text_with_video: {
    endpoint: '/auto-reply',
    method: 'POST',
    timeout: 10000,
    retries: 0
  },

  // Mensagens simples → Auto-reply local
  sticker: {
    endpoint: 'local',
    method: 'REPLY',
    timeout: 5000,
    retries: 0
  },

  location: {
    endpoint: 'local',
    method: 'REPLY',
    timeout: 5000,
    retries: 0
  },

  contact: {
    endpoint: 'local',
    method: 'REPLY',
    timeout: 5000,
    retries: 0
  }
};

/**
 * Respostas automáticas por tipo de conteúdo
 */
export const AUTO_REPLIES: Record<string, string> = {
  sticker: '😄 Legal! Como posso ajudar você hoje?',
  
  location: '📍 Localização recebida! Obrigado por compartilhar.',
  
  contact: '👤 Contato recebido! Vou adicionar aos registros.',
  
  video_only: '🎥 Vídeo recebido! Devido ao tamanho, vou analisar e respondo em breve.',
  
  text_with_video: '🎥 Vídeo recebido! Vou analisar junto com sua mensagem e respondo em breve.',
  
  unknown: '📨 Mensagem recebida! Vou processar e retorno em breve.'
};

