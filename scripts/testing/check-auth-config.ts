#!/usr/bin/env tsx

/**
 * Script de diagnóstico de configuração de autenticação
 * 
 * Verifica:
 * - Variáveis de ambiente necessárias
 * - Configuração do Better Auth
 * - URLs de callback do Google OAuth
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') });

interface ConfigCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  valid: boolean;
  message?: string;
}

async function checkAuthConfig() {
  console.log('🔍 Verificando configuração de autenticação...\n');

  const checks: ConfigCheck[] = [];

  // 1. Verificar variáveis de ambiente essenciais
  const envVars = [
    { name: 'NEXT_PUBLIC_APP_URL', required: true },
    { name: 'BETTER_AUTH_SECRET', required: true },
    { name: 'GOOGLE_CLIENT_ID', required: true },
    { name: 'GOOGLE_CLIENT_SECRET', required: true },
    { name: 'DATABASE_URL', required: true },
    { name: 'POSTGRES_URL', required: true },
  ];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];
    const valid = !!value && value.length > 0;
    
    checks.push({
      name: envVar.name,
      value: value ? `${value.substring(0, 20)}...` : undefined,
      required: envVar.required,
      valid,
      message: valid ? '✅ Configurada' : '❌ Faltando ou vazia'
    });
  }

  // 2. Verificar URL do app
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const isProduction = appUrl.includes('vercel.app') || !appUrl.includes('localhost');
    const message = isProduction 
      ? '✅ URL de produção configurada' 
      : '⚠️ URL local - não funcionará em produção';
    
    checks.push({
      name: 'APP_URL_ENVIRONMENT',
      value: appUrl,
      required: true,
      valid: isProduction,
      message
    });
  }

  // 3. Verificar formato do BETTER_AUTH_SECRET
  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (authSecret) {
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(authSecret);
    const hasCorrectLength = authSecret.length >= 32;
    const valid = isBase64 && hasCorrectLength;
    
    checks.push({
      name: 'BETTER_AUTH_SECRET_FORMAT',
      value: `${authSecret.length} caracteres`,
      required: true,
      valid,
      message: valid 
        ? '✅ Formato correto (Base64, >=32 chars)' 
        : '❌ Formato inválido (deve ser Base64 com pelo menos 32 caracteres)'
    });
  }

  // 4. Verificar configuração do Google OAuth
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (googleClientId && googleClientSecret) {
    const clientIdValid = googleClientId.endsWith('.apps.googleusercontent.com');
    const secretValid = googleClientSecret.startsWith('GOCSPX-');
    
    checks.push({
      name: 'GOOGLE_CLIENT_ID_FORMAT',
      value: googleClientId,
      required: true,
      valid: clientIdValid,
      message: clientIdValid 
        ? '✅ Formato correto' 
        : '❌ Formato inválido (deve terminar com .apps.googleusercontent.com)'
    });

    checks.push({
      name: 'GOOGLE_CLIENT_SECRET_FORMAT',
      value: `${googleClientSecret.substring(0, 15)}...`,
      required: true,
      valid: secretValid,
      message: secretValid 
        ? '✅ Formato correto' 
        : '⚠️ Formato incomum (geralmente começa com GOCSPX-)'
    });
  }

  // 5. Gerar URLs de callback esperadas
  if (appUrl) {
    const callbackUrls = [
      `${appUrl}/api/auth/callback/google`,
      `${appUrl}/api/auth/callback`,
    ];

    console.log('\n📋 URLs de Callback do Google OAuth (configure no Google Cloud Console):');
    callbackUrls.forEach(url => {
      console.log(`   ${url}`);
    });
  }

  // Exibir resultados
  console.log('\n📊 Resultados da Verificação:\n');
  
  let allValid = true;
  for (const check of checks) {
    console.log(`${check.message}`);
    console.log(`   ${check.name}: ${check.value || 'N/A'}\n`);
    
    if (check.required && !check.valid) {
      allValid = false;
    }
  }

  // Verificar se há variável BETTER_AUTH_URL (que não deve existir)
  const betterAuthUrl = process.env.BETTER_AUTH_URL;
  if (betterAuthUrl) {
    console.log('⚠️  AVISO: Variável BETTER_AUTH_URL encontrada mas NÃO é usada pelo código!');
    console.log(`   O código usa NEXT_PUBLIC_APP_URL. Remova BETTER_AUTH_URL para evitar confusão.\n`);
  }

  // Resumo final
  console.log('\n' + '='.repeat(80));
  if (allValid) {
    console.log('✅ Todas as configurações essenciais estão OK!');
  } else {
    console.log('❌ Algumas configurações precisam ser corrigidas.');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Corrija as variáveis de ambiente marcadas com ❌');
    console.log('   2. Configure as URLs de callback no Google Cloud Console');
    console.log('   3. Execute: vercel env pull .env.vercel');
    console.log('   4. Compare .env.local com .env.vercel');
    console.log('   5. Atualize no Vercel: vercel env add VARIAVEL');
  }
  console.log('='.repeat(80) + '\n');

  // Instruções adicionais
  console.log('🔧 Para configurar o Google OAuth Callback:');
  console.log('   1. Acesse: https://console.cloud.google.com/apis/credentials');
  console.log('   2. Selecione seu OAuth 2.0 Client ID');
  console.log('   3. Em "Authorized redirect URIs", adicione as URLs listadas acima');
  console.log('   4. Salve as alterações\n');

  process.exit(allValid ? 0 : 1);
}

// Executar verificação
checkAuthConfig().catch(error => {
  console.error('❌ Erro ao verificar configuração:', error);
  process.exit(1);
});

