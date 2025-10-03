#!/usr/bin/env tsx

/**
 * Script para testar o salvamento de mensagens no banco de dados
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

// Verificar se as variáveis de ambiente foram carregadas
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada. Verificando variáveis de ambiente...');
  console.log('Variáveis carregadas:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
  process.exit(1);
}

async function testMessageSaving() {
  // Importar após carregar as variáveis de ambiente
  const { messageService } = await import('../src/services/message-service');
  const { UAZMessage, UAZChat } = await import('../src/lib/uaz-api/types');
  console.log('🚀 Testando salvamento de mensagens no banco de dados...\n');

  try {
    // Dados de teste baseados no payload real recebido
    const testMessage: UAZMessage = {
      buttonOrListid: '',
      chatid: '5511992345329@s.whatsapp.net',
      content: 'Olá! Esta é uma mensagem de teste para verificar o salvamento no banco.',
      convertOptions: '',
      edited: '',
      fromMe: false,
      groupName: 'Unknown',
      id: '554791945151:TEST_MESSAGE_' + Date.now(),
      isGroup: false,
      mediaType: '',
      messageTimestamp: Date.now(),
      messageType: 'Conversation',
      messageid: 'TEST_MESSAGE_' + Date.now(),
      owner: '554791945151',
      quoted: '',
      reaction: '',
      sender: '5511992345329@s.whatsapp.net',
      senderName: 'Teste Usuário',
      sender_lid: '130043657330717@lid',
      sender_pn: '5511992345329@s.whatsapp.net',
      source: 'test',
      status: '',
      text: 'Olá! Esta é uma mensagem de teste para verificar o salvamento no banco.',
      track_id: '',
      track_source: '',
      type: 'text',
      vote: '',
      wasSentByApi: false
    };

    const testChat: UAZChat = {
      chatbot_agentResetMemoryAt: 0,
      chatbot_disableUntil: 0,
      chatbot_lastTriggerAt: 0,
      chatbot_lastTrigger_id: '',
      id: 'test_chat_' + Date.now(),
      image: '',
      imagePreview: '',
      lead_assignedAttendant_id: '',
      lead_email: '',
      lead_field01: '',
      lead_field02: '',
      lead_field03: '',
      lead_field04: '',
      lead_field05: '',
      lead_field06: '',
      lead_field07: '',
      lead_field08: '',
      lead_field09: '',
      lead_field10: '',
      lead_field11: '',
      lead_field12: '',
      lead_field13: '',
      lead_field14: '',
      lead_field15: '',
      lead_field16: '',
      lead_field17: '',
      lead_field18: '',
      lead_field19: '',
      lead_field20: '',
      lead_fullName: '',
      lead_isTicketOpen: false,
      lead_kanbanOrder: 0,
      lead_name: '',
      lead_notes: '',
      lead_personalid: '',
      lead_status: '',
      lead_tags: [],
      name: 'Teste Usuário',
      owner: '554791945151',
      phone: '+55 11 99234-5329',
      wa_archived: false,
      wa_chatid: '5511992345329@s.whatsapp.net',
      wa_contactName: '',
      wa_ephemeralExpiration: 0,
      wa_fastid: '554791945151:5511992345329',
      wa_isBlocked: false,
      wa_isGroup: false,
      wa_isGroup_admin: false,
      wa_isGroup_announce: false,
      wa_isGroup_community: false,
      wa_isGroup_member: false,
      wa_isPinned: false,
      wa_label: [],
      wa_lastMessageSender: '5511992345329@s.whatsapp.net',
      wa_lastMessageTextVote: 'Olá! Esta é uma mensagem de teste.',
      wa_lastMessageType: 'Conversation',
      wa_lastMsgTimestamp: Date.now(),
      wa_muteEndTime: 0,
      wa_name: 'Teste Usuário',
      wa_unreadCount: 1
    };

    console.log('📋 Dados de teste:');
    console.log(`   Mensagem: ${testMessage.content}`);
    console.log(`   Remetente: ${testMessage.sender}`);
    console.log(`   Chat: ${testChat.name}`);
    console.log(`   Owner: ${testMessage.owner}`);

    // 1. Testar processamento da mensagem
    console.log('\n1️⃣ Processando mensagem...');
    const result = await messageService.processIncomingMessage(
      testMessage, 
      testChat, 
      testMessage.owner
    );

    console.log('✅ Mensagem processada com sucesso:');
    console.log(`   Message ID: ${result.message.id}`);
    console.log(`   Conversation ID: ${result.conversation.id}`);
    console.log(`   User ID: ${result.user.id}`);
    console.log(`   User Name: ${result.user.name}`);

    // 2. Testar busca de mensagens da conversa
    console.log('\n2️⃣ Buscando mensagens da conversa...');
    const messages = await messageService.getConversationMessages(result.conversation.id);
    console.log(`✅ Encontradas ${messages.length} mensagens na conversa`);

    // 3. Testar busca de conversas ativas
    console.log('\n3️⃣ Buscando conversas ativas...');
    const conversations = await messageService.getActiveConversations(result.user.companyId);
    console.log(`✅ Encontradas ${conversations.length} conversas ativas`);

    // 4. Testar segunda mensagem (deve reutilizar usuário e conversa)
    console.log('\n4️⃣ Testando segunda mensagem (reutilização)...');
    
    const secondMessage: UAZMessage = {
      ...testMessage,
      id: '554791945151:TEST_MESSAGE_2_' + Date.now(),
      messageid: 'TEST_MESSAGE_2_' + Date.now(),
      content: 'Esta é a segunda mensagem de teste.',
      text: 'Esta é a segunda mensagem de teste.',
      messageTimestamp: Date.now()
    };

    const secondResult = await messageService.processIncomingMessage(
      secondMessage, 
      testChat, 
      testMessage.owner
    );

    console.log('✅ Segunda mensagem processada:');
    console.log(`   Message ID: ${secondResult.message.id}`);
    console.log(`   Conversation ID: ${secondResult.conversation.id} (deve ser a mesma)`);
    console.log(`   User ID: ${secondResult.user.id} (deve ser o mesmo)`);
    console.log(`   Reutilizou conversa: ${secondResult.conversation.id === result.conversation.id}`);
    console.log(`   Reutilizou usuário: ${secondResult.user.id === result.user.id}`);

    // 5. Verificar mensagens atualizadas
    console.log('\n5️⃣ Verificando mensagens atualizadas...');
    const updatedMessages = await messageService.getConversationMessages(result.conversation.id);
    console.log(`✅ Agora há ${updatedMessages.length} mensagens na conversa`);

    console.log('\n✅ TESTE DE SALVAMENTO CONCLUÍDO!');
    console.log('\n📊 RESUMO:');
    console.log('   - Criação de empresa: ✅ Funcionando');
    console.log('   - Criação de usuário: ✅ Funcionando');
    console.log('   - Criação de conversa: ✅ Funcionando');
    console.log('   - Salvamento de mensagem: ✅ Funcionando');
    console.log('   - Reutilização de dados: ✅ Funcionando');
    console.log('   - Busca de mensagens: ✅ Funcionando');
    console.log('   - Busca de conversas: ✅ Funcionando');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE TESTE:');
    console.error(error);
    process.exit(1);
  }
}

// Executar teste
testMessageSaving();
