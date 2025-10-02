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

    // Validar assinatura do webhook
    if (!uazClient.validateWebhookSignature(rawBody, signature)) {
      console.error('Webhook signature validation failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse do payload JSON
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validação básica do payload
    if (!payload.event || !payload.instance || !payload.data) {
      console.error('Invalid webhook payload structure:', payload);
      return NextResponse.json(
        { error: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    // Log do webhook recebido
    console.log('UAZ Webhook received:', {
      event: payload.event,
      instance: payload.instance,
      timestamp: new Date().toISOString(),
      dataId: payload.data.id,
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
async function processWebhookEvent(payload: WebhookPayload): Promise<void> {
  const { event, data } = payload;

  switch (event) {
    case 'messages':
      await handleMessageEvent(data);
      break;
    
    case 'messages_update':
      await handleMessageUpdateEvent(data);
      break;
    
    case 'connection':
      await handleConnectionEvent(data);
      break;
    
    case 'presence':
      await handlePresenceEvent(data);
      break;
    
    case 'contacts':
      await handleContactsEvent(data);
      break;
    
    case 'groups':
      await handleGroupsEvent(data);
      break;
    
    default:
      console.log(`Unhandled webhook event: ${event}`, data);
  }
}

/**
 * Processa eventos de mensagem
 */
async function handleMessageEvent(data: any): Promise<void> {
  console.log('Processing message event:', {
    messageId: data.id,
    from: data.from,
    to: data.to,
    type: data.type,
    body: data.body?.substring(0, 100) + '...', // Log apenas início da mensagem
    isGroup: data.isGroup,
    timestamp: data.timestamp,
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
