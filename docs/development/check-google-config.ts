#!/usr/bin/env tsx

/**
 * Script simples para verificar configuração do Google OAuth
 */

console.log("🔍 Verificando configuração do Google OAuth...\n");

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Verificar variáveis de ambiente
console.log("📋 Variáveis de Ambiente:");
console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ Configurado" : "❌ Não configurado"}`);
console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ Configurado" : "❌ Não configurado"}`);
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ Não configurado"}`);
console.log(`BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? "✅ Configurado" : "❌ Não configurado"}\n`);

if (process.env.GOOGLE_CLIENT_ID) {
  console.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
}

console.log("\n📝 Instruções para configurar Google OAuth:");
console.log("1. Acesse: https://console.developers.google.com/");
console.log("2. Selecione seu projeto ou crie um novo");
console.log("3. Vá em 'APIs e Serviços' > 'Credenciais'");
console.log("4. Clique no Client ID do OAuth 2.0");
console.log("5. Em 'URIs de redirecionamento autorizados', adicione:");
console.log(`   - ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`);
console.log("6. Em 'Origens JavaScript autorizadas', adicione:");
console.log(`   - ${process.env.NEXT_PUBLIC_APP_URL}`);

console.log("\n🔗 URLs que devem estar configuradas no Google Console:");
console.log(`- Redirect URI: ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`);
console.log(`- JavaScript Origins: ${process.env.NEXT_PUBLIC_APP_URL}`);

console.log("\n⚠️  IMPORTANTE:");
console.log("Se você mudou a porta (localhost:3001), certifique-se de que:");
console.log("1. As URLs acima estão configuradas no Google Console");
console.log("2. O NEXT_PUBLIC_APP_URL está correto no .env.local");
console.log("3. Reinicie o servidor após mudanças no .env.local");
