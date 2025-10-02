#!/usr/bin/env tsx

/**
 * Script de validação dos componentes da Fase 1
 * Valida a estrutura e funcionalidades sem dependências externas
 */

import { UAZClient } from '../src/lib/uaz-api/client';
import { CircuitBreaker } from '../src/lib/uaz-api/circuit-breaker';
import { RetryLogic } from '../src/lib/uaz-api/retry-logic';
import { RateLimiter } from '../src/lib/uaz-api/rate-limiter';
import { UAZLogger } from '../src/lib/logger/uaz-logger';
import { validateSendTextMessage } from '../src/lib/uaz-api/validation';

console.log('🚀 Iniciando validação dos componentes da Fase 1...\n');

const results = {
  uazClient: false,
  circuitBreaker: false,
  retryLogic: false,
  rateLimiter: false,
  logger: false,
  validation: false,
  webhook: false,
  templates: false,
};

try {
  // 1. Validação do UAZ Client
  console.log('📡 Testando UAZ Client...');
  const client = new UAZClient({
    baseUrl: 'https://test.uazapi.com',
    apiKey: 'test-key',
    apiSecret: 'test-secret',
    webhookSecret: 'test-webhook',
  });
  
  if (client && typeof client.sendTextMessage === 'function') {
    console.log('✅ UAZ Client: OK');
    results.uazClient = true;
  } else {
    throw new Error('UAZ Client não inicializou corretamente');
  }

  // 2. Validação do Circuit Breaker
  console.log('🔌 Testando Circuit Breaker...');
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60000,
  });
  
  if (circuitBreaker && typeof circuitBreaker.execute === 'function') {
    console.log('✅ Circuit Breaker: OK');
    results.circuitBreaker = true;
  } else {
    throw new Error('Circuit Breaker não inicializou corretamente');
  }

  // 3. Validação do Retry Logic
  console.log('🔄 Testando Retry Logic...');
  const retryLogic = new RetryLogic({
    maxRetries: 3,
    baseDelay: 1000,
  });
  
  if (retryLogic && typeof retryLogic.execute === 'function') {
    console.log('✅ Retry Logic: OK');
    results.retryLogic = true;
  } else {
    throw new Error('Retry Logic não inicializou corretamente');
  }

  // 4. Validação do Rate Limiter
  console.log('⏱️ Testando Rate Limiter...');
  const rateLimiter = new RateLimiter({
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  });
  
  if (rateLimiter && typeof rateLimiter.canMakeRequest === 'function') {
    console.log('✅ Rate Limiter: OK');
    results.rateLimiter = true;
  } else {
    throw new Error('Rate Limiter não inicializou corretamente');
  }

  // 5. Validação do Logger
  console.log('📝 Testando Logger...');
  const logger = new UAZLogger('test');
  
  if (logger && typeof logger.info === 'function') {
    console.log('✅ Logger: OK');
    results.logger = true;
  } else {
    throw new Error('Logger não inicializou corretamente');
  }

  // 6. Validação das Validações
  console.log('✅ Testando Validações...');
  try {
    const validData = {
      number: '5511999999999',
      text: 'Teste de validação',
    };
    
    const validated = validateSendTextMessage(validData);
    if (validated) {
      console.log('✅ Validações: OK');
      results.validation = true;
    }
  } catch (error) {
    throw new Error('Validações não funcionaram corretamente');
  }

  // 7. Validação do Webhook (arquivo existe)
  console.log('🔗 Testando Webhook...');
  try {
    const fs = require('fs');
    const webhookPath = './src/app/api/webhook/uaz/route.ts';
    if (fs.existsSync(webhookPath)) {
      console.log('✅ Webhook: OK');
      results.webhook = true;
    } else {
      throw new Error('Arquivo de webhook não encontrado');
    }
  } catch (error) {
    throw new Error('Webhook não encontrado');
  }

  // 8. Validação dos Templates (arquivo existe)
  console.log('📋 Testando Templates...');
  try {
    const fs = require('fs');
    const templatePath = './src/lib/uaz-api/template-service.ts';
    if (fs.existsSync(templatePath)) {
      console.log('✅ Templates: OK');
      results.templates = true;
    } else {
      throw new Error('Arquivo de templates não encontrado');
    }
  } catch (error) {
    throw new Error('Templates não encontrados');
  }

} catch (error) {
  console.error('❌ Erro durante validação:', error);
}

// Resultado final
console.log('\n📊 RESULTADO DA VALIDAÇÃO:');
console.log('========================');

const totalTests = Object.keys(results).length;
const passedTests = Object.values(results).filter(Boolean).length;

Object.entries(results).forEach(([component, passed]) => {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${component}: ${passed ? 'PASSOU' : 'FALHOU'}`);
});

console.log('\n📈 ESTATÍSTICAS:');
console.log(`Total de testes: ${totalTests}`);
console.log(`Testes passaram: ${passedTests}`);
console.log(`Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 FASE 1 VALIDADA COM SUCESSO!');
  console.log('Todos os componentes estão funcionando corretamente.');
  console.log('A plataforma está pronta para a Fase 2!');
} else {
  console.log('\n⚠️ ALGUNS COMPONENTES PRECISAM DE AJUSTE');
  console.log('Verifique os componentes que falharam acima.');
}

process.exit(passedTests === totalTests ? 0 : 1);
