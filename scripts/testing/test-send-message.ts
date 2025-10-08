#!/usr/bin/env tsx

/**
 * Script para testar o envio de mensagem via UAZ API
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { UAZClient } from '../src/lib/uaz-api/client';
import { UAZLogger } from '../src/lib/logger/uaz-logger';

async function testSendMessage() {
  console.log('🚀 Testando envio de mensagem via UAZ API...\n');

  // Inicializar logger
  const logger = new UAZLogger('test-send-message');
  
  try {
    // Inicializar cliente UAZ
    const client = new UAZClient({
      baseUrl: process.env.UAZ_BASE_URL || 'https://api.uazapi.com',
      apiKey: process.env.UAZ_API_KEY || '',
      apiSecret: process.env.UAZ_API_SECRET || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET || '',
    });

    console.log('📡 Cliente UAZ inicializado');
    console.log(`🔗 Base URL: ${process.env.UAZ_BASE_URL}`);
    console.log(`🔑 API Key: ${process.env.UAZ_API_KEY ? '***' + process.env.UAZ_API_KEY.slice(-4) : 'NÃO CONFIGURADA'}`);

    // Dados da mensagem
    const messageData = {
      number: '5511992345329',
      text: 'Olá! Esta é uma mensagem de teste da plataforma SaaS multi-agente. 🚀\n\nA Fase 1 foi implementada com sucesso!',
      delay: 0,
      readchat: true,
      readmessages: true,
    };

    console.log('\n📝 Dados da mensagem:');
    console.log(`📞 Número: ${messageData.number}`);
    console.log(`💬 Texto: ${messageData.text}`);
    console.log(`⏱️ Delay: ${messageData.delay}s`);

    // Enviar mensagem
    console.log('\n📤 Enviando mensagem...');
    
    const result = await client.sendTextMessage(messageData);
    
    console.log('\n✅ MENSAGEM ENVIADA COM SUCESSO!');
    console.log('📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));

    // Log estruturado
    logger.log('info', 'Mensagem enviada com sucesso', {
      number: messageData.number,
      messageId: result.id || 'unknown',
      status: result.status || 'sent',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('\n❌ ERRO AO ENVIAR MENSAGEM:');
    console.error(error);
    
    // Log de erro
    logger.log('error', 'Erro ao enviar mensagem', {
      number: '5511992345329',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    });

    process.exit(1);
  }
}

// Executar teste
testSendMessage();
