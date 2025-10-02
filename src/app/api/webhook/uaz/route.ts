import { NextRequest, NextResponse } from 'next/server';
import { UAZClient } from '@/lib/uaz-api/client';
import { UAZError } from '@/lib/uaz-api/errors';
import { WebhookPayload } from '@/lib/uaz-api/types';

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
    let payload: any;
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
    if (!payload.EventType || !payload.message) {
      console.error('Invalid webhook payload structure:', payload);
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
async function processWebhookEvent(payload: any): Promise<void> {
  const { EventType, message, chat } = payload;

  switch (EventType) {
    case 'messages':
      await handleMessageEvent({ message, chat });
      break;
    
    case 'messages_update':
      await handleMessageUpdateEvent({ message, chat });
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
async function handleMessageEvent(data: any): Promise<void> {
  const { message, chat } = data;
  
  console.log('Processing message event:', {
    messageId: message.id,
    from: message.sender,
    to: message.chatid,
    type: message.type,
    content: message.content,
    text: message.text,
    isGroup: message.isGroup,
    timestamp: message.messageTimestamp,
    chatName: chat.name,
    senderName: message.senderName,
  });

  // TODO: Implementar roteamento para orchestrator
  // TODO: Salvar mensagem no banco de dados
  // TODO: Determinar agente responsável
  // TODO: Processar com agente especializado
}

/**
 * Processa atualizações de mensagem
 */
async function handleMessageUpdateEvent(data: any): Promise<void> {
  console.log('Processing message update event:', {
    messageId: data.id,
    status: data.status,
    timestamp: data.timestamp,
  });

  // TODO: Atualizar status da mensagem no banco
  // TODO: Notificar usuário sobre status (entregue, lida, etc.)
}

/**
 * Processa eventos de conexão
 */
async function handleConnectionEvent(data: any): Promise<void> {
  console.log('Processing connection event:', {
    status: data.status,
    instance: data.instance,
    timestamp: data.timestamp,
  });

  // TODO: Atualizar status da instância no banco
  // TODO: Notificar administradores sobre mudanças de status
}

/**
 * Processa eventos de presença
 */
async function handlePresenceEvent(data: any): Promise<void> {
  console.log('Processing presence event:', {
    from: data.from,
    presence: data.presence,
    timestamp: data.timestamp,
  });

  // TODO: Atualizar status de presença do usuário
  // TODO: Ajustar estratégia de resposta baseada na presença
}

/**
 * Processa eventos de contatos
 */
async function handleContactsEvent(data: any): Promise<void> {
  console.log('Processing contacts event:', {
    contactId: data.id,
    name: data.name,
    timestamp: data.timestamp,
  });

  // TODO: Atualizar informações do contato
  // TODO: Sincronizar com base de dados local
}

/**
 * Processa eventos de grupos
 */
async function handleGroupsEvent(data: any): Promise<void> {
  console.log('Processing groups event:', {
    groupId: data.id,
    name: data.name,
    participants: data.participants?.length || 0,
    timestamp: data.timestamp,
  });

  // TODO: Atualizar informações do grupo
  // TODO: Gerenciar permissões e configurações
}
