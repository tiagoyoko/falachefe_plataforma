import { NextRequest, NextResponse } from 'next/server';
import { UAZClient } from '@/lib/uaz-api/client';
import { UAZError } from '@/lib/uaz-api/errors';
import { UAZWebhookPayload, UAZMessage, UAZChat, UAZPresenceEvent } from '@/lib/uaz-api/types';
import { MessageService } from '@/services/message-service';
// Removed agent-squad framework references
import { AgentOrchestrator } from '@/agents/core/agent-orchestrator';
import { WindowControlService } from '@/lib/window-control/window-service';
import { RedisClient } from '@/lib/cache/redis-client';

// Redis client instance (singleton)
let redisClient: RedisClient | null = null;

// Window Control Service instance (singleton)
let windowControlService: WindowControlService | null = null;

// Configuração do cliente UAZ
let uazClient: UAZClient | null = null;

// Agent Squad instance removed - using AgentOrchestrator directly

// Agent Orchestrator instance (singleton)
const agentOrchestrator: AgentOrchestrator | null = null;

/**
 * Initialize Redis Client if not already initialized
 */
async function initializeRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    console.log('🗄️ Initializing Redis Client...');
    redisClient = new RedisClient({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
    await redisClient.connect();
    console.log('✅ Redis Client initialized');
  }
  return redisClient;
}

/**
 * Initialize Window Control Service if not already initialized
 */
async function initializeWindowControlService(): Promise<WindowControlService> {
  if (!windowControlService) {
    console.log('🪟 Initializing Window Control Service...');
    const redis = await initializeRedisClient();
    windowControlService = new WindowControlService(redis);
    console.log('✅ Window Control Service initialized');
  }
  return windowControlService;
}

/**
 * Initialize UAZ Client if not already initialized
 */
async function initializeUAZClient(): Promise<UAZClient> {
  if (!uazClient) {
    console.log('🔌 Initializing UAZ Client...');
    const windowService = await initializeWindowControlService();
    uazClient = new UAZClient({
      baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
      apiKey: process.env.UAZ_API_KEY || '',
      apiSecret: process.env.UAZ_API_SECRET || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
      timeout: 30000,
    }, windowService);
    console.log('✅ UAZ Client initialized');
  }
  return uazClient;
}

// Removed initializeAgentSquad function - using AgentOrchestrator directly

/**
 * Initialize Agent Orchestrator if not already initialized
 */
async function initializeAgentOrchestrator(): Promise<AgentOrchestrator> {
  if (!agentOrchestrator) {
    console.log('🎯 Initializing Agent Orchestrator...');
    
    // TODO: Implement simplified AgentOrchestrator without Agent Squad dependencies
    // For now, we'll use a placeholder that can be implemented later
    throw new Error('AgentOrchestrator initialization needs to be updated after removing Agent Squad framework');
  }
  return agentOrchestrator;
}

/**
 * Valida se o payload UAZAPI tem a estrutura correta baseada no tipo de evento
 */
function validateUAZPayload(payload: unknown): payload is UAZWebhookPayload {
  // Verificar se é um objeto
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Campos obrigatórios para todos os payloads
  if (!p.EventType || !p.owner || !p.token) {
    return false;
  }

  // Validação específica por tipo de evento
  switch (p.EventType) {
    case 'messages':
    case 'messages_update':
      return !!(p.message && p.chat);
    
    case 'presence':
      return !!(p.event && p.type);
    
    case 'connection':
    case 'contacts':
    case 'groups':
      // Estes eventos podem ter estruturas mais simples
      return true;
    
    default:
      // Para eventos desconhecidos, aceitar se tem os campos básicos
      return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter payload bruto para validação de assinatura
    const rawBody = await request.text();
    
    // Obter assinatura do header (para validação futura)
    const _signature = request.headers.get('x-uaz-signature') || 
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
    // Diferentes tipos de evento têm estruturas diferentes
    const isValidPayload = validateUAZPayload(payload);
    
    if (!isValidPayload) {
      console.error('Invalid webhook payload structure:', {
        hasEventType: !!payload.EventType,
        hasMessage: !!payload.message,
        hasChat: !!payload.chat,
        hasEvent: !!payload.event,
        hasOwner: !!payload.owner,
        eventType: payload.EventType,
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
  const { EventType, message, chat, event, owner, token } = payload;

  switch (EventType) {
    case 'messages':
      if (message && chat) {
        await handleMessageEvent({ message, chat, owner, token });
      }
      break;
    
    case 'messages_update':
      if (message && chat) {
        await handleMessageUpdateEvent({ message, chat, owner, token });
      }
      break;
    
    case 'connection':
      await handleConnectionEvent(payload);
      break;
    
    case 'presence':
      if (event) {
        await handlePresenceEvent({ event, owner, token });
      }
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

  try {
    // Inicializar UAZ Client com controle de janela
    const uazClientInstance = await initializeUAZClient();
    
    // Processar mensagem do usuário (renovar janela se necessário)
    if (!message.fromMe) {
      await uazClientInstance.processUserMessage(message.sender);
      console.log('🪟 User message processed, window renewed if needed');
    }

    // Salvar mensagem no banco de dados
    const result = await MessageService.processIncomingMessage(message, chat, owner);
    
    console.log('Message saved successfully:', {
      messageId: result.message.id,
      conversationId: result.conversation.id,
      userId: result.user.id,
      userName: result.user.name
    });

    // Process message through Agent Orchestrator
    try {
      const orchestrator = await initializeAgentOrchestrator();
      
      // Convert UAZ message to orchestrator format
      const orchestratorMessage = {
        id: message.id,
        text: message.text || message.content || '',
        type: message.type || 'text',
        sender: message.sender,
        chatId: message.chatid,
        timestamp: message.messageTimestamp,
        isGroup: message.isGroup || false,
        fromMe: message.fromMe || false,
        metadata: {
          messageId: message.messageid,
          senderName: message.senderName,
          chatName: chat.name,
          owner: owner,
          uazMessageId: message.id,
          uazChatId: chat.id
        }
      };

      // Create conversation context
      const conversationContext = {
        conversationId: `conv-${message.id}`,
        userId: message.sender,
        agentId: 'orchestrator',
        currentIntent: {
          intent: 'general',
          domain: 'general',
          confidence: 1.0,
          reasoning: 'Initial message',
          suggestedAgent: 'orchestrator'
        },
        conversationHistory: [{
          role: 'user' as const,
          content: orchestratorMessage.text,
          timestamp: new Date(),
          metadata: {
            messageId: message.id,
            senderId: message.sender
          }
        }],
        metadata: {
          createdAt: new Date(),
          lastUpdated: new Date(),
          version: 1.0,
          updates: []
        },
        userPreferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        },
        sessionData: {
          chatId: orchestratorMessage.chatId,
          isGroup: orchestratorMessage.isGroup,
          fromMe: orchestratorMessage.fromMe
        }
      };

      // Process through Agent Orchestrator
      const response = await orchestrator.processMessage(orchestratorMessage.text, conversationContext);
      
      console.log('Agent Orchestrator response:', {
        agentId: response.agentId,
        agentType: response.agentType,
        response: response.response,
        processingTime: response.processingTime,
        confidence: response.confidence
      });
      
      // Send response back to user via UAZ API if available
      if (response.response && !message.fromMe) {
        await sendResponseToUserWithWindowValidation(chat, response.response, owner, token, message.sender);
      }
      
    } catch (error) {
      console.error('Error processing message through Agent Orchestrator:', error);
      // Continue with normal message processing even if orchestrator fails
    }
    
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    // Não falhar o webhook por erro de banco, apenas logar
  }
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
async function handlePresenceEvent(data: { event: UAZPresenceEvent; owner: string; token: string }): Promise<void> {
  const { event, owner, token: _token } = data;
  
  console.log('Processing presence event:', {
    chat: event.Chat,
    sender: event.Sender,
    isFromMe: event.IsFromMe,
    isGroup: event.IsGroup,
    state: event.State,
    media: event.Media,
    addressingMode: event.AddressingMode,
    senderAlt: event.SenderAlt,
    recipientAlt: event.RecipientAlt,
    broadcastListOwner: event.BroadcastListOwner,
    broadcastRecipients: event.BroadcastRecipients,
    owner: owner,
    token: _token ? '***' + _token.slice(-4) : 'N/A',
  });

  // TODO: Atualizar status de presença do usuário
  // TODO: Ajustar estratégia de resposta baseada na presença
  // TODO: Implementar lógica baseada no estado (composing, recording, etc.)
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

/**
 * Envia resposta para o usuário via UAZ API com validação de janela
 */
async function sendResponseToUserWithWindowValidation(
  chat: UAZChat,
  response: string,
  owner: string,
  token: string,
  userId: string
): Promise<void> {
  try {
    console.log('Sending response to user with window validation:', {
      chatId: chat.id,
      chatName: chat.name,
      responseLength: response.length,
      owner: owner,
      userId: userId
    });

    // Obter UAZ Client com controle de janela
    const uazClientInstance = await initializeUAZClient();

    // Enviar mensagem via UAZ API com validação de janela
    const messageData = {
      chatId: chat.id,
      number: chat.id, // Usar chatId como number
      text: response,
      type: 'text'
    };

    const result = await uazClientInstance.sendMessageWithWindowValidation(
      messageData, 
      owner, 
      token, 
      userId
    );
    
    console.log('Response sent successfully with window validation:', {
      messageId: result.data?.id,
      status: result.data?.status,
      chatId: chat.id,
      userId: userId
    });

  } catch (error) {
    console.error('Error sending response to user with window validation:', error);
    
    // Se erro é de janela não ativa, tentar enviar template aprovado
    if (error instanceof UAZError && error.code === 403) {
      console.log('🪟 Window not active, attempting to send approved template...');
      await sendApprovedTemplate(chat, owner, token, userId);
    } else {
      // Não falhar o processamento por erro de envio
      console.error('Failed to send response:', error);
    }
  }
}

/**
 * Envia template aprovado quando janela não está ativa
 */
async function sendApprovedTemplate(
  chat: UAZChat,
  owner: string,
  token: string,
  userId: string
): Promise<void> {
  try {
    const uazClientInstance = await initializeUAZClient();
    
    // Usar template de confirmação
    const templateData = {
      name: 'confirmation',
      category: 'utility' as const,
      language: 'pt_BR',
      content: {
        body: {
          text: 'Recebemos sua mensagem. Em breve retornaremos.'
        }
      }
    };

    const result = await uazClientInstance.sendTemplateWithWindowValidation(
      templateData,
      owner,
      token,
      userId,
      'confirmation'
    );
    
    console.log('Approved template sent successfully:', {
      messageId: result.data?.id,
      status: result.data?.status,
      chatId: chat.id,
      templateId: 'confirmation'
    });

  } catch (error) {
    console.error('Error sending approved template:', error);
  }
}

/**
 * Envia resposta para o usuário via UAZ API (método legado)
 */
async function sendResponseToUser(
  chat: UAZChat,
  response: string,
  owner: string,
  token: string
): Promise<void> {
  try {
    console.log('Sending response to user (legacy):', {
      chatId: chat.id,
      chatName: chat.name,
      responseLength: response.length,
      owner: owner
    });

    // Obter UAZ Client
    const uazClientInstance = await initializeUAZClient();

    // Enviar mensagem via UAZ API
    const messageData = {
      number: chat.id,
      text: response
    };

    const result = await uazClientInstance.sendTextMessage(messageData);
    
    console.log('Response sent successfully:', {
      messageId: result.data?.id,
      status: result.data?.status,
      chatId: chat.id
    });

  } catch (error) {
    console.error('Error sending response to user:', error);
    // Não falhar o processamento por erro de envio
  }
}
