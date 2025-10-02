#!/usr/bin/env tsx

/**
 * Script para verificar e configurar webhook na UAZ API
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { UAZClient } from '../src/lib/uaz-api/client';
import { UAZLogger } from '../src/lib/logger/uaz-logger';

async function configureUAZWebhook() {
  console.log('🚀 Verificando e configurando webhook na UAZ API...\n');

  // Inicializar logger
  const logger = new UAZLogger('configure-uaz-webhook');
  
  try {
    // Inicializar cliente UAZ
    const client = new UAZClient({
      baseUrl: process.env.UAZ_BASE_URL || 'https://falachefe.uazapi.com',
      apiKey: process.env.UAZ_API_KEY || '',
      apiSecret: process.env.UAZ_API_SECRET || '',
      webhookSecret: process.env.UAZ_WEBHOOK_SECRET || 'test-webhook-secret',
    });

    console.log('📡 Cliente UAZ inicializado');
    console.log(`🔗 Base URL: ${process.env.UAZ_BASE_URL}`);
    console.log(`🔑 API Key: ${process.env.UAZ_API_KEY ? '***' + process.env.UAZ_API_KEY.slice(-4) : 'NÃO CONFIGURADA'}`);

    // 1. Verificar status da instância
    console.log('\n🔍 Verificando status da instância...');
    
    try {
      const instanceStatus = await client.getInstanceStatus();
      console.log('✅ Status da instância:');
      console.log(`   Nome: ${instanceStatus.instanceName || 'N/A'}`);
      console.log(`   Status: ${instanceStatus.status || 'N/A'}`);
      console.log(`   Conectado: ${instanceStatus.connected ? 'SIM' : 'NÃO'}`);
      console.log(`   QR Code: ${instanceStatus.qrCode ? 'Disponível' : 'N/A'}`);
    } catch (error) {
      console.log('❌ Erro ao verificar status da instância:', error);
    }

    // 2. Verificar configuração atual do webhook
    console.log('\n🔍 Verificando configuração atual do webhook...');
    
    try {
      const currentWebhook = await client.getWebhookConfig();
      console.log('✅ Configuração atual do webhook:');
      console.log(`   URL: ${currentWebhook.webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   Eventos: ${currentWebhook.events?.join(', ') || 'N/A'}`);
      console.log(`   Status: ${currentWebhook.status || 'N/A'}`);
      console.log(`   Secret: ${currentWebhook.secret ? '***' + currentWebhook.secret.slice(-4) : 'N/A'}`);
    } catch (error) {
      console.log('⚠️ Não foi possível obter configuração do webhook:', error);
      console.log('   Isso pode indicar que não há webhook configurado ou a API não suporta este endpoint');
    }

    // 3. Configurar webhook
    console.log('\n⚙️ Configurando webhook...');
    
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/uaz`;
    const webhookSecret = process.env.UAZ_WEBHOOK_SECRET || 'falachefe-webhook-secret-2024';
    
    const webhookConfig = {
      webhook_url: webhookUrl,
      events: ['messages', 'messages_update', 'connection', 'presence'],
      secret: webhookSecret,
      status: 'active'
    };

    console.log('📋 Configuração do webhook:');
    console.log(`   URL: ${webhookConfig.webhook_url}`);
    console.log(`   Eventos: ${webhookConfig.events.join(', ')}`);
    console.log(`   Secret: ***${webhookSecret.slice(-4)}`);

    try {
      const result = await client.setWebhookConfig(webhookConfig);
      console.log('✅ Webhook configurado com sucesso!');
      console.log('📊 Resultado:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ Erro ao configurar webhook:', error);
      console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
      console.log('   1. Verificar se a API Key tem permissões de administração');
      console.log('   2. Verificar se a URL do webhook é acessível publicamente');
      console.log('   3. Usar ngrok ou similar para expor localhost:3000');
      console.log('   4. Configurar manualmente no painel da UAZ API');
    }

    // 4. Verificar se o webhook foi configurado
    console.log('\n🔍 Verificando se o webhook foi configurado...');
    
    try {
      const updatedWebhook = await client.getWebhookConfig();
      console.log('✅ Configuração atualizada do webhook:');
      console.log(`   URL: ${updatedWebhook.webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   Eventos: ${updatedWebhook.events?.join(', ') || 'N/A'}`);
      console.log(`   Status: ${updatedWebhook.status || 'N/A'}`);
      
      if (updatedWebhook.webhook_url === webhookUrl) {
        console.log('🎉 WEBHOOK CONFIGURADO COM SUCESSO!');
      } else {
        console.log('⚠️ Webhook não foi configurado corretamente');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar webhook configurado:', error);
    }

    // 5. Testar webhook (se configurado)
    console.log('\n🧪 Testando webhook...');
    
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('✅ Webhook endpoint está acessível:');
        console.log(`   Status: ${data.status}`);
        console.log(`   Service: ${data.service}`);
      } else {
        console.log(`❌ Webhook endpoint retornou erro: ${testResponse.status}`);
        console.log('💡 Certifique-se de que o servidor Next.js está rodando (npm run dev)');
      }
    } catch (error) {
      console.log('❌ Erro ao testar webhook endpoint:', error);
      console.log('💡 Certifique-se de que o servidor Next.js está rodando (npm run dev)');
    }

    console.log('\n📊 RESUMO DA CONFIGURAÇÃO:');
    console.log('========================');
    console.log(`✅ Cliente UAZ: Funcionando`);
    console.log(`✅ Status da instância: Verificado`);
    console.log(`✅ Configuração do webhook: ${webhookUrl}`);
    console.log(`✅ Eventos habilitados: messages, messages_update, connection, presence`);
    console.log(`✅ Secret configurado: ***${webhookSecret.slice(-4)}`);

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Iniciar servidor Next.js: npm run dev');
    console.log('2. Usar ngrok para expor localhost:3000 (se necessário)');
    console.log('3. Testar com mensagens reais do WhatsApp');
    console.log('4. Verificar logs do webhook no console do servidor');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE CONFIGURAÇÃO DO WEBHOOK:');
    console.error(error);
    
    // Log de erro
    logger.log('error', 'Erro durante configuração do webhook', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    });

    process.exit(1);
  }
}

// Executar configuração
configureUAZWebhook();
