import { db } from '@/lib/db';
import { conversations, messages, companies, userOnboarding } from '@/lib/schema';
import { userSubscriptions } from '@/lib/billing-schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { UAZMessage, UAZChat } from '@/lib/uaz-api/types';

/**
 * Resultado do processamento de mensagem
 */
export interface ProcessMessageResult {
  success: boolean;
  requiresCompanySetup?: boolean;  // Novo: indica que usuário precisa cadastrar empresa
  standardMessage?: string;         // Novo: mensagem padrão a ser enviada
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

      // Normalizar número de telefone
      const normalizedPhone = message.sender.replace('@c.us', '');

      // ✨ NOVO: Verificar se usuário já existe na plataforma
      const platformUserCheck = await this.checkPlatformUserWithoutCompany(normalizedPhone);
      
      if (platformUserCheck.hasUser && !platformUserCheck.hasCompanyRelation) {
        console.log('⚠️  Usuário existe na plataforma mas sem empresa relacionada', {
          userId: platformUserCheck.userId,
          phone: normalizedPhone
        });

        // Retornar mensagem padrão sem processar
        return {
          success: true,
          requiresCompanySetup: true,
          standardMessage: this.getCompanySetupMessage(),
          message: {
            id: 'no-message-saved',
            content: message.text || message.content || '',
            uazMessageId: message.id || message.messageid || ''
          },
          conversation: {
            id: 'no-conversation',
            status: 'requires_setup'
          },
          user: {
            id: platformUserCheck.userId!,
            name: platformUserCheck.userName || 'Usuário',
            phoneNumber: normalizedPhone,
            isNewUser: false
          }
        };
      }

      // 1. Buscar dados do usuário em user_onboarding
      const phoneDigits = normalizedPhone.replace(/\D/g, '').slice(-9);
      const onboardingData = await db.execute<{
        user_id: string;
        first_name: string;
        last_name: string;
        whatsapp_phone: string;
      }>(
        sql`SELECT user_id, first_name, last_name, whatsapp_phone
            FROM user_onboarding
            WHERE whatsapp_phone LIKE ${'%' + phoneDigits + '%'}
            LIMIT 1`
      );

      if (!onboardingData || onboardingData.length === 0) {
        throw new Error('Usuário não encontrado em user_onboarding');
      }

      const userData = onboardingData[0];
      const userId = userData.user_id;
      const userName = `${userData.first_name} ${userData.last_name}`.trim();

      console.log('👤 User from onboarding:', {
        userId,
        userName,
        phoneNumber: normalizedPhone
      });

      // 2. Buscar company_id via subscription
      const subscriptions = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      if (subscriptions.length === 0) {
        throw new Error('Subscription não encontrada para usuário');
      }

      const companyId = subscriptions[0].companyId;

      console.log('🏢 Company from subscription:', {
        companyId,
        userId
      });

      // 3. Buscar ou criar conversação ativa
      const conversation = await this.getOrCreateActiveConversation(
        userId,
        companyId
      );

      console.log('💬 Conversation:', {
        id: conversation.id,
        status: conversation.status
      });

      // 4. Salvar mensagem no banco
      const savedMessage = await this.saveMessage({
        conversationId: conversation.id,
        senderId: userId,
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
          id: userId,
          name: userName,
          phoneNumber: normalizedPhone,
          isNewUser: false
        }
      };

    } catch (error) {
      console.error('❌ MessageService error:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário existe na plataforma mas sem empresa relacionada
   * 
   * @param phoneNumber - Número do WhatsApp
   * @returns Status do usuário
   */
  private static async checkPlatformUserWithoutCompany(phoneNumber: string): Promise<{
    hasUser: boolean;
    hasCompanyRelation: boolean;
    userId?: string;
    userName?: string;
  }> {
    try {
      // Buscar últimos 9 dígitos do telefone (formato padrão BR)
      const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-9);
      
      // Buscar na tabela user_onboarding (usuários que fizeram cadastro na plataforma)
      const platformUsers = await db.execute<{
        user_id: string;
        first_name: string;
        last_name: string;
        whatsapp_phone: string;
        is_completed: boolean;
      }>(
        sql`SELECT user_id, first_name, last_name, whatsapp_phone, is_completed
            FROM user_onboarding
            WHERE whatsapp_phone LIKE ${'%' + phoneDigits + '%'}
            LIMIT 1`
      );

      if (!platformUsers || platformUsers.length === 0) {
        return { hasUser: false, hasCompanyRelation: false };
      }

      const platformUser = platformUsers[0];
      
      // Verificar se tem subscription ativa (relação com empresa)
      const subscriptions = await db.execute<{
        id: string;
        company_id: string;
      }>(
        sql`SELECT id, company_id
            FROM user_subscriptions
            WHERE user_id = ${platformUser.user_id}
              AND status = 'active'
            LIMIT 1`
      );

      const hasCompanyRelation = subscriptions && subscriptions.length > 0;

      return {
        hasUser: true,
        hasCompanyRelation,
        userId: platformUser.user_id,
        userName: `${platformUser.first_name} ${platformUser.last_name}`.trim()
      };

    } catch (error) {
      console.error('Error checking platform user:', error);
      // Em caso de erro, retornar false para não bloquear fluxo
      return { hasUser: false, hasCompanyRelation: false };
    }
  }

  /**
   * Retorna mensagem padrão para usuários sem empresa cadastrada
   */
  private static getCompanySetupMessage(): string {
    return `👋 Olá! Vi que você já tem cadastro na plataforma FalaChefe.

Para começar a usar os agentes de IA via WhatsApp, você precisa:

1️⃣ Acessar: https://falachefe.app.br
2️⃣ Fazer login com sua conta
3️⃣ Cadastrar sua empresa no painel
4️⃣ Conectar este número de WhatsApp

Após isso, nossos agentes de IA estarão prontos para te ajudar! 🤖

📞 Dúvidas? Entre em contato pelo site.`;
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
        // Buscar company pelo domínio (evitar duplicatas)
        const companiesByDomain = await db.select().from(companies).where(eq(companies.domain, 'falachefe.app.br')).limit(1);
        company = companiesByDomain[0] || null;

        if (!company) {
          // Criar company padrão apenas se realmente não existir
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
        } else {
          // Atualizar uazToken da empresa existente
          console.log('🏢 Updating uazToken for existing company');
          await db.update(companies)
            .set({ uazToken: owner })
            .where(eq(companies.id, company.id));
        }
      }

      return company;
    } catch (error) {
      console.error('Error in getOrCreateDefaultCompany:', error);
      throw error;
    }
  }

  // REMOVIDO: getOrCreateWhatsAppUser()
  // Agora usamos user_onboarding diretamente
  // Dados de WhatsApp estão em user_onboarding.whatsapp_phone
  // user_id é obtido via checkPlatformUserWithoutCompany() ou query direta

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
