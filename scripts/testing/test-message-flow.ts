#!/usr/bin/env tsx

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { messageService } from '../src/services/message-service';

async function testMessageFlow() {
  console.log('🧪 Testando fluxo completo de mensagens...\n');

  try {
    // 1. Testar processamento de mensagem recebida (simulando webhook)
    console.log('1️⃣ Testando processamento de mensagem recebida...');
    
    const mockUAZMessage = {
      id: 'msg_test_' + Date.now(),
      sender: '5511999999999@s.whatsapp.net',
      chatid: '5511999999999@s.whatsapp.net',
      type: 'text',
      messageType: 'conversation',
      content: 'Olá! Esta é uma mensagem de teste.',
      text: 'Olá! Esta é uma mensagem de teste.',
      messageTimestamp: Date.now(),
      fromMe: false,
      isGroup: false,
      senderName: 'Teste Usuário',
      wasSentByApi: false,
      messageid: 'msg_test_' + Date.now(),
      mediaType: null,
      quoted: null,
      reaction: null
    };

    const mockUAZChat = {
      id: 'chat_test_' + Date.now(),
      name: 'Teste Usuário',
      wa_chatid: '5511999999999@s.whatsapp.net',
      wa_name: 'Teste Usuário',
      wa_isGroup: false,
      wa_unreadCount: 0
    };

    const mockOwner = 'test_owner_token';

    const incomingResult = await messageService.processIncomingMessage(
      mockUAZMessage,
      mockUAZChat,
      mockOwner
    );

    console.log('✅ Mensagem recebida processada:', {
      messageId: incomingResult.message.id,
      conversationId: incomingResult.conversation.id,
      userId: incomingResult.user.id,
      userName: incomingResult.user.name
    });

    // 2. Testar envio de mensagem de resposta
    console.log('\n2️⃣ Testando envio de mensagem de resposta...');
    
    const outgoingResult = await messageService.sendOutgoingMessage(
      '5511999999999',
      'Obrigado pela sua mensagem! Esta é uma resposta automática.',
      'text',
      incomingResult.conversation.companyId,
      incomingResult.conversation.id,
      {
        source: 'test_script',
        replyToMessage: incomingResult.message.id
      }
    );

    console.log('✅ Mensagem enviada:', {
      messageId: outgoingResult.message.id,
      conversationId: outgoingResult.conversation.id,
      status: outgoingResult.message.status,
      uazMessageId: outgoingResult.message.uazMessageId
    });

    // 3. Testar busca de conversas ativas
    console.log('\n3️⃣ Testando busca de conversas ativas...');
    
    const activeConversations = await messageService.getActiveConversations(
      incomingResult.conversation.companyId,
      10
    );

    console.log('✅ Conversas ativas encontradas:', {
      total: activeConversations.length,
      conversations: activeConversations.map(conv => ({
        id: conv.id,
        userPhone: conv.user?.phoneNumber,
        userName: conv.user?.name,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messages?.length || 0
      }))
    });

    // 4. Testar busca de mensagens da conversa
    console.log('\n4️⃣ Testando busca de mensagens da conversa...');
    
    const conversationMessages = await messageService.getConversationMessages(
      incomingResult.conversation.id,
      20
    );

    console.log('✅ Mensagens da conversa:', {
      conversationId: incomingResult.conversation.id,
      total: conversationMessages.length,
      messages: conversationMessages.map(msg => ({
        id: msg.id,
        senderType: msg.senderType,
        content: msg.content.substring(0, 50) + '...',
        messageType: msg.messageType,
        status: msg.status,
        sentAt: msg.sentAt
      }))
    });

    console.log('\n🎉 Teste do fluxo completo concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- Empresa criada/encontrada: ${incomingResult.conversation.companyId}`);
    console.log(`- Usuário criado/encontrado: ${incomingResult.user.id} (${incomingResult.user.name})`);
    console.log(`- Conversa criada/encontrada: ${incomingResult.conversation.id}`);
    console.log(`- Mensagens processadas: ${conversationMessages.length}`);
    console.log(`- Conversas ativas: ${activeConversations.length}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executar teste
testMessageFlow();
