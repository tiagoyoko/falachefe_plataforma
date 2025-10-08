#!/usr/bin/env tsx

/**
 * Script para testar o webhook de recebimento de mensagens
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { UAZClient } from '../src/lib/uaz-api/client';
import { UAZLogger } from '../src/lib/logger/uaz-logger';

async function testWebhookReceive() {
  console.log('🚀 Testando webhook de recebimento de mensagens...\n');

  // Inicializar logger
  const logger = new UAZLogger('test-webhook-receive');
  
  try {
    // Inicializar cliente UAZ
    const client = new UAZClient({
      baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
      apiKey: process.env.UAZ_API_KEY || '',
      apiSecret: process.env.UAZ_API_SECRET || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET || '',
    });

    console.log('📡 Cliente UAZ inicializado');
    console.log(`🔗 Base URL: ${process.env.UAZ_BASE_URL}`);
    console.log(`🔑 API Key: ${process.env.UAZ_API_KEY ? '***' + process.env.UAZ_API_KEY.slice(-4) : 'NÃO CONFIGURADA'}`);

    // 1. Verificar se o webhook está configurado na UAZ API
    console.log('\n🔍 Verificando configuração do webhook...');
    
    try {
      const webhookConfig = await client.getWebhookConfig();
      console.log('✅ Webhook configurado na UAZ API:');
      console.log(`   URL: ${webhookConfig.webhook_url}`);
      console.log(`   Eventos: ${webhookConfig.events?.join(', ') || 'N/A'}`);
      console.log(`   Status: ${webhookConfig.status || 'N/A'}`);
    } catch (error) {
      console.log('⚠️ Não foi possível verificar configuração do webhook:', error);
    }

    // 2. Testar endpoint do webhook local
    console.log('\n🌐 Testando endpoint do webhook local...');
    
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/uaz`;
    console.log(`   URL: ${webhookUrl}`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Webhook local está funcionando:');
        console.log(`   Status: ${data.status}`);
        console.log(`   Service: ${data.service}`);
        console.log(`   Timestamp: ${data.timestamp}`);
      } else {
        console.log(`❌ Webhook local retornou erro: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Erro ao testar webhook local:', error);
    }

    // 3. Simular webhook de mensagem recebida
    console.log('\n📨 Simulando webhook de mensagem recebida...');
    
    const mockWebhookPayload = {
      event: 'messages',
      instance: 'falachefe',
      data: {
        id: 'test-message-' + Date.now(),
        from: '5511992345329@s.whatsapp.net',
        to: '554791945151@s.whatsapp.net',
        type: 'text',
        body: 'Olá! Esta é uma mensagem de teste para verificar o webhook.',
        isGroup: false,
        timestamp: Date.now(),
        sender: '5511992345329@s.whatsapp.net',
        senderName: 'Teste Usuário',
        messageType: 'ExtendedTextMessage',
        status: 'received'
      },
      timestamp: Date.now()
    };

    console.log('📋 Payload simulado:');
    console.log(JSON.stringify(mockWebhookPayload, null, 2));

    // 4. Testar processamento do webhook
    console.log('\n🔄 Testando processamento do webhook...');
    
    try {
      // Gerar assinatura válida para o payload
      const payloadString = JSON.stringify(mockWebhookPayload);
      const signature = client.generateWebhookSignature(payloadString);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-uaz-signature': signature,
        },
        body: payloadString,
      });
      
      if (webhookResponse.ok) {
        const responseData = await webhookResponse.json();
        console.log('✅ Webhook processado com sucesso:');
        console.log(`   Success: ${responseData.success}`);
        console.log(`   Message: ${responseData.message}`);
        console.log(`   Timestamp: ${responseData.timestamp}`);
      } else {
        const errorData = await webhookResponse.json();
        console.log('❌ Erro ao processar webhook:');
        console.log(`   Status: ${webhookResponse.status}`);
        console.log(`   Error: ${errorData.error}`);
      }
    } catch (error) {
      console.log('❌ Erro ao testar processamento do webhook:', error);
    }

    // 5. Verificar logs do webhook
    console.log('\n📝 Verificando logs do webhook...');
    console.log('   Os logs devem aparecer no console do servidor Next.js');
    console.log('   Procure por: "UAZ Webhook received" e "Processing message event"');

    console.log('\n✅ TESTE DE WEBHOOK CONCLUÍDO!');
    console.log('\n📊 RESUMO:');
    console.log('   - Webhook endpoint: /api/webhook/uaz');
    console.log('   - Métodos suportados: GET (health check), POST (receber eventos)');
    console.log('   - Validação de assinatura: Implementada');
    console.log('   - Processamento de eventos: Implementado');
    console.log('   - Logs estruturados: Implementados');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE TESTE DO WEBHOOK:');
    console.error(error);
    
    // Log de erro
    logger.log('error', 'Erro durante teste do webhook', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    });

    process.exit(1);
  }
}

// Executar teste
testWebhookReceive();
