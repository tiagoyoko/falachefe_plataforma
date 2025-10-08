#!/usr/bin/env tsx

import { config } from 'dotenv';
import { emailService } from '../src/lib/email-service';

// Load environment variables
config();

async function testEmailService() {
  console.log('🧪 Testando serviço de email...\n');

  // 1. Verificar configuração
  console.log('1️⃣ Verificando configuração...');
  const isConfigured = await emailService.isConfigured();
  
  if (!isConfigured) {
    console.log('❌ Serviço de email não está configurado corretamente');
    console.log('📋 Verifique se as seguintes variáveis estão definidas:');
    console.log('   - RESEND_API_KEY');
    console.log('   - RESEND_FROM_EMAIL (opcional)');
    console.log('   - APP_NAME (opcional)');
    return;
  }
  
  console.log('✅ Serviço de email configurado corretamente\n');

  // 2. Testar email de verificação
  console.log('2️⃣ Testando email de verificação...');
  const verificationData = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Usuário Teste'
    },
    url: 'https://falachefe.com/verify?token=test-token-123',
    token: 'test-token-123'
  };

  try {
    const verificationResult = await emailService.sendVerificationEmail(verificationData);
    console.log(`   ${verificationResult ? '✅' : '❌'} Email de verificação: ${verificationResult ? 'Enviado' : 'Falhou'}`);
  } catch (error) {
    console.log(`   ❌ Erro no email de verificação:`, error);
  }

  // 3. Testar email de redefinição de senha
  console.log('\n3️⃣ Testando email de redefinição de senha...');
  const resetData = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Usuário Teste'
    },
    url: 'https://falachefe.com/reset-password?token=reset-token-123',
    token: 'reset-token-123'
  };

  try {
    const resetResult = await emailService.sendPasswordResetEmail(resetData);
    console.log(`   ${resetResult ? '✅' : '❌'} Email de redefinição: ${resetResult ? 'Enviado' : 'Falhou'}`);
  } catch (error) {
    console.log(`   ❌ Erro no email de redefinição:`, error);
  }

  // 4. Testar email de boas-vindas
  console.log('\n4️⃣ Testando email de boas-vindas...');
  const welcomeData = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Usuário Teste'
    },
    loginUrl: 'https://falachefe.com/login'
  };

  try {
    const welcomeResult = await emailService.sendWelcomeEmail(welcomeData);
    console.log(`   ${welcomeResult ? '✅' : '❌'} Email de boas-vindas: ${welcomeResult ? 'Enviado' : 'Falhou'}`);
  } catch (error) {
    console.log(`   ❌ Erro no email de boas-vindas:`, error);
  }

  console.log('\n🎉 Teste do serviço de email concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Configure RESEND_API_KEY no arquivo .env.local');
  console.log('   2. Configure RESEND_FROM_EMAIL (opcional)');
  console.log('   3. Execute este teste novamente para validar');
}

async function main() {
  try {
    await testEmailService();
  } catch (error) {
    console.error('💥 Erro fatal no teste:', error);
    process.exit(1);
  }
}

main();
