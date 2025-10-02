import { NextRequest, NextResponse } from 'next/server';
import { UAZClient } from '@/lib/uaz-api/client';
import { UAZError } from '@/lib/uaz-api/errors';
import { UAZWebhookPayload, UAZMessage, UAZChat } from '@/lib/uaz-api/types';

// Configuração do cliente UAZ
const uazClient = new UAZClient({
  baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
  apiKey: process.env.UAZ_API_KEY || '',
  apiSecret: process.env.UAZ_API_SECRET || '',
  webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
  timeout: 30000,
});

export async function POST(request: NextRequest) {
  try {
    // Obter payload bruto para validação de assinatura
    const rawBody = await request.text();
    
    // Obter assinatura do header
    const signature = request.headers.get('x-uaz-signature') || 
                     request.headers.get('x-signature') || 
                     request.headers.get('signature') || '';

    // Validação de assinatura desabilitada para testes
    console.log('Webhook received - signature validation skipped for testing');

    // Parse do payload JSON
    let payload: UAZWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validação básica do payload - estrutura real do UAZAPI
    if (!payload.EventType || !payload.message || !payload.chat || !payload.owner) {
      console.error('Invalid webhook payload structure:', {
        hasEventType: !!payload.EventType,
        hasMessage: !!payload.message,
        hasChat: !!payload.chat,
        hasOwner: !!payload.owner,
        payload: payload
      });
      return NextResponse.json(
        { error: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    // Log do webhook recebido
    console.log('UAZ Webhook received:', {
      eventType: payload.EventType,
      message: payload.message,
      chat: payload.chat,
      owner: payload.owner,
      timestamp: new Date().toISOString(),
    });

    // Processar webhook baseado no tipo de evento
    await processWebhookEvent(payload);

    // Resposta de sucesso
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Tratamento de erros específicos
    if (error instanceof UAZError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          success: false 
        },
        { status: error.code || 500 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok', 
      service: 'UAZ Webhook Handler',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

/**
 * Processa eventos do webhook baseado no tipo
 */
async function processWebhookEvent(payload: UAZWebhookPayload): Promise<void> {
  const { EventType, message, chat, owner, token } = payload;

  switch (EventType) {
    case 'messages':
      await handleMessageEvent({ message, chat, owner, token });
      break;
    
    case 'messages_update':
      await handleMessageUpdateEvent({ message, chat, owner, token });
      break;
    
    case 'connection':
      await handleConnectionEvent(payload);
      break;
    
    case 'presence':
      await handlePresenceEvent(payload);
      break;
    
    case 'contacts':
      await handleContactsEvent(payload);
      break;
    
    case 'groups':
      await handleGroupsEvent(payload);
      break;
    
    default:
      console.log(`Unhandled webhook event: ${EventType}`, payload);
  }
}

/**
 * Processa eventos de mensagem
 */
async function handleMessageEvent(data: { message: UAZMessage; chat: UAZChat; owner: string; token: string }): Promise<void> {
  const { message, chat, owner, token } = data;
  
  console.log('Processing message event:', {
    messageId: message.id,
    messageIdAlt: message.messageid,
    from: message.sender,
    to: message.chatid,
    type: message.type,
    messageType: message.messageType,
    content: message.content,
    text: message.text,
    isGroup: message.isGroup,
    fromMe: message.fromMe,
    timestamp: message.messageTimestamp,
    chatName: chat.name,
    chatId: chat.id,
    senderName: message.senderName,
    owner: owner,
    token: token ? '***' + token.slice(-4) : 'N/A',
    waChatId: chat.wa_chatid,
    waName: chat.wa_name,
    waUnreadCount: chat.wa_unreadCount,
  });

  // TODO: Implementar roteamento para orchestrator
  // TODO: Salvar mensagem no banco de dados
  // TODO: Determinar agente responsável
  // TODO: Processar com agente especializado
}

/**
 * Processa atualizações de mensagem
 */
async function handleMessageUpdateEvent(data: { message: UAZMessage; chat: UAZChat; owner: string; token: string }): Promise<void> {
  const { message, chat, owner, token } = data;
  
  console.log('Processing message update event:', {
    messageId: message.id,
    messageIdAlt: message.messageid,
    status: message.status,
    timestamp: message.messageTimestamp,
    from: message.sender,
    chatId: chat.id,
    owner: owner,
  });

  // TODO: Atualizar status da mensagem no banco
  // TODO: Notificar usuário sobre status (entregue, lida, etc.)
}

/**
 * Processa eventos de conexão
 */
async function handleConnectionEvent(data: UAZWebhookPayload): Promise<void> {
  console.log('Processing connection event:', {
    eventType: data.EventType,
    owner: data.owner,
    token: data.token ? '***' + data.token.slice(-4) : 'N/A',
    baseUrl: data.BaseUrl,
  });

  // TODO: Atualizar status da instância no banco
  // TODO: Notificar administradores sobre mudanças de status
}

/**
 * Processa eventos de presença
 */
async function handlePresenceEvent(data: UAZWebhookPayload): Promise<void> {
  console.log('Processing presence event:', {
    eventType: data.EventType,
    owner: data.owner,
    token: data.token ? '***' + data.token.slice(-4) : 'N/A',
    baseUrl: data.BaseUrl,
  });

  // TODO: Atualizar status de presença do usuário
  // TODO: Ajustar estratégia de resposta baseada na presença
}

/**
 * Processa eventos de contatos
 */
async function handleContactsEvent(data: UAZWebhookPayload): Promise<void> {
  console.log('Processing contacts event:', {
    eventType: data.EventType,
    owner: data.owner,
    token: data.token ? '***' + data.token.slice(-4) : 'N/A',
    baseUrl: data.BaseUrl,
  });

  // TODO: Atualizar informações do contato
  // TODO: Sincronizar com base de dados local
}

/**
 * Processa eventos de grupos
 */
async function handleGroupsEvent(data: UAZWebhookPayload): Promise<void> {
  console.log('Processing groups event:', {
    eventType: data.EventType,
    owner: data.owner,
    token: data.token ? '***' + data.token.slice(-4) : 'N/A',
    baseUrl: data.BaseUrl,
    chat: data.chat ? {
      id: data.chat.id,
      name: data.chat.name,
      isGroup: data.chat.wa_isGroup,
      participants: data.chat.wa_isGroup ? 'N/A' : 'Not a group',
    } : 'No chat data',
  });

  // TODO: Atualizar informações do grupo
  // TODO: Gerenciar permissões e configurações
}
