import { db } from '@/lib/db';
import { users, conversations, messages, companies } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { UAZMessage, UAZChat } from '@/lib/uaz-api/types';

/**
 * Resultado do processamento de mensagem
 */
export interface ProcessMessageResult {
  success: boolean;
  message: {
    id: string;
    content: string;
    uazMessageId: string;
  };
  conversation: {
    id: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    isNewUser: boolean;
  };
}

/**
 * Serviço de Mensagens - Processa mensagens do WhatsApp
 * 
 * Fluxo:
 * 1. Valida/cria usuário pelo número de telefone
 * 2. Busca/cria conversação ativa
 * 3. Salva mensagem no banco
 * 4. Retorna dados completos para processamento
 */
export class MessageService {
  
  /**
   * Processa mensagem recebida via webhook
   * 
   * @param message - Mensagem do UAZAPI
   * @param chat - Chat do UAZAPI
   * @param owner - Owner da instância
   * @returns Dados da mensagem, conversação e usuário
   */
  static async processIncomingMessage(
    message: UAZMessage,
    chat: UAZChat,
    owner: string
  ): Promise<ProcessMessageResult> {
    try {
      console.log('📨 MessageService: Processing incoming message', {
        messageId: message.id,
        sender: message.sender,
        chatName: chat.name
      });

      // 1. Buscar ou criar company (usar company padrão por enquanto)
      const company = await this.getOrCreateDefaultCompany(owner);
      
      console.log('🏢 Company:', {
        id: company.id,
        name: company.name
      });

      // 2. Buscar ou criar usuário WhatsApp
      const user = await this.getOrCreateWhatsAppUser(
        message.sender,
        chat.name || message.senderName || 'Usuário',
        company.id
      );

      console.log('👤 User:', {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        isNew: user.isNewUser
      });

      // 3. Buscar ou criar conversação ativa
      const conversation = await this.getOrCreateActiveConversation(
        user.id,
        company.id
      );

      console.log('💬 Conversation:', {
        id: conversation.id,
        status: conversation.status
      });

      // 4. Salvar mensagem no banco
      const savedMessage = await this.saveMessage({
        conversationId: conversation.id,
        senderId: user.id,
        senderType: 'user' as const,
        content: message.text || message.content || '',
        messageType: this.mapMessageType(message.type || message.messageType),
        uazMessageId: message.id || message.messageid,
        metadata: {
          chatId: chat.id,
          chatName: chat.name,
          senderName: message.senderName,
          owner: owner,
          timestamp: message.messageTimestamp,
          isGroup: message.isGroup || false,
          fromMe: message.fromMe || false
        }
      });

      console.log('✅ Message saved:', {
        id: savedMessage.id,
        conversationId: conversation.id
      });

      return {
        success: true,
        message: {
          id: savedMessage.id,
          content: savedMessage.content,
          uazMessageId: savedMessage.uazMessageId || ''
        },
        conversation: {
          id: conversation.id,
          status: conversation.status || 'active'
        },
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          isNewUser: user.isNewUser || false
        }
      };

    } catch (error) {
      console.error('❌ MessageService error:', error);
      throw error;
    }
  }

  /**
   * Busca ou cria company padrão
   */
  private static async getOrCreateDefaultCompany(owner: string) {
    try {
      // Tentar buscar company existente pelo owner/uazToken
      const existingCompanies = await db.select().from(companies).where(eq(companies.uazToken, owner)).limit(1);
      let company = existingCompanies[0] || null;

      if (!company) {
        // Criar company padrão
        console.log('🏢 Creating default company for owner:', owner);
        
        const [newCompany] = await db.insert(companies).values({
          name: 'Falachefe - Default',
          domain: 'falachefe.app.br',
          uazToken: owner,
          uazAdminToken: process.env.UAZAPI_ADMIN_TOKEN || owner,
          subscriptionPlan: 'starter',
          isActive: true,
          settings: {}
        }).returning();

        company = newCompany;
      }

      return company;
    } catch (error) {
      console.error('Error in getOrCreateDefaultCompany:', error);
      throw error;
    }
  }

  /**
   * Busca ou cria usuário WhatsApp pelo telefone
   */
  private static async getOrCreateWhatsAppUser(
    phoneNumber: string,
    name: string,
    companyId: string
  ) {
    try {
      // Normalizar número de telefone (remover @c.us se presente)
      const normalizedPhone = phoneNumber.replace('@c.us', '');

      // Buscar usuário existente (tabela whatsapp_users exportada como 'users')
      const existingUsers = await db.select().from(users).where(eq(users.phoneNumber, normalizedPhone)).limit(1);
      let user = existingUsers[0] || null;

      let isNewUser = false;

      if (!user) {
        // Criar novo usuário
        console.log('👤 Creating new WhatsApp user:', normalizedPhone);
        
        const [newUser] = await db.insert(users).values({
          phoneNumber: normalizedPhone,
          name: name,
          companyId: companyId,
          optInStatus: true, // Auto opt-in ao enviar mensagem
          lastInteraction: new Date(),
          windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          preferences: {}
        }).returning();

        user = newUser;
        isNewUser = true;
      } else {
        // Atualizar última interação e janela
        await db.update(users)
          .set({
            lastInteraction: new Date(),
            windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
      }

      return {
        ...user,
        isNewUser
      };
    } catch (error) {
      console.error('Error in getOrCreateWhatsAppUser:', error);
      throw error;
    }
  }

  /**
   * Busca ou cria conversação ativa para o usuário
   */
  private static async getOrCreateActiveConversation(
    userId: string,
    companyId: string
  ) {
    try {
      // Buscar conversação ativa mais recente
      const activeConversations = await db.select()
        .from(conversations)
        .where(and(
          eq(conversations.userId, userId),
          eq(conversations.status, 'active')
        ))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(1);
      
      const activeConversation = activeConversations[0] || null;

      if (activeConversation) {
        // Atualizar timestamp da última mensagem
        await db.update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, activeConversation.id));

        return activeConversation;
      }

      // Criar nova conversação
      console.log('💬 Creating new conversation for user:', userId);
      
      const [newConversation] = await db.insert(conversations).values({
        userId: userId,
        companyId: companyId,
        status: 'active',
        priority: 'medium',
        context: {},
        metadata: {},
        startedAt: new Date(),
        lastMessageAt: new Date()
      }).returning();

      return newConversation;
    } catch (error) {
      console.error('Error in getOrCreateActiveConversation:', error);
      throw error;
    }
  }

  /**
   * Salva mensagem no banco
   */
  private static async saveMessage(data: {
    conversationId: string;
    senderId: string;
    senderType: 'user' | 'agent' | 'system';
    content: string;
    messageType: string;
    uazMessageId: string;
    metadata: any;
  }): Promise<any> {
    try {
      const insertedMessages = await db.insert(messages).values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        messageType: data.messageType as any,
        uazMessageId: data.uazMessageId,
        status: 'delivered',
        metadata: data.metadata,
        sentAt: new Date(),
        deliveredAt: new Date()
      }).returning();

      return insertedMessages[0];
    } catch (error) {
      console.error('Error in saveMessage:', error);
      throw error;
    }
  }

  /**
   * Mapeia tipo de mensagem do UAZAPI para o schema
   */
  private static mapMessageType(uazType: string | undefined): 'text' | 'image' | 'document' | 'audio' {
    const type = uazType?.toLowerCase() || 'text';
    
    // Mapeamento de tipos UAZAPI para schema
    const typeMap: Record<string, any> = {
      'chat': 'text',
      'text': 'text',
      'extendedtextmessage': 'text',
      'image': 'image',
      'imagemessage': 'image',
      'document': 'document',
      'documentmessage': 'document',
      'audio': 'audio',
      'audiomessage': 'audio',
      'ptt': 'ptt',
      'video': 'video',
      'videomessage': 'video',
      'sticker': 'sticker',
      'stickermessage': 'sticker'
    };

    return typeMap[type] || 'text';
  }

  /**
   * Buscar conversações (compatibilidade)
   */
  static async getConversations(userId?: string) {
    try {
      if (userId) {
        return await db.query.conversations.findMany({
          where: eq(conversations.userId, userId),
          orderBy: desc(conversations.lastMessageAt)
        });
      }
      return await db.query.conversations.findMany({
        orderBy: desc(conversations.lastMessageAt),
        limit: 50
      });
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  /**
   * Buscar mensagens de uma conversação (compatibilidade)
   */
  static async getMessages(conversationId: string) {
    try {
      return await db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: desc(messages.sentAt)
      });
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  /**
   * Salvar mensagem simples (compatibilidade - método legado)
   */
  static async saveLegacyMessage(message: any) {
    console.log('Saving message (legacy method):', message);
    return { success: true };
  }
}
