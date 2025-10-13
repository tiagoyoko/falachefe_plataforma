import { NextRequest, NextResponse } from 'next/server';
import { UAZClient } from '@/lib/uaz-api/client';
import { UAZError } from '@/lib/uaz-api/errors';
import { UAZWebhookPayload, UAZMessage, UAZChat, UAZPresenceEvent, UAZReceiptEvent } from '@/lib/uaz-api/types';
import { MessageService } from '@/services/message-service';
import { createRedisQueue } from '@/lib/queue/redis-queue';
import { WindowControlService } from '@/lib/window-control/window-service';
import { UpstashRedisClient as RedisClient } from '@/lib/cache/upstash-redis-client';
import { MessageRouter, MessageDestination } from '@/lib/message-router';

// Redis client instance (singleton)
let redisClient: RedisClient | null = null;

// Window Control Service instance (singleton)
let windowControlService: WindowControlService | null = null;

// Configuração do cliente UAZ
let uazClient: UAZClient | null = null;

// Agent Squad instance removed - using AgentOrchestrator directly

// Agent Orchestrator instance (singleton) - TODO: Remove after implementing /api/crewai/process
// const agentOrchestrator: AgentOrchestrator | null = null;

/**
 * Initialize Redis Client if not already initialized
 * Usando Upstash Redis (REST API para serverless)
 */
async function initializeRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    console.log('🗄️ Initializing Upstash Redis Client...');
    redisClient = new RedisClient({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
    });
    // Upstash não precisa de connect() explícito (HTTP/REST)
    await redisClient.connect();
    console.log('✅ Upstash Redis Client initialized');
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
      baseUrl: process.env.UAZAPI_BASE_URL || 'https://falachefe.uazapi.com',
      apiKey: process.env.UAZAPI_TOKEN || process.env.UAZAPI_INSTANCE_TOKEN || '',
      apiSecret: process.env.UAZAPI_ADMIN_TOKEN || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET,
      timeout: 30000,
    }, windowService);
    console.log('✅ UAZ Client initialized with token:', process.env.UAZAPI_TOKEN ? '***' + process.env.UAZAPI_TOKEN.slice(-4) : 'NOT SET');
  }
  return uazClient;
}

// Removed initializeAgentSquad function - using AgentOrchestrator directly

/**
 * Initialize Agent Orchestrator if not already initialized
 */
// TODO: Replace with call to /api/crewai/process endpoint
// async function initializeAgentOrchestrator(): Promise<AgentOrchestrator> {
//   if (!agentOrchestrator) {
//     console.log('🎯 Initializing Agent Orchestrator...');
//     throw new Error('AgentOrchestrator initialization needs to be updated after removing Agent Squad framework');
//   }
//   return agentOrchestrator;
// }

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
      return !!(p.message && p.chat);
    
    case 'messages_update':
      // messages_update pode ter:
      // - message + chat (atualização de mensagem)
      // - event + type (read receipts, delivery receipts)
      return !!((p.message && p.chat) || (p.event && p.type));
    
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
 * Type guard para verificar se é um UAZReceiptEvent
 */
function isReceiptEvent(event: UAZPresenceEvent | UAZReceiptEvent): event is UAZReceiptEvent {
  return 'Type' in event && (event.Type === 'read' || event.Type === 'delivery');
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
      } else if (event) {
        // Read receipts e delivery receipts
        await handleMessageReceiptEvent(payload);
      }
      break;
    
    case 'connection':
      await handleConnectionEvent(payload);
      break;
    
    case 'presence':
      if (event && !isReceiptEvent(event)) {
        await handlePresenceEvent({ event: event as UAZPresenceEvent, owner, token });
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
 * Decodifica base64 se necessário
 */
function decodeBase64IfNeeded(text: string): string {
  if (!text) return '';
  
  try {
    // Verifica se é base64 válido (regex simplificado)
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    
    // Se parece com base64 e não tem caracteres especiais comuns em texto
    if (base64Regex.test(text) && !text.includes(' ') && text.length > 20) {
      const decoded = Buffer.from(text, 'base64').toString('utf-8');
      
      // Verifica se o decode resultou em texto válido (não binário)
      if (/^[\x20-\x7E\u00A0-\uFFFF\s]+$/.test(decoded)) {
        console.log('🔓 Base64 detected and decoded');
        return decoded;
      }
    }
  } catch {
    // Se falhar, retorna original
    console.log('⚠️ Base64 decode failed, using original text');
  }
  
  return text;
}

/**
 * Processa eventos de mensagem
 */
async function handleMessageEvent(data: { message: UAZMessage; chat: UAZChat; owner: string; token: string }): Promise<void> {
  const { message, chat, owner, token } = data;
  
  // Decodificar base64 se necessário
  const decodedContent = decodeBase64IfNeeded(message.content || '');
  const decodedText = decodeBase64IfNeeded(message.text || '');
  
  console.log('Processing message event:', {
    messageId: message.id,
    messageIdAlt: message.messageid,
    from: message.sender,
    to: message.chatid,
    type: message.type,
    messageType: message.messageType,
    content: decodedContent,
    text: decodedText,
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

    // Atualizar message com textos decodificados
    const processedMessage = {
      ...message,
      content: decodedContent,
      text: decodedText
    };

    // Salvar mensagem no banco de dados
    const result = await MessageService.processIncomingMessage(processedMessage, chat, owner);
    
    console.log('Message saved successfully:', {
      messageId: result.message.id,
      conversationId: result.conversation.id,
      userId: result.user.id,
      userName: result.user.name
    });

      // ✨ NOVO: Verificar se usuário precisa cadastrar empresa
      if (result.requiresCompanySetup && result.standardMessage) {
        console.log('📧 Enviando mensagem padrão: usuário precisa cadastrar empresa');
        
        try {
          await sendResponseToUserWithWindowValidation(
            chat,
            result.standardMessage,
            owner,
            token,
            result.user.phoneNumber
          );
          console.log('✅ Mensagem de setup enviada com sucesso');
        } catch (error) {
          console.error('❌ Erro ao enviar mensagem de setup:', error);
        }
        
        // Não processar com CrewAI
        return;
      }

      // Rotear mensagem baseado no tipo
      if (!message.fromMe) {
        // Classificar e rotear mensagem
        const routing = await MessageRouter.route(
          processedMessage, 
          chat,
          process.env.CREWAI_API_URL || 'https://falachefe.app.br'
        );

        console.log('📍 Message Routing:', {
          type: routing.classification.contentType,
          destination: routing.classification.destination,
          shouldProcess: routing.shouldProcess,
          priority: routing.classification.priority,
          estimatedTime: `${routing.classification.metadata.estimatedProcessingTime}s`
        });

        // Se não deve processar, ignorar
        if (!routing.shouldProcess) {
          console.log(`⏭️ Skipping message: ${routing.reason}`);
          return;
        }

        // Ignorar tipos específicos
        if (routing.classification.destination === MessageDestination.IGNORE) {
          console.log(`🚫 Message type ignored: ${routing.classification.contentType}`);
          return;
        }

        // Preparar processamento
        const baseWorkerUrl = process.env.CREWAI_API_URL || 'http://37.27.248.13:8000';
        const targetEndpoint = `${baseWorkerUrl}${routing.destination.endpoint}`;
        const payload = MessageRouter.preparePayload(
          processedMessage,
          chat,
          routing.classification,
          result.user.id,
          result.conversation.id
        );

        // Processar mensagem
        try {
          console.log('📬 Enqueuing message to Redis Queue for async processing...');
          
          // Obter Redis client
          const redis = await initializeRedisClient();
          const redisQueue = createRedisQueue(redis);

          if (!baseWorkerUrl) {
            console.error('❌ Worker URL not configured');
            throw new Error('Worker URL not configured');
          }

          console.log(`🎯 Target: ${targetEndpoint} (${routing.destination.description})`);

          // Enfileirar mensagem para processamento assíncrono
          const queueResult = await redisQueue.enqueue(
            targetEndpoint,
            {
              message: payload.message || '',
              userId: payload.userId || '',
              phoneNumber: payload.phoneNumber || '',
              context: payload.context || { conversationId: result.conversation.id }
            },
            {
              retries: routing.destination.retries,
              delay: 0
            }
          );

          if (queueResult.success) {
            console.log('✅ Message queued successfully:', {
              jobId: queueResult.jobId,
              destination: targetEndpoint,
              contentType: routing.classification.contentType,
              userId: result.user.id
            });
          } else {
            console.error('❌ Failed to queue message:', queueResult.error);
            throw new Error(queueResult.error || 'Failed to queue message');
          }
          
        } catch (error) {
          console.error('❌ Error queueing message to Redis:', error);
          
          // Fallback: tentar processar diretamente (se Redis falhar)
          console.log('🔄 Trying direct processing as fallback...');
          
          try {
            const directResponse = await fetch(targetEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(routing.destination.timeout || 5000)
            });
            
            if (directResponse.ok) {
              console.log('✅ Direct processing succeeded');
            }
          } catch (fallbackError) {
            console.error('❌ Direct processing also failed:', fallbackError);
            
            // Enviar mensagem de erro ao usuário
            try {
              await sendResponseToUserWithWindowValidation(
                chat,
                'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes.',
                owner,
                token,
                message.sender
              );
            } catch (sendError) {
              console.error('Failed to send error message to user:', sendError);
            }
          }
        }
      } else {
        console.log('⏭️ Skipping CrewAI processing (message from me)');
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
  const { message, chat, owner } = data;
  
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
 * Processa eventos de confirmação de leitura e entrega
 */
async function handleMessageReceiptEvent(payload: UAZWebhookPayload): Promise<void> {
  const { event, type, state, owner } = payload;
  
  if (!event) return;
  
  // Verificar se é um receipt event
  if (!isReceiptEvent(event)) {
    console.log('⚠️ Not a receipt event, skipping');
    return;
  }
  
  console.log('📬 Processing message receipt event:', {
    type: type,
    state: state,
    chat: event.Chat,
    sender: event.Sender,
    isFromMe: event.IsFromMe,
    messageType: event.Type,
    timestamp: event.Timestamp,
    owner: owner,
  });

  // Read receipts (confirmações de leitura) não precisam de processamento
  // Apenas logamos para debug
  if (type === 'ReadReceipt' || event.Type === 'read') {
    console.log('✓ Read receipt received - no action needed');
    return;
  }
  
  // Delivery receipts também não precisam de ação
  if (type === 'DeliveryReceipt' || event.Type === 'delivery') {
    console.log('✓ Delivery receipt received - no action needed');
    return;
  }

  // TODO: Atualizar status das mensagens no banco se necessário
  // TODO: Implementar métricas de entrega e leitura
}

/**
 * Processa eventos de conexão
 */
async function handleConnectionEvent(data: UAZWebhookPayload): Promise<void> {
  console.log('Processing connection event:', {
    eventType: data.EventType,
    owner: data.owner,
    baseUrl: data.BaseUrl,
  });

  // TODO: Atualizar status da instância no banco
  // TODO: Notificar administradores sobre mudanças de status
}

/**
 * Processa eventos de presença
 */
async function handlePresenceEvent(data: { event: UAZPresenceEvent; owner: string; token: string }): Promise<void> {
  const { event, owner } = data;
  
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
    owner: owner
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

// Função sendResponseToUser removida (não utilizada)
